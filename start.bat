@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules call npm install
call npm run build
if errorlevel 1 pause & exit /b 1
echo.
echo 神州大富翁即将启动。访问 http://localhost:4173
echo 其他设备请使用下方输出的局域网地址。
echo.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:4173'"
npm start
pause
