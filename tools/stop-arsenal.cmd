@echo off
setlocal
title NOX Arsenal stoppen

echo.
echo   Stoppe NOX Motion Arsenal ^(Port 5195^)...
echo.

powershell -NoProfile -Command ^
  "$c = Get-NetTCPConnection -LocalPort 5195 -State Listen -ErrorAction SilentlyContinue;" ^
  "if (-not $c) { Write-Host '   Es lief nichts auf Port 5195.'; exit 0 }" ^
  "$c | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {" ^
  "  try { $p = Get-Process -Id $_ -ErrorAction Stop; Stop-Process -Id $_ -Force; Write-Host \"   Beendet: $($p.ProcessName) (PID $_)\" } catch {}" ^
  "}"

ping -n 3 127.0.0.1 >nul
exit /b 0
