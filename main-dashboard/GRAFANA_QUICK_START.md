# Quick Start: Network Monitoring with Grafana

## Step 1: Start the Dashboard

```bash
cd main-dashboard
bash start.sh
```

This will start all services including Grafana and Prometheus.

## Step 2: Add Van Targets to Prometheus

Edit `targets.json` and add your van agent URL:

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

Example with actual ngrok URL:
```json
[
  {
    "targets": ["abc123xyz.ngrok-free.app:443"],
    "labels": {
      "job": "vans",
      "van_id": "van1"
    }
  }
]
```

Then reload Prometheus:
```bash
docker restart dashboard-prometheus
```

## Step 3: Access

- **Dashboard UI**: Open the frontend ngrok URL
- **Grafana Direct**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

## Step 4: View Network Metrics

1. Open the main dashboard frontend
2. Click on the **Dashboard** tab
3. You'll see:
   - Van status cards at the top
   - Grafana network monitoring charts below

The charts show:
- Internet speed (download/upload)
- Ping latency  
- Per-interface bandwidth usage
- Real-time network statistics

## Notes

- Speedtest runs every 5 minutes
- Interface stats update every 5 seconds
- Data is stored in Prometheus for 15 days by default





