$port = 8080
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptDir "BI-Tool")

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try { $listener.Start() } catch {
    Write-Host "Error: Port $port is already in use" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  BI Tool Server Running" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "URL: http://localhost:$port" -ForegroundColor Green
Write-Host "`nClose this window to stop`n" -ForegroundColor Yellow

$mime = @{".html"="text/html; charset=utf-8";".js"="application/javascript";".css"="text/css";".svg"="image/svg+xml";".png"="image/png";".json"="application/json";".csv"="text/csv"}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $path = $ctx.Request.Url.LocalPath
        if ($path -eq "/" -or $path -match "^/BI-Tool/?$") { $path = "/index.html" }
        $path = $path -replace "^/BI-Tool/", "/"
        $file = Join-Path $PWD $path.TrimStart("/")
        if (Test-Path $file -PathType Leaf) {
            $ext = [IO.Path]::GetExtension($file).ToLower()
            $ctx.Response.ContentType = if($mime[$ext]){$mime[$ext]}else{"application/octet-stream"}
            $bytes = [IO.File]::ReadAllBytes($file)
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else { $ctx.Response.StatusCode = 404 }
        $ctx.Response.Close()
    } catch {}
}
