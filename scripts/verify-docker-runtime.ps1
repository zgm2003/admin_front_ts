[CmdletBinding()]
param(
  [ValidateRange(1, 120)][int]$HttpTimeoutSeconds = 15,
  [ValidateRange(1, 120)][int]$WebSocketTimeoutSeconds = 12
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

if ($PSVersionTable.PSVersion.Major -lt 7) {
  throw 'POWERSHELL_7_REQUIRED'
}

$expectedFrontendRoot = [IO.Path]::GetFullPath('E:\admin\admin_front_ts')
$expectedBackendRoot = [IO.Path]::GetFullPath('E:\admin\admin_back_go')
$frontendRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$backendRoot = $expectedBackendRoot
$platformScript = 'E:\admin\admin_back_go\scripts\docker-platform.ps1'
$defaultDocker = 'E:\Docker\Docker\resources\bin\docker.exe'
$baseURL = 'http://127.0.0.1:5173'
$origin = 'http://localhost:5173'
$deviceID = 'p07-docker-runtime-smoke'
$script:sensitiveValues = [Collections.Generic.List[string]]::new()

function Assert-ExactRoot {
  param(
    [Parameter(Mandatory)][string]$Actual,
    [Parameter(Mandatory)][string]$Expected,
    [Parameter(Mandatory)][string]$Label
  )

  if (-not [IO.Directory]::Exists($Actual) -or
      -not [string]::Equals($Actual.TrimEnd('\'), $Expected.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase)) {
    throw "$Label root must resolve to $Expected"
  }
}

function Resolve-Executable {
  param(
    [AllowEmptyString()][string]$Preferred,
    [Parameter(Mandatory)][string]$Fallback
  )

  if (-not [string]::IsNullOrWhiteSpace($Preferred) -and
      [IO.File]::Exists($Preferred)) {
    return $Preferred
  }
  return (Get-Command $Fallback -ErrorAction Stop | Select-Object -First 1).Source
}

function Assert-NoSecretLikeOutput {
  param([AllowEmptyString()][string]$Text)

  if ($Text -match '(?i)(authorization\s*:\s*bearer|access[_-]?token\s*[:=]|refresh[_-]?token\s*[:=]|password\s*[:=]|ticket\s*[:=])') {
    throw 'SECRET_LIKE_OUTPUT_DETECTED'
  }
  foreach ($secret in $script:sensitiveValues) {
    if ($secret.Length -ge 12 -and $Text.Contains($secret, [StringComparison]::Ordinal)) {
      throw 'SECRET_VALUE_OUTPUT_DETECTED'
    }
  }
}

function Invoke-DockerCapture {
  param(
    [Parameter(Mandatory)][string[]]$Arguments,
    [Parameter(Mandatory)][string]$Label
  )

  $lines = @(& $script:DockerExecutable @Arguments 2>&1)
  $exitCode = $LASTEXITCODE
  $text = ($lines | ForEach-Object { $_.ToString() }) -join "`n"
  Assert-NoSecretLikeOutput $text
  if ($exitCode -ne 0) {
    throw "$Label failed with exit code $exitCode"
  }
  return $text.Trim()
}

function Resolve-GitRevision {
  param([Parameter(Mandatory)][string]$Repository)

  $revision = @(& $script:GitExecutable -C $Repository rev-parse --verify HEAD 2>&1)
  $exitCode = $LASTEXITCODE
  $text = ($revision | ForEach-Object { $_.ToString() }) -join "`n"
  Assert-NoSecretLikeOutput $text
  if ($exitCode -ne 0) {
    throw "could not resolve Git revision for $Repository"
  }
  $head = $text.Trim().ToLowerInvariant()
  if ($head -notmatch '^[0-9a-f]{40}$') {
    throw "invalid Git revision for $Repository"
  }
  return $head
}

function Invoke-PlatformStatus {
  $lines = @(& $platformScript -Action status 2>&1)
  $succeeded = $?
  $text = ($lines | ForEach-Object { $_.ToString() }) -join "`n"
  Assert-NoSecretLikeOutput $text
  if (-not $succeeded) {
    throw 'Docker platform status failed'
  }
}

function Assert-HealthyContainer {
  param([Parameter(Mandatory)][string]$Container)

  $stateJSON = Invoke-DockerCapture `
    -Arguments @('inspect', '--format', '{{json .State}}', $Container) `
    -Label "container inspection for $Container"
  try {
    $inspection = [pscustomobject]@{ State = $stateJSON | ConvertFrom-Json -Depth 20 }
  }
  catch {
    throw "container state is invalid for $Container"
  }
  if ([string]$inspection.State.Status -cne 'running' -or
      $null -eq $inspection.State.Health -or
      [string]$inspection.State.Health.Status -cne 'healthy') {
    throw "container is not running and healthy: $Container"
  }
}

function Get-ContainerImageID {
  param([Parameter(Mandatory)][string]$Container)

  $imageID = Invoke-DockerCapture `
    -Arguments @('inspect', '--format', '{{.Image}}', $Container) `
    -Label "image id inspection for $Container"
  if ($imageID -notmatch '^sha256:[0-9a-f]{64}$') {
    throw "container image id is invalid: $Container"
  }
  return $imageID
}

function Assert-ImageRevision {
  param(
    [Parameter(Mandatory)][string]$Container,
    [Parameter(Mandatory)][string]$ExpectedRevision
  )

  $imageID = Get-ContainerImageID $Container
  $labelTemplate = '{{ index .Config.Labels "org.opencontainers.image.revision" }}'
  $revision = Invoke-DockerCapture `
    -Arguments @('image', 'inspect', '--format', $labelTemplate, $imageID) `
    -Label "revision label inspection for $Container"
  if ($revision.Trim().ToLowerInvariant() -cne $ExpectedRevision) {
    throw "image revision does not match repository HEAD: $Container"
  }
}

function Invoke-HealthCheck {
  param(
    [Parameter(Mandatory)][Net.Http.HttpClient]$Client,
    [Parameter(Mandatory)][string]$HealthBaseURL,
    [Parameter(Mandatory)][string]$Path
  )

  $response = $Client.GetAsync("$HealthBaseURL$Path").GetAwaiter().GetResult()
  try {
    if (-not $response.IsSuccessStatusCode) {
      throw "$Path returned HTTP $([int]$response.StatusCode)"
    }
  }
  finally {
    $response.Dispose()
  }
}

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory)][Net.Http.HttpClient]$Client,
    [Parameter(Mandatory)][Net.Http.HttpMethod]$Method,
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][string]$Label,
    [AllowNull()][hashtable]$Body,
    [AllowEmptyString()][string]$AccessToken = ''
  )

  $request = [Net.Http.HttpRequestMessage]::new($Method, "$baseURL$Path")
  try {
    $null = $request.Headers.TryAddWithoutValidation('Origin', $origin)
    $null = $request.Headers.TryAddWithoutValidation('platform', 'admin')
    $null = $request.Headers.TryAddWithoutValidation('device-id', $deviceID)
    if (-not [string]::IsNullOrWhiteSpace($AccessToken)) {
      $request.Headers.Authorization = [Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $AccessToken)
    }
    if ($null -ne $Body) {
      $jsonBody = $Body | ConvertTo-Json -Compress -Depth 10
      $request.Content = [Net.Http.StringContent]::new($jsonBody, [Text.Encoding]::UTF8, 'application/json')
    }

    $response = $Client.SendAsync($request).GetAwaiter().GetResult()
    try {
      $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
      if (-not $response.IsSuccessStatusCode) {
        throw "$Label returned HTTP $([int]$response.StatusCode)"
      }
      try {
        $json = $content | ConvertFrom-Json -Depth 30
      }
      catch {
        throw "$Label returned invalid JSON"
      }
      if ($null -eq $json -or [int]$json.code -ne 0) {
        throw "$Label returned a non-success envelope"
      }
      return $json
    }
    finally {
      $response.Dispose()
    }
  }
  finally {
    $request.Dispose()
  }
}

function Receive-WebSocketJSON {
  param(
    [Parameter(Mandatory)][Net.WebSockets.ClientWebSocket]$Socket,
    [Parameter(Mandatory)][Threading.CancellationToken]$Token
  )

  $buffer = [byte[]]::new(65536)
  $stream = [IO.MemoryStream]::new()
  try {
    do {
      $segment = [ArraySegment[byte]]::new($buffer)
      $result = $Socket.ReceiveAsync($segment, $Token).GetAwaiter().GetResult()
      if ($result.MessageType -eq [Net.WebSockets.WebSocketMessageType]::Close) {
        throw 'realtime WebSocket closed before the expected frame'
      }
      if ($result.MessageType -ne [Net.WebSockets.WebSocketMessageType]::Text) {
        throw 'realtime WebSocket returned a non-text frame'
      }
      $stream.Write($buffer, 0, $result.Count)
      if ($stream.Length -gt 1048576) {
        throw 'realtime WebSocket frame exceeded the smoke limit'
      }
    } until ($result.EndOfMessage)
    $payload = [Text.Encoding]::UTF8.GetString($stream.ToArray())
    try {
      return $payload | ConvertFrom-Json -Depth 30
    }
    catch {
      throw 'realtime WebSocket returned invalid JSON'
    }
  }
  finally {
    $stream.Dispose()
  }
}

function Invoke-RealtimeSmoke {
  param(
    [Parameter(Mandatory)][Net.Http.HttpClient]$Client,
    [Parameter(Mandatory)][string]$AccessToken
  )

  $ticketResponse = Invoke-JsonRequest `
    -Client $Client `
    -Method ([Net.Http.HttpMethod]::Post) `
    -Path '/api/admin/v1/auth/realtime-tickets' `
    -Label 'realtime ticket' `
    -Body @{} `
    -AccessToken $AccessToken
  $ticketKeys = @($ticketResponse.data.PSObject.Properties.Name | Sort-Object)
  if (($ticketKeys -join ',') -cne 'expires_in,ticket' -or
      [int]$ticketResponse.data.expires_in -ne 30 -or
      [string]::IsNullOrWhiteSpace([string]$ticketResponse.data.ticket)) {
    throw 'realtime ticket response violated the closed contract'
  }
  $ticket = [string]$ticketResponse.data.ticket
  $script:sensitiveValues.Add($ticket)

  $socket = [Net.WebSockets.ClientWebSocket]::new()
  $cts = [Threading.CancellationTokenSource]::new([TimeSpan]::FromSeconds($WebSocketTimeoutSeconds))
  try {
    $socket.Options.SetRequestHeader('Origin', $origin)
    $uri = [uri]("ws://127.0.0.1:5173/api/admin/v1/realtime/ws?ticket=" + [uri]::EscapeDataString($ticket))
    $null = $socket.ConnectAsync($uri, $cts.Token).GetAwaiter().GetResult()
    $connected = Receive-WebSocketJSON -Socket $socket -Token $cts.Token
    if ([string]$connected.type -cne 'realtime.connected.v1' -or
        [string]$connected.data.platform -cne 'admin' -or
        [int64]$connected.data.user_id -le 0 -or
        [int]$connected.data.heartbeat_interval_ms -le 0) {
      throw 'realtime connected handshake violated the contract'
    }

    $requestID = 'p07-runtime-smoke-ping'
    $ping = @{ type = 'realtime.ping.v1'; request_id = $requestID; data = @{} } | ConvertTo-Json -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($ping)
    $segment = [ArraySegment[byte]]::new($bytes)
    $null = $socket.SendAsync(
      $segment,
      [Net.WebSockets.WebSocketMessageType]::Text,
      $true,
      $cts.Token
    ).GetAwaiter().GetResult()

    $matchedPong = $false
    for ($attempt = 0; $attempt -lt 5 -and -not $matchedPong; $attempt++) {
      $message = Receive-WebSocketJSON -Socket $socket -Token $cts.Token
      if ([string]$message.type -ceq 'realtime.error.v1') {
        throw 'realtime WebSocket returned an error envelope'
      }
      $matchedPong = [string]$message.type -ceq 'realtime.pong.v1' -and
        [string]$message.request_id -ceq $requestID -and
        -not [string]::IsNullOrWhiteSpace([string]$message.data.server_time)
    }
    if (-not $matchedPong) {
      throw 'realtime WebSocket did not return the expected pong'
    }
  }
  finally {
    if ($socket.State -eq [Net.WebSockets.WebSocketState]::Open) {
      try {
        $null = $socket.CloseAsync(
          [Net.WebSockets.WebSocketCloseStatus]::NormalClosure,
          'smoke complete',
          [Threading.CancellationToken]::None
        ).GetAwaiter().GetResult()
      }
      catch {
        $socket.Abort()
      }
    }
    $cts.Dispose()
    $socket.Dispose()
    $ticket = $null
    $ticketResponse = $null
  }
}

Assert-ExactRoot -Actual $frontendRoot -Expected $expectedFrontendRoot -Label 'frontend'
Assert-ExactRoot -Actual $backendRoot -Expected $expectedBackendRoot -Label 'backend'
if (-not [IO.File]::Exists($platformScript)) {
  throw 'shared Docker platform script is missing'
}

$account = [string]$env:ADMIN_SMOKE_ACCOUNT
$password = [string]$env:ADMIN_SMOKE_PASSWORD
if ([string]::IsNullOrWhiteSpace($account) -or [string]::IsNullOrWhiteSpace($password)) {
  throw 'ADMIN_SMOKE_CREDENTIALS_REQUIRED'
}
$account = $account.Trim()
$script:sensitiveValues.Add($account)
$script:sensitiveValues.Add($password)

$script:DockerExecutable = Resolve-Executable -Preferred $defaultDocker -Fallback 'docker.exe'
$script:GitExecutable = Resolve-Executable -Preferred '' -Fallback 'git.exe'
$frontendRevision = Resolve-GitRevision $frontendRoot
$backendRevision = Resolve-GitRevision $backendRoot
$containers = @(
  'admin-state-mysql-1',
  'admin-state-redis-1',
  'admin-app-admin-api-1',
  'admin-app-admin-worker-1',
  'admin-app-frontend-1'
)

$handler = [Net.Http.HttpClientHandler]::new()
$handler.CookieContainer = [Net.CookieContainer]::new()
$client = [Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromSeconds($HttpTimeoutSeconds)
$accessToken = ''
$primaryError = $null

try {
  Invoke-PlatformStatus
  foreach ($container in $containers) {
    Assert-HealthyContainer $container
  }

  Assert-ImageRevision -Container 'admin-app-frontend-1' -ExpectedRevision $frontendRevision
  Assert-ImageRevision -Container 'admin-app-admin-api-1' -ExpectedRevision $backendRevision
  Assert-ImageRevision -Container 'admin-app-admin-worker-1' -ExpectedRevision $backendRevision

  $apiImage = Get-ContainerImageID 'admin-app-admin-api-1'
  $workerImage = Get-ContainerImageID 'admin-app-admin-worker-1'
  if ($apiImage -cne $workerImage) {
    throw 'Admin API and worker must use the same backend image'
  }

  Invoke-DockerCapture `
    -Arguments @(
      'run', '--rm',
      '--mount', "type=bind,src=$frontendRoot,dst=/workspace",
      '--workdir', '/workspace',
      'node:22.23.1-alpine',
      'sh', '-lc', 'npm run check:browser-only'
    ) `
    -Label 'P08R Browser-only retirement verifier' | Out-Null

  Invoke-HealthCheck -Client $client -HealthBaseURL $baseURL -Path '/healthz'
  Invoke-HealthCheck -Client $client -HealthBaseURL 'http://127.0.0.1:8080' -Path '/health'
  Invoke-HealthCheck -Client $client -HealthBaseURL 'http://127.0.0.1:8080' -Path '/ready'

  $login = Invoke-JsonRequest `
    -Client $client `
    -Method ([Net.Http.HttpMethod]::Post) `
    -Path '/api/admin/v1/auth/login' `
    -Label 'password login' `
    -Body @{
      login_account = $account
      login_type = 'password'
      password = $password
    }
  $credentialKeys = @($login.data.PSObject.Properties.Name | Sort-Object)
  if (($credentialKeys -join ',') -cne 'access_token,expires_in' -or
      [string]::IsNullOrWhiteSpace([string]$login.data.access_token) -or
      [int64]$login.data.expires_in -le 0) {
    throw 'password login violated the closed credential contract'
  }
  $accessToken = [string]$login.data.access_token
  $script:sensitiveValues.Add($accessToken)

  $null = Invoke-JsonRequest `
    -Client $client `
    -Method ([Net.Http.HttpMethod]::Get) `
    -Path '/api/admin/v1/users/me' `
    -Label 'authenticated users/me' `
    -Body $null `
    -AccessToken $accessToken

  Invoke-RealtimeSmoke -Client $client -AccessToken $accessToken
}
catch {
  $primaryError = $_
}
finally {
  if (-not [string]::IsNullOrWhiteSpace($accessToken)) {
    try {
      $logout = Invoke-JsonRequest `
        -Client $client `
        -Method ([Net.Http.HttpMethod]::Post) `
        -Path '/api/admin/v1/auth/logout' `
        -Label 'smoke logout' `
        -Body $null `
        -AccessToken $accessToken
      if (@($logout.data.PSObject.Properties).Count -ne 0) {
        throw 'smoke logout violated the closed empty response contract'
      }
    }
    catch {
      if ($null -eq $primaryError) {
        $primaryError = $_
      }
    }
  }
  $accessToken = $null
  $account = $null
  $password = $null
  $client.Dispose()
  $handler.Dispose()
}

if ($null -ne $primaryError) {
  throw $primaryError
}

$summary = @(
  'Docker platform status: verified',
  'Five-container health: verified',
  'Frontend/backend image revisions: verified',
  'P08R Browser-only retirement: verified',
  'Frontend and backend health endpoints: verified',
  'Authenticated Admin HTTP: verified',
  'Realtime ticket and WebSocket ping/pong: verified',
  'Secret output: none'
) -join "`n"
Assert-NoSecretLikeOutput $summary
Write-Output $summary
