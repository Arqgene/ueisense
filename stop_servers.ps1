$ports = 8000, 3001, 5173
$foundAny = $false

foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                if ($conn.OwningProcess -gt 4) {
                    $foundAny = $true
                    $procName = (Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue).ProcessName
                    Write-Host "Stopping process '$procName' (PID $($conn.OwningProcess)) on port $port..." -ForegroundColor Yellow
                    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {}
}

if (-not $foundAny) {
    Write-Host "No running services found on ports 8000, 3001, or 5173." -ForegroundColor Cyan
} else {
    Write-Host "All Uveitis AI services stopped successfully." -ForegroundColor Green
}
