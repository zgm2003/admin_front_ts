[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$Command
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$expectedRepositoryRoot = 'E:\admin\admin_front_ts'
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\', '/')
$defaultDocker = 'E:\Docker\Docker\resources\bin\docker.exe'

if (-not [StringComparer]::OrdinalIgnoreCase.Equals($repositoryRoot, $expectedRepositoryRoot)) {
  throw "frontend gate must run from $expectedRepositoryRoot; resolved $repositoryRoot"
}

$lockfile = Join-Path $repositoryRoot 'package-lock.json'
if (-not (Test-Path -LiteralPath $lockfile -PathType Leaf)) {
  throw "package-lock.json is required at $lockfile"
}

if (Test-Path -LiteralPath $defaultDocker -PathType Leaf) {
  $dockerExecutable = $defaultDocker
} else {
  $dockerExecutable = (Get-Command 'docker.exe' -ErrorAction Stop | Select-Object -First 1).Source
}

$containerCommand = "npm ci --no-audit --no-fund && $Command"
& $dockerExecutable @(
  'run',
  '--rm',
  '--name', 'admin-front-quality-gate',
  '--mount', "type=bind,src=$repositoryRoot,dst=/workspace",
  '--mount', 'type=volume,src=admin-front-node-modules,dst=/workspace/node_modules',
  '--mount', 'type=volume,src=admin-front-npm-cache,dst=/root/.npm',
  '--workdir', '/workspace',
  'node:24.18.0-alpine',
  'sh', '-lc', $containerCommand
)
$exitCode = $LASTEXITCODE
exit $exitCode
