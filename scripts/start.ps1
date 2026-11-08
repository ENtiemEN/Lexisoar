$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (-not (Test-Path -LiteralPath 'node_modules')) { throw 'Install dependencies first: npm ci' }
if (-not (Test-Path -LiteralPath 'dist/index.html')) { npm run build; if ($LASTEXITCODE -ne 0) { throw 'Build failed.' } }
New-Item -ItemType Directory -Force '.local' | Out-Null
$strideUrl = 'http://127.0.0.1:4180'
$running = $false
try { $response = Invoke-RestMethod ($strideUrl + '/api/session') -TimeoutSec 2; $running = $null -ne $response.csrf } catch { }
if (-not $running) {
 Start-Process -FilePath 'node' -ArgumentList '--import','tsx','server/index.ts' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput '.local/server.log' -RedirectStandardError '.local/server-error.log'
 for ($i=0; $i -lt 30; $i++) { try { $response = Invoke-RestMethod ($strideUrl + '/api/session') -TimeoutSec 1; $running = $null -ne $response.csrf; if ($running) { break } } catch { }; Start-Sleep -Milliseconds 300 }
}
if (-not $running) { throw 'Stride could not start. See .local/server-error.log.' }
Start-Process $strideUrl
