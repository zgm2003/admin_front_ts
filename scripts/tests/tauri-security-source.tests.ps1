[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
Set-StrictMode -Version Latest

$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$sourceRoot = Join-Path $repositoryRoot 'src'
$tauriAdapter = 'src/adapters/tauri/native-bridge.ts'
$webAdapter = 'src/adapters/web/native-bridge.ts'
$violations = [Collections.Generic.List[string]]::new()

function Relative-Path {
  param([Parameter(Mandatory = $true)][string]$Path)
  return [IO.Path]::GetRelativePath($repositoryRoot, $Path).Replace('\', '/')
}

function Add-Violation {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Rule
  )
  $violations.Add("$(Relative-Path $Path): $Rule")
}

$runtimeFiles = Get-ChildItem -LiteralPath $sourceRoot -Recurse -File |
  Where-Object { $_.Extension -in @('.ts', '.vue', '.js', '.mjs') }

foreach ($file in $runtimeFiles) {
  $relative = Relative-Path $file.FullName
  $source = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8

  if ($source -match '__TAURI__') {
    Add-Violation $file.FullName 'global Tauri probing is forbidden'
  }
  if ($relative -ne $tauriAdapter -and
      ($source -match '@tauri-apps/' -or $source -match '\binvoke(?:<[^>]+>)?\s*\(')) {
    Add-Violation $file.FullName 'raw Tauri imports/invoke must remain in the one adapter'
  }
  if ($relative -ne $webAdapter -and $source -match '\bwindow\.open\s*\(') {
    Add-Violation $file.FullName 'window.open must remain behind validated navigation'
  }
  if ($relative -ne $webAdapter -and
      ($source -match '\b(?:window|globalThis)\.location\.href\s*=' -or
       $source -match '\b(?:(?:window|globalThis)\.)?location\??\.(?:assign|replace)\s*\(')) {
    Add-Violation $file.FullName 'external navigation must use a validated adapter'
  }
  if ($source -match '\bwindow\.postMessage\s*\([^,]+,\s*[''"]\*[''"]') {
    Add-Violation $file.FullName 'wildcard postMessage targets are forbidden'
  }
  if ($source -match '\bwindow\.addEventListener\s*\(\s*[''"]message[''"]' -and
      ($source -notmatch '\.origin\s*===' -or $source -notmatch 'safeParse|parse\(')) {
    Add-Violation $file.FullName 'window message receivers require exact origin and schema validation'
  }
  if ($source -match 'createElement\s*\(\s*[''"]script[''"]' -or
      $source -match '\b(?:eval|Function)\s*\(' -or
      $source -match '\bnew\s+Function\s*\(' -or
      $source -match '\btemplate\s*:\s*[`''"]\s*<') {
    Add-Violation $file.FullName 'dynamic script or runtime Vue template compilation is forbidden'
  }
  if ($source -match '(?i)javascript:') {
    Add-Violation $file.FullName 'javascript URLs are forbidden in runtime source'
  }

  $lines = $source -split "`r?`n"
  for ($index = 0; $index -lt $lines.Count; $index += 1) {
    $line = $lines[$index]
    $mentionsCredential = $line -match '(?:refresh|access)_?[Tt]oken'
    $persistsOrLogs = $line -match 'localStorage|sessionStorage|document\.cookie|Cookies\.|persistence\.(?:write|set)|console\.(?:log|info|warn|error)'
    if ($mentionsCredential -and $persistsOrLogs) {
      $violations.Add("${relative}:$($index + 1): credential persistence/logging is forbidden")
    }
  }
}

$adapterPath = Join-Path $repositoryRoot $tauriAdapter
$adapterSource = Get-Content -LiteralPath $adapterPath -Raw -Encoding UTF8
$invokeCount = [regex]::Matches($adapterSource, '\binvoke(?:<[^>]+>)?\s*\(').Count
$literalInvokeCount = [regex]::Matches(
  $adapterSource,
  '\binvoke(?:<[^>]+>)?\s*\(\s*[''"][a-z0-9_:-]+[''"]'
).Count
if ($invokeCount -eq 0 -or $invokeCount -ne $literalInvokeCount) {
  Add-Violation $adapterPath 'every native command name must be a string literal'
}

$configPath = Join-Path $repositoryRoot 'src-tauri\tauri.conf.json'
$config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$csp = [string]$config.app.security.csp
if ($csp -match "'unsafe-eval'" -or $csp -match "script-src[^;]*'unsafe-inline'") {
  Add-Violation $configPath 'script unsafe-eval/unsafe-inline is forbidden'
}

$capabilityPath = Join-Path $repositoryRoot 'src-tauri\capabilities\default.json'
$capabilitySource = Get-Content -LiteralPath $capabilityPath -Raw -Encoding UTF8
$capability = $capabilitySource | ConvertFrom-Json
if ($capability.PSObject.Properties.Name -contains 'remote') {
  Add-Violation $capabilityPath 'remote capability is forbidden'
}
if ($capabilitySource -match '(?:shell|opener):(?:default|allow-)') {
  Add-Violation $capabilityPath 'shell/opener/default capability is forbidden'
}

if ($violations.Count -gt 0) {
  throw "Tauri source security violations:`n$($violations -join "`n")"
}

Write-Output "Tauri source security scan passed ($($runtimeFiles.Count) runtime files)."
