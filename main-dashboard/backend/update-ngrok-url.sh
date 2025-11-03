#!/bin/sh
# Wait for ngrok to start and get the URL
sleep 5

NGROK_URL=$(wget -qO- http://dashboard-ngrok:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -n1 | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
  echo "Detected ngrok URL: $NGROK_URL"
  export DASHBOARD_PUBLIC_URL="$NGROK_URL"
  # You could write this to a file that agents can fetch
  echo "{\"dashboardUrl\":\"$NGROK_URL\"}" > /tmp/dashboard-url.json
else
  echo "Could not detect ngrok URL"
fi

# Start the actual server
node server.js

