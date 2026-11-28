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

# The refresh rates Windows really offers, and each monitor's current values. The mode list the monitor reports (WMI) often has only some modes, so the maximum refresh rate can look too low.
# (Real case: the WMI list had only 1920x1080 at 60 Hz, while Windows offered 50, 59, 60, 75 and 100 Hz.)
try {
    Add-Type -TypeDefinition @'
using System; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class ItsvcDisp {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)] public struct DEVMODE { [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmDeviceName; public short dmSpecVersion, dmDriverVersion, dmSize, dmDriverExtra; public int dmFields; public int px, py; public int dmDisplayOrientation, dmDisplayFixedOutput; public short dmColor, dmDuplex, dmYResolution, dmTTOption, dmCollate; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmFormName; public short dmLogPixels; public int dmBitsPerPel, dmPelsWidth, dmPelsHeight, dmDisplayFlags, dmDisplayFrequency, dmICMMethod, dmICMIntent, dmMediaType, dmDitherType, dmReserved1, dmReserved2, dmPanningWidth, dmPanningHeight; }
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)] public struct DISPLAY_DEVICE { public int cb; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string DeviceName; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)] public string DeviceString; public int StateFlags; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)] public string DeviceID; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)] public string DeviceKey; }
  [DllImport("user32.dll", CharSet=CharSet.Ansi)] static extern bool EnumDisplaySettings(string dev, int mode, ref DEVMODE dm);
  [DllImport("user32.dll", CharSet=CharSet.Ansi)] static extern bool EnumDisplayDevices(string dev, uint idx, ref DISPLAY_DEVICE dd, uint flags);
  public static string[] Devices() {
    var r = new List<string>();
    for (uint i = 0; ; i++) {
      var a = new DISPLAY_DEVICE(); a.cb = Marshal.SizeOf(typeof(DISPLAY_DEVICE));
      if (!EnumDisplayDevices(null, i, ref a, 0)) break;
      if ((a.StateFlags & 1) == 0) continue;
      var m = new DISPLAY_DEVICE(); m.cb = Marshal.SizeOf(typeof(DISPLAY_DEVICE));
      if (EnumDisplayDevices(a.DeviceName, 0, ref m, 0)) r.Add(a.DeviceName + "|" + m.DeviceID);
    }
    return r.ToArray();
  }
  public static int[] Current(string dev) {
    var d = new DEVMODE(); d.dmSize = (short)Marshal.SizeOf(typeof(DEVMODE));
    return EnumDisplaySettings(dev, -1, ref d) ? new int[] { d.dmPelsWidth, d.dmPelsHeight, d.dmDisplayFrequency } : new int[] { 0, 0, 0 };
  }
  public static int[] Rates(string dev, int w, int h) {
    var s = new SortedSet<int>(); var d = new DEVMODE(); d.dmSize = (short)Marshal.SizeOf(typeof(DEVMODE));
    for (int i = 0; EnumDisplaySettings(dev, i, ref d); i++) if (d.dmPelsWidth == w && d.dmPelsHeight == h && d.dmDisplayFrequency > 1) s.Add(d.dmDisplayFrequency);
    var r = new List<int>(s); return r.ToArray();
  }
}
'@ -ErrorAction Stop
    $devs = @([ItsvcDisp]::Devices() | ForEach-Object { $p = $_.Split('|'); [pscustomobject]@{ dev = $p[0]; id = $p[1]; used = $false } })
    foreach ($m in $mon) {
        $code = ($m.name -split '\\')[1]
        $d = $devs | Where-Object { -not $_.used -and $code -and $_.id -match [regex]::Escape("\$code\") } | Select-Object -First 1
        if (-not $d) { continue }
        $d.used = $true
        $cur = [ItsvcDisp]::Current($d.dev)
        $m | Add-Member -NotePropertyName curW -NotePropertyValue ([int]$cur[0])
        $m | Add-Member -NotePropertyName curH -NotePropertyValue ([int]$cur[1])
        $m | Add-Member -NotePropertyName curHz -NotePropertyValue ([int]$cur[2])
        $m | Add-Member -NotePropertyName rates -NotePropertyValue ([int[]]@([ItsvcDisp]::Rates($d.dev, $m.prefW, $m.prefH)))
    }
} catch { }

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
