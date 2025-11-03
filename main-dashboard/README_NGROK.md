# Auto-Discovery Setup

To avoid manually updating the ngrok URL on each van:

## Option 1: Use a static discovery URL (Recommended)

1. Create a free account on pastebin.com or gist.github.com
2. When the dashboard starts, run:
   ```bash
   ./get-ngrok-url.sh
   ```
3. Manually update the paste/gist with the new URL (one-time, when dashboard restarts)
4. Set `DASHBOARD_DISCOVERY_URL` on each van to that paste URL

## Option 2: Use ngrok's fixed domain (Paid Plan)

With ngrok Pro ($8/month), you get a fixed domain that doesn't change:
- Your URL: `https://your-domain.ngrok.app`
- Set once in van's `.env`, never changes

## Option 3: Use the office public IP (if static)

If your office has a static IP:
1. Forward port 4000 on office router
2. Set `DASHBOARD_API_URL=http://<office-public-ip>:4000`
3. Never changes

## Current Quick Fix

After restarting dashboard:
```bash
cd main-dashboard
./get-ngrok-url.sh
# Copy the URL and paste it in van's .env
```

