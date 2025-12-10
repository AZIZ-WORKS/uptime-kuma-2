# Network Monitoring Setup

This guide explains how to set up network monitoring with Grafana for OB vans.

## Overview

The system monitors:
1. **Internet Speed** (via speedtest): Download/Upload speeds and ping
2. **Per-Interface Bandwidth**: Real-time network usage for each network interface
3. **Device-level metrics**: Individual device network consumption

## Architecture

```
[OB Van] → uptime-agent (with network-monitor.js)
                ↓ (exposes /metrics endpoint)
[Main Office] → Prometheus (scrapes metrics)
                ↓
[Main Office] → Grafana (visualizes data)
                ↓
[Dashboard UI] → Shows Grafana iframes
```

## Setup Instructions

### 1. Configure Van Agent (Already Done)

The `uptime-agent` now includes:
- `network-monitor.js`: Monitors network stats and runs speedtest
- `/metrics` endpoint: Prometheus-compatible metrics
- `/network` endpoint: JSON API for network data

### 2. Start Main Dashboard with Monitoring

```bash
cd main-dashboard
bash start.sh
```

This will start:
- Backend (port 4000)
- Frontend (port 5173)
- **Prometheus** (port 9090)
- **Grafana** (port 3000)
- Ngrok tunnels

### 3. Configure Prometheus Targets

Edit `main-dashboard/targets.json` to add your van agent URLs:

```json
[
  {
    "targets": [
      "van1-agent-url.ngrok-free.app:443",
      "10.200.5.0:5000"
    ],
    "labels": {
      "job": "vans",
      "van_id": "van1"
    }
  }
]
```

**Important**: If using ngrok URLs for van agents, use port `443` (HTTPS).

### 4. Access Grafana

Open: `http://localhost:3000`
- Username: `admin`
- Password: `admin` (or set via `GRAFANA_PASSWORD` env var)

The dashboard "OB Van Network Monitoring" should be auto-loaded.

### 5. View in Main Dashboard

Open the main dashboard frontend and go to the **Dashboard** tab to see the embedded Grafana charts.

## Metrics Collected

### Speedtest Metrics
- `van_speedtest_download_mbps`: Download speed in Mbps
- `van_speedtest_upload_mbps`: Upload speed in Mbps
- `van_speedtest_ping_ms`: Ping latency in ms

### Interface Metrics
- `van_interface_download_mbps{interface,ip}`: Per-interface download speed
- `van_interface_upload_mbps{interface,ip}`: Per-interface upload speed

## Troubleshooting

### No Data in Grafana

1. Check if Prometheus is scraping:
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```

2. Check van agent metrics endpoint:
   ```bash
   curl http://van-agent-url:5000/metrics
   ```

3. Verify `targets.json` has correct van URLs

### Speedtest Not Running

- Speedtest runs every 5 minutes by default
- Set `SPEEDTEST_INTERVAL` env var in agent (milliseconds)
- Check agent logs: `docker logs uptime-agent`

### Grafana Not Loading in Dashboard

- Ensure `GF_SECURITY_ALLOW_EMBEDDING=true` in docker-compose
- Check Grafana is running: `docker ps | grep grafana`
- Verify port 3000 is accessible

## Environment Variables

### uptime-agent
- `SPEEDTEST_INTERVAL`: How often to run speedtest (default: 300000ms = 5min)
- `VAN_ID`: Identifier for this van (used in metrics labels)

### main-dashboard
- `GRAFANA_PASSWORD`: Grafana admin password (default: admin)

## Next Steps

1. **Expose Grafana via ngrok** (optional): Add Grafana to ngrok config for remote access
2. **Add alerting**: Configure Prometheus alerting rules for slow speeds
3. **Historical analysis**: Use Grafana's time-range selector to view historical data





