# How to Get Ngrok URL for Agent (Remote Device)

## Method 1: Ngrok Web Interface (Easiest)

1. **On the remote device**, open your web browser
2. Go to: **http://localhost:4040**
3. You'll see a web page showing all active tunnels
4. Look for the tunnel named **"agent"** (pointing to port 5000)
5. Copy the **Forwarding** URL (e.g., `https://abc123.ngrok-free.app`)

**Note:** If http://localhost:4040 doesn't work, the port might not be exposed. Try Method 2 or 3.

## Method 2: Check Docker Logs

**On the remote device**, run:

```bash
docker logs van-ngrok 2>&1 | grep -i "https://"
```

Or to see more context:

```bash
docker logs van-ngrok 2>&1 | tail -100
```

Look for lines containing:
- `https://` followed by `.ngrok`
- `Forwarding`
- `started tunnel`
- `agent`

**Example output you might see:**
```
Forwarding   https://abc123.ngrok-free.app -> http://agent:5000
```

Or:
```
t=2024-01-01T12:00:00Z lvl=info msg="started tunnel" name=agent url=https://abc123.ngrok-free.app
```

## Method 3: Use Ngrok API (PowerShell/Windows)

**On the remote device** (Windows PowerShell):

```powershell
Invoke-RestMethod http://localhost:4040/api/tunnels | ConvertTo-Json -Depth 10
```

Or to get just the agent URL:

```powershell
$tunnels = Invoke-RestMethod http://localhost:4040/api/tunnels
$agentTunnel = $tunnels.tunnels | Where-Object { $_.name -eq "agent" -or $_.config.addr -like "*5000*" }
$agentTunnel.public_url
```

## Method 4: Check Agent Container Logs

The agent might have logged the ngrok URL when it started:

```bash
docker logs uptime-agent 2>&1 | grep -i "ngrok\|url\|https" | head -20
```

## Method 5: Test Agent Endpoint Directly

If you know the ngrok URL pattern, you can test it:

```bash
# Replace YOUR_URL with the ngrok URL
curl https://YOUR_URL.ngrok-free.app/metrics
```

If it works, you'll see Prometheus metrics output.

## Method 6: Check Ngrok Configuration File

The ngrok URL might be logged or stored. Check:

```bash
# View ngrok config
cat ngrok.yml

# Check if there's a log file
ls -la *.log 2>/dev/null
```

## Method 7: Use Ngrok Dashboard (If You Have Account)

If you have an ngrok account:
1. Go to: https://dashboard.ngrok.com/
2. Login to your account
3. Go to "Cloud Edge" → "Tunnels"
4. You'll see all active tunnels with their URLs

## Method 8: Restart and Watch Logs

Restart ngrok and watch the logs in real-time:

```bash
docker restart van-ngrok
docker logs -f van-ngrok
```

Press `Ctrl+C` to stop watching. Look for the URL in the startup messages.

## Method 9: Check Container Environment

Inspect the ngrok container:

```bash
docker inspect van-ngrok | grep -i "url\|addr\|config"
```

## Method 10: Direct Container Exec (If Available)

If the container has the right tools:

```bash
# Try to access ngrok API from inside container
docker exec van-ngrok wget -qO- http://localhost:4040/api/tunnels 2>/dev/null
```

## What to Do With the URL

Once you have the ngrok URL (e.g., `https://abc123.ngrok-free.app`):

1. **Add to Prometheus targets** on the dashboard server:
   - Edit `main-dashboard/targets.json`
   - Add: `"targets": ["https://abc123.ngrok-free.app:443"]`
   - Include the `van_id` label matching the agent's `VAN_ID`

2. **Test the URL works:**
   ```bash
   curl https://abc123.ngrok-free.app/metrics
   ```
   Should return Prometheus metrics.

3. **Reload Prometheus:**
   ```bash
   cd main-dashboard
   docker restart dashboard-prometheus
   ```

## Troubleshooting

### Port 4040 Not Accessible

If `http://localhost:4040` doesn't work:

1. **Check if port is exposed:**
   ```bash
   docker port van-ngrok
   ```
   Should show: `4040/tcp -> 0.0.0.0:4040`

2. **If not exposed, update docker-compose.yml:**
   ```yaml
   ngrok:
     ports:
       - '4040:4040'
   ```
   Then restart: `docker compose up -d ngrok`

### No URL in Logs

If logs are empty or don't show URL:

1. **Check ngrok is running:**
   ```bash
   docker ps | grep van-ngrok
   ```

2. **Check for errors:**
   ```bash
   docker logs van-ngrok 2>&1 | grep -i "error\|fail"
   ```

3. **Verify ngrok authtoken:**
   - Check `ngrok.yml` has valid `authtoken`
   - Token should be from: https://dashboard.ngrok.com/get-started/your-authtoken

### Ngrok URL Changes

Ngrok free tier URLs change when:
- Container restarts (sometimes)
- After 2 hours of inactivity
- When ngrok service restarts

**Solution:** Use a static domain (requires ngrok paid plan) or update `targets.json` when URL changes.

## Quick Command Reference

```bash
# Get URL from web UI
# Open: http://localhost:4040

# Get URL from logs
docker logs van-ngrok 2>&1 | grep -i "https://.*\.ngrok"

# Get URL from API (PowerShell)
Invoke-RestMethod http://localhost:4040/api/tunnels

# Test URL works
curl https://YOUR_URL.ngrok-free.app/metrics
```

