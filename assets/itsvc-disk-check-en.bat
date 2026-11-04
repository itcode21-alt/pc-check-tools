@echo off
rem itsvc.co.kr disk health check, English edition (read-only). See the notes below the PS marker.
rem Reads disk health and free space, then opens https://itsvc.co.kr/ssd-health-check.html
chcp 65001 >nul
net session >nul 2>&1
if %errorlevel%==0 goto run
rem Try to re-launch as administrator; if declined, continue without admin rights.
powershell -NoProfile -Command "try { Start-Process -FilePath '%~f0' -Verb RunAs -ErrorAction Stop; exit 0 } catch { exit 1 }"
if %errorlevel%==0 exit /b
:run
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText('%~f0',[Text.Encoding]::UTF8); $i=$s.IndexOf('#PS'+'-START'); Invoke-Expression $s.Substring($i)"
exit /b

#PS-START
# Storage health check (read-only)
# - Reads disk status, wear, error records and temperature, drive free space, and the number of storage-related
#   events in the last 30 days, then opens the result page.
# - It changes no settings and deletes no files; the result is handed only to the browser on this PC.
# - Administrator rights are needed to read wear, temperature and error records.
$ErrorActionPreference = 'Continue'
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Host ''
Write-Host 'Storage health check (read-only)' -ForegroundColor Cyan
if (-not $isAdmin) { Write-Host 'Not running as administrator, so wear, temperature and error records may not be readable.' -ForegroundColor Yellow }
Write-Host 'Reading disk information...'

$d = @()
try {
    $d = @(Get-PhysicalDisk -ErrorAction Stop | ForEach-Object {
        $r = $_ | Get-StorageReliabilityCounter -ErrorAction SilentlyContinue
        $l = @(Get-Partition -DiskNumber $_.DeviceId -ErrorAction SilentlyContinue | Where-Object DriveLetter | ForEach-Object { "$($_.DriveLetter):" })
        [pscustomobject]@{ diskNumber = $_.DeviceId; drives = $l; model = $_.FriendlyName; mediaType = "$($_.MediaType)"; busType = "$($_.BusType)"; health = "$($_.HealthStatus)"; operational = "$($_.OperationalStatus)"; sizeGB = [math]::Round($_.Size / 1GB); wear = $r.Wear; temperature = $r.Temperature; powerOnHours = $r.PowerOnHours; readErrorsUncorrected = $r.ReadErrorsUncorrected; writeErrorsUncorrected = $r.WriteErrorsUncorrected; readLatencyMax = $r.ReadLatencyMax; writeLatencyMax = $r.WriteLatencyMax; flushLatencyMax = $r.FlushLatencyMax }
    })
} catch { Write-Host 'Could not read disk information.' -ForegroundColor Yellow }

$v = @()
try {
    $v = @(Get-Volume -ErrorAction Stop | Where-Object DriveLetter | ForEach-Object {
        [pscustomobject]@{ drive = "$($_.DriveLetter):"; sizeGB = [math]::Round($_.Size / 1GB, 1); freeGB = [math]::Round($_.SizeRemaining / 1GB, 1) }
    })
} catch { Write-Host 'Could not read drive free space.' -ForegroundColor Yellow }

Write-Host 'Counting storage-related event records from the last 30 days...'
$events = @()
$eventsOk = $true
try {
    $since = (Get-Date).AddDays(-30).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.000Z')
    $xpath = "*[System[TimeCreated[@SystemTime>='$since'] and ((Provider[@Name='disk'] and (EventID=7 or EventID=9 or EventID=11 or EventID=51 or EventID=52 or EventID=153 or EventID=154 or EventID=157)) or (Provider[@Name='stornvme'] and (EventID=11 or EventID=129)) or (Provider[@Name='storahci'] and EventID=129) or ((Provider[@Name='Ntfs'] or Provider[@Name='Microsoft-Windows-Ntfs']) and (EventID=50 or EventID=55 or EventID=57 or EventID=140)))]]"
    $events = @(Get-WinEvent -LogName System -FilterXPath $xpath -MaxEvents 3000 -ErrorAction Stop | Group-Object { "$($_.ProviderName)|$($_.Id)|" + [regex]::Match("$($_.Message)", 'Harddisk(\d+)').Groups[1].Value } | ForEach-Object {
        $p = $_.Name -split '\|'
        [pscustomobject]@{ provider = $p[0]; id = [int]$p[1]; disk = $p[2]; count = $_.Count; last = $_.Group[0].TimeCreated.ToString('yyyy-MM-dd') }
    })
} catch { if ($_.FullyQualifiedErrorId -notlike 'NoMatchingEventsFound*') { $eventsOk = $false } }

$json = [pscustomobject]@{ disks = $d; volumes = $v; events = @($events); eventsChecked = $eventsOk } | ConvertTo-Json -Depth 4 -Compress
$page = 'https://itsvc.co.kr/en/ssd-health-check.html'

# The JSON is compressed (gzip + base64url) into the part of the address after #. That part is never sent to a server.
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
    # If the address would be too long, hand the result over through the clipboard (paste it into the page).
    try { Set-Clipboard -Value $json } catch {}
    Write-Host 'The result was copied to the clipboard. Paste it (Ctrl+V) into the page that opens.' -ForegroundColor Green
    Start-Process $page
}
Write-Host ''
Read-Host 'Press Enter to close this window'
