# How to View the Dashboard in Grafana

## ✅ Data is Now Available!

Prometheus is successfully collecting data from your remote agent:
- ✅ Location: Manama, Bahrain (26.2235° lat, 50.5813° lon)
- ✅ Van ID: van1
- ✅ Metrics are being scraped

## Steps to View Dashboard

### 1. Open Grafana
Go to: **http://localhost:3000**

### 2. Login
- Username: `admin`
- Password: `admin` (or your configured password)

### 3. Navigate to Dashboard

**Option A: Via Dashboards Menu**
1. Click **"Dashboards"** in the left menu
2. Click **"Browse"**
3. Look for **"OB Van Network Monitoring"**
4. Click on it

**Option B: Direct URL**
Go to: http://localhost:3000/d/network-monitoring

**Option C: Search**
1. Click the search icon (🔍) in the top bar
2. Type: "OB Van Network Monitoring"
3. Click on the dashboard

### 4. What You Should See

The dashboard should show:

1. **Map Panel (Top)**
   - Interactive world map
   - Marker showing van location in Manama, Bahrain
   - Tooltip with van details when you hover

2. **Network Speed Charts**
   - Download/Upload speed over time
   - Ping latency

3. **Interface Bandwidth**
   - Real-time bandwidth usage per network interface

4. **Current Stats**
   - Current download speed
   - Current upload speed  
   - Current ping

## If Dashboard Doesn't Appear

### Check Dashboard is Loaded
1. Go to: http://localhost:3000/dashboards
2. You should see "OB Van Network Monitoring" in the list
3. If not, check Grafana logs: `docker logs dashboard-grafana | tail -20`

### Check Data Source
1. Go to: **Configuration** → **Data Sources**
2. Click on **Prometheus**
3. Click **"Test"** button
4. Should show: ✅ "Data source is working"

### Check Queries
1. Open the dashboard
2. Click on any panel
3. Click **"Edit"**
4. Check the query shows data in the query editor

### Verify Data in Prometheus
```bash
# Check location data
curl 'http://localhost:9090/api/v1/query?query=van_location_latitude'

# Check speedtest data
curl 'http://localhost:9090/api/v1/query?query=van_speedtest_download_mbps'
```

## Troubleshooting

### "No data" in panels
- Wait 1-2 minutes for first scrape
- Check time range selector (top right) - should be "Last 6 hours" or similar
- Verify Prometheus has data (see commands above)

### Map not showing
- Check if location data exists: `curl 'http://localhost:9090/api/v1/query?query=van_location_latitude'`
- Wait for first geolocation update (happens ~10 seconds after agent starts)
- Check panel configuration - should use Geomap panel type

### Dashboard not found
- Restart Grafana: `docker restart dashboard-grafana`
- Check dashboard file exists: `docker exec dashboard-grafana ls /etc/grafana/provisioning/dashboards/`
- Check Grafana logs for errors

## Quick Test

Run this to verify everything:
```bash
# 1. Check Prometheus has data
curl 'http://localhost:9090/api/v1/query?query=van_location_latitude'

# 2. Check Grafana is running
curl http://localhost:3000/api/health

# 3. Check dashboard exists
curl -u admin:admin http://localhost:3000/api/search?query=OB%20Van
```

## Expected Results

✅ **Prometheus:** Has location and network metrics  
✅ **Grafana:** Dashboard "OB Van Network Monitoring" is available  
✅ **Map:** Shows van location in Manama, Bahrain  
✅ **Charts:** Display network metrics over time  

If all checks pass but you still don't see data, the issue is likely in Grafana's query configuration. Check the panel queries match the metric names in Prometheus.

