[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
Set-StrictMode -Version Latest

$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

Push-Location (Join-Path $repositoryRoot 'src-tauri')
try {
  cargo fmt --all -- --check
  cargo clippy --all-targets --all-features -- -D warnings
  cargo test --all-features
  # Cargo.lock contains Tauri's Linux-only GTK graph and build-time HTML parser
  # graph even though P08 ships only Windows. Ignore only those audited warnings;
  # vulnerabilities in the Windows runtime graph remain blocking.
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
  cargo build --locked --release
} finally {
  Pop-Location
}
