@echo off
rem itsvc.co.kr display check, English edition (read-only). See the notes below the PS marker.
rem Reads the monitor's preferred resolution / refresh rate and the graphics adapter's current mode, then opens https://itsvc.co.kr/en/display-resolution-check.html
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText('%~f0',[Text.Encoding]::UTF8); $i=$s.IndexOf('#PS'+'-START'); Invoke-Expression $s.Substring($i)"
exit /b

#PS-START
# Monitor resolution and refresh rate check (read-only)
# - Reads the best (preferred) resolution and supported modes the monitor reports, and the resolution and refresh rate the graphics adapter is using now, then opens the result page.
# - It changes no settings and deletes no files, and hands the result only to the browser on this PC. Administrator rights are not needed.
$ErrorActionPreference = 'Continue'
Write-Host ''
Write-Host 'Monitor resolution and refresh rate check (read-only)' -ForegroundColor Cyan
Write-Host 'Reading the monitor and graphics adapter information...'

function Get-Hz($m) { if ($m.VerticalRefreshRateDenominator -gt 0) { [math]::Round($m.VerticalRefreshRateNumerator / $m.VerticalRefreshRateDenominator, 2) } else { 0 } }

# Monitor name (manufacturer and model), paired with the supported-mode list by the same InstanceName.
$ids = @{}
try {
    Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction Stop | ForEach-Object {
        $mk = (($_.ManufacturerName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '')
        $md = (($_.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '')
        $ids["$($_.InstanceName)"] = [pscustomobject]@{ maker = $mk; model = $md }
    }
} catch { }

# The preferred mode the monitor reports (usually the best resolution) and its supported modes (maximum refresh rate per resolution, largest first, up to 12).
$mon = @()
try {
    $mon = @(Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorListedSupportedSourceModes -ErrorAction Stop | ForEach-Object {
        $o = $_
        $modes = @($o.MonitorSourceModes)
        $p = $null
        if ($modes.Count -gt 0 -and $o.PreferredMonitorSourceModeIndex -lt $modes.Count) { $p = $modes[$o.PreferredMonitorSourceModeIndex] }
        if ($p) {
            $list = @($modes | Where-Object { $_.HorizontalActivePixels -gt 0 -and $_.VerticalActivePixels -gt 0 } |
                Group-Object { "$($_.HorizontalActivePixels)x$($_.VerticalActivePixels)" } |
                ForEach-Object {
                    $g = @($_.Group)
                    $mx = ($g | ForEach-Object { Get-Hz $_ } | Measure-Object -Maximum).Maximum
                    [pscustomobject]@{ w = [int]$g[0].HorizontalActivePixels; h = [int]$g[0].VerticalActivePixels; maxHz = $mx }
                } | Sort-Object { $_.w * $_.h } -Descending | Select-Object -First 12)
            $id = $ids["$($o.InstanceName)"]
            [pscustomobject]@{ name = "$($o.InstanceName)"; maker = "$($id.maker)"; model = "$($id.model)"; active = [bool]$o.Active; prefW = [int]$p.HorizontalActivePixels; prefH = [int]$p.VerticalActivePixels; prefHz = (Get-Hz $p); modes = $list }
        }
    })
} catch { Write-Host 'Could not read the monitor information.' -ForegroundColor Yellow }

# The resolution and refresh rate the graphics adapter is using now.
$gpu = @()
try {
    $gpu = @(Get-CimInstance -ClassName Win32_VideoController -ErrorAction Stop | ForEach-Object {
        [pscustomobject]@{ name = "$($_.Name)"; curW = [int]$_.CurrentHorizontalResolution; curH = [int]$_.CurrentVerticalResolution; curHz = [int]$_.CurrentRefreshRate; driver = "$($_.DriverVersion)" }
    })
} catch { Write-Host 'Could not read the graphics adapter information.' -ForegroundColor Yellow }

$json = [pscustomobject]@{ v = 1; monitors = @($mon); adapters = @($gpu) } | ConvertTo-Json -Depth 5 -Compress
$page = 'https://itsvc.co.kr/en/display-resolution-check.html'

# Shrink the JSON with gzip + base64url and put it after the # in the address. The value after # is not sent to a server.
$bytes = [Text.Encoding]::UTF8.GetBytes($json)
$ms = New-Object IO.MemoryStream
$gz = New-Object IO.Compression.GZipStream($ms, [IO.Compression.CompressionMode]::Compress)
$gz.Write($bytes, 0, $bytes.Length)
$gz.Close()
$b64 = [Convert]::ToBase64String($ms.ToArray()).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$url = "$page#d=$b64"

if ($url.Length -le 1900) {
    Write-Host 'Opening the result page in your browser.' -ForegroundColor Green
    Start-Process $url
} else {
    # If the address is too long, pass it through the clipboard (paste it into the page).
    try { Set-Clipboard -Value $json } catch {}
    Write-Host 'The result was copied to the clipboard. Paste it (Ctrl+V) into the page that opens.' -ForegroundColor Green
    Start-Process $page
}
Write-Host ''
Read-Host 'Press Enter to close this window'
