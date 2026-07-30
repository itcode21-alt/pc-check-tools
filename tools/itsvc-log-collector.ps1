<#
.SYNOPSIS
    Collects the last seven days of Windows diagnostics for PC troubleshooting.

.DESCRIPTION
    The user selects a destination folder. The collector exports System,
    Application, and Setup event logs, creates a CSV event summary, and copies
    recent minidump and LiveKernelReports files when they are available.

    This script runs locally. It does not upload or send collected files.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$retentionDays = 7
$startTime = (Get-Date).AddDays(-$retentionDays)
$computerName = $env:COMPUTERNAME
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Show-Message {
    param(
        [string]$Message,
        [string]$Title = "ITSVC 진단 자료 수집기",
        [System.Windows.Forms.MessageBoxIcon]$Icon = [System.Windows.Forms.MessageBoxIcon]::Information
    )
    [System.Windows.Forms.MessageBox]::Show($Message, $Title, [System.Windows.Forms.MessageBoxButtons]::OK, $Icon) | Out-Null
}

function Select-Destination {
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = "진단 자료를 저장할 폴더를 선택하세요."
    $dialog.ShowNewFolderButton = $true
    $result = $dialog.ShowDialog()
    if ($result -ne [System.Windows.Forms.DialogResult]::OK -or [string]::IsNullOrWhiteSpace($dialog.SelectedPath)) {
        return $null
    }
    return $dialog.SelectedPath
}

function New-SafeDirectory {
    param([string]$Path)
    New-Item -Path $Path -ItemType Directory -Force | Out-Null
}

function Export-EventLogFile {
    param(
        [string]$LogName,
        [string]$Destination
    )

    $target = Join-Path $Destination ($LogName.ToLowerInvariant() + ".evtx")
    $query = "*[System[TimeCreated[timediff(@SystemTime) <= 604800000]]]"
    $output = & wevtutil.exe epl $LogName $target "/q:$query" /ow:true 2>&1
    if ($LASTEXITCODE -ne 0) {
        return "실패: $LogName - $($output -join ' ')"
    }
    return "완료: $LogName"
}

function Get-EventSummary {
    param([string]$Destination)

    $rows = New-Object System.Collections.Generic.List[object]
    foreach ($logName in @("System", "Application", "Setup")) {
        try {
            $events = Get-WinEvent -FilterHashtable @{ LogName = $logName; StartTime = $startTime } -ErrorAction Stop
            foreach ($event in $events) {
                $rows.Add([PSCustomObject]@{
                    TimeCreated = $event.TimeCreated
                    LogName = $logName
                    ProviderName = $event.ProviderName
                    Id = $event.Id
                    Level = $event.LevelDisplayName
                    Task = $event.TaskDisplayName
                    RecordId = $event.RecordId
                    Message = (($event.Message -replace "\r?\n", " ") -replace "\s{2,}", " ").Trim()
                })
            }
        } catch {
            $rows.Add([PSCustomObject]@{
                TimeCreated = Get-Date
                LogName = $logName
                ProviderName = "수집 오류"
                Id = ""
                Level = ""
                Task = ""
                RecordId = ""
                Message = $_.Exception.Message
            })
        }
    }

    $csvPath = Join-Path $Destination "event-summary.csv"
    $rows | Sort-Object TimeCreated | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
    return $rows.Count
}

function Copy-RecentFiles {
    param(
        [string]$SourcePath,
        [string]$DestinationPath,
        [string[]]$Patterns
    )

    $count = 0
    if (-not (Test-Path -LiteralPath $SourcePath)) {
        return $count
    }
    New-SafeDirectory -Path $DestinationPath
    foreach ($pattern in $Patterns) {
        Get-ChildItem -LiteralPath $SourcePath -Filter $pattern -File -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -ge $startTime } |
            ForEach-Object {
                $relative = $_.FullName.Substring($SourcePath.Length).TrimStart('\', '/')
                $target = Join-Path $DestinationPath $relative
                $targetDir = Split-Path -Parent $target
                New-SafeDirectory -Path $targetDir
                Copy-Item -LiteralPath $_.FullName -Destination $target -Force -ErrorAction SilentlyContinue
                if (Test-Path -LiteralPath $target) { $count++ }
            }
    }
    return $count
}

$destinationRoot = Select-Destination
if ($null -eq $destinationRoot) {
    exit 0
}

$sessionPath = Join-Path $destinationRoot ("itsvc-diagnostic-{0}" -f $stamp)
$eventPath = Join-Path $sessionPath "event-logs"
$dumpPath = Join-Path $sessionPath "minidumps"
$reportPath = Join-Path $sessionPath "collection-report.txt"
New-SafeDirectory -Path $eventPath
New-SafeDirectory -Path $dumpPath

$results = New-Object System.Collections.Generic.List[string]
$results.Add("ITSVC 진단 자료 수집 결과")
$results.Add("컴퓨터: $computerName")
$results.Add("수집 시작 기준: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))")
$results.Add("수집 종료 시각: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))")
$results.Add("저장 위치: $sessionPath")
$results.Add("")

foreach ($logName in @("System", "Application", "Setup")) {
    $results.Add((Export-EventLogFile -LogName $logName -Destination $eventPath))
}

try {
    $eventCount = Get-EventSummary -Destination $sessionPath
    $results.Add("이벤트 요약 CSV: 완료 ($eventCount개 행)")
} catch {
    $results.Add("이벤트 요약 CSV: 실패 - $($_.Exception.Message)")
}

$windowsPath = [Environment]::GetFolderPath("Windows")
$minidumpCount = Copy-RecentFiles -SourcePath (Join-Path $windowsPath "Minidump") -DestinationPath (Join-Path $dumpPath "Minidump") -Patterns @("*.dmp")
$liveKernelCount = Copy-RecentFiles -SourcePath (Join-Path $windowsPath "LiveKernelReports") -DestinationPath (Join-Path $dumpPath "LiveKernelReports") -Patterns @("*.dmp", "*.wer", "*.xml")
$results.Add("최근 미니덤프 복사: $minidumpCount개")
$results.Add("최근 LiveKernelReports 복사: $liveKernelCount개")
$results.Add("")
$results.Add("개인정보 주의: 이벤트 메시지와 덤프에는 사용자 이름, 컴퓨터 이름, 파일 경로가 포함될 수 있습니다.")
$results.Add("분석기에 업로드하기 전에 공유해도 되는 정보인지 확인하세요.")
$results.Add("이 프로그램은 수집한 자료를 자동으로 외부로 전송하지 않습니다.")
$results | Set-Content -Path $reportPath -Encoding UTF8

Show-Message ("수집이 완료되었습니다.`n`n저장 위치:`n{0}`n`n이벤트 요약과 최근 덤프 파일을 확인한 뒤 필요한 자료만 분석기에 올리세요." -f $sessionPath)
