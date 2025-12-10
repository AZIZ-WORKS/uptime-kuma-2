# Manual Prometheus Datasource Setup

Since automatic provisioning is having issues, please add the Prometheus datasource manually:

## Steps:

1. **Access Grafana**: http://localhost:3000
2. **Login**: `admin` / `admin`
3. **Go to**: Configuration → Data Sources (or click the gear icon in the left sidebar)
4. **Click**: "Add data source" button
5. **Select**: Prometheus (under Time series databases)
6. **Configure**:
   - **Name**: `Prometheus`
   - **URL**: `http://prometheus:9090`
   - **Access**: `Server (default)`
   - Leave other settings as default
7. **Click**: "Save & Test" at the bottom
   - You should see "Data source is working" message

## After Adding:

- The dashboards should automatically start working
- Go to Dashboards → Browse to see your dashboards
- The "Datasource prometheus was not found" errors should disappear

## Note:

The datasource provisioning file has been temporarily disabled. Once you've added it manually, Grafana will remember it.
