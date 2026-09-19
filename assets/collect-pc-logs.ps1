# itsvc.co.kr 현장 진단 수집 스크립트 (읽기 전용)
#
# 하는 일: 이 PC의 시스템 이벤트 로그, 미니덤프, 하드웨어 요약을 바탕화면의 폴더 하나로 모읍니다.
# 하지 않는 일: 인터넷으로 아무것도 전송하지 않고, 설정을 바꾸거나 파일을 삭제하지 않습니다.
# 결과 폴더의 파일을 https://itsvc.co.kr/minidump-analyzer.html 에 올리면 원인 분석을 받을 수 있습니다.
#
# 실행: 관리자 권한 PowerShell에서
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\collect-pc-logs.ps1
# 옵션: -Days 14 (로그 기간, 기본 14일)  -OutDir "D:\수집" (저장 위치)  -NoZip (압축 안 함)  -NoOpen (폴더를 열지 않음)
#
# 수집하지 않는 정보: 컴퓨터 이름, 사용자 이름, 시리얼 번호, MAC 주소, 파일 내용, 브라우저 기록.
param(
    [int]$Days = 14,
    [string]$OutDir = "",
    [switch]$NoZip,
    [switch]$NoOpen
)

$ErrorActionPreference = 'Continue'
$notes = New-Object System.Collections.Generic.List[string]
function Note($m) { $script:notes.Add($m); Write-Host "  ! $m" -ForegroundColor Yellow }
function Step($m) { Write-Host "[..] $m" -ForegroundColor Cyan }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Note "관리자 권한이 아닙니다. 미니덤프 복사와 디스크 SMART 상세가 빠질 수 있습니다. 관리자 PowerShell로 다시 실행하면 더 정확합니다." }

$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
if (-not $OutDir) { $OutDir = Join-Path ([Environment]::GetFolderPath('Desktop')) "itsvc-collect-$stamp" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
Write-Host "저장 위치: $OutDir"

# ── 1) 시스템 이벤트 로그: 필터 없이 기간만 지정해 통째로 내보낸다 ──────────────
Step "시스템 이벤트 로그 내보내기 (최근 $Days 일)"
$evtxPath = Join-Path $OutDir 'System.evtx'
try {
    $ms = [int64]$Days * 24 * 60 * 60 * 1000
    & wevtutil.exe epl System "$evtxPath" "/q:*[System[TimeCreated[timediff(@SystemTime) <= $ms]]]" /ow:true 2>&1 | Out-Null
    if (-not (Test-Path $evtxPath)) { Note "System.evtx 를 만들지 못했습니다." }
} catch { Note "이벤트 로그 내보내기 실패: $($_.Exception.Message)" }

# ── 2) 미니덤프 복사(최근 10개) ──────────────────────────────────────────────
Step "미니덤프 복사"
$dumpCount = 0; $newestDump = $null
try {
    $dumpDir = Join-Path $env:SystemRoot 'Minidump'
    if (Test-Path $dumpDir) {
        $dumps = Get-ChildItem $dumpDir -Filter *.dmp -ErrorAction Stop | Sort-Object LastWriteTime -Descending | Select-Object -First 10
        $dumpCount = @($dumps).Count
        if ($dumpCount -gt 0) {
            $dest = Join-Path $OutDir 'Minidump'
            New-Item -ItemType Directory -Force -Path $dest | Out-Null
            foreach ($d in $dumps) { Copy-Item $d.FullName $dest -ErrorAction SilentlyContinue }
            $newestDump = $dumps[0].LastWriteTime.ToString('s')
        }
    } else { Note "Minidump 폴더가 없습니다(덤프 생성이 꺼져 있거나 블루스크린이 없었을 수 있습니다)." }
} catch { Note "미니덤프를 읽지 못했습니다(관리자 권한 필요): $($_.Exception.Message)" }

# ── 3) 하드웨어 요약(JSON) ──────────────────────────────────────────────────
Step "하드웨어 정보 수집"
$hw = [ordered]@{ schema = 'itsvc-collect-v1'; collectedAt = (Get-Date).ToUniversalTime().ToString('s') + 'Z'; days = $Days; isAdmin = $isAdmin }

try {
    $os = Get-CimInstance Win32_OperatingSystem
    $hw.os = [ordered]@{ caption = $os.Caption; build = $os.BuildNumber; version = $os.Version
        lastBoot = $os.LastBootUpTime.ToUniversalTime().ToString('s') + 'Z'
        uptimeHours = [math]::Round(((Get-Date) - $os.LastBootUpTime).TotalHours, 1) }
} catch { Note "OS 정보 실패" }

try {
    $bios = Get-CimInstance Win32_BIOS; $bb = Get-CimInstance Win32_BaseBoard
    $hw.board = [ordered]@{ manufacturer = $bb.Manufacturer; product = $bb.Product }
    $hw.bios = [ordered]@{ vendor = $bios.Manufacturer; version = $bios.SMBIOSBIOSVersion
        date = if ($bios.ReleaseDate) { $bios.ReleaseDate.ToString('yyyy-MM-dd') } else { $null } }
} catch { Note "메인보드/BIOS 정보 실패" }

try {
    $hw.cpu = @(Get-CimInstance Win32_Processor | ForEach-Object { [ordered]@{ name = $_.Name.Trim(); cores = $_.NumberOfCores; threads = $_.NumberOfLogicalProcessors; maxMHz = $_.MaxClockSpeed } })
} catch { Note "CPU 정보 실패" }

try {
    $hw.memory = @(Get-CimInstance Win32_PhysicalMemory | ForEach-Object {
        [ordered]@{ capacityGB = [math]::Round($_.Capacity / 1GB, 0); speed = $_.Speed; configuredSpeed = $_.ConfiguredClockSpeed
            smbiosType = $_.SMBIOSMemoryType; manufacturer = ($_.Manufacturer | Out-String).Trim(); slot = $_.DeviceLocator } })
} catch { Note "메모리 정보 실패" }

# 그래픽카드: PCIe 링크 폭·속도까지 읽는다(x16 슬롯이 x8/x4로 잡히면 접촉·라이저 문제의 직접 증거)
try {
    $hw.gpu = @(Get-PnpDevice -Class Display -ErrorAction Stop | Where-Object { $_.Status -eq 'OK' } | ForEach-Object {
        $id = $_.InstanceId
        $prop = { param($k) (Get-PnpDeviceProperty -InstanceId $id -KeyName $k -ErrorAction SilentlyContinue).Data }
        $drv = Get-CimInstance Win32_VideoController | Where-Object { $_.PNPDeviceID -eq $id } | Select-Object -First 1
        [ordered]@{ name = $_.FriendlyName
            driverVersion = $drv.DriverVersion
            driverDate = if ($drv.DriverDate) { $drv.DriverDate.ToString('yyyy-MM-dd') } else { $null }
            link = [ordered]@{
                currentSpeed = & $prop 'DEVPKEY_PciDevice_CurrentLinkSpeed'
                maxSpeed = & $prop 'DEVPKEY_PciDevice_MaxLinkSpeed'
                currentWidth = & $prop 'DEVPKEY_PciDevice_CurrentLinkWidth'
                maxWidth = & $prop 'DEVPKEY_PciDevice_MaxLinkWidth' } } })
} catch { Note "그래픽 정보 실패" }

# 디스크: 상태 + (관리자 권한이면) 신뢰성 카운터
try {
    $hw.disks = @(Get-PhysicalDisk -ErrorAction Stop | ForEach-Object {
        $rel = $_ | Get-StorageReliabilityCounter -ErrorAction SilentlyContinue
        [ordered]@{ model = $_.FriendlyName; mediaType = "$($_.MediaType)"; busType = "$($_.BusType)"
            health = "$($_.HealthStatus)"; operational = "$($_.OperationalStatus)"; sizeGB = [math]::Round($_.Size / 1GB, 0)
            wear = $rel.Wear; temperature = $rel.Temperature; powerOnHours = $rel.PowerOnHours
            readErrorsUncorrected = $rel.ReadErrorsUncorrected; writeErrorsUncorrected = $rel.WriteErrorsUncorrected } })
    if (@($hw.disks | Where-Object { $null -ne $_.wear -or $null -ne $_.temperature }).Count -eq 0) { Note "디스크 SMART 상세(마모율·온도)를 읽지 못했습니다. 관리자 권한에서만 읽히는 경우가 많습니다." }
} catch { Note "디스크 정보 실패" }

# 전원/덤프 설정
try {
    $aspm = (& powercfg.exe /q SCHEME_CURRENT SUB_PCIEXPRESS ASPM 2>$null | Select-String -Pattern '0x[0-9a-fA-F]{8}' -AllMatches).Matches | ForEach-Object { [Convert]::ToInt32($_.Value, 16) }
    $plan = (& powercfg.exe /getactivescheme 2>$null) -replace '^.*\((.*)\).*$', '$1'
    $hb = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power' -ErrorAction SilentlyContinue).HiberbootEnabled
    $hw.power = [ordered]@{ plan = $plan; aspmAC = if ($aspm.Count -ge 1) { $aspm[-2] } else { $null }; aspmDC = if ($aspm.Count -ge 1) { $aspm[-1] } else { $null }; fastStartup = $hb }
} catch { Note "전원 설정 실패" }
try {
    $cc = Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\CrashControl' -ErrorAction Stop
    $hw.crashControl = [ordered]@{ dumpType = $cc.CrashDumpEnabled; autoReboot = $cc.AutoReboot; minidumpCount = $dumpCount; newestMinidump = $newestDump }
} catch { Note "덤프 설정 실패" }

$hw.notes = @($notes)
$json = $hw | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText((Join-Path $OutDir 'hardware.json'), $json, (New-Object System.Text.UTF8Encoding($false)))

@"
itsvc.co.kr 현장 수집 결과 ($stamp)
- System.evtx    : 시스템 이벤트 로그(최근 $Days 일, 필터 없음)
- Minidump\      : 블루스크린 덤프 $dumpCount 개
- hardware.json  : 하드웨어 요약(컴퓨터 이름·사용자 이름·시리얼·MAC 미포함)
이 폴더의 파일을 https://itsvc.co.kr/minidump-analyzer.html 에 올려 분석하세요.
"@ | Set-Content -Path (Join-Path $OutDir 'README.txt') -Encoding UTF8

# ── 4) 압축 ──────────────────────────────────────────────────────────────────
if (-not $NoZip) {
    try { Compress-Archive -Path (Join-Path $OutDir '*') -DestinationPath "$OutDir.zip" -Force; Write-Host "압축: $OutDir.zip" } catch { Note "압축 실패: $($_.Exception.Message)" }
}
Write-Host "`n완료. 폴더: $OutDir" -ForegroundColor Green
if ($notes.Count) { Write-Host "참고 사항 $($notes.Count)건은 hardware.json 의 notes 에 기록했습니다." -ForegroundColor Yellow }
if (-not $NoOpen) { try { Start-Process explorer.exe $OutDir } catch {} }
