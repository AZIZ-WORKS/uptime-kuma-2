# Verification Checklist

Use this checklist to verify everything is working correctly after setting up the remote agent.

## ✅ Quick Health Check

### 1. Prometheus Targets
**Check:** http://localhost:9090/targets

**What to look for:**
- ✅ `van1` target shows as **"UP"** (green)
- ✅ Last scrape time is recent (within last 30 seconds)
- ✅ No error messages

**If "DOWN":**
- Check Prometheus logs: `docker logs dashboard-prometheus | tail -20`
- Verify ngrok-proxy is running: `docker ps | grep ngrok-proxy`
- Test proxy manually: `curl http://localhost:8080/metrics`

### 2. Grafana Dashboard
**Check:** http://localhost:3000

**Steps:**
1. Login (admin/admin)
2. Go to "Dashboards" → "OB Van Network Monitoring"
3. Verify you see:
   - ✅ **Map panel** showing van location (Manama, Bahrain)
   - ✅ **Network speed charts** (download/upload)
   - ✅ **Ping latency** chart
   - ✅ **Interface bandwidth** charts
   - ✅ **Current stats** panels showing values

**If map is empty:**
- Wait 1-2 minutes for first data scrape
- Check Prometheus has data: `curl 'http://localhost:9090/api/v1/query?query=van_location_latitude'`
- Verify Grafana data source is connected to Prometheus

### 3. Location Data
**Check via API:**
```bash
curl 'http://localhost:9090/api/v1/query?query=van_location_latitude'
curl 'http://localhost:9090/api/v1/query?query=van_location_info'
```

**What to verify:**
- ✅ Returns location data with coordinates
- ✅ Shows city, country, ISP information
- ✅ Coordinates match expected location (Manama: ~26.22, 50.58)

### 4. Network Metrics
**Check via API:**
```bash
curl 'http://localhost:9090/api/v1/query?query=van_speedtest_download_mbps'
curl 'http://localhost:9090/api/v1/query?query=van_interface_download_mbps'
```

**What to verify:**
- ✅ Returns metric values (may be 0 if no recent speedtest)
- ✅ Values update over time
- ✅ Multiple interfaces if van has multiple network connections

### 5. Container Status
**Check all containers are running:**
```bash
docker ps
```

**Should see:**
- ✅ `dashboard-prometheus` - Running
- ✅ `dashboard-grafana` - Running  
- ✅ `ngrok-proxy` - Running
- ✅ `dashboard-backend` - Running
- ✅ `dashboard-frontend` - Running

### 6. Remote Agent Connection
**On the remote device, check agent logs:**
```bash
docker logs uptime-agent | grep -i "connected\|dashboard"
```

**Should see:**
- ✅ `✓ Connected to dashboard`
- ✅ No connection errors
- ✅ Regular update messages

## 🔍 Detailed Verification

### Check Prometheus is Scraping
```bash
# View all targets
curl -s 'http://localhost:9090/api/v1/targets' | python3 -m json.tool

# Check specific metric
curl -s 'http://localhost:9090/api/v1/query?query=van_location_latitude'

# Check metric over time
curl -s 'http://localhost:9090/api/v1/query_range?query=van_speedtest_download_mbps&start=$(date -d "1 hour ago" +%s)&end=$(date +%s)&step=60'
```

### Check Grafana Data Source
1. Go to: http://localhost:3000
2. Navigate: **Configuration** → **Data Sources**
3. Click on **Prometheus** data source
4. Click **Test** button
5. Should show: ✅ "Data source is working"

### Check Map Panel
1. Open dashboard in Grafana
2. Check the "Van Locations" panel at the top
3. Should show:
   - ✅ Interactive map
   - ✅ Marker(s) showing van location(s)
   - ✅ Tooltip shows van details when hovering

### Check Real-time Updates
1. Watch the dashboard for 1-2 minutes
2. Values should update:
   - ✅ Interface bandwidth updates every 5 seconds
   - ✅ Speedtest updates every 5 minutes
   - ✅ Location updates every 10 minutes

## 🐛 Troubleshooting

### No Data in Grafana
1. **Check Prometheus has data:**
   ```bash
   curl 'http://localhost:9090/api/v1/query?query=van_location_latitude'
   ```

2. **Check Grafana data source:**
   - Verify Prometheus URL is correct
   - Test the connection

3. **Check dashboard queries:**
   - Open panel edit mode
   - Verify query syntax is correct
   - Check time range selector

### Target Shows as DOWN
1. **Check proxy is working:**
   ```bash
   curl http://localhost:8080/metrics
   ```

2. **Check Prometheus can reach proxy:**
   ```bash
   docker exec dashboard-prometheus wget -qO- http://ngrok-proxy:8080/metrics
   ```

3. **Check Prometheus logs:**
   ```bash
   docker logs dashboard-prometheus | tail -30
   ```

### Map Not Showing
1. **Verify location data exists:**
   ```bash
   curl 'http://localhost:9090/api/v1/query?query=van_location_latitude'
   ```

2. **Check Geomap panel configuration:**
   - Verify latitude/longitude fields are mapped correctly
   - Check transformations are applied

3. **Wait for data:**
   - Location data updates every 10 minutes
   - First update happens ~10 seconds after agent starts

## 📊 Expected Data Points

After setup, you should see:

- **Location:** Updates every 10 minutes
- **Speedtest:** Updates every 5 minutes  
- **Interface stats:** Updates every 5 seconds
- **Status:** Updates every 10 seconds (via WebSocket)

## ✅ Success Indicators

Everything is working correctly if:
- ✅ Prometheus target shows "UP"
- ✅ Grafana map shows van location
- ✅ Network charts display data
- ✅ Values update over time
- ✅ No errors in logs

## 🔗 Useful Links

- **Prometheus UI:** http://localhost:9090
- **Grafana:** http://localhost:3000
- **Prometheus Targets:** http://localhost:9090/targets
- **Prometheus Graph:** http://localhost:9090/graph
- **Grafana Dashboards:** http://localhost:3000/dashboards

