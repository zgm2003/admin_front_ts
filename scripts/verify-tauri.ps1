[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
Set-StrictMode -Version Latest

$ExpectedRustVersion = '1.97.0'
$ExpectedCargoAuditVersion = '0.22.2'
$ExpectedCargoTauriVersion = '2.10.0'
$ExpectedTarget = 'x86_64-pc-windows-msvc'
$NodeImage = 'node:22.23.1-alpine'

$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$tauriRoot = Join-Path $repositoryRoot 'src-tauri'
$defaultDocker = 'E:\Docker\Docker\resources\bin\docker.exe'
$cargoBin = Join-Path $HOME '.cargo\bin'

if (Test-Path -LiteralPath $cargoBin -PathType Container) {
  $env:PATH = "$cargoBin;$env:PATH"
}

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

function Assert-VersionOutput {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Output,
    [Parameter(Mandatory = $true)][string]$ExpectedVersion,
    [Parameter(Mandatory = $true)][string]$Pattern
  )

  $match = [regex]::Match($Output, $Pattern)
  if (-not $match.Success -or $match.Groups['version'].Value -cne $ExpectedVersion) {
    throw "$Name must be exactly $ExpectedVersion; received: $Output"
  }
}

function Assert-AppAclManifest {
  param([Parameter(Mandatory = $true)][string]$RepositoryRoot)

  $rustSourceRoot = Join-Path $RepositoryRoot 'src-tauri\src'
  $capabilityPath = Join-Path $RepositoryRoot 'src-tauri\capabilities\default.json'
  $manifestPath = Join-Path $RepositoryRoot 'src-tauri\gen\schemas\acl-manifests.json'
  if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "Tauri did not generate the ACL manifest at $manifestPath"
  }

  $commandNames = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  $commandPattern = '#\s*\[\s*tauri::command(?:\([^\]]*\))?\s*\]\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+(?<name>[a-z][a-z0-9_]*)'
  foreach ($file in Get-ChildItem -LiteralPath $rustSourceRoot -Recurse -File -Filter '*.rs') {
    $rustSource = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    foreach ($match in [regex]::Matches($rustSource, $commandPattern)) {
      $null = $commandNames.Add($match.Groups['name'].Value)
    }
  }
  $commands = @($commandNames | Sort-Object)
  if ($commands.Count -eq 0) {
    throw 'No custom Tauri commands were found for the application ACL'
  }

  $acl = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json -AsHashtable
  if (-not $acl.ContainsKey('__app-acl__')) {
    throw 'Generated Tauri ACL manifest does not contain __app-acl__'
  }
  $generatedPermissions = $acl['__app-acl__']['permissions']

  $capability = Get-Content -LiteralPath $capabilityPath -Raw -Encoding UTF8 |
    ConvertFrom-Json -AsHashtable
  if ($capability.ContainsKey('remote')) {
    throw 'The main capability must not grant any remote origin'
  }
  $windows = @($capability['windows'])
  if ($windows.Count -ne 1 -or [string]$windows[0] -cne 'main') {
    throw 'The application ACL must be restricted to the exact main window'
  }

  $capabilityPermissions = @($capability['permissions'] | ForEach-Object { [string]$_ })
  $expectedAppPermissions = @()
  foreach ($command in $commands) {
    $permissionId = "allow-$($command.Replace('_', '-'))"
    $expectedAppPermissions += $permissionId
    if (-not $generatedPermissions.ContainsKey($permissionId)) {
      throw "Generated application ACL is missing $permissionId"
    }
    $allowedCommands = @($generatedPermissions[$permissionId]['commands']['allow'])
    if ($allowedCommands.Count -ne 1 -or [string]$allowedCommands[0] -cne $command) {
      throw "Generated permission $permissionId does not map only to $command"
    }
    if ($capabilityPermissions -cnotcontains $permissionId) {
      throw "The local main capability does not grant $permissionId"
    }
  }

  $actualAppPermissions = @(
    $capabilityPermissions |
      Where-Object { -not $_.Contains(':') } |
      Sort-Object
  )
  $expectedAppPermissions = @($expectedAppPermissions | Sort-Object)
  $permissionDelta = @(
    Compare-Object `
      -ReferenceObject $expectedAppPermissions `
      -DifferenceObject $actualAppPermissions `
      -CaseSensitive
  )
  if ($permissionDelta.Count -ne 0) {
    throw 'The local main capability application permissions do not exactly match the Rust commands'
  }

  Write-Output "verified application ACL for $($commands.Count) custom commands"
}

if (-not $IsWindows -or [Runtime.InteropServices.RuntimeInformation]::OSArchitecture -ne 'X64') {
  throw 'P08 verification requires Windows x86_64'
}

$script:DockerExecutable = Resolve-Executable -Preferred $defaultDocker -Fallback 'docker.exe'
$null = Resolve-Executable -Preferred '' -Fallback 'rustup.exe'
$null = Resolve-Executable -Preferred '' -Fallback 'rustc.exe'
$null = Resolve-Executable -Preferred '' -Fallback 'cargo.exe'
$null = Resolve-Executable -Preferred '' -Fallback 'pwsh.exe'

Push-Location $repositoryRoot
try {
  $toolchainConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath 'rust-toolchain.toml'
  if ($toolchainConfig -notmatch "(?m)^channel\s*=\s*`"$([regex]::Escape($ExpectedRustVersion))`"\s*$") {
    throw "rust-toolchain.toml must pin Rust $ExpectedRustVersion"
  }

  $rustcVersionOutput = (& rustc --version | Out-String).Trim()
  Assert-VersionOutput `
    -Name 'rustc' `
    -Output $rustcVersionOutput `
    -ExpectedVersion $ExpectedRustVersion `
    -Pattern '^rustc\s+(?<version>\d+\.\d+\.\d+)(?:\s|$)'

  $cargoAuditVersionOutput = (& cargo audit --version | Out-String).Trim()
  Assert-VersionOutput `
    -Name 'cargo-audit' `
    -Output $cargoAuditVersionOutput `
    -ExpectedVersion $ExpectedCargoAuditVersion `
    -Pattern '^cargo-audit(?:-audit)?\s+(?<version>\d+\.\d+\.\d+)(?:\s|$)'

  $cargoTauriVersionOutput = (& cargo tauri --version | Out-String).Trim()
  Assert-VersionOutput `
    -Name 'cargo-tauri' `
    -Output $cargoTauriVersionOutput `
    -ExpectedVersion $ExpectedCargoTauriVersion `
    -Pattern '^(?:cargo-tauri|tauri-cli|tauri)\s+(?<version>\d+\.\d+\.\d+)(?:\s|$)'

  $installedTargets = @(& rustup target list --installed)
  if ($installedTargets -notcontains $ExpectedTarget) {
    throw "Rust target $ExpectedTarget is not installed"
  }

  pwsh -NoProfile -File scripts/tests/tauri-security-source.tests.ps1

  $dockerScript = @'
set -eu
command npm ci --ignore-scripts
command npm test -- tests/shared/tauri tests/unit/native tests/integration/native
command npm run typecheck
command npm run build
'@
  Invoke-Docker @(
    'run', '--rm',
    '--mount', "type=bind,source=$repositoryRoot,target=/workspace",
    '--mount', 'type=volume,target=/workspace/node_modules',
    '--workdir', '/workspace',
    $NodeImage,
    'sh', '-lc', $dockerScript
  )

  Push-Location $tauriRoot
  try {
    cargo fmt --all -- --check
    cargo clippy --locked --all-targets --all-features -- -D warnings
    cargo test --locked --all-features
    cargo audit --deny warnings `
      --target-arch x86_64 `
      --target-os windows `
      --ignore RUSTSEC-2024-0411 `
      --ignore RUSTSEC-2024-0412 `
      --ignore RUSTSEC-2024-0413 `
      --ignore RUSTSEC-2024-0414 `
      --ignore RUSTSEC-2024-0415 `
      --ignore RUSTSEC-2024-0416 `
      --ignore RUSTSEC-2024-0417 `
      --ignore RUSTSEC-2024-0418 `
      --ignore RUSTSEC-2024-0419 `
      --ignore RUSTSEC-2024-0420 `
      --ignore RUSTSEC-2024-0429 `
      --ignore RUSTSEC-2024-0370 `
      --ignore RUSTSEC-2025-0057 `
      --ignore RUSTSEC-2025-0075 `
      --ignore RUSTSEC-2025-0080 `
      --ignore RUSTSEC-2025-0081 `
      --ignore RUSTSEC-2025-0098 `
      --ignore RUSTSEC-2025-0100 `
      --ignore RUSTSEC-2026-0097
    cargo build --locked --release --target x86_64-pc-windows-msvc
  } finally {
    Pop-Location
  }

  Assert-AppAclManifest -RepositoryRoot $repositoryRoot

  $buildStartedAt = [DateTime]::UtcNow
  $localBundleConfig = '{"bundle":{"createUpdaterArtifacts":false}}'
  $tauriBuildOutput = @()
  cargo tauri build --ci --bundles nsis `
    --target x86_64-pc-windows-msvc `
    --config $localBundleConfig `
    -- --locked 2>&1 |
    Tee-Object -Variable tauriBuildOutput
  $tauriBuildLog = ($tauriBuildOutput | ForEach-Object { $_.ToString() }) -join "`n"
  if ($tauriBuildLog.Contains('Failed to add bundler type')) {
    throw 'Tauri could not patch the NSIS bundle type into the packaged application'
  }

  $nsisPattern = Join-Path $tauriRoot 'target/x86_64-pc-windows-msvc/release/bundle/nsis/*.exe'
  $freshNsisFiles = @(
    Get-ChildItem -Path $nsisPattern -File |
      Where-Object { $_.LastWriteTimeUtc -ge $buildStartedAt }
  )
  if ($freshNsisFiles.Count -eq 0) {
    throw "Tauri did not create a fresh NSIS executable at $nsisPattern"
  }

  Write-Output "verified Rust $ExpectedRustVersion, cargo-audit $ExpectedCargoAuditVersion, and cargo-tauri $ExpectedCargoTauriVersion"
  foreach ($file in $freshNsisFiles) {
    Write-Output "verified NSIS executable: $($file.FullName)"
  }
} finally {
  Pop-Location
}
