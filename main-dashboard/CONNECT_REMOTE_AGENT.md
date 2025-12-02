# Connect Remote Agent - Quick Guide

## Step-by-Step: Get Data from Agent on Another PC

### Step 1: On the Remote PC (where agent is running)

**A. Get the agent's public URL**

If using ngrok, get the URL:
- Open browser: `http://localhost:4040` on the remote PC
- Find the "agent" tunnel
- Copy the URL (e.g., `https://abc123.ngrok-free.app`)

Or check logs:
```powershell
docker logs van-ngrok
```

**B. Note the VAN_ID**
- Check the `.env` file on the remote PC
- Note the `VAN_ID` value (e.g., `van1`, `van2`)

### Step 2: On the Dashboard PC (where main-dashboard is running)

**A. Get your dashboard URL**

If dashboard uses ngrok:
```powershell
cd main-dashboard
docker logs dashboard-ngrok
```
Look for the backend URL (port 4000)

Or if on same network, use the dashboard PC's IP:
```powershell
ipconfig
```
Look for IPv4 address (e.g., `192.168.1.100`)

**B. Update the remote agent's `.env` file**

On the **remote PC**, edit `uptime-agent/.env`:

```env
DASHBOARD_WS_URL=http://DASHBOARD_IP:4000
# Or if using ngrok:
# DASHBOARD_WS_URL=https://your-dashboard-ngrok-url.ngrok-free.app

VAN_ID=van2
UPDATE_INTERVAL=10000
GEOLOCATION_INTERVAL=600000
```

Replace `DASHBOARD_IP` with:
- Dashboard's local IP (if same network): `192.168.x.x`
- Or dashboard's ngrok URL: `https://xxxxx.ngrok-free.app`

**C. Restart the agent on remote PC:**
```powershell
cd uptime-agent
docker compose restart agent
```

### Step 3: Add Agent to Prometheus

**On the dashboard PC**, edit `main-dashboard/targets.json`:

```json
[
  {
    "targets": ["https://AGENT_NGROK_URL.ngrok-free.app:443"],
    "labels": {
      "job": "vans",
      "van_id": "van2"
    }
  }
]
```

**Important:**
- Replace `AGENT_NGROK_URL` with the actual ngrok URL from Step 1A
- Replace `van2` with the actual `VAN_ID` from Step 1B
- Use port `443` for ngrok HTTPS URLs
- If agent is on same network (no ngrok), use: `["http://AGENT_IP:5000"]`

**Example:**
```json
[
  {
    "targets": ["https://abc123xyz.ngrok-free.app:443"],
    "labels": {
      "job": "vans",
      "van_id": "van2"
    }
  }
]
```

### Step 4: Reload Prometheus

**On the dashboard PC:**
```powershell
cd main-dashboard
docker restart dashboard-prometheus
```

### Step 5: Verify Connection

**A. Check WebSocket connection:**
- On remote PC: `docker logs uptime-agent`
- Look for: `✓ Connected to dashboard`

**B. Check Prometheus targets:**
- Open: http://localhost:9090/targets
- Your agent should show as "UP"

**C. Check metrics:**
```powershell
curl "http://localhost:9090/api/v1/query?query=van_location_latitude"
```

**D. View in Grafana:**
- Open: http://localhost:3000
- Go to "OB Van Network Monitoring" dashboard
- You should see:
  - Van on the map (after ~10 seconds)
  - Network metrics in charts
  - Real-time updates

## Troubleshooting

### Agent not connecting to dashboard

**Check:**
1. `DASHBOARD_WS_URL` is correct in agent's `.env`
2. Dashboard backend is running: `docker ps | Select-String dashboard-backend`
3. Firewall allows connection
4. Agent logs: `docker logs uptime-agent` on remote PC

**Test connection from remote PC:**
```powershell
# Test if dashboard is reachable
curl http://DASHBOARD_IP:4000/api/health
# Or if using ngrok:
curl https://DASHBOARD_NGROK_URL/api/health
```

### Prometheus not scraping

**Check:**
1. Agent's `/metrics` endpoint is accessible:
   ```powershell
   # From dashboard PC, test agent URL
   curl https://AGENT_NGROK_URL/metrics
   ```

2. `targets.json` has correct URL and port (443 for HTTPS, 5000 for HTTP)

3. Prometheus was restarted after updating targets

4. Check Prometheus logs:
   ```powershell
   docker logs dashboard-prometheus
   ```

5. Check Prometheus targets page: http://localhost:9090/targets

### No location data

- Wait 10 minutes for first geolocation update
- Check agent has internet: `docker logs uptime-agent` on remote PC
- Verify geolocation APIs are accessible

## Quick Reference

**Agent Endpoints:**
- Metrics: `http://agent:5000/metrics` or `https://ngrok-url/metrics`
- Status: `http://agent:5000/status`
- Network: `http://agent:5000/network`

**Dashboard Endpoints:**
- Backend API: `http://dashboard:4000`
- Prometheus: `http://dashboard:9090`
- Grafana: `http://dashboard:3000`

**Files to Edit:**
- Remote PC: `uptime-agent/.env` (DASHBOARD_WS_URL, VAN_ID)
- Dashboard PC: `main-dashboard/targets.json` (add agent URL)

