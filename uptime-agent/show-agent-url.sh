#!/bin/bash
echo ""
echo "=========================================="
echo "  🚐 Agent URLs"
echo "=========================================="
echo ""

# Method 1: Try ngrok local API (port 4040)
AGENT_URL=""
if command -v curl &> /dev/null; then
    API_RESPONSE=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)
    if [ ! -z "$API_RESPONSE" ]; then
        AGENT_URL=$(echo "$API_RESPONSE" | grep -oP '"public_url":"https://[^"]*\.ngrok[^"]*"' | grep -oP 'https://[^"]*\.ngrok[^"]*' | head -n1)
    fi
fi

# Method 2: Try different log formats
if [ -z "$AGENT_URL" ]; then
    # Try format: url=https://...
    AGENT_URL=$(docker logs van-ngrok 2>&1 | grep -i "agent" | grep -oP 'https://[^\s]+\.ngrok[^\s]*' | head -n1)
fi

if [ -z "$AGENT_URL" ]; then
    # Try format: Forwarding https://...
    AGENT_URL=$(docker logs van-ngrok 2>&1 | grep -i "forwarding" | grep -i "agent" | grep -oP 'https://[^\s]+\.ngrok[^\s]*' | head -n1)
fi

if [ -z "$AGENT_URL" ]; then
    # Try any https ngrok URL in logs
    AGENT_URL=$(docker logs van-ngrok 2>&1 | grep -oP 'https://[^\s]+\.ngrok[^\s]*' | head -n1)
fi

if [ -z "$AGENT_URL" ]; then
    echo "⏳ Ngrok tunnel not ready yet. Waiting..."
    sleep 5
    
    # Retry all methods
    if command -v curl &> /dev/null; then
        API_RESPONSE=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)
        if [ ! -z "$API_RESPONSE" ]; then
            AGENT_URL=$(echo "$API_RESPONSE" | grep -oP '"public_url":"https://[^"]*\.ngrok[^"]*"' | grep -oP 'https://[^"]*\.ngrok[^"]*' | head -n1)
        fi
    fi
    
    if [ -z "$AGENT_URL" ]; then
        AGENT_URL=$(docker logs van-ngrok 2>&1 | grep -oP 'https://[^\s]+\.ngrok[^\s]*' | head -n1)
    fi
fi

if [ -z "$AGENT_URL" ]; then
    echo "❌ Could not find agent ngrok URL automatically"
    echo ""
    echo "Please try these methods:"
    echo ""
    echo "Method 1: Check ngrok web interface"
    echo "   Open: http://localhost:4040"
    echo "   Look for the 'agent' tunnel URL"
    echo ""
    echo "Method 2: Check logs manually"
    echo "   docker logs van-ngrok"
    echo "   Look for any line containing 'https://' and '.ngrok'"
    echo ""
    echo "Method 3: Use ngrok API"
    echo "   curl http://localhost:4040/api/tunnels"
    echo ""
    exit 1
fi

echo "🔌 AGENT METRICS URL (for Prometheus targets.json):"
echo "   ${AGENT_URL}:443"
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
echo "=========================================="
echo ""
echo "💡 After adding to targets.json, reload Prometheus:"
echo "   cd main-dashboard"
echo "   docker restart dashboard-prometheus"
echo ""
echo "=========================================="

