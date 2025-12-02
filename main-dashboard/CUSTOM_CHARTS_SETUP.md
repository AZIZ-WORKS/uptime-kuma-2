# Custom Network Charts (No iframes!)

## What Changed?

Instead of embedding Grafana via iframe, we now:
1. **Pull data directly from Prometheus** via backend API
2. **Render custom charts** using Recharts (React charting library)
3. **Full control over design** and user experience

## Architecture

```
Prometheus (stores metrics)
    ↓ (HTTP API)
Backend (/api/metrics/*)
    ↓ (REST API)
Frontend (NetworkCharts.jsx)
    ↓ (Recharts)
Beautiful custom charts!
```

## Features

### 1. Current Stats Cards
- Download speed (Mbps)
- Upload speed (Mbps)
- Ping latency (ms)
- Color-coded status (green/yellow/red)

### 2. Internet Speed History
- Line chart showing download/upload over time
- Last 1 hour of speedtest data
- Hover tooltips with exact values

### 3. Per-Interface Bandwidth
- Real-time bandwidth for each network interface
- Separate charts for each interface
- Last 5 minutes of data
- Updates every 5 seconds

### 4. Van Selector
- Switch between multiple vans
- Shows online/offline status
- Clean button interface

## API Endpoints

### GET `/api/metrics/speedtest`
Returns speedtest data (download/upload/ping) for a van.

**Params:**
- `vanId`: Van identifier (required)
- `range`: Time range (default: `1h`, options: `30m`, `1h`, `6h`, `1d`)

**Response:**
```json
[
  {
    "timestamp": 1699200000,
    "download": 85.5,
    "upload": 12.3,
    "ping": 25
  }
]
```

### GET `/api/metrics/interfaces`
Returns per-interface bandwidth data.

**Params:**
- `vanId`: Van identifier (required)
- `range`: Time range (default: `5m`)

**Response:**
```json
{
  "eth0 (192.168.1.100)": [
    {
      "timestamp": 1699200000,
      "download_mbps": 15.2,
      "upload_mbps": 3.4
    }
  ]
}
```

### GET `/api/metrics/current`
Returns current/latest values.

**Params:**
- `vanId`: Van identifier (required)

**Response:**
```json
{
  "download": 85.5,
  "upload": 12.3,
  "ping": 25
}
```

## How to Use

### 1. Access the Dashboard
Open: `https://921fea644d0c.ngrok-free.app`

### 2. Setup Backend URL
Enter: `https://a97ebe7bfda9.ngrok-free.app`

### 3. Login
- Username: `admin`
- Password: `admin123`

### 4. Go to Dashboard Tab
- Select a van from the dropdown
- View network metrics in custom charts

## Benefits vs iframe

### ✅ Pros:
- **Native design**: Matches your app's look and feel
- **Better UX**: No iframe scrolling/loading issues
- **Full control**: Customize charts, colors, layouts
- **Responsive**: Works on mobile/tablet better
- **Faster**: No extra iframe overhead
- **More features**: Can add custom interactivity

### ❌ Cons:
- Can't use Grafana's built-in editing UI
- Need to code chart changes manually
- More frontend code to maintain

## Customization

### Change Chart Colors
Edit `main-dashboard/frontend/src/components/NetworkCharts.jsx`:

```jsx
<Line 
  type="monotone" 
  dataKey="download" 
  stroke="#3b82f6"  // Change this color
  strokeWidth={2}
  name="Download"
/>
```

### Add More Metrics
1. Add query in `main-dashboard/backend/routes/metrics.js`
2. Create new chart in `NetworkCharts.jsx`
3. Profit!

### Change Refresh Rate
Edit `NetworkCharts.jsx`:
```jsx
const interval = setInterval(fetchMetrics, 10000); // Change 10000 to desired ms
```

## Still Want Grafana?

Grafana is still running on `http://localhost:3000`!

You can:
- Use it for advanced analytics
- Create custom dashboards
- Set up alerts
- Export data
- Just login at http://localhost:3000 (admin/admin)

## Next Steps

1. **Configure van agent** to expose metrics
2. **Add van to Prometheus** targets
3. **Watch data flow** in real-time
4. **Customize charts** to your liking!

See `NETWORK_MONITORING_SETUP.md` for complete setup instructions.




