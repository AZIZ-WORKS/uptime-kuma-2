# Fixing ngrok 401 Errors for Prometheus Scraping

## Problem
ngrok free tier intermittently blocks Prometheus scraping with 401 errors due to browser warning checks.

## Solution Options

### Option 1: Configure ngrok on Agent Side (Recommended)
Add request header rewrite to the agent's ngrok.yml:

```yaml
version: "2"
authtoken: YOUR_TOKEN
tunnels:
  agent:
    proto: http
    addr: agent:5000
    request_header:
      add:
        - "ngrok-skip-browser-warning: true"
```

Then restart the agent's ngrok container.

### Option 2: Use ngrok Edge (Paid)
Upgrade to ngrok paid plan and configure an Edge that allows automated scraping.

### Option 3: Use Alternative Tunnel
- Cloudflare Tunnel (free, no browser warnings)
- Tailscale (free for personal use)
- WireGuard VPN

### Option 4: Direct Connection
If agent and Prometheus are on same network, connect directly without tunnel.

## Current Status
- Proxy is working (sometimes returns 200)
- ngrok is intermittently blocking (401 errors)
- Metrics are available when ngrok allows access

## Next Steps
1. Configure agent's ngrok.yml with request_header.add
2. Restart agent's ngrok container
3. Verify Prometheus can scrape consistently
