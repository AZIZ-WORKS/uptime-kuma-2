#!/bin/bash
echo ""
echo "=========================================="
echo "  🚐 Agent URLs"
echo "=========================================="
echo ""

# Extract agent ngrok URL
AGENT_URL=$(docker logs van-ngrok 2>&1 | grep "started tunnel" | grep "agent" | grep -oP 'url=\K[^ ]+' | head -n1)

if [ -z "$AGENT_URL" ]; then
    echo "⏳ Ngrok tunnel not ready yet. Waiting..."
    sleep 5
    AGENT_URL=$(docker logs van-ngrok 2>&1 | grep "started tunnel" | grep "agent" | grep -oP 'url=\K[^ ]+' | head -n1)
fi

if [ -z "$AGENT_URL" ]; then
    echo "❌ Could not find agent ngrok URL"
    echo ""
    echo "Check ngrok logs:"
    echo "   docker logs van-ngrok"
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

