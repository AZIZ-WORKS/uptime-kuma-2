# OPNsense API Integration Setup

This guide explains how to configure the uptime-agent to use OPNsense API for network upload and download speed monitoring.

## Overview

Instead of using system-level network statistics, the agent can now fetch real-time network traffic data from your OPNsense firewall/router via its API. This provides more accurate and centralized network monitoring.

## Prerequisites

1. OPNsense firewall/router with API access enabled
2. API credentials (key and secret) from OPNsense
3. Network connectivity from the agent to the OPNsense device

## Step 1: Generate API Credentials in OPNsense

1. **Log into OPNsense Web Interface**
   - Navigate to your OPNsense firewall's web interface (typically `https://192.168.1.1` or your router's IP)

2. **Create API Key**
   - Go to **System** > **Access** > **Users**
   - Select the user account you want to use for API access (or create a new user)
   - Scroll down to the **API Keys** section
   - Click the **+** button to create a new API key
   - **Important**: Download and save the key and secret immediately - they cannot be retrieved later!

3. **Set Permissions** (if needed)
   - Ensure the user has permissions to access:
     - Diagnostics > Interface Traffic
     - Or Interfaces > Statistics (depending on your OPNsense version)

## Step 2: Configure Agent Environment Variables

Edit your `.env` file in the `uptime-agent` directory:

```env
# Enable OPNsense integration
USE_OPNSENSE=true

# OPNsense API Configuration
OPNSENSE_URL=https://192.168.1.1
OPNSENSE_API_KEY=your_api_key_here
OPNSENSE_API_SECRET=your_api_secret_here

# Interfaces to monitor (comma-separated)
OPNSENSE_INTERFACES=wan,lan

# Other existing variables...
DASHBOARD_WS_URL=http://your-dashboard-url:4000
VAN_ID=van1
```

### Configuration Details

- **USE_OPNSENSE**: Set to `true` to enable OPNsense API integration. If not set or `false`, the agent will use system-level network stats (if available).

- **OPNSENSE_URL**: The full URL to your OPNsense device. Examples:
  - `https://192.168.1.1` (local network)
  - `https://opnsense.example.com` (if using domain name)
  - `https://10.0.0.1` (different subnet)

- **OPNSENSE_API_KEY**: The API key generated in Step 1

- **OPNSENSE_API_SECRET**: The API secret generated in Step 1

- **OPNSENSE_INTERFACES**: Comma-separated list of interfaces to monitor. Common values:
  - `wan` - WAN interface (internet connection)
  - `lan` - LAN interface
  - `wan,lan` - Both interfaces
  - `opt1,opt2` - Optional interfaces

## Step 3: Test the Connection

Before starting the full agent, test the OPNsense API connection:

```bash
# From the agent device, test API access
curl -u "your_api_key:your_api_secret" \
     -k \
     "https://your-opnsense-url/api/diagnostics/interface/traffic/wan"
```

If successful, you should see JSON data with traffic statistics.

## Step 4: Start the Agent

Start the agent as usual:

```bash
cd uptime-agent
docker compose up -d --build
```

Or if using the startup script:

```bash
./kuma-start.sh
```

## Step 5: Verify Data Collection

1. **Check Agent Logs**:
   ```bash
   docker logs uptime-agent | grep -i opnsense
   ```

2. **Check Metrics Endpoint**:
   ```bash
   curl http://localhost:5000/metrics | grep van_interface
   ```

   You should see metrics like:
   ```
   van_interface_download_mbps{van_id="van1",interface="wan",ip="unknown"} 15.23
   van_interface_upload_mbps{van_id="van1",interface="wan",ip="unknown"} 3.45
   ```

3. **Check Network Data API**:
   ```bash
   curl http://localhost:5000/network
   ```

   Should return JSON with bandwidth data from OPNsense.

## Troubleshooting

### API Connection Fails

**Error**: `Failed to fetch OPNsense traffic for wan: ...`

**Solutions**:
- Verify `OPNSENSE_URL` is correct and accessible from the agent
- Check that API key and secret are correct
- Ensure OPNsense firewall allows API access from the agent's IP
- Try accessing the URL in a browser first to verify SSL certificate

### SSL Certificate Errors

If using self-signed certificates, the agent will automatically ignore SSL verification. If you still have issues:

- Verify the URL uses `https://` (not `http://`)
- Check that the certificate is valid in a browser
- Consider adding the certificate to the system trust store

### No Data in Metrics

**Check**:
- `USE_OPNSENSE=true` is set
- All three OPNsense environment variables are configured
- Interface names in `OPNSENSE_INTERFACES` match actual interface names in OPNsense
- OPNsense API is responding (test with curl as shown in Step 3)

### Interface Names

To find the correct interface names in OPNsense:
1. Go to **Interfaces** > **[Interface Name]** in OPNsense web UI
2. The interface name is shown in the URL or page title
3. Common names: `wan`, `lan`, `opt1`, `opt2`, etc.

## API Endpoints Used

The agent uses the following OPNsense API endpoints:

- `/api/diagnostics/interface/traffic/<interface>` - Real-time traffic statistics
- `/api/interfaces/statistics/<interface>` - Interface statistics (fallback)

## Data Format

The agent converts OPNsense API responses to the same Prometheus metrics format as before, so:
- Frontend visualizations work without changes
- Existing Grafana dashboards continue to work
- Data structure remains compatible

## Fallback Behavior

If OPNsense API is not configured or fails:
- The agent will log warnings but continue running
- Other monitoring features (speedtest, geolocation) continue to work
- Network interface metrics will be empty

## Security Notes

- **Never commit API keys to version control**
- Store credentials in `.env` file (which should be in `.gitignore`)
- Use HTTPS for OPNsense URL when possible
- Consider creating a dedicated API user with minimal required permissions
- Regularly rotate API keys

## Example .env File

```env
# Dashboard Connection
DASHBOARD_WS_URL=http://192.168.1.100:4000
VAN_ID=van1
UPDATE_INTERVAL=10000

# OPNsense Configuration
USE_OPNSENSE=true
OPNSENSE_URL=https://192.168.1.1
OPNSENSE_API_KEY=abc123def456ghi789
OPNSENSE_API_SECRET=xyz789uvw456rst123
OPNSENSE_INTERFACES=wan,lan

# Optional: Speedtest and Geolocation
SPEEDTEST_INTERVAL=300000
GEOLOCATION_INTERVAL=600000
```

## Additional Resources

- [OPNsense API Documentation](https://docs.opnsense.org/development/how-tos/api.html)
- [OPNsense Traffic Shaper](https://docs.opnsense.org/manual/how-tos/shaper_bufferbloat.html)

