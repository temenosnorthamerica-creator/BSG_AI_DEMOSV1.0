# AmrBSGBankEcoIntDemo - Health Monitor with Service Control
# Real-time health monitoring dashboard with stop/start/restart capabilities

param(
    [int]$RefreshInterval = 5
)

$Host.UI.RawUI.WindowTitle = "Health Monitor - AmrBSGBankEcoIntDemo"

# Service Definitions with paths and commands
$Services = @(
    @{ Name = "Config API Server"; Port = 3010; Type = "Backend"; Category = "Config"; Path = "brian.grundleger\BG_DallasAiProjects\DallasAiProjects"; StartCmd = "npm run config-server" },
    @{ Name = "Landing Page"; Port = 3000; Type = "Frontend"; Category = "Main"; Path = "brian.grundleger\BG_DallasAiProjects\DallasAiProjects"; StartCmd = "npm run dev" },
    @{ Name = "CRM Banking Simulator"; Port = 3001; Type = "Frontend"; Category = "Demo"; Path = "alwin\crm-banking-simulator_v2\crm-banking-simulator_v2"; StartCmd = "npm run dev" },
    @{ Name = "BSG Demo - Frontend"; Port = 3002; Type = "Frontend"; Category = "Demo"; Path = "migarcia\DALLASAI 1\DALLASAI\frontend"; StartCmd = "npm run dev" },
    @{ Name = "BSG Demo - Backend"; Port = 8002; Type = "Backend"; Category = "Demo"; Path = "migarcia\DALLASAI 1\DALLASAI\backend"; StartCmd = "python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload" },
    @{ Name = "Debit Cards - Frontend"; Port = 3003; Type = "Frontend"; Category = "Demo"; Path = "sweekruth.somaraju\debitcards\debitcards\frontend"; StartCmd = "npm run dev" },
    @{ Name = "Debit Cards - Backend"; Port = 8003; Type = "Backend"; Category = "Demo"; Path = "sweekruth.somaraju\debitcards\debitcards\backend"; StartCmd = "python -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload" },
    @{ Name = "LMS Applicant Portal"; Port = 3004; Type = "Frontend"; Category = "Demo"; Path = "mmoore\lms-applicant-portal\lms-applicant-portal"; StartCmd = "npm run dev" },
    @{ Name = "ESB - Frontend"; Port = 3016; Type = "Frontend"; Category = "Demo"; Path = "m.mahaboobhussain\ESB\ESB_V1.0\frontend"; StartCmd = "npm run dev" },
    @{ Name = "ESB - Backend"; Port = 8006; Type = "Backend"; Category = "Demo"; Path = "m.mahaboobhussain\ESB\ESB_V1.0\backend"; StartCmd = "npm run dev" }
)

# File watcher status
$ConfigFile = Join-Path $PSScriptRoot "apps_integration_info.txt"

# Mode: dashboard or control
$Mode = "dashboard"
$SelectedIndex = 0
$ActionMessage = ""
$ActionMessageExpiry = $null

function Test-ServiceHealth {
    param([int]$Port)

    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $tcpClient.BeginConnect("localhost", $Port, $null, $null)
        $wait = $asyncResult.AsyncWaitHandle.WaitOne(1000, $false)

        if ($wait) {
            try {
                $tcpClient.EndConnect($asyncResult)
                $tcpClient.Close()
                return "Running"
            }
            catch {
                return "Stopped"
            }
        }
        else {
            $tcpClient.Close()
            return "Stopped"
        }
    }
    catch {
        return "Stopped"
    }
}

function Get-ProcessByPort {
    param([int]$Port)

    try {
        $netstat = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
        if ($netstat) {
            $line = $netstat.Line.Trim()
            $parts = $line -split '\s+'
            $pid = $parts[-1]
            if ($pid -match '^\d+$') {
                return [int]$pid
            }
        }
    }
    catch { }
    return $null
}

function Stop-ServiceByPort {
    param([int]$Port, [string]$ServiceName)

    $pid = Get-ProcessByPort -Port $Port
    if ($pid) {
        try {
            taskkill /F /PID $pid /T 2>&1 | Out-Null
            return "Stopped $ServiceName (PID: $pid)"
        }
        catch {
            return "Failed to stop $ServiceName"
        }
    }
    else {
        return "$ServiceName is already stopped"
    }
}

function Start-ServiceProcess {
    param($Service)

    $FullPath = Join-Path $PSScriptRoot $Service.Path

    if (-not (Test-Path $FullPath)) {
        return "Path not found: $($Service.Path)"
    }

    $Title = "$($Service.Name) - Port: $($Service.Port)"

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$FullPath'; Write-Host 'Starting $($Service.Name)...' -ForegroundColor Cyan; $($Service.StartCmd)"
    ) -WindowStyle Normal

    return "Started $($Service.Name)"
}

function Get-FileWatcherStatus {
    if (Test-Path $ConfigFile) {
        $lastWrite = (Get-Item $ConfigFile).LastWriteTime
        return @{
            Status = "Active"
            LastModified = $lastWrite.ToString("HH:mm:ss")
        }
    }
    else {
        return @{
            Status = "File Not Found"
            LastModified = "N/A"
        }
    }
}

function Show-Dashboard {
    Clear-Host

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $runningCount = 0
    $stoppedCount = 0

    # Header
    Write-Host ""
    Write-Host "  +========================================================================+" -ForegroundColor Cyan
    Write-Host "  |            AmrBSGBankEcoIntDemo - Health Monitor                       |" -ForegroundColor Cyan
    Write-Host "  +========================================================================+" -ForegroundColor Cyan
    Write-Host "  |  Last Check: $timestamp                      Auto-refresh: ${RefreshInterval}s   |" -ForegroundColor Cyan
    Write-Host "  +========================================================================+" -ForegroundColor Cyan

    if ($Mode -eq "dashboard") {
        Write-Host "  |  SERVICE                              PORT        STATUS               |" -ForegroundColor Cyan
    }
    else {
        Write-Host "  |  #   SERVICE                          PORT        STATUS    ACTION     |" -ForegroundColor Cyan
    }
    Write-Host "  +========================================================================+" -ForegroundColor Cyan

    # Check each service
    $results = @()
    $index = 0
    foreach ($service in $Services) {
        $status = Test-ServiceHealth -Port $service.Port
        $results += @{
            Index = $index
            Name = $service.Name
            Port = $service.Port
            Type = $service.Type
            Status = $status
            Service = $service
        }

        if ($status -eq "Running") {
            $runningCount++
        }
        else {
            $stoppedCount++
        }
        $index++
    }

    # Display Backends
    Write-Host "  |  " -NoNewline -ForegroundColor Cyan
    Write-Host "BACKENDS" -NoNewline -ForegroundColor Yellow
    Write-Host "                                                              |" -ForegroundColor Cyan

    foreach ($result in ($results | Where-Object { $_.Type -eq "Backend" })) {
        $isSelected = ($Mode -eq "control" -and $SelectedIndex -eq $result.Index)

        if ($Mode -eq "control") {
            $indexStr = ("{0,2}" -f $result.Index).PadRight(4)
        }
        else {
            $indexStr = ""
        }

        $nameStr = $result.Name.PadRight(31)
        $portStr = (":$($result.Port)").PadRight(12)

        Write-Host "  |  " -NoNewline -ForegroundColor Cyan

        if ($isSelected) {
            Write-Host ">" -NoNewline -ForegroundColor Yellow
        }
        else {
            Write-Host " " -NoNewline
        }

        if ($Mode -eq "control") {
            Write-Host $indexStr -NoNewline -ForegroundColor DarkGray
        }

        if ($result.Status -eq "Running") {
            Write-Host "* " -NoNewline -ForegroundColor Green
            Write-Host "$nameStr" -NoNewline -ForegroundColor $(if ($isSelected) { "Yellow" } else { "White" })
            Write-Host "$portStr" -NoNewline -ForegroundColor Gray
            Write-Host "OK Running" -NoNewline -ForegroundColor Green
            if ($Mode -eq "control") {
                Write-Host "  " -NoNewline
            }
            else {
                Write-Host "   " -NoNewline
            }
        }
        else {
            Write-Host "x " -NoNewline -ForegroundColor Red
            Write-Host "$nameStr" -NoNewline -ForegroundColor $(if ($isSelected) { "Yellow" } else { "Gray" })
            Write-Host "$portStr" -NoNewline -ForegroundColor Gray
            Write-Host "!! Stopped" -NoNewline -ForegroundColor Red
            if ($Mode -eq "control") {
                Write-Host "  " -NoNewline
            }
            else {
                Write-Host "   " -NoNewline
            }
        }
        Write-Host "|" -ForegroundColor Cyan
    }

    Write-Host "  +------------------------------------------------------------------------+" -ForegroundColor Cyan

    # Display Frontends
    Write-Host "  |  " -NoNewline -ForegroundColor Cyan
    Write-Host "FRONTENDS" -NoNewline -ForegroundColor Yellow
    Write-Host "                                                             |" -ForegroundColor Cyan

    foreach ($result in ($results | Where-Object { $_.Type -eq "Frontend" })) {
        $isSelected = ($Mode -eq "control" -and $SelectedIndex -eq $result.Index)

        if ($Mode -eq "control") {
            $indexStr = ("{0,2}" -f $result.Index).PadRight(4)
        }
        else {
            $indexStr = ""
        }

        $nameStr = $result.Name.PadRight(31)
        $portStr = (":$($result.Port)").PadRight(12)

        Write-Host "  |  " -NoNewline -ForegroundColor Cyan

        if ($isSelected) {
            Write-Host ">" -NoNewline -ForegroundColor Yellow
        }
        else {
            Write-Host " " -NoNewline
        }

        if ($Mode -eq "control") {
            Write-Host $indexStr -NoNewline -ForegroundColor DarkGray
        }

        if ($result.Status -eq "Running") {
            Write-Host "* " -NoNewline -ForegroundColor Green
            Write-Host "$nameStr" -NoNewline -ForegroundColor $(if ($isSelected) { "Yellow" } else { "White" })
            Write-Host "$portStr" -NoNewline -ForegroundColor Gray
            Write-Host "OK Running" -NoNewline -ForegroundColor Green
            if ($Mode -eq "control") {
                Write-Host "  " -NoNewline
            }
            else {
                Write-Host "   " -NoNewline
            }
        }
        else {
            Write-Host "x " -NoNewline -ForegroundColor Red
            Write-Host "$nameStr" -NoNewline -ForegroundColor $(if ($isSelected) { "Yellow" } else { "Gray" })
            Write-Host "$portStr" -NoNewline -ForegroundColor Gray
            Write-Host "!! Stopped" -NoNewline -ForegroundColor Red
            if ($Mode -eq "control") {
                Write-Host "  " -NoNewline
            }
            else {
                Write-Host "   " -NoNewline
            }
        }
        Write-Host "|" -ForegroundColor Cyan
    }

    Write-Host "  +------------------------------------------------------------------------+" -ForegroundColor Cyan

    # File Watcher Status
    $fileStatus = Get-FileWatcherStatus
    Write-Host "  |  " -NoNewline -ForegroundColor Cyan
    Write-Host "FILE WATCHER & INTEGRATIONS" -NoNewline -ForegroundColor Yellow
    Write-Host "                                      |" -ForegroundColor Cyan

    Write-Host "  |  " -NoNewline -ForegroundColor Cyan
    if ($fileStatus.Status -eq "Active") {
        Write-Host "* " -NoNewline -ForegroundColor Green
        Write-Host "apps_integration_info.txt          " -NoNewline -ForegroundColor White
        Write-Host "Watching    " -NoNewline -ForegroundColor Gray
        Write-Host "Last: $($fileStatus.LastModified)" -NoNewline -ForegroundColor Green
    }
    else {
        Write-Host "x " -NoNewline -ForegroundColor Red
        Write-Host "apps_integration_info.txt          " -NoNewline -ForegroundColor Gray
        $statusText = $fileStatus.Status.PadRight(24)
        Write-Host "$statusText" -NoNewline -ForegroundColor Red
    }
    Write-Host "  |" -ForegroundColor Cyan

    Write-Host "  +------------------------------------------------------------------------+" -ForegroundColor Cyan

    # Summary
    $total = $runningCount + $stoppedCount
    Write-Host "  |  " -NoNewline -ForegroundColor Cyan
    Write-Host "SUMMARY: " -NoNewline -ForegroundColor White
    Write-Host "$runningCount" -NoNewline -ForegroundColor Green
    Write-Host "/$total Running" -NoNewline -ForegroundColor White
    Write-Host "  |  " -NoNewline -ForegroundColor Gray

    if ($stoppedCount -gt 0) {
        Write-Host "$stoppedCount Stopped" -NoNewline -ForegroundColor Red
        Write-Host "                              |" -ForegroundColor Cyan
    }
    else {
        Write-Host "All services healthy!" -NoNewline -ForegroundColor Green
        Write-Host "                   |" -ForegroundColor Cyan
    }

    Write-Host "  +========================================================================+" -ForegroundColor Cyan

    # Action Message
    if ($ActionMessage -and $ActionMessageExpiry -and (Get-Date) -lt $ActionMessageExpiry) {
        Write-Host ""
        Write-Host "    >> $ActionMessage" -ForegroundColor Magenta
    }

    Write-Host ""

    # Controls based on mode
    if ($Mode -eq "dashboard") {
        Write-Host "    (R) Refresh  |  (C) Control Mode  |  (O) Open Landing Page  |  (Q) Quit" -ForegroundColor Gray
    }
    else {
        Write-Host "    CONTROL MODE - Select service and action:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "    (Up/Down) Navigate  |  (S) Start  |  (X) Stop  |  (T) Restart" -ForegroundColor Gray
        Write-Host "    (A) Start All  |  (D) Dashboard Mode  |  (Q) Quit" -ForegroundColor Gray
        Write-Host ""
        Write-Host "    Or enter service number (0-$($Services.Count - 1)) to select" -ForegroundColor DarkGray
    }
    Write-Host ""

    return $results
}

# Main loop
$running = $true
$lastRefresh = Get-Date
$results = @()

while ($running) {
    $results = Show-Dashboard

    $timeout = [DateTime]::Now.AddSeconds($RefreshInterval)

    while ([DateTime]::Now -lt $timeout) {
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true)

            if ($Mode -eq "dashboard") {
                switch ($key.Key) {
                    'R' {
                        # Manual refresh
                        break
                    }
                    'C' {
                        # Switch to control mode
                        $Mode = "control"
                        $SelectedIndex = 0
                        break
                    }
                    'O' {
                        # Open landing page
                        Start-Process "http://localhost:3000"
                    }
                    'Q' {
                        $running = $false
                        break
                    }
                }
            }
            else {
                # Control mode
                switch ($key.Key) {
                    'UpArrow' {
                        $SelectedIndex = [Math]::Max(0, $SelectedIndex - 1)
                        break
                    }
                    'DownArrow' {
                        $SelectedIndex = [Math]::Min($Services.Count - 1, $SelectedIndex + 1)
                        break
                    }
                    'S' {
                        # Start selected service
                        $service = $Services[$SelectedIndex]
                        $ActionMessage = Start-ServiceProcess -Service $service
                        $ActionMessageExpiry = (Get-Date).AddSeconds(5)
                        break
                    }
                    'X' {
                        # Stop selected service
                        $service = $Services[$SelectedIndex]
                        if ($service.Port -eq 3010) {
                            $ActionMessage = "Cannot stop Config API from this monitor"
                        }
                        else {
                            $ActionMessage = Stop-ServiceByPort -Port $service.Port -ServiceName $service.Name
                        }
                        $ActionMessageExpiry = (Get-Date).AddSeconds(5)
                        break
                    }
                    'T' {
                        # Restart selected service
                        $service = $Services[$SelectedIndex]
                        if ($service.Port -eq 3010) {
                            $ActionMessage = "Cannot restart Config API from this monitor"
                        }
                        else {
                            Stop-ServiceByPort -Port $service.Port -ServiceName $service.Name | Out-Null
                            Start-Sleep -Milliseconds 1000
                            $ActionMessage = Start-ServiceProcess -Service $service
                        }
                        $ActionMessageExpiry = (Get-Date).AddSeconds(5)
                        break
                    }
                    'A' {
                        # Start all stopped services
                        $started = 0
                        foreach ($service in $Services) {
                            $status = Test-ServiceHealth -Port $service.Port
                            if ($status -eq "Stopped") {
                                Start-ServiceProcess -Service $service | Out-Null
                                $started++
                                Start-Sleep -Milliseconds 500
                            }
                        }
                        $ActionMessage = "Started $started services"
                        $ActionMessageExpiry = (Get-Date).AddSeconds(5)
                        break
                    }
                    'D' {
                        # Switch back to dashboard mode
                        $Mode = "dashboard"
                        break
                    }
                    'R' {
                        # Refresh
                        break
                    }
                    'Q' {
                        $running = $false
                        break
                    }
                    default {
                        # Check for number input
                        $char = $key.KeyChar
                        if ($char -match '^\d$') {
                            $num = [int]$char.ToString()
                            if ($num -ge 0 -and $num -lt $Services.Count) {
                                $SelectedIndex = $num
                            }
                        }
                        elseif ($key.Key -eq 'D1' -and $key.Modifiers -eq 'None') {
                            # Handle 10, 11 with Shift+number
                            # This is a simplified version
                        }
                    }
                }
            }

            if (-not $running) { break }
            if ($key.Key -eq 'R' -or $key.Key -eq 'C' -or $key.Key -eq 'D' -or
                $key.Key -eq 'UpArrow' -or $key.Key -eq 'DownArrow' -or
                $key.Key -eq 'S' -or $key.Key -eq 'X' -or $key.Key -eq 'T' -or $key.Key -eq 'A') {
                break
            }
        }

        Start-Sleep -Milliseconds 100
    }
}

Write-Host "Health Monitor stopped." -ForegroundColor Yellow
