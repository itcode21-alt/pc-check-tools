# Hyper-V 켜기와 캡처용 VM 준비

캡처용 VM(블루스크린, WinRE, 설정 화면)을 만들기 위한 호스트 준비 순서. **BIOS 설정 변경과 Hyper-V 활성화는 호스트 시스템 설정을 바꾸므로 직접 실행한다.**

## 1. BIOS에서 CPU 가상화 켜기
- 호스트 PC가 `펌웨어 가상화 사용: False`이면 먼저 켜야 한다. 확인:
  ```powershell
  (Get-CimInstance Win32_Processor).VirtualizationFirmwareEnabled
  ```
- Gigabyte X470 AORUS 계열은 대체로 `Advanced Frequency Settings → Advanced CPU Settings → SVM Mode → Enabled`. 저장 후 재부팅(F10).
- BIOS 화면은 캡처 단축키가 없으니 휴대폰으로 찍는다. 이때 XMP/EXPO, SATA 모드(AHCI), 부팅 순서 화면도 같이 찍어 두면 촬영 목록의 A·F 항목을 채울 수 있다. 시리얼 번호나 MAC 주소가 보이면 가린다.

## 2. Hyper-V 켜기 (관리자 PowerShell)
```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -All
```
끝나면 재부팅한다. 켜면 호스트도 하이퍼바이저 위에서 동작한다. VPN 클라이언트(FortiClient 등)가 정상 동작하는지 한 번 확인한다.

## 3. ISO 준비
- Microsoft 공식 사이트의 Windows 11 25H2 한국어 ISO를 `D:\VMs`에 둔다.
- 사이트의 기존 캡처(24H2/25H2)와 맞추기 위해 최신 빌드를 쓴다. 21H2(빌드 22000) ISO로는 현재 사용자가 보는 화면과 다를 수 있다.

## 4. VM 만들기 (관리자 PowerShell, 저장소 루트에서)
```powershell
powershell -ExecutionPolicy Bypass -File scripts\vm\new-capture-vm.ps1 -IsoPath D:\VMs\<받은 파일>.iso
```
2세대 VM, vCPU 4, RAM 6GB, 디스크 80GB(가변), 보안 부팅, 가상 TPM, DVD 부팅으로 만든다. 만들기만 하고 시작하지 않는다.

## 5. 설치 후
- 설치가 끝나 첫 로그인까지 하면 종료하고 깨끗한 상태를 체크포인트로 저장한다.
  ```powershell
  Checkpoint-VM -Name cap-win11 -SnapshotName clean-install
  ```
- 화면을 어지럽힌 뒤에는 `Restore-VMCheckpoint -VMName cap-win11 -Name clean-install -Confirm:$false`로 되돌린다.
- 정품 인증을 하지 않은 상태에서는 바탕화면에 인증 안내가 나올 수 있으니, 설정 화면 캡처에서는 해당 영역을 제외한다.

## 6. 이 VM으로 촬영할 항목 (docs/SCREENSHOT_TODO.md의 A, D)
- BSOD: Sysinternals `NotMyFault`로 재현(CRITICAL_PROCESS_DIED, KERNEL_SECURITY_CHECK_FAILURE 등). 먼저 최신 빌드에서 실제 화면을 확인하고, 사이트 본문의 "파란 화면" 표현이 맞는지 점검한다.
- WinRE: VM을 부팅 중 강제 종료(전원 끄기)를 반복하면 자동 복구 화면으로 들어간다. 고급 옵션, 시작 설정, 명령 프롬프트 화면을 캡처한다.
- INACCESSIBLE_BOOT_DEVICE(0x7B): 디스크 컨트롤러 구성을 바꿔 재현한다.
- 화면 캡처: VM 창에서 호스트의 `Win+Shift+S`를 쓰거나, 가상 머신 연결의 `파일 → 스크린샷`을 쓴다.
