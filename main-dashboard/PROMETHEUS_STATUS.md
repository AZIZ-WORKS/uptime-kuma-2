# Prometheus Scraping Status

## Current Situation
- ✅ Metrics are available at the agent endpoint
- ⚠️ Prometheus can scrape intermittently (sometimes 200, sometimes 401)
- ❌ ngrok free tier is blocking automated scraping inconsistently

## What You Need to Do

### Step 1: Update Agent's ngrok.yml
I've updated `uptime-agent/ngrok.yml` to add the `ngrok-skip-browser-warning` header automatically.

### Step 2: Restart Agent's ngrok Container
On the agent machine, run:
```bash
cd uptime-agent
docker restart van-ngrok
```

### Step 3: Verify Prometheus Can Scrape
After restarting ngrok, wait 30 seconds and check:
```bash
# In main-dashboard directory
docker exec dashboard-prometheus wget -qO- "http://localhost:9090/api/v1/targets" | grep -o '"health":"[^"]*"'
```

You should see `"health":"up"` instead of `"health":"down"`.

### Step 4: Check Metrics in Dashboard
Once Prometheus is scraping successfully:
1. Go to http://localhost:5173
2. Navigate to a van dashboard
3. You should see speedtest data, location, and interface metrics

## Alternative Solutions

If ngrok free tier continues to block:
1. **Upgrade ngrok** - Paid plans allow automated scraping
2. **Use Cloudflare Tunnel** - Free, no browser warnings
3. **Direct connection** - If on same network, skip tunnel entirely

## Current Metrics Available
Based on your metrics output, these are available:
- `van_speedtest_download_mbps` - 647.31 Mbps
- `van_speedtest_upload_mbps` - 525.05 Mbps  
- `van_speedtest_ping_ms` - 16.787 ms
- `van_interface_download_mbps` - Interface speeds
- `van_location_latitude` - 26.118
- `van_location_longitude` - 50.5011
- Location info (city: Hamad Town, Bahrain)

Once Prometheus can scrape consistently, all this data will appear in your dashboard!
