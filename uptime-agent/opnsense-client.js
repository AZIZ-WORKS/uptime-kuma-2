import axios from 'axios';
import https from 'https';

const OPNsense_URL = process.env.OPNSENSE_URL || '';
const OPNsense_API_KEY = process.env.OPNSENSE_API_KEY || '';
const OPNsense_API_SECRET = process.env.OPNSENSE_API_SECRET || '';
const OPNsense_INTERFACES = (process.env.OPNSENSE_INTERFACES || 'wan,lan').split(',').map(i => i.trim());

// Create axios instance with basic auth and SSL verification disabled (for self-signed certs)
const opnsenseClient = axios.create({
  auth: {
    username: OPNsense_API_KEY,
    password: OPNsense_API_SECRET,
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Allow self-signed certificates
  }),
  timeout: 10000,
});

/**
 * Fetch traffic statistics for a specific interface from OPNsense
 * @param {string} interfaceName - Interface name (e.g., 'wan', 'lan')
 * @returns {Promise<Object|null>} Traffic statistics or null on error
 */
export async function getInterfaceTraffic(interfaceName) {
  if (!OPNsense_URL || !OPNsense_API_KEY || !OPNsense_API_SECRET) {
    console.warn('OPNsense API credentials not configured');
    return null;
  }

  try {
    const url = `${OPNsense_URL}/api/diagnostics/interface/traffic/${interfaceName}`;
    const response = await opnsenseClient.get(url);
    
    // Handle different response formats
    let trafficData = null;
    if (response.data) {
      // Format 1: { traffic: { ... } }
      if (response.data.traffic) {
        trafficData = response.data.traffic;
      }
      // Format 2: Direct traffic object
      else if (response.data.bytes_in !== undefined || response.data.inbytes !== undefined) {
        trafficData = response.data;
      }
      // Format 3: Array with traffic data
      else if (Array.isArray(response.data) && response.data.length > 0) {
        trafficData = response.data[0];
      }
    }
    
    if (trafficData) {
      return {
        interface: interfaceName,
        ...trafficData,
        timestamp: Date.now(),
      };
    }
    
    console.warn(`Unexpected OPNsense API response format for ${interfaceName}`);
    return null;
  } catch (err) {
    console.error(`Failed to fetch OPNsense traffic for ${interfaceName}:`, err.message);
    return null;
  }
}

/**
 * Get all configured interfaces' traffic statistics
 * @returns {Promise<Array>} Array of traffic statistics per interface
 */
export async function getAllInterfacesTraffic() {
  const results = [];
  
  for (const iface of OPNsense_INTERFACES) {
    const traffic = await getInterfaceTraffic(iface);
    if (traffic) {
      results.push(traffic);
    }
  }
  
  return results;
}

/**
 * Get interface statistics (bytes in/out) from OPNsense
 * This endpoint provides cumulative counters
 * @param {string} interfaceName - Interface name
 * @returns {Promise<Object|null>} Interface statistics
 */
export async function getInterfaceStatistics(interfaceName) {
  if (!OPNsense_URL || !OPNsense_API_KEY || !OPNsense_API_SECRET) {
    return null;
  }

  try {
    // Try the statistics endpoint if available
    const url = `${OPNsense_URL}/api/interfaces/statistics/${interfaceName}`;
    const response = await opnsenseClient.get(url);
    
    if (response.data) {
      return {
        interface: interfaceName,
        ...response.data,
        timestamp: Date.now(),
      };
    }
    
    return null;
  } catch (err) {
    // If statistics endpoint doesn't exist, try traffic endpoint
    return await getInterfaceTraffic(interfaceName);
  }
}

/**
 * Calculate bandwidth speed from two snapshots
 * @param {Object} previous - Previous snapshot with bytes and timestamp
 * @param {Object} current - Current snapshot with bytes and timestamp
 * @returns {Object} Bandwidth in bps and Mbps
 */
export function calculateBandwidthSpeed(previous, current) {
  if (!previous || !current) {
    return { download_bps: 0, upload_bps: 0, download_mbps: 0, upload_mbps: 0 };
  }

  const timeDiff = (current.timestamp - previous.timestamp) / 1000; // seconds
  if (timeDiff <= 0) {
    return { download_bps: 0, upload_bps: 0, download_mbps: 0, upload_mbps: 0 };
  }

  // OPNsense traffic API typically provides cumulative counters:
  // - bytes_in / bytes_out
  // - inbytes / outbytes  
  // - bytes_in_total / bytes_out_total
  // - in / out (in some versions)
  
  const bytesIn = current.bytes_in || current.inbytes || current.bytes_in_total || current.in || 0;
  const bytesOut = current.bytes_out || current.outbytes || current.bytes_out_total || current.out || 0;
  const prevBytesIn = previous.bytes_in || previous.inbytes || previous.bytes_in_total || previous.in || 0;
  const prevBytesOut = previous.bytes_out || previous.outbytes || previous.bytes_out_total || previous.out || 0;

  const rxSpeed = (bytesIn - prevBytesIn) / timeDiff; // bytes/sec
  const txSpeed = (bytesOut - prevBytesOut) / timeDiff; // bytes/sec

  return {
    download_bps: Math.round(rxSpeed),
    upload_bps: Math.round(txSpeed),
    download_mbps: Math.round(rxSpeed / 1000000 * 100) / 100,
    upload_mbps: Math.round(txSpeed / 1000000 * 100) / 100,
  };
}

export default {
  getInterfaceTraffic,
  getAllInterfacesTraffic,
  getInterfaceStatistics,
  calculateBandwidthSpeed,
};

