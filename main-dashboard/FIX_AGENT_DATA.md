# Fix: Ensure Data Comes Only From Agent (Van)

## Problem
Dashboard is showing main dashboard's location/speedtest instead of agent's data from different network/location.

## Root Cause
Prometheus target is intermittently failing (401 errors from ngrok), causing no data to be scraped. When data exists, it might be from wrong source or cached.

## Solution: Force Only Agent Data

### Step 1: Verify Agent URL in targets.json
Make sure `targets.json` points ONLY to the agent:
```json
[
  {
    "targets": ["prometheus-proxy:8081"],
    "labels": {
      "job": "vans",
      "van_id": "van1"
    }
  }
]
```

### Step 2: Restart Agent's ngrok (CRITICAL)
On the agent machine (van), restart ngrok with the updated config:
```bash
cd uptime-agent
docker restart van-ngrok
```

This ensures ngrok adds the `ngrok-skip-browser-warning` header automatically.

### Step 3: Clear Prometheus Data (if showing wrong data)
```bash
cd main-dashboard
docker stop dashboard-prometheus
docker volume rm prometheus-data  # WARNING: Deletes all historical data
docker compose up -d prometheus
```

### Step 4: Verify Only Agent Data
Check Prometheus only has data from agent:
```bash
docker exec dashboard-prometheus wget -qO- "http://localhost:9090/api/v1/query?query=van_speedtest_download_mbps{van_id=\"van1\"}"
```

Should show data with:
- `instance: prometheus-proxy:8081`
- `van_id: van1`
- Values matching agent's network (different from main dashboard)

### Step 5: Verify Backend Queries Filter Correctly
All backend queries MUST include `van_id="${vanId}"` filter:
- ✅ `/api/metrics/speedtest?vanId=van1` - filters by van_id
- ✅ `/api/metrics/current?vanId=van1` - filters by van_id  
- ✅ `/api/metrics/location?vanId=van1` - filters by van_id
- ✅ `/api/metrics/interfaces?vanId=van1` - filters by van_id

## Verification Checklist

- [ ] Agent's ngrok.yml has `request_header.add: ngrok-skip-browser-warning: true`
- [ ] Agent's ngrok container restarted
- [ ] Prometheus target shows `health: up` (not `down`)
- [ ] Prometheus has metrics with `van_id="van1"` label
- [ ] All backend queries include `van_id` filter
- [ ] Dashboard shows agent's location (not main dashboard location)
- [ ] Dashboard shows agent's speedtest (not main dashboard speedtest)

## If Still Showing Wrong Data

1. Check browser cache - hard refresh (Ctrl+Shift+R)
2. Check Prometheus has ONLY one target (the agent)
3. Verify no local metrics exporter running on main dashboard
4. Check agent's VAN_ID matches "van1" in .env file
