@echo off
setlocal
chcp 65001 >nul
set "SCRIPT=%~dp0itsvc-log-collector.ps1"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
if errorlevel 1 (
  echo.
  echo 진단 자료 수집기를 실행하지 못했습니다.
  pause
)
endlocal
