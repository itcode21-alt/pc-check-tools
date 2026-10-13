<#
Creates a Hyper-V Generation 2 VM for taking Windows screenshots (BSOD, WinRE, settings screens).

Run in an ELEVATED Windows PowerShell on a host where:
  - CPU virtualization (SVM/VT-x) is enabled in BIOS
  - Hyper-V is enabled (see enable-hyperv.md) and the host was rebooted

Usage:
  powershell -ExecutionPolicy Bypass -File scripts\vm\new-capture-vm.ps1 -IsoPath D:\VMs\Win11_25H2_Korean_x64.iso
  powershell -ExecutionPolicy Bypass -File scripts\vm\new-capture-vm.ps1 -IsoPath <iso> -Name cap-win11 -MemoryGB 6 -DiskGB 80 -Root D:\VMs

The script only creates and configures the VM. It does not start it and it does not touch the host system settings.
Windows 11 needs >= 4 GB RAM, >= 64 GB disk, TPM 2.0 and Secure Boot; the VM is configured accordingly.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$IsoPath,
    [string]$Name = 'cap-win11',
    [string]$Root = 'D:\VMs',
    [int]$MemoryGB = 6,
    [int]$CpuCount = 4,
    [int]$DiskGB = 80,
    [string]$SwitchName = 'Default Switch'
)

$ErrorActionPreference = 'Stop'

function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# 1. preconditions
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Fail 'Run this script from an elevated (Administrator) PowerShell.' }
if (-not (Get-Command New-VM -ErrorAction SilentlyContinue)) { Fail 'Hyper-V PowerShell module not found. Enable Hyper-V first (enable-hyperv.md) and reboot.' }
if (-not (Test-Path -LiteralPath $IsoPath)) { Fail "ISO not found: $IsoPath" }
if (Get-VM -Name $Name -ErrorAction SilentlyContinue) { Fail "A VM named '$Name' already exists. Choose another -Name or remove it first." }
if (-not (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue)) {
    Write-Host "Switch '$SwitchName' not found; the VM will be created without a network adapter connection." -ForegroundColor Yellow
    $SwitchName = $null
}
$vmPath = Join-Path $Root $Name
$vhdPath = Join-Path $vmPath "$Name.vhdx"
$free = (Get-PSDrive -Name ($Root.Substring(0, 1))).Free / 1GB
if ($free -lt ($DiskGB + 10)) { Fail ("Not enough free space on {0}: {1:N0} GB free, need about {2} GB." -f $Root.Substring(0, 2), $free, ($DiskGB + 10)) }

# 2. create VM
New-Item -ItemType Directory -Force -Path $vmPath | Out-Null
$vm = New-VM -Name $Name -Generation 2 -MemoryStartupBytes ($MemoryGB * 1GB) -NewVHDPath $vhdPath -NewVHDSizeBytes ($DiskGB * 1GB) -Path $Root -SwitchName $SwitchName
Set-VM -VM $vm -ProcessorCount $CpuCount -DynamicMemory:$false -AutomaticCheckpointsEnabled $false -CheckpointType Standard

# 3. Windows 11 requirements: Secure Boot (Microsoft Windows template) + virtual TPM
Set-VMFirmware -VM $vm -EnableSecureBoot On -SecureBootTemplate 'MicrosoftWindows'
Set-VMKeyProtector -VM $vm -NewLocalKeyProtector
Enable-VMTPM -VM $vm

# 4. install media + boot order (DVD first)
$dvd = Add-VMDvdDrive -VM $vm -Path $IsoPath -Passthru
Set-VMFirmware -VM $vm -FirstBootDevice $dvd

# 5. guest services help copying screenshots out of the VM.
# Integration service names are localized (e.g. Korean Windows), so look it up by its fixed ID instead of by name.
# This step is optional: a failure here must not stop the script.
try {
    $guestSvc = Get-VMIntegrationService -VM $vm | Where-Object { $_.Id -like '*6C09BB55-D683-4DA0-8931-C9BF705F6480' }
    if ($guestSvc) { Enable-VMIntegrationService -VMIntegrationService $guestSvc }
    else { Write-Host 'Guest Service Interface not found; skipped (optional).' -ForegroundColor Yellow }
} catch {
    Write-Host ('Could not enable Guest Service Interface (optional): ' + $_.Exception.Message) -ForegroundColor Yellow
}

Write-Host ''
Write-Host "VM '$Name' created at $vmPath" -ForegroundColor Green
Write-Host '  Next:'
Write-Host "    1) Start-VM -Name $Name ; vmconnect.exe localhost $Name"
Write-Host '    2) Press any key at "Press any key to boot from CD or DVD", then install Windows 11.'
Write-Host '    3) After first sign-in, shut down and create a clean checkpoint:'
Write-Host "       Checkpoint-VM -Name $Name -SnapshotName 'clean-install'"
Write-Host '  Restore later with:  Restore-VMCheckpoint -VMName <name> -Name clean-install -Confirm:$false'
