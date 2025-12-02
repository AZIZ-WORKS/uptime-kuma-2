#!/bin/bash
echo "Getting agent URL from ngrok logs..."
echo ""

# Check if ngrok container is running
if ! docker ps | grep -q van-ngrok; then
    echo "❌ Ngrok container is not running!"
    echo "Start it with: docker compose up -d ngrok"
    exit 1
fi

# Get all ngrok logs and look for URLs
echo "Checking ngrok logs for agent tunnel URL..."
echo ""

# Try to find the agent URL in logs
AGENT_URL=$(docker logs van-ngrok 2>&1 | grep -i "agent" | grep -oP 'https://[^\s]+\.ngrok[^\s]*' | head -n1)

if [ -z "$AGENT_URL" ]; then
    # Try without filtering for agent - just get any ngrok URL
    AGENT_URL=$(docker logs van-ngrok 2>&1 | grep -oP 'https://[^\s]+\.ngrok[^\s]*' | head -n1)
fi

if [ -z "$AGENT_URL" ]; then
    echo "❌ Could not find URL in logs"
    echo ""
    echo "Showing recent ngrok logs:"
    echo "----------------------------------------"
    docker logs van-ngrok 2>&1 | tail -30
    echo "----------------------------------------"
    echo ""
    echo "Look for a line containing 'https://' and '.ngrok'"
    echo "The URL should look like: https://xxxxx.ngrok-free.app"
    exit 1
fi

echo "✅ Found agent URL:"
echo ""
echo "   $AGENT_URL"
echo ""
echo "📝 Add this to main-dashboard/targets.json:"
echo ""
echo "{"
echo "  \"targets\": [\"${AGENT_URL}:443\"],"
echo "  \"labels\": {"
echo "    \"job\": \"vans\","
echo "    \"van_id\": \"\$(grep VAN_ID .env | cut -d'=' -f2)\""
echo "  }"
echo "}"
echo ""

