# Grafana Datasource Fix

## Issue
Grafana shows error: "Datasource provisioning error: data source not found"

## Manual Fix (Recommended)

Since automatic provisioning is failing, manually add the Prometheus datasource:

1. **Access Grafana**: http://localhost:3000
2. **Login**: `admin` / `admin`
3. **Go to**: Configuration → Data Sources
4. **Click**: "Add data source"
5. **Select**: Prometheus
6. **Configure**:
   - Name: `Prometheus`
   - URL: `http://prometheus:9090`
   - Access: `Server (default)`
   - Click "Save & Test"

## Alternative: Check Datasource File

The datasource file should be at:
- Host: `main-dashboard/grafana/provisioning/datasources/prometheus.yml`
- Container: `/etc/grafana/provisioning/datasources/prometheus.yml`

Verify the file is mounted correctly in docker-compose.yml
