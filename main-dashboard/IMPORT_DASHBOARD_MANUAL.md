# How to Import Dashboard Manually

Since automatic provisioning isn't working, here's how to import the dashboard manually:

## Quick Import Steps

### Option 1: Import via UI (Easiest)

1. **Open Grafana:** http://localhost:3000
2. **Login:** admin / admin
3. **Go to Dashboards:**
   - Click **"+"** (plus icon) in left menu
   - Select **"Import"**
4. **Import Dashboard:**
   - Click **"Upload JSON file"**
   - Navigate to: `main-dashboard/grafana/provisioning/dashboards/network-monitoring.json`
   - Select the file and click **"Load"**
5. **Configure:**
   - Select **Prometheus** as data source
   - Click **"Import"**

### Option 2: Copy-Paste JSON

1. **Open Grafana:** http://localhost:3000
2. **Login:** admin / admin  
3. **Go to:** **"+"** → **"Import"**
4. **Copy the JSON:**
   ```bash
   # On your machine, run:
   cat main-dashboard/grafana/provisioning/dashboards/network-monitoring.json
   ```
5. **Paste** the entire JSON into the "Import via panel json" text area
6. **Click "Load"**
7. **Select Prometheus** as data source
8. **Click "Import"**

### Option 3: Use Grafana API (Command Line)

```bash
# First, get your API key or use basic auth
curl -u admin:admin -X POST \
  -H "Content-Type: application/json" \
  -d @grafana/provisioning/dashboards/network-monitoring.json \
  'http://localhost:3000/api/dashboards/db'
```

**Note:** This requires admin permissions. If you get permission errors, use Option 1 or 2.

## After Import

Once imported, you should see:
- ✅ Dashboard "OB Van Network Monitoring" in your dashboards list
- ✅ Map panel showing van location
- ✅ Network metrics charts
- ✅ Real-time data updates

## Verify Data Source

Before importing, make sure Prometheus data source is configured:
1. Go to: **Configuration** → **Data Sources**
2. Click on **Prometheus**
3. Verify URL is: `http://prometheus:9090` or `http://localhost:9090`
4. Click **"Test"** - should show ✅ "Data source is working"

## Troubleshooting

### "No data" in panels
- Check Prometheus has data: `curl 'http://localhost:9090/api/v1/query?query=van_location_latitude'`
- Verify time range (top right) - try "Last 6 hours"
- Check panel queries are correct

### Map not showing
- Wait 1-2 minutes for data to appear
- Check location data exists in Prometheus
- Verify Geomap panel is configured correctly

