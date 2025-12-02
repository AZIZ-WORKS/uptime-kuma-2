# Remote Agent Setup Guide

This guide explains how to connect an uptime-agent running on another device to your main dashboard.

## Overview

The agent needs two connections:
1. **WebSocket connection** - For real-time status updates to the dashboard
2. **Prometheus scraping** - For network metrics and geolocation data

## Step 1: Configure the Remote Agent

On the remote device where you're running the uptime-agent, create or update the `.env` file:

```bash
cd uptime-agent
```

Create/edit `.env`:

```env
# Required: Dashboard WebSocket URL (your main dashboard's public URL)
DASHBOARD_WS_URL=http://your-dashboard-url:4000
# Or if using ngrok:
# DASHBOARD_WS_URL=https://your-ngrok-url.ngrok-free.app

# Required: Unique van identifier
VAN_ID=van2

# Optional: Update interval (default: 10000ms = 10 seconds)
UPDATE_INTERVAL=10000

# Optional: Geolocation update interval (default: 600000ms = 10 minutes)
GEOLOCATION_INTERVAL=600000

# Optional: If using ngrok for agent public access
NGROK_AUTHTOKEN=your_ngrok_token
AGENT_PUBLIC_URL=https://your-agent-ngrok-url.ngrok-free.app:443
```

### Finding Your Dashboard URL

**Option A: If dashboard is on local network**
- Use the dashboard server's local IP: `http://192.168.x.x:4000`
- Example: `DASHBOARD_WS_URL=http://192.168.1.100:4000`

**Option B: If dashboard is publicly accessible**
- Use the public URL or ngrok URL
- Example: `DASHBOARD_WS_URL=https://abc123.ngrok-free.app`

**Option C: If dashboard uses ngrok**
- Check the dashboard's ngrok URL:
  ```bash
  cd main-dashboard
  docker logs dashboard-ngrok | grep "started tunnel"
  ```

## Step 2: Make Agent Metrics Accessible to Prometheus

Prometheus needs to scrape the `/metrics` endpoint from your agent. You have two options:

### Option A: Using ngrok (Recommended for remote devices)

1. **Configure ngrok on the agent device** (`uptime-agent/ngrok.yml`):
   ```yaml
   version: "2"
   authtoken: your_ngrok_token
   tunnels:
     agent:
       proto: http
       addr: 5000
   ```

2. **Get the ngrok URL** after starting:
   ```bash
   docker logs van-ngrok | grep "started tunnel"
   ```
   You'll see something like: `https://xyz789.ngrok-free.app`

3. **Note the full URL** - You'll need this for Prometheus (include port 443):
   - Full URL: `https://xyz789.ngrok-free.app:443`

### Option B: Direct Network Access (Same network only)

If the agent and dashboard are on the same network:
- Use the agent's local IP and port: `192.168.x.x:5000`
- No ngrok needed

## Step 3: Add Agent to Prometheus Targets

On the **dashboard server**, edit `main-dashboard/targets.json`:

```json
[
  {
    "targets": ["https://xyz789.ngrok-free.app:443"],
    "labels": {
      "job": "vans",
      "van_id": "van2"
    }
  }
]
```

**Important Notes:**
- For ngrok URLs, use port `443` (HTTPS)
- For local IPs, use port `5000` (HTTP)
- The `van_id` label should match the `VAN_ID` from the agent's `.env`

**Example with multiple vans:**
```json
[
  {
    "targets": ["https://van1-ngrok.ngrok-free.app:443"],
    "labels": {
      "job": "vans",
      "van_id": "van1"
    }
  },
  {
    "targets": ["https://van2-ngrok.ngrok-free.app:443"],
    "labels": {
      "job": "vans",
      "van_id": "van2"
    }
  }
]
```

## Step 4: Reload Prometheus

After updating `targets.json`, reload Prometheus:

```bash
cd main-dashboard
docker restart dashboard-prometheus
```

Or send a reload signal:
```bash
docker exec dashboard-prometheus kill -HUP 1
```

## Step 5: Verify Connection

### Check WebSocket Connection

1. **On the agent device**, check logs:
   ```bash
   docker logs uptime-agent
   ```
   Look for: `✓ Connected to dashboard`

2. **On the dashboard**, check if van appears:
   - Open the dashboard frontend
   - Go to the Vans page
   - You should see your van with status

### Check Prometheus Scraping

1. **Check Prometheus targets**:
   ```bash
   # On dashboard server
   curl http://localhost:9090/api/v1/targets
   ```
   Or visit: http://localhost:9090/targets

2. **Check if metrics are being collected**:
   ```bash
   curl "http://localhost:9090/api/v1/query?query=van_location_latitude{van_id=\"van2\"}"
   ```

3. **Check agent metrics endpoint directly**:
   ```bash
   # If using ngrok
   curl https://your-agent-ngrok-url.ngrok-free.app/metrics
   
   # If local network
   curl http://agent-ip:5000/metrics
   ```

## Step 6: View Data in Grafana

1. Open Grafana: http://localhost:3000
2. Navigate to the "OB Van Network Monitoring" dashboard
3. You should see:
   - Your van on the map (after first geolocation lookup, ~10 seconds)
   - Network metrics in the charts
   - Real-time updates

## Troubleshooting

### Agent not connecting to dashboard

**Check:**
- `DASHBOARD_WS_URL` is correct in agent's `.env`
- Dashboard backend is running and accessible
- Firewall allows connection on port 4000
- If using ngrok, the URL is correct and active

**Test connection:**
```bash
# From agent device, test dashboard reachability
curl http://your-dashboard-url:4000/api/health
# Or if using ngrok
curl https://your-dashboard-ngrok-url.ngrok-free.app/api/health
```

### Prometheus not scraping metrics

**Check:**
- Agent's `/metrics` endpoint is accessible
- `targets.json` has correct URL and port
- Prometheus was restarted after updating targets
- Check Prometheus logs: `docker logs dashboard-prometheus`

**Common issues:**
- Wrong port (use 443 for ngrok HTTPS, 5000 for HTTP)
- ngrok URL expired or changed
- Firewall blocking connection

### No location data on map

**Check:**
- Agent has internet connectivity
- Geolocation API is accessible (ip-api.com, api.ipify.org)
- Check agent logs for geolocation errors:
  ```bash
  docker logs uptime-agent | grep -i geolocation
  ```
- Wait 10 minutes for first update (or check `GEOLOCATION_INTERVAL`)

### Multiple agents setup

For each additional agent:
1. Use unique `VAN_ID` in each agent's `.env`
2. Add separate entry in `targets.json` with unique ngrok URL
3. Restart Prometheus after adding

## Quick Reference

**Agent Environment Variables:**
- `DASHBOARD_WS_URL` - Dashboard WebSocket URL (required)
- `VAN_ID` - Unique van identifier (required)
- `UPDATE_INTERVAL` - Status update interval (optional, default: 10000ms)
- `GEOLOCATION_INTERVAL` - Location update interval (optional, default: 600000ms)
- `AGENT_PUBLIC_URL` - Public URL for agent (optional, for Prometheus)

**Prometheus Targets Format:**
```json
{
  "targets": ["agent-url:port"],
  "labels": {
    "job": "vans",
    "van_id": "van_id_from_agent_env"
  }
}
```

**Endpoints:**
- Agent metrics: `http://agent:5000/metrics` or `https://ngrok-url/metrics`
- Agent status: `http://agent:5000/status`
- Dashboard API: `http://dashboard:4000/api/*`
- Prometheus: `http://dashboard:9090`

