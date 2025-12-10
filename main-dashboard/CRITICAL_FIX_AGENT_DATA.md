# CRITICAL: Fix Agent Data Not Showing

## Problem
- Dashboard shows data from main dashboard location (Hamad Town, Bahrain)
- Agent is in a DIFFERENT location
- Prometheus is getting 401 errors and cannot scrape fresh data from agent

## Root Cause
ngrok free tier is blocking Prometheus scraping requests, even with headers configured.

## Solution Steps

### Step 1: Restart Agent's ngrok (ON THE VAN/AGENT MACHINE)

**You MUST do this on the machine where the agent is running:**

```bash
cd uptime-agent
docker compose restart van-ngrok
```

Wait 10 seconds, then verify:
```bash
docker compose logs van-ngrok --tail 10
```

### Step 2: Verify Agent is Exposing Metrics

On the agent machine, test if metrics are accessible:
```bash
# Get the agent's ngrok URL
./show-agent-url.sh

# Test if metrics endpoint is accessible (from agent machine)
curl -H "ngrok-skip-browser-warning: true" https://fumelike-anabel-sandier.ngrok-free.dev/metrics | head -20
```

You should see Prometheus metrics starting with `# HELP van_...`

### Step 3: Clear Prometheus Data (ON MAIN DASHBOARD MACHINE)

```bash
cd main-dashboard

# Stop Prometheus
docker compose stop prometheus

# Remove the container
docker compose rm -f prometheus

# Remove the data volume
docker volume rm main-dashboard_prometheus-data

# Restart Prometheus
docker compose up -d prometheus prometheus-proxy

# Wait 30 seconds for first scrape
sleep 30
```

### Step 4: Verify Prometheus Can Scrape

```bash
# Check target status
docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets | python -m json.tool | grep -A 5 "prometheus-proxy"

# Should show: "health":"up" (not "down")
```

### Step 5: Verify Data is from Agent

```bash
# Check location data
docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=van_location_info{van_id=\"van1\"}" | python -m json.tool

# Check the city, country, and public_ip fields
# They should match the AGENT's location, NOT the main dashboard location
```

### Step 6: If Still Getting 401 Errors

If Prometheus target still shows "down" with 401 errors:

1. **Check ngrok configuration on agent:**
   ```bash
   cd uptime-agent
   cat ngrok.yml
   ```
   
   Should have:
   ```yaml
   tunnels:
     agent:
       proto: http
       addr: agent:5000
       request_header:
         add:
           - "ngrok-skip-browser-warning: true"
   ```

2. **Restart ALL agent containers:**
   ```bash
   cd uptime-agent
   docker compose restart
   ```

3. **Check prometheus-proxy configuration:**
   ```bash
   cd main-dashboard
   cat prometheus-proxy.conf
   ```
   
   Should proxy to the correct ngrok URL and add headers.

4. **Restart prometheus-proxy:**
   ```bash
   docker compose restart prometheus-proxy
   ```

## Important Notes

- **The agent's ngrok MUST be restarted** for header configuration to take effect
- **Prometheus data MUST be cleared** to remove stale main dashboard data
- **Wait 30-60 seconds** after restarting for Prometheus to scrape fresh data
- **Verify the location/IP** matches the agent, not the main dashboard

## Verification Checklist

- [ ] Agent's ngrok container restarted
- [ ] Prometheus data volume cleared
- [ ] Prometheus target shows "health":"up"
- [ ] Location data shows agent's location (not main dashboard)
- [ ] Speedtest data matches agent's network (not main dashboard)
- [ ] Public IP matches agent's IP (not main dashboard)
