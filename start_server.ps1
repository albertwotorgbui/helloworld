[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression") | Out-Null
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
try {
    $listener.Start()
    Write-Output "Listening on http://localhost:8080/..."
} catch {
    Write-Error "Failed to start listener: $_"
    exit 1
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.Url.LocalPath
        if ($url -eq "/") { $url = "/index.html" }
        
        $relPath = $url.TrimStart('/')
        $file = Join-Path (Get-Location) $relPath
        
        if (Test-Path $file -PathType Leaf) {
            $stream = New-Object System.IO.FileStream($file, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
            $bytes = New-Object byte[] $stream.Length
            $stream.Read($bytes, 0, $bytes.Length) | Out-Null
            $stream.Close()
            
            if ($file.EndsWith(".html")) { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($file.EndsWith(".css")) { $response.ContentType = "text/css; charset=utf-8" }
            elseif ($file.EndsWith(".js")) { $response.ContentType = "application/javascript; charset=utf-8" }
            elseif ($file.EndsWith(".pdf")) { $response.ContentType = "application/pdf" }
            
            # Prevent caching during development
            $response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {}
}
