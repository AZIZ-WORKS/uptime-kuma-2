# 🚨 URGENT: Fix Agent Data Issue

## Current Problem
- ✅ Prometheus is configured correctly
- ✅ prometheus-proxy is configured correctly  
- ❌ **Prometheus getting 401 errors from ngrok**
- ❌ **Dashboard showing stale data from main dashboard location**

## Root Cause
ngrok free tier is blocking Prometheus scraping. The agent's ngrok container needs to be restarted to apply the header configuration.

---

## ⚠️ ACTION REQUIRED: Do This on the AGENT MACHINE (Van)

**You MUST run these commands on the machine where the agent is running (the van), NOT on the main dashboard machine.**

```bash
# Navigate to agent directory
cd uptime-agent

# Restart ngrok container
docker compose restart van-ngrok

# Wait 10 seconds
sleep 10

# Verify ngrok is running
docker compose logs van-ngrok --tail 20

# Check agent URL
./show-agent-url.sh
```

**Expected output:** You should see the ngrok URL and no errors in the logs.

---

## After Restarting Agent's ngrok: Do This on MAIN DASHBOARD

Once you've restarted the agent's ngrok, come back to the main dashboard machine and run:

```bash
cd main-dashboard

# 1. Clear Prometheus stale data
docker compose stop prometheus
docker compose rm -f prometheus
docker volume rm main-dashboard_prometheus-data
docker compose up -d prometheus prometheus-proxy

# 2. Wait 60 seconds for Prometheus to scrape fresh data
sleep 60

# 3. Verify Prometheus can scrape
docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets | python -m json.tool | grep -A 5 "prometheus-proxy"
```

**Expected result:** Should show `"health":"up"` instead of `"health":"down"`

---

## Verify Data is Correct

```bash
# Check location - should show AGENT's location, not main dashboard
docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=van_location_info{van_id=\"van1\"}" | python -m json.tool | grep -E "(city|country|public_ip)"
```

**Verify:**
- ✅ City/Country matches the **agent's location** (not main dashboard)
- ✅ Public IP matches the **agent's IP** (not main dashboard)
- ✅ Speedtest data matches the **agent's network** (not main dashboard)

---

## If Still Getting 401 After Restarting ngrok

1. **Check ngrok.yml on agent:**
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

3. **Check if agent metrics are accessible:**
   ```bash
   # Get the ngrok URL first
   ./show-agent-url.sh
   
   # Then test (replace with your actual URL)
   curl -H "ngrok-skip-browser-warning: true" https://fumelike-anabel-sandier.ngrok-free.dev/metrics | head -10
   ```
   
   Should return Prometheus metrics, not 401 error.

---

## Summary

1. ✅ **On AGENT machine:** `docker compose restart van-ngrok`
2. ✅ **On MAIN DASHBOARD:** Clear Prometheus data and restart
3. ✅ **Wait 60 seconds** for fresh scrape
4. ✅ **Verify** location/IP matches agent, not main dashboard

**The key issue:** ngrok free tier blocks Prometheus scraping. Restarting the agent's ngrok container applies the header configuration that allows scraping.
