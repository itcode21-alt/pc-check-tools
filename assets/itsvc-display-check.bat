@echo off
rem itsvc.co.kr display check (read-only). See the notes below the PS marker.
rem Reads the monitor's preferred resolution / refresh rate and the graphics adapter's current mode, then opens https://itsvc.co.kr/display-resolution-check.html
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText('%~f0',[Text.Encoding]::UTF8); $i=$s.IndexOf('#PS'+'-START'); Invoke-Expression $s.Substring($i)"
exit /b

#PS-START
# 모니터 해상도·주사율 점검 (읽기 전용)
# - 모니터가 알려 주는 최적(선호) 해상도와 지원 모드, 그래픽 어댑터가 지금 쓰는 해상도·주사율을 읽어 결과 페이지를 엽니다.
# - 설정을 바꾸거나 파일을 지우지 않고, 결과는 이 PC의 브라우저로만 넘깁니다. 관리자 권한은 필요 없습니다.
$ErrorActionPreference = 'Continue'
Write-Host ''
Write-Host '모니터 해상도·주사율 점검 (읽기 전용)' -ForegroundColor Cyan
Write-Host '모니터와 그래픽 어댑터 정보를 읽는 중입니다...'

function Get-Hz($m) { if ($m.VerticalRefreshRateDenominator -gt 0) { [math]::Round($m.VerticalRefreshRateNumerator / $m.VerticalRefreshRateDenominator, 2) } else { 0 } }

# 모니터 이름(제조사·모델). 같은 InstanceName으로 지원 모드 목록과 짝을 짓는다.
$ids = @{}
try {
    Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction Stop | ForEach-Object {
        $mk = (($_.ManufacturerName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '')
        $md = (($_.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '')
        $ids["$($_.InstanceName)"] = [pscustomobject]@{ maker = $mk; model = $md }
    }
} catch { }

# 모니터가 알려 주는 선호 모드(= 보통 최적 해상도)와 지원 모드 목록(해상도별 최대 주사율, 큰 해상도부터 최대 12개)
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
} catch { Write-Host '모니터 정보를 읽지 못했습니다.' -ForegroundColor Yellow }

# 그래픽 어댑터가 지금 쓰는 해상도·주사율
$gpu = @()
try {
    $gpu = @(Get-CimInstance -ClassName Win32_VideoController -ErrorAction Stop | ForEach-Object {
        [pscustomobject]@{ name = "$($_.Name)"; curW = [int]$_.CurrentHorizontalResolution; curH = [int]$_.CurrentVerticalResolution; curHz = [int]$_.CurrentRefreshRate; driver = "$($_.DriverVersion)" }
    })
} catch { Write-Host '그래픽 어댑터 정보를 읽지 못했습니다.' -ForegroundColor Yellow }

$json = [pscustomobject]@{ v = 1; monitors = @($mon); adapters = @($gpu) } | ConvertTo-Json -Depth 5 -Compress
$page = 'https://itsvc.co.kr/display-resolution-check.html'

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
