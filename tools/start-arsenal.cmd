@echo off
setlocal
title NOX Motion Arsenal
cd /d "%~dp0.."

echo.
echo   NOX MOTION ARSENAL
echo   ==================
echo.

rem Laeuft der Dev-Server schon? Dann nur das Fenster oeffnen, nicht doppelt starten.
powershell -NoProfile -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:5195/' -UseBasicParsing -TimeoutSec 3; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
  echo   Server laeuft bereits - oeffne Browser...
  start "" "http://localhost:5195/"
  ping -n 3 127.0.0.1 >nul
  exit /b 0
)

if not exist "node_modules\" (
  echo   Abhaengigkeiten fehlen - installiere einmalig ^(dauert ein paar Minuten^)...
  echo.
  call npm ci
  if errorlevel 1 (
    echo.
    echo   FEHLER bei npm ci. Fenster bleibt offen.
    pause
    exit /b 1
  )
)

echo   Starte Dev-Server auf Port 5195...
start "NOX Arsenal Server" /min cmd /c "npm run dev"

echo   Warte, bis der Server antwortet...
powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(90); while((Get-Date) -lt $deadline){ try{ $null=Invoke-WebRequest -Uri 'http://localhost:5195/' -UseBasicParsing -TimeoutSec 2; exit 0 }catch{ Start-Sleep -Milliseconds 700 } }; exit 1"
if errorlevel 1 (
  echo.
  echo   Server kam nicht hoch. Im Server-Fenster steht die Ursache.
  pause
  exit /b 1
)

echo   Bereit - oeffne Browser.
start "" "http://localhost:5195/"
ping -n 3 127.0.0.1 >nul
exit /b 0
