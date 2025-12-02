# How to Get Your Agent URL

If the script doesn't work, here are manual methods to find your agent's ngrok URL:

## Method 1: Ngrok Web Interface (Easiest)

1. Open your browser
2. Go to: **http://localhost:4040**
3. You'll see a web interface showing all active tunnels
4. Look for the tunnel named **"agent"** (port 5000)
5. Copy the **Forwarding** URL (e.g., `https://xxxxx.ngrok-free.app`)

## Method 2: Ngrok API (PowerShell)

```powershell
Invoke-RestMethod http://localhost:4040/api/tunnels | ConvertTo-Json
```

Or in one line to get just the agent URL:
```powershell
(Invoke-RestMethod http://localhost:4040/api/tunnels).tunnels | Where-Object { $_.config.addr -like "*5000*" } | Select-Object -ExpandProperty public_url
```

## Method 3: Check Docker Logs

```powershell
docker logs van-ngrok
```

Look for any line containing:
- `https://` 
- `.ngrok`
- `agent`
- `5000`

Example output you might see:
```
Forwarding   https://abc123.ngrok-free.app -> http://agent:5000
```

## Method 4: Filter Logs for URLs

```powershell
docker logs van-ngrok 2>&1 | Select-String "https://.*\.ngrok"
```

This will show only lines with ngrok URLs.

## Method 5: Check All Running Containers

```powershell
docker ps
```

Make sure `van-ngrok` is running. If not, start it:
```powershell
cd uptime-agent
docker compose up -d ngrok
```

## Once You Have the URL

Add it to `main-dashboard/targets.json`:

```json
[
  {
    "targets": ["https://YOUR_URL_HERE.ngrok-free.app:443"],
    "labels": {
      "job": "vans",
      "van_id": "van2"
    }
  }
]
```

Then reload Prometheus:
```powershell
cd main-dashboard
docker restart dashboard-prometheus
```

