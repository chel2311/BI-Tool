@echo off
REM BI Tool Local Server

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~0,2%"=="\\" (
    echo Copying to temp folder...
    xcopy /E /I /Y "%SCRIPT_DIR%*" "%TEMP%\BI-Tool-Temp\" >nul
    cd /d "%TEMP%\BI-Tool-Temp\dist"
    start http://localhost:8080
    powershell -ExecutionPolicy Bypass -File "%TEMP%\BI-Tool-Temp\server.ps1"
) else (
    cd /d "%~dp0dist"
    start http://localhost:8080
    powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)
