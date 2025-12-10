# CRITICAL: Fix Agent Data Scraping

## Problem
Dashboard shows YOUR location (Hamad Town) and wrong speedtest (not 980 Mbps from van).

## Root Cause
ngrok free tier is intermittently blocking Prometheus (401 errors), so Prometheus can't scrape consistently from the agent.

## Solution: Restart Agent's ngrok (REQUIRED)

**On the agent machine (van), you MUST restart ngrok:**

```bash
cd uptime-agent
docker restart van-ngrok
```

This applies the updated `ngrok.yml` config that automatically adds the `ngrok-skip-browser-warning` header.

## Verify It's Working

After restarting agent's ngrok, wait 30 seconds, then check:

```bash
# In main-dashboard directory
docker exec dashboard-prometheus wget -qO- "http://localhost:9090/api/v1/targets" | grep -o '"health":"[^"]*"'
```

Should show: `"health":"up"` (not "down")

## Expected Data

Once working, dashboard should show:
- ✅ Van's location (NOT Hamad Town - different city)
- ✅ Van's speedtest (~980 Mbps from fast.com, NOT your network speed)
- ✅ All data from agent's network/location

## Current Status

- Proxy is configured correctly ✅
- Prometheus config is correct ✅  
- Backend queries filter by van_id ✅
- **Agent's ngrok needs restart** ❌ ← THIS IS THE ISSUE

## If Still Not Working After Restart

1. Check agent's ngrok.yml has the header config
2. Check agent's VAN_ID matches "van1"
3. Verify agent is actually running and exposing /metrics
4. Check ngrok tunnel is active: `docker logs van-ngrok`
