# IP Geolocation Setup for Van Monitoring

## Overview

This feature adds IP geolocation tracking to show the physical location of each van on a map in Grafana. The system automatically detects the van's public IP address and retrieves its geographic location.

## How It Works

1. **Public IP Detection**: The network monitor fetches the van's public IP address using `api.ipify.org`
2. **Geolocation Lookup**: The public IP is then used to query `ip-api.com` for location data (latitude, longitude, city, country, etc.)
3. **Prometheus Metrics**: Location data is exported as Prometheus metrics:
   - `van_location_latitude` - Latitude coordinate
   - `van_location_longitude` - Longitude coordinate
   - `van_location_info` - Information metric with labels (country, city, ISP, etc.)
4. **Grafana Visualization**: A Geomap panel displays all vans on an interactive world map

## Configuration

### Environment Variables (uptime-agent)

- `GEOLOCATION_INTERVAL` - How often to fetch geolocation (default: 600000ms = 10 minutes)
  - Set this higher to reduce API calls
  - Example: `GEOLOCATION_INTERVAL=1800000` (30 minutes)

### Grafana Dashboard

The dashboard includes a "Van Locations" panel at the top showing:
- Interactive world map
- Van markers with location
- Tooltips showing van details (ID, city, country, IP, ISP)

## API Services Used

- **ipify.org** - Public IP detection (free, no API key)
- **ip-api.com** - IP geolocation (free tier: 45 requests/minute, no API key required)

## Limitations

1. **Accuracy**: IP geolocation is typically accurate to city level, not exact street addresses
2. **Mobile Networks**: Vans using mobile/cellular networks may show the ISP's location rather than the van's exact location
3. **Rate Limits**: ip-api.com free tier allows 45 requests/minute. With multiple vans, adjust `GEOLOCATION_INTERVAL` accordingly

## Troubleshooting

### No location data showing in Grafana

1. Check if the agent is running and can access the internet
2. Verify Prometheus is scraping the metrics:
   ```bash
   curl http://localhost:9090/api/v1/query?query=van_location_latitude
   ```
3. Check agent logs for geolocation errors
4. Ensure the van has internet connectivity to reach the geolocation APIs

### Location not updating

- The default interval is 10 minutes. Wait for the next update cycle
- Check the `GEOLOCATION_INTERVAL` environment variable
- Verify the agent container is running

### Map not displaying

- Ensure Grafana version is 8.0+ (Geomap panel is built-in)
- Check that Prometheus queries return data
- Verify the dashboard is using the correct data source

## Testing

To test geolocation manually:

```bash
# In the van agent container
curl http://ip-api.com/json/$(curl -s https://api.ipify.org)
```

This will return the current location data in JSON format.

