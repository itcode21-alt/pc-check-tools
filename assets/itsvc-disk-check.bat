@echo off
rem itsvc.co.kr disk health check (read-only). See the notes below the PS marker.
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
# 저장장치 건강 점검 (읽기 전용)
# - 디스크 상태·수명 소모·오류 기록·온도, 드라이브 여유 공간, 최근 30일 저장장치 관련 이벤트 횟수를 읽어 결과 페이지를 엽니다.
# - 설정을 바꾸거나 파일을 지우지 않고, 결과는 이 PC의 브라우저로만 넘깁니다.
# - 관리자 권한이 있어야 수명·온도·오류 기록까지 읽힙니다.
$ErrorActionPreference = 'Continue'
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Host ''
Write-Host '저장장치 건강 점검 (읽기 전용)' -ForegroundColor Cyan
if (-not $isAdmin) { Write-Host '관리자 권한이 아니라 수명·온도·오류 기록은 읽지 못할 수 있습니다.' -ForegroundColor Yellow }
Write-Host '디스크 정보를 읽는 중입니다...'

$d = @()
try {
    $d = @(Get-PhysicalDisk -ErrorAction Stop | ForEach-Object {
        $r = $_ | Get-StorageReliabilityCounter -ErrorAction SilentlyContinue
        $l = @(Get-Partition -DiskNumber $_.DeviceId -ErrorAction SilentlyContinue | Where-Object DriveLetter | ForEach-Object { "$($_.DriveLetter):" })
        [pscustomobject]@{ diskNumber = $_.DeviceId; drives = $l; model = $_.FriendlyName; mediaType = "$($_.MediaType)"; busType = "$($_.BusType)"; health = "$($_.HealthStatus)"; operational = "$($_.OperationalStatus)"; sizeGB = [math]::Round($_.Size / 1GB); wear = $r.Wear; temperature = $r.Temperature; powerOnHours = $r.PowerOnHours; readErrorsUncorrected = $r.ReadErrorsUncorrected; writeErrorsUncorrected = $r.WriteErrorsUncorrected; readLatencyMax = $r.ReadLatencyMax; writeLatencyMax = $r.WriteLatencyMax; flushLatencyMax = $r.FlushLatencyMax }
    })
} catch { Write-Host '디스크 정보를 읽지 못했습니다.' -ForegroundColor Yellow }

$v = @()
try {
    $v = @(Get-Volume -ErrorAction Stop | Where-Object DriveLetter | ForEach-Object {
        [pscustomobject]@{ drive = "$($_.DriveLetter):"; sizeGB = [math]::Round($_.Size / 1GB, 1); freeGB = [math]::Round($_.SizeRemaining / 1GB, 1) }
    })
} catch { Write-Host '드라이브 여유 공간을 읽지 못했습니다.' -ForegroundColor Yellow }

Write-Host '최근 30일 저장장치 관련 이벤트 기록을 세는 중입니다...'
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
$page = 'https://itsvc.co.kr/ssd-health-check.html'

# JSON을 gzip + base64url로 줄여 주소의 # 뒤에 담는다. # 뒤의 값은 서버로 전송되지 않는다.
$bytes = [Text.Encoding]::UTF8.GetBytes($json)
$ms = New-Object IO.MemoryStream
$gz = New-Object IO.Compression.GZipStream($ms, [IO.Compression.CompressionMode]::Compress)
$gz.Write($bytes, 0, $bytes.Length)
$gz.Close()
$b64 = [Convert]::ToBase64String($ms.ToArray()).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$url = "$page#d=$b64"

if ($url.Length -le 1900) {
    Write-Host '브라우저에서 결과 페이지를 엽니다.' -ForegroundColor Green
    Start-Process $url
} else {
    # 주소가 너무 길면 클립보드로 넘긴다(페이지에 붙여넣기).
    try { Set-Clipboard -Value $json } catch {}
    Write-Host '결과를 클립보드에 복사했습니다. 열리는 페이지에 붙여넣기(Ctrl+V)하세요.' -ForegroundColor Green
    Start-Process $page
}
Write-Host ''
Read-Host '엔터를 누르면 이 창이 닫힙니다'
