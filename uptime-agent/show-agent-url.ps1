Write-Host ""
Write-Host "=========================================="
Write-Host "  🚐 Agent URLs"
Write-Host "=========================================="
Write-Host ""

# Get ngrok logs
$logs = docker logs van-ngrok 2>&1

# Look for agent tunnel URL
$agentLine = $logs | Select-String -Pattern "started tunnel.*agent" | Select-Object -First 1

if (-not $agentLine) {
    Write-Host "⏳ Waiting for ngrok to start..."
    Start-Sleep -Seconds 5
    $logs = docker logs van-ngrok 2>&1
    $agentLine = $logs | Select-String -Pattern "started tunnel.*agent" | Select-Object -First 1
}

if (-not $agentLine) {
    Write-Host "❌ Could not find agent ngrok URL automatically"
    Write-Host ""
    Write-Host "Please check manually:"
    Write-Host "   docker logs van-ngrok"
    Write-Host ""
    Write-Host "Look for a line containing 'started tunnel' and 'agent'"
    Write-Host "The URL should look like: https://xxxxx.ngrok-free.app"
    Write-Host ""
    exit 1
}

# Extract URL (look for https:// pattern)
if ($agentLine -match 'https://[^\s]+\.ngrok[^\s]*') {
    $AGENT_URL = $matches[0]
    
    Write-Host "🔌 AGENT METRICS URL (for Prometheus targets.json):"
    Write-Host "   ${AGENT_URL}:443"
    Write-Host ""
    Write-Host "📝 Add this to main-dashboard/targets.json:"
    Write-Host ""
    Write-Host "{"
    Write-Host "  `"targets`": [`"${AGENT_URL}:443`"],"
    Write-Host "  `"labels`": {"
    Write-Host "    `"job`": `"vans`","
    Write-Host "    `"van_id`": `"YOUR_VAN_ID`""
    Write-Host "  }"
    Write-Host "}"
    Write-Host ""
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "💡 After adding to targets.json, reload Prometheus:"
    Write-Host "   cd main-dashboard"
    Write-Host "   docker restart dashboard-prometheus"
    Write-Host ""
    Write-Host "=========================================="
} else {
    Write-Host "❌ Could not extract URL from logs"
    Write-Host "Full line: $agentLine"
}

