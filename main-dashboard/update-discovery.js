import http from 'http';
import fs from 'fs/promises';

async function updateDiscoveryFile() {
  try {
    // Query ngrok's local API for the public URL
    const options = {
      hostname: 'dashboard-ngrok',
      port: 4040,
      path: '/api/tunnels',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        try {
          const tunnels = JSON.parse(data);
          const publicUrl = tunnels.tunnels?.[0]?.public_url;
          if (publicUrl) {
            console.log(`Dashboard ngrok URL: ${publicUrl}`);
            await fs.writeFile('./public-url.txt', publicUrl);
            console.log('✓ Discovery file updated');
          }
        } catch (err) {
          console.warn('Failed to parse ngrok response:', err.message);
        }
      });
    });

    req.on('error', (err) => {
      console.warn('Failed to fetch ngrok URL:', err.message);
    });

    req.end();
  } catch (err) {
    console.warn('Discovery update failed:', err.message);
  }
}

// Run every 30 seconds
setInterval(updateDiscoveryFile, 30000);
updateDiscoveryFile();

