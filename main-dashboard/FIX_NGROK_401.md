# Fix ngrok 401 Unauthorized Error

## Problem
Prometheus is getting `401 Unauthorized` errors when trying to scrape metrics from the agent via ngrok. This means Prometheus cannot get fresh data from the agent.

## Solution

The agent's ngrok container needs to be restarted to apply the header configuration.

### On the Agent (Van) Machine:

1. **Restart the ngrok container:**
   ```bash
   cd uptime-agent
   docker compose restart van-ngrok
   ```

2. **Verify ngrok is running:**
   ```bash
   docker compose logs van-ngrok --tail 20
   ```

3. **Check the agent URL:**
   ```bash
   ./show-agent-url.sh
   ```

### On the Main Dashboard Machine:

1. **Restart prometheus-proxy to ensure it's using the latest config:**
   ```bash
   cd main-dashboard
   docker compose restart prometheus-proxy
   ```

2. **Restart Prometheus to force a fresh scrape:**
   ```bash
   docker compose restart prometheus
   ```

3. **Wait 30 seconds, then check Prometheus targets:**
   ```bash
   docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets | grep -A 5 "prometheus-proxy"
   ```

   You should see `"health":"up"` instead of `"health":"down"`.

4. **Verify data is coming from agent:**
   ```bash
   docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=van_location_info{van_id=\"van1\"}" | python -m json.tool
   ```

   Check the `city`, `country`, and `public_ip` fields - they should match the agent's location, NOT the main dashboard location.

## Important Notes

- The `ngrok.yml` file on the agent already has the correct header configuration
- The `prometheus-proxy.conf` on the main dashboard is correctly configured
- The issue is that ngrok needs to be restarted to apply the configuration
- After restarting, wait 30-60 seconds for Prometheus to scrape fresh data

## If Still Getting 401 Errors

If you're still getting 401 errors after restarting:

1. Check ngrok logs for errors:
   ```bash
   cd uptime-agent
   docker compose logs van-ngrok
   ```

2. Verify the ngrok URL is correct in `prometheus-proxy.conf`:
   ```bash
   cd main-dashboard
   cat prometheus-proxy.conf
   ```

3. Test the proxy directly:
   ```bash
   docker compose exec prometheus-proxy wget -qO- http://localhost:8081/metrics 2>&1 | head -5
   ```

4. If ngrok free tier is still blocking, you may need to upgrade to ngrok paid tier or use a different tunneling solution.
