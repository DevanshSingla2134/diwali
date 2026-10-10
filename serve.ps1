$port = 8080
$prefix = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host "  🪔 Shubh Deepavali - 3D Diwali Greeting Server Running" -ForegroundColor Green
    Write-Host "  URL: $prefix" -ForegroundColor Cyan
    Write-Host "  (Camera, Mic & Location permissions fully supported!)" -ForegroundColor DarkYellow
    Write-Host "  Press Ctrl+C in this terminal to stop." -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Yellow

    # Launch browser automatically
    Start-Process $prefix

    $scriptPath = $MyInvocation.MyCommand.Path
    $currentDir = if ($scriptPath) { Split-Path -Parent $scriptPath } else { (Get-Location).Path }

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        # CORS Headers for phone & remote visitor access
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # API Route: /api/contacts (Database storage)
        if ($request.Url.LocalPath -eq "/api/contacts") {
            $dbPath = Join-Path $currentDir "contacts_db.json"
            if (-not (Test-Path $dbPath)) { [System.IO.File]::WriteAllText($dbPath, "[]", [System.Text.Encoding]::UTF8) }

            if ($request.HttpMethod -eq "GET") {
                $bytes = [System.IO.File]::ReadAllBytes($dbPath)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $newContacts = $body | ConvertFrom-Json

                $existingRaw = Get-Content $dbPath -Raw -Encoding utf8
                $existing = if ($existingRaw) { $existingRaw | ConvertFrom-Json } else { @() }
                if ($null -eq $existing) { $existing = @() }

                $combined = @($existing) + @($newContacts)
                $jsonOut = $combined | ConvertTo-Json -Depth 5
                [System.IO.File]::WriteAllText($dbPath, $jsonOut, [System.Text.Encoding]::UTF8)

                $respJson = "{`"success`":true,`"total`":$($combined.Count)}"
                $respBytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $respBytes.Length
                $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
            }
            elseif ($request.HttpMethod -eq "DELETE") {
                [System.IO.File]::WriteAllText($dbPath, "[]", [System.Text.Encoding]::UTF8)
                $respBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"success`":true}")
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $respBytes.Length
                $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
            }
            $response.Close()
            continue
        }

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "index.html"
        }

        # Clean query strings if any
        $filePath = Join-Path $currentDir $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($extension) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
