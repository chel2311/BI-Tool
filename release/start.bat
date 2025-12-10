@echo off
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~0,2%"=="\\" (
    xcopy /E /I /Y "%SCRIPT_DIR%*" "%TEMP%\BI-Tool-Temp\" >nul
    cd /d "%TEMP%\BI-Tool-Temp\BI-Tool"
    start http://localhost:8080
    powershell -ExecutionPolicy Bypass -File "%TEMP%\BI-Tool-Temp\server.ps1"
) else (
    cd /d "%~dp0BI-Tool"
    start http://localhost:8080
    powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)
