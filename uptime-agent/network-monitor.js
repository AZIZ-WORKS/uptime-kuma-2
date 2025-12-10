import { execSync } from 'child_process';
import fs from 'fs';
import axios from 'axios';
import { getAllInterfacesTraffic, calculateBandwidthSpeed } from './opnsense-client.js';

const VAN_ID = process.env.VAN_ID || 'van1';
const METRICS_FILE = '/tmp/network-metrics.txt';
const SPEEDTEST_INTERVAL = parseInt(process.env.SPEEDTEST_INTERVAL || '300000'); // 5 minutes default
const GEOLOCATION_INTERVAL = parseInt(process.env.GEOLOCATION_INTERVAL || '600000'); // 10 minutes default
const USE_OPNSENSE = process.env.USE_OPNSENSE === 'true' || 
                     (process.env.OPNSENSE_URL && process.env.OPNSENSE_API_KEY && process.env.OPNSENSE_API_SECRET);

// Get network interfaces and their stats from OPNsense API
async function getNetworkStats() {
  if (!USE_OPNSENSE) {
    console.warn('OPNsense API not configured, returning empty stats');
    return [];
  }

  try {
    const trafficData = await getAllInterfacesTraffic();
    return trafficData.map(data => ({
      interface: data.interface,
      ip: data.ip || data.ip_address || 'unknown',
      bytes_in: data.bytes_in || data.inbytes || data.bytes_in_total || 0,
      bytes_out: data.bytes_out || data.outbytes || data.bytes_out_total || 0,
      timestamp: data.timestamp || Date.now()
    }));
  } catch (err) {
    console.error('Failed to get OPNsense network stats:', err.message);
    return [];
  }
}

// Get public IP address
async function getPublicIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
    return response.data.ip;
  } catch (err) {
    console.warn('Failed to get public IP:', err.message);
    return null;
  }
}

// Get geolocation data from public IP
async function getGeolocation() {
  try {
    const publicIP = await getPublicIP();
    if (!publicIP) return null;
    
    // Use ip-api.com (free, no API key required)
    const response = await axios.get(`http://ip-api.com/json/${publicIP}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
      timeout: 10000
    });
    
    if (response.data.status === 'success') {
      return {
        public_ip: response.data.query,
        country: response.data.country || 'Unknown',
        country_code: response.data.countryCode || '',
        region: response.data.regionName || 'Unknown',
        city: response.data.city || 'Unknown',
        zip: response.data.zip || '',
        latitude: response.data.lat || 0,
        longitude: response.data.lon || 0,
        timezone: response.data.timezone || 'Unknown',
        isp: response.data.isp || 'Unknown',
        org: response.data.org || 'Unknown',
        timestamp: Date.now()
      };
    }
    return null;
  } catch (err) {
    console.warn('Failed to get geolocation:', err.message);
    return null;
  }
}

// Run speedtest
async function runSpeedtest() {
  try {
    console.log('Running speedtest...');
    const result = execSync('speedtest --json', { 
      timeout: 60000,
      encoding: 'utf-8' 
    });
    
    const data = JSON.parse(result);
    
    return {
      download: Math.round(data.download / 1000000 * 100) / 100, // Mbps
      upload: Math.round(data.upload / 1000000 * 100) / 100, // Mbps
      ping: data.ping,
      server: data.server?.sponsor || 'Unknown',
      timestamp: Date.now()
    };
  } catch (err) {
    console.error('Speedtest failed:', err.message);
    return null;
  }
}

// Calculate bandwidth usage per second from OPNsense data
let previousStats = null;
async function calculateBandwidth() {
  const currentStats = await getNetworkStats();
  
  if (!previousStats || previousStats.length === 0) {
    previousStats = currentStats;
    return [];
  }
  
  const bandwidth = [];
  
  for (const current of currentStats) {
    const previous = previousStats.find(s => s.interface === current.interface);
    if (!previous) continue;
    
    const speed = calculateBandwidthSpeed(previous, current);
    
    bandwidth.push({
      interface: current.interface,
      ip: current.ip,
      ...speed,
      timestamp: current.timestamp
    });
  }
  
  previousStats = currentStats;
  return bandwidth;
}

// Export metrics in Prometheus format
function exportPrometheusMetrics(speedtest, bandwidth, geolocation) {
  let metrics = '';
  
  // Speedtest metrics
  if (speedtest) {
    metrics += `# HELP van_speedtest_download_mbps Download speed in Mbps\n`;
    metrics += `# TYPE van_speedtest_download_mbps gauge\n`;
    metrics += `van_speedtest_download_mbps{van_id="${VAN_ID}"} ${speedtest.download}\n\n`;
    
    metrics += `# HELP van_speedtest_upload_mbps Upload speed in Mbps\n`;
    metrics += `# TYPE van_speedtest_upload_mbps gauge\n`;
    metrics += `van_speedtest_upload_mbps{van_id="${VAN_ID}"} ${speedtest.upload}\n\n`;
    
    metrics += `# HELP van_speedtest_ping_ms Ping in milliseconds\n`;
    metrics += `# TYPE van_speedtest_ping_ms gauge\n`;
    metrics += `van_speedtest_ping_ms{van_id="${VAN_ID}"} ${speedtest.ping}\n\n`;
  }
  
  // Interface bandwidth metrics
  for (const iface of bandwidth) {
    metrics += `# HELP van_interface_download_mbps Interface download speed in Mbps\n`;
    metrics += `# TYPE van_interface_download_mbps gauge\n`;
    metrics += `van_interface_download_mbps{van_id="${VAN_ID}",interface="${iface.interface}",ip="${iface.ip}"} ${iface.download_mbps}\n\n`;
    
    metrics += `# HELP van_interface_upload_mbps Interface upload speed in Mbps\n`;
    metrics += `# TYPE van_interface_upload_mbps gauge\n`;
    metrics += `van_interface_upload_mbps{van_id="${VAN_ID}",interface="${iface.interface}",ip="${iface.ip}"} ${iface.upload_mbps}\n\n`;
  }
  
  // Geolocation metrics
  if (geolocation) {
    metrics += `# HELP van_location_latitude Van location latitude\n`;
    metrics += `# TYPE van_location_latitude gauge\n`;
    metrics += `van_location_latitude{van_id="${VAN_ID}",public_ip="${geolocation.public_ip}",country="${geolocation.country}",city="${geolocation.city}"} ${geolocation.latitude}\n\n`;
    
    metrics += `# HELP van_location_longitude Van location longitude\n`;
    metrics += `# TYPE van_location_longitude gauge\n`;
    metrics += `van_location_longitude{van_id="${VAN_ID}",public_ip="${geolocation.public_ip}",country="${geolocation.country}",city="${geolocation.city}"} ${geolocation.longitude}\n\n`;
    
    metrics += `# HELP van_location_info Van location information (1 = present)\n`;
    metrics += `# TYPE van_location_info gauge\n`;
    metrics += `van_location_info{van_id="${VAN_ID}",public_ip="${geolocation.public_ip}",country="${geolocation.country}",country_code="${geolocation.country_code}",region="${geolocation.region}",city="${geolocation.city}",zip="${geolocation.zip}",timezone="${geolocation.timezone}",isp="${geolocation.isp}"} 1\n\n`;
  }
  
  return metrics;
}

// Store latest metrics
let latestSpeedtest = null;
let latestBandwidth = [];
let latestGeolocation = null;

// Main monitoring loop
async function startMonitoring() {
  console.log('Network monitoring started');
  
  // Run speedtest periodically
  const runSpeedtestPeriodic = async () => {
    latestSpeedtest = await runSpeedtest();
    setTimeout(runSpeedtestPeriodic, SPEEDTEST_INTERVAL);
  };
  
  // Get geolocation periodically
  const getGeolocationPeriodic = async () => {
    console.log('Fetching geolocation...');
    latestGeolocation = await getGeolocation();
    if (latestGeolocation) {
      console.log(`Van location: ${latestGeolocation.city}, ${latestGeolocation.country} (${latestGeolocation.latitude}, ${latestGeolocation.longitude})`);
    }
    setTimeout(getGeolocationPeriodic, GEOLOCATION_INTERVAL);
  };
  
  // Initial speedtest
  setTimeout(runSpeedtestPeriodic, 5000); // Wait 5s on startup
  
  // Initial geolocation
  setTimeout(getGeolocationPeriodic, 10000); // Wait 10s on startup
  
  // Monitor bandwidth every 5 seconds
  setInterval(async () => {
    latestBandwidth = await calculateBandwidth();
    
    // Write metrics to file for Prometheus
    const metrics = exportPrometheusMetrics(latestSpeedtest, latestBandwidth, latestGeolocation);
    fs.writeFileSync(METRICS_FILE, metrics);
  }, 5000);
}

// Export endpoint for Express
export function getMetrics() {
  return fs.existsSync(METRICS_FILE) 
    ? fs.readFileSync(METRICS_FILE, 'utf-8') 
    : '# No metrics yet\n';
}

export function getNetworkData() {
  return {
    speedtest: latestSpeedtest,
    bandwidth: latestBandwidth,
    geolocation: latestGeolocation,
    vanId: VAN_ID
  };
}

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMonitoring();
}

export default startMonitoring;




