# Verify Prometheus is Scraping

## Step 1: Check Prometheus Targets
1. Open: http://localhost:9090/targets
2. Look for the `vans-file` job
3. Check if the target shows **UP** (green) or **DOWN** (red)

## Step 2: Test Agent Metrics Endpoint
Test if the agent is accessible:
```bash
curl -H "ngrok-skip-browser-warning: true" https://fumelike-anabel-sandier.ngrok-free.dev/metrics
```

You should see Prometheus metrics output like:
```
# HELP van_speedtest_download_mbps Download speed in Mbps
# TYPE van_speedtest_download_mbps gauge
van_speedtest_download_mbps{van_id="van1"} 45.2
...
```

## Step 3: Query Prometheus Directly
1. Go to: http://localhost:9090/graph
2. Try these queries:
   - `van_speedtest_download_mbps{van_id="van1"}`
   - `van_speedtest_upload_mbps{van_id="van1"}`
   - `van_speedtest_ping_ms{van_id="van1"}`
   - `up{job="vans-file"}` (should return 1 if scraping is working)

## Step 4: Check Prometheus Logs
If targets show DOWN, check logs:
```bash
docker logs dashboard-prometheus --tail 50
```

Look for errors like:
- Connection refused
- Certificate errors
- Timeout errors

## Step 5: Restart Prometheus
After making changes to prometheus.yml or targets.json:
```bash
cd main-dashboard
docker restart dashboard-prometheus
```

Wait 30 seconds, then check targets again.

## Common Issues:

### Issue: Target shows DOWN with "connection refused"
- **Solution**: Check if ngrok URL is correct and agent is running
- Verify: `curl https://fumelike-anabel-sandier.ngrok-free.dev/metrics`

### Issue: Target shows DOWN with certificate error
- **Solution**: Already configured with `insecure_skip_verify: true`
- Check Prometheus logs for specific error

### Issue: Target shows UP but no metrics
- **Solution**: Check if agent is actually generating metrics
- Query: `up{job="vans-file"}` should return 1
- Check agent logs: `docker logs uptime-agent`

### Issue: Metrics exist but Grafana shows empty
- **Solution**: Check Grafana datasource is connected to Prometheus
- Verify: Grafana → Configuration → Data Sources → Prometheus
- Test query in Grafana: `van_speedtest_download_mbps`
