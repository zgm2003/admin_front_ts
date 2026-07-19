[CmdletBinding()]
param(
  [string]$GitSha = '',
  [string]$ImageName = 'admin-frontend'
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
Set-StrictMode -Version Latest

$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$defaultDocker = 'E:\Docker\Docker\resources\bin\docker.exe'

function Resolve-Executable {
  param(
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Preferred,
    [Parameter(Mandatory = $true)][string]$Fallback
  )

  if (-not [string]::IsNullOrWhiteSpace($Preferred) -and
      (Test-Path -LiteralPath $Preferred -PathType Leaf)) {
    return $Preferred
  }
  return (Get-Command $Fallback -ErrorAction Stop | Select-Object -First 1).Source
}

function Invoke-Docker {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  & $script:DockerExecutable @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker exited with code $LASTEXITCODE"
  }
}

function Invoke-DockerCapture {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  $output = & $script:DockerExecutable @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker exited with code $LASTEXITCODE"
  }
  return ($output -join "`n")
}

function Read-ProductionValue {
  param([Parameter(Mandatory = $true)][string]$Name)

  $envFile = Join-Path $repositoryRoot '.env.production'
  $line = Get-Content -LiteralPath $envFile -Encoding UTF8 |
    Where-Object { $_ -like "$Name=*" } |
    Select-Object -Last 1
  if ([string]::IsNullOrWhiteSpace($line)) {
    throw "$Name is missing from .env.production"
  }
  $value = $line.Substring($Name.Length + 1).Trim()
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$Name is empty in .env.production"
  }
  return $value
}

$script:DockerExecutable = Resolve-Executable -Preferred $defaultDocker -Fallback 'docker.exe'
$gitExecutable = Resolve-Executable -Preferred '' -Fallback 'git.exe'

Push-Location $repositoryRoot
try {
  $head = (& $gitExecutable rev-parse --verify HEAD).Trim().ToLowerInvariant()
  if ($LASTEXITCODE -ne 0 -or $head -notmatch '^[0-9a-f]{40}$') {
    throw 'could not resolve the frontend Git revision'
  }
  if ([string]::IsNullOrWhiteSpace($GitSha)) {
    $GitSha = $head
  } else {
    $GitSha = $GitSha.Trim().ToLowerInvariant()
  }
  if ($GitSha -notmatch '^[0-9a-f]{40}$' -or $GitSha -ne $head) {
    throw "GitSha must equal the full checkout revision $head"
  }

  $dirty = @(& $gitExecutable status --porcelain)
  if ($LASTEXITCODE -ne 0) {
    throw 'could not inspect frontend Git status'
  }
  if ($dirty.Count -gt 0) {
    throw 'frontend checkout must be clean before Docker image verification'
  }

  $qualityCommands = @(
    'npm ci --no-audit --no-fund',
    'npm run check:browser-only',
    'npm run contract:check',
    'npm run routes:generate',
    'npm run lint:baseline',
    'npm run typecheck',
    'npm test -- --coverage',
    'npm run build:check'
  ) -join ' && '
  Invoke-Docker @('run',
    '--rm',
    '--mount', "type=bind,src=$repositoryRoot,dst=/workspace",
    '--mount', 'type=volume,dst=/workspace/node_modules',
    '--workdir', '/workspace',
    'node:22.23.1-alpine',
    'sh', '-lc', $qualityCommands
  )

  $apiOrigin = Read-ProductionValue -Name 'VITE_GO_API_BASE_URL'
  $realtimeOrigin = Read-ProductionValue -Name 'VITE_WEB_SOCKET_URL'
  $imageTag = "${ImageName}:$GitSha"
  Invoke-Docker @('build',
    '--pull',
    '--file', (Join-Path $repositoryRoot 'Dockerfile'),
    '--build-arg', "BUILD_REVISION=$GitSha",
    '--build-arg', "VITE_GO_API_BASE_URL=$apiOrigin",
    '--build-arg', "VITE_WEB_SOCKET_URL=$realtimeOrigin",
    '--build-arg', 'VITE_PLATFORM=admin',
    '--build-arg', 'VITE_ADMIN_RUNTIME_MODE=production',
    '--tag', $imageTag,
    $repositoryRoot
  )

  $inspection = Invoke-DockerCapture @('image', 'inspect', $imageTag) | ConvertFrom-Json
  $image = @($inspection)[0]
  if ($image.Config.Labels.'org.opencontainers.image.revision' -cne $GitSha) {
    throw 'frontend image revision label does not match the checkout'
  }
  if ([string]::IsNullOrWhiteSpace([string]$image.Config.User) -or [string]$image.Config.User -eq '0') {
    throw 'frontend runtime image must use an unprivileged user'
  }
  if ($null -eq $image.Config.Healthcheck -or $image.Config.Healthcheck.Test.Count -eq 0) {
    throw 'frontend runtime image is missing its healthcheck'
  }
  $expectedHealthEndpoint = '127.0.0.1:8080/healthz'
  if (($image.Config.Healthcheck.Test -join ' ') -notlike "*$expectedHealthEndpoint*") {
    throw 'frontend runtime image healthcheck does not target /healthz'
  }
  if ($null -eq $image.Config.ExposedPorts.'8080/tcp') {
    throw 'frontend runtime image must expose port 8080'
  }

  Write-Output "verified Docker image $imageTag"
  Write-Output "image id: $($image.Id)"
} finally {
  Pop-Location
}
