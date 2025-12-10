# Network Monitoring with Grafana - Summary

## ✅ What's Been Added

### 1. **Uptime Agent Network Monitoring**
- `network-monitor.js`: Monitors network performance
  - Runs speedtest every 5 minutes (configurable)
  - Tracks per-interface bandwidth usage in real-time
  - Exports Prometheus-compatible metrics
- New endpoints:
  - `/metrics`: Prometheus scraping endpoint
  - `/network`: JSON API for network data

### 2. **Prometheus (Metrics Collection)**
- Collects metrics from all van agents
- Stores time-series data for historical analysis
- Accessible at: `http://localhost:9090`

### 3. **Grafana (Visualization)**
- Pre-configured dashboard: "OB Van Network Monitoring"
- Shows:
  - Internet speed (download/upload from speedtest)
  - Ping latency
  - Per-interface bandwidth usage
  - Real-time and historical charts
- Accessible at: `http://localhost:3000` (admin/admin)

### 4. **Dashboard Integration**
- **Dashboard tab** now shows embedded Grafana charts
- Displays network performance for all vans
- Auto-refreshes every 10 seconds

## 🚀 Quick Access

### Local URLs:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090

### Public URLs (via ngrok):
- **Frontend**: `https://523bf31627b2.ngrok-free.app`
- **Backend**: `https://97cfa8b364d7.ngrok-free.app`

## 📊 Metrics Tracked

1. **van_speedtest_download_mbps**: Download speed (Mbps)
2. **van_speedtest_upload_mbps**: Upload speed (Mbps)
3. **van_speedtest_ping_ms**: Ping latency (ms)
4. **van_interface_download_mbps**: Per-interface download (Mbps)
5. **van_interface_upload_mbps**: Per-interface upload (Mbps)

## 🔧 Next Steps

### 1. Configure Van Agent Targets
Edit `main-dashboard/targets.json`:
```json
[
  {
    "targets": ["YOUR_VAN_NGROK_URL:443"],
    "labels": {
      "job": "vans",
      "van_id": "van1"
    }
  }
]
```

Then restart Prometheus:
```bash
docker restart dashboard-prometheus
```

### 2. Rebuild Van Agent
The van agent needs to be rebuilt to include network monitoring:
```bash
cd uptime-agent
docker compose down
docker compose up -d --build
```

### 3. Verify Metrics
Check if van agent is exposing metrics:
```bash
curl http://VAN_AGENT_URL:5000/metrics
```

You should see Prometheus-formatted metrics like:
```
van_speedtest_download_mbps{van_id="van1"} 85.5
van_speedtest_upload_mbps{van_id="van1"} 12.3
...
```

## 📝 Configuration Files

- `main-dashboard/docker-compose.yml`: Added Prometheus & Grafana services
- `main-dashboard/prometheus.yml`: Prometheus configuration
- `main-dashboard/targets.json`: Van agent targets for scraping
- `main-dashboard/grafana/provisioning/`: Grafana dashboards & datasources
- `uptime-agent/network-monitor.js`: Network monitoring logic
- `uptime-agent/Dockerfile`: Updated to install speedtest-cli

## 🎯 How It Works

```
┌─────────────┐
│   OB Van    │
│             │
│ network-    │──┐
│ monitor.js  │  │ Exposes /metrics
└─────────────┘  │
                 │
                 ▼
         ┌──────────────┐
         │  Prometheus  │ Scrapes metrics every 15s
         │              │ Stores time-series data
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │   Grafana    │ Queries Prometheus
         │              │ Visualizes charts
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  Dashboard   │ Embeds Grafana via iframe
         │     UI       │ Shows in "Dashboard" tab
         └──────────────┘
```

## 🐛 Troubleshooting

### No data in Grafana?
1. Check Prometheus targets: http://localhost:9090/targets
2. Verify van agent metrics: `curl http://van-url:5000/metrics`
3. Check targets.json has correct URL

### Speedtest not running?
- Check agent logs: `docker logs uptime-agent`
- Speedtest runs every 5 minutes by default
- May take up to 60 seconds to complete

### Grafana not loading in Dashboard?
- Ensure port 3000 is accessible
- Check `GF_SECURITY_ALLOW_EMBEDDING=true` in docker-compose
- Try accessing Grafana directly: http://localhost:3000

## 🎨 Customization

### Change speedtest interval:
Edit `uptime-agent/.env`:
```env
SPEEDTEST_INTERVAL=600000  # 10 minutes in milliseconds
```

### Modify Grafana dashboard:
1. Open Grafana: http://localhost:3000
2. Edit dashboard: "OB Van Network Monitoring"
3. Save changes
4. Export JSON and save to `grafana/provisioning/dashboards/network-monitoring.json`





