use crate::credentials::CredentialStore;
use crate::error::SafeError;
use futures_util::StreamExt;
use reqwest::header::{
    HeaderMap, HeaderName, HeaderValue, ACCEPT, CONTENT_LENGTH, CONTENT_TYPE, USER_AGENT,
};
use reqwest::{redirect::Policy, StatusCode, Url};
use secrecy::{ExposeSecret, SecretString};
use serde::{de::IgnoredAny, Deserialize, Serialize};
use std::future::Future;
use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, SocketAddr};
use std::pin::Pin;
use std::sync::Arc;
use std::time::Duration;
use tokio::net::lookup_host;
use zeroize::Zeroizing;

pub const ADMIN_REFRESH_ENDPOINT: &str = "https://www.zgm2003.cn/api/admin/v1/auth/refresh";
const ADMIN_HOST: &str = "www.zgm2003.cn";
const HTTPS_PORT: u16 = 443;
const DNS_TIMEOUT: Duration = Duration::from_secs(5);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);
const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);
const MAX_RESPONSE_BYTES: usize = 64 * 1024;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccessCredential {
    pub access_token: String,
    pub expires_at: u64,
}

struct RefreshRotation {
    access: AccessCredential,
    refresh: SecretString,
}

struct RefreshHttpRequest {
    endpoint: Url,
    headers: HeaderMap,
    body: Zeroizing<Vec<u8>>,
}

struct RefreshHttpResponse {
    status: StatusCode,
    body: Zeroizing<Vec<u8>>,
}

type TransportFuture<'a> =
    Pin<Box<dyn Future<Output = Result<RefreshHttpResponse, SafeError>> + Send + 'a>>;

trait RefreshTransport: Send + Sync {
    fn execute<'a>(&'a self, request: RefreshHttpRequest) -> TransportFuture<'a>;
}

#[derive(Default)]
struct PinnedReqwestTransport;

impl RefreshTransport for PinnedReqwestTransport {
    fn execute<'a>(&'a self, request: RefreshHttpRequest) -> TransportFuture<'a> {
        Box::pin(async move {
            let addresses = resolve_public_addresses().await?;
            let client = reqwest::Client::builder()
                .https_only(true)
                .no_proxy()
                .redirect(Policy::none())
                .connect_timeout(CONNECT_TIMEOUT)
                .timeout(REQUEST_TIMEOUT)
                .resolve_to_addrs(ADMIN_HOST, &addresses)
                .build()
                .map_err(|_| SafeError::policy())?;

            let response = client
                .post(request.endpoint)
                .headers(request.headers)
                .body(request.body.as_slice().to_vec())
                .send()
                .await
                .map_err(classify_reqwest_error)?;

            let status = response.status();
            let content_type = response
                .headers()
                .get(CONTENT_TYPE)
                .and_then(|value| value.to_str().ok())
                .and_then(|value| value.split(';').next())
                .map(str::trim);
            if !content_type.is_some_and(|value| value.eq_ignore_ascii_case("application/json")) {
                return Err(SafeError::response_contract());
            }
            if response
                .headers()
                .get(CONTENT_LENGTH)
                .and_then(|value| value.to_str().ok())
                .and_then(|value| value.parse::<usize>().ok())
                .is_some_and(|length| length > MAX_RESPONSE_BYTES)
            {
                return Err(SafeError::response_contract());
            }

            let mut stream = response.bytes_stream();
            let mut body = Zeroizing::new(Vec::new());
            while let Some(chunk) = stream.next().await {
                let chunk = chunk.map_err(classify_reqwest_error)?;
                let next_length = body
                    .len()
                    .checked_add(chunk.len())
                    .ok_or_else(SafeError::response_contract)?;
                if next_length > MAX_RESPONSE_BYTES {
                    return Err(SafeError::response_contract());
                }
                body.extend_from_slice(&chunk);
            }
            Ok(RefreshHttpResponse { status, body })
        })
    }
}

pub struct AdminHttpClient {
    transport: Arc<dyn RefreshTransport>,
}

impl Default for AdminHttpClient {
    fn default() -> Self {
        Self {
            transport: Arc::new(PinnedReqwestTransport),
        }
    }
}

impl AdminHttpClient {
    async fn rotate(
        &self,
        current: &SecretString,
        device_id: &str,
        now_ms: u64,
    ) -> Result<RefreshRotation, SafeError> {
        let request = build_refresh_request(current.expose_secret(), device_id)?;
        let response = self.transport.execute(request).await?;
        decode_refresh_response(response.status, response.body.as_slice(), now_ms)
    }
}

pub async fn rotate_stored_refresh_credential(
    store: &CredentialStore,
    client: &AdminHttpClient,
    device_id: &str,
) -> Result<AccessCredential, SafeError> {
    let current = store.load()?;
    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|_| SafeError::server())?
        .as_millis()
        .try_into()
        .map_err(|_| SafeError::server())?;
    let rotation = client.rotate(&current, device_id, now_ms).await?;
    store.replace(rotation.refresh)?;
    Ok(rotation.access)
}

fn classify_reqwest_error(error: reqwest::Error) -> SafeError {
    if error.is_timeout() {
        SafeError::timeout()
    } else {
        SafeError::network()
    }
}

async fn resolve_public_addresses() -> Result<Vec<SocketAddr>, SafeError> {
    let resolved = tokio::time::timeout(DNS_TIMEOUT, lookup_host((ADMIN_HOST, HTTPS_PORT)))
        .await
        .map_err(|_| SafeError::timeout())?
        .map_err(|_| SafeError::network())?;
    let mut addresses: Vec<SocketAddr> = resolved.collect();
    if addresses.is_empty() || addresses.iter().any(|address| !is_public_ip(address.ip())) {
        return Err(SafeError::policy());
    }
    addresses.sort_unstable();
    addresses.dedup();
    Ok(addresses)
}

pub fn validate_admin_refresh_endpoint(input: &str) -> Result<Url, SafeError> {
    if input != ADMIN_REFRESH_ENDPOINT {
        return Err(SafeError::policy());
    }
    let endpoint = Url::parse(input).map_err(|_| SafeError::policy())?;
    if endpoint.scheme() != "https"
        || endpoint.host_str() != Some(ADMIN_HOST)
        || endpoint.port().is_some()
        || !endpoint.username().is_empty()
        || endpoint.password().is_some()
        || endpoint.query().is_some()
        || endpoint.fragment().is_some()
        || endpoint.path() != "/api/admin/v1/auth/refresh"
    {
        return Err(SafeError::policy());
    }
    Ok(endpoint)
}

pub fn is_public_ip(address: IpAddr) -> bool {
    match address {
        IpAddr::V4(address) => is_public_ipv4(address),
        IpAddr::V6(address) => is_public_ipv6(address),
    }
}

fn is_public_ipv4(address: Ipv4Addr) -> bool {
    let [a, b, c, _] = address.octets();
    !(a == 0
        || a == 10
        || a == 100 && (64..=127).contains(&b)
        || a == 127
        || a == 169 && b == 254
        || a == 172 && (16..=31).contains(&b)
        || a == 192 && b == 0 && (c == 0 || c == 2)
        || a == 192 && b == 88 && c == 99
        || a == 192 && b == 168
        || a == 198 && (b == 18 || b == 19)
        || a == 198 && b == 51 && c == 100
        || a == 203 && b == 0 && c == 113
        || a >= 224)
}

fn is_public_ipv6(address: Ipv6Addr) -> bool {
    if let Some(mapped) = address.to_ipv4() {
        return is_public_ipv4(mapped);
    }
    let segments = address.segments();
    if address.is_unspecified()
        || address.is_loopback()
        || address.is_multicast()
        || segments[0] & 0xfe00 == 0xfc00
        || segments[0] & 0xffc0 == 0xfe80
        || segments[0] & 0xffc0 == 0xfec0
        || segments[0] == 0x0100 && segments[1..4] == [0, 0, 0]
        || segments[0] == 0x0064 && segments[1] == 0xff9b
        || segments[0] == 0x2001 && segments[1] == 0x0db8
        || segments[0] == 0x2001 && segments[1] <= 0x01ff
        || segments[0] == 0x2002
        || segments[0] == 0x3fff && segments[1] & 0xf000 == 0
    {
        return false;
    }
    true
}

#[derive(Serialize)]
#[serde(deny_unknown_fields)]
struct RefreshRequest<'a> {
    refresh_token: &'a str,
}

fn build_refresh_request(
    refresh_token: &str,
    device_id: &str,
) -> Result<RefreshHttpRequest, SafeError> {
    if refresh_token.is_empty()
        || refresh_token.trim() != refresh_token
        || device_id.is_empty()
        || device_id.trim() != device_id
    {
        return Err(SafeError::policy());
    }

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(ACCEPT, HeaderValue::from_static("application/json"));
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static(concat!("CloudAdmin/", env!("CARGO_PKG_VERSION"))),
    );
    headers.insert(
        HeaderName::from_static("x-admin-client-variant"),
        HeaderValue::from_static("desktop"),
    );
    headers.insert(
        HeaderName::from_static("platform"),
        HeaderValue::from_static("admin"),
    );
    headers.insert(
        HeaderName::from_static("device-id"),
        HeaderValue::from_str(device_id).map_err(|_| SafeError::policy())?,
    );
    headers.insert(
        HeaderName::from_static("x-trace-id"),
        HeaderValue::from_str(&uuid::Uuid::new_v4().to_string())
            .map_err(|_| SafeError::policy())?,
    );

    let body = serde_json::to_vec(&RefreshRequest { refresh_token })
        .map(Zeroizing::new)
        .map_err(|_| SafeError::policy())?;
    Ok(RefreshHttpRequest {
        endpoint: validate_admin_refresh_endpoint(ADMIN_REFRESH_ENDPOINT)?,
        headers,
        body,
    })
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RefreshSuccessEnvelope<'a> {
    code: i64,
    #[serde(borrow)]
    data: RefreshSuccessData<'a>,
    msg: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RefreshSuccessData<'a> {
    access_token: String,
    expires_in: i64,
    #[serde(borrow)]
    refresh_token: &'a str,
    refresh_expires_in: i64,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct ErrorEnvelope {
    code: i64,
    data: IgnoredAny,
    msg: String,
    error: ErrorDetail,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct ErrorDetail {
    code: String,
    category: ErrorCategory,
    retryable: bool,
    request_id: Option<String>,
    trace_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
enum ErrorCategory {
    Authentication,
    Authorization,
    Canceled,
    Conflict,
    Dependency,
    Internal,
    NotFound,
    RateLimit,
    Timeout,
    Validation,
}

fn decode_refresh_response(
    status: StatusCode,
    body: &[u8],
    now_ms: u64,
) -> Result<RefreshRotation, SafeError> {
    if status == StatusCode::OK {
        let envelope: RefreshSuccessEnvelope<'_> =
            serde_json::from_slice(body).map_err(|_| SafeError::response_contract())?;
        let data = envelope.data;
        if envelope.code != 0
            || data.access_token.is_empty()
            || data.refresh_token.is_empty()
            || data.expires_in <= 0
            || data.refresh_expires_in <= 0
        {
            return Err(SafeError::response_contract());
        }
        let _ = &envelope.msg;
        let lifetime_ms = u64::try_from(data.expires_in)
            .ok()
            .and_then(|seconds| seconds.checked_mul(1_000))
            .ok_or_else(SafeError::response_contract)?;
        let expires_at = now_ms
            .checked_add(lifetime_ms)
            .ok_or_else(SafeError::response_contract)?;
        return Ok(RefreshRotation {
            access: AccessCredential {
                access_token: data.access_token,
                expires_at,
            },
            refresh: SecretString::from(data.refresh_token),
        });
    }

    let envelope: ErrorEnvelope =
        serde_json::from_slice(body).map_err(|_| SafeError::response_contract())?;
    let _ = (
        &envelope.data,
        &envelope.msg,
        envelope.error.retryable,
        &envelope.error.request_id,
        &envelope.error.trace_id,
    );
    if envelope.code == 0 || envelope.error.code.is_empty() {
        return Err(SafeError::response_contract());
    }
    match envelope.error.category {
        ErrorCategory::Authentication
        | ErrorCategory::Authorization
        | ErrorCategory::Conflict
        | ErrorCategory::NotFound
        | ErrorCategory::Validation => Err(SafeError::authentication()),
        ErrorCategory::Canceled | ErrorCategory::Timeout => Err(SafeError::timeout()),
        ErrorCategory::Dependency | ErrorCategory::Internal | ErrorCategory::RateLimit => {
            Err(SafeError::server())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use reqwest::StatusCode;
    use secrecy::ExposeSecret;

    struct TimeoutTransport;

    impl RefreshTransport for TimeoutTransport {
        fn execute<'a>(&'a self, _request: RefreshHttpRequest) -> TransportFuture<'a> {
            Box::pin(async { Err(SafeError::timeout()) })
        }
    }

    #[test]
    fn strict_success_contract_yields_access_and_rotated_refresh_credentials() {
        let body = br#"{"code":0,"data":{"access_token":"next-access","expires_in":60,"refresh_token":"next-refresh","refresh_expires_in":3600},"msg":"success"}"#;
        let rotation = decode_refresh_response(StatusCode::OK, body, 1_000).unwrap();

        assert_eq!(rotation.access.access_token, "next-access");
        assert_eq!(rotation.access.expires_at, 61_000);
        assert_eq!(rotation.refresh.expose_secret(), "next-refresh");
    }

    #[test]
    fn malformed_or_incomplete_success_envelopes_are_contract_errors() {
        for body in [
            br#"{"code":0,"data":{"access_token":"access","expires_in":60},"msg":"success"}"#.as_slice(),
            br#"{"code":0,"data":{"access_token":"access","expires_in":60,"refresh_token":"refresh","refresh_expires_in":3600,"legacy":"forbidden"},"msg":"success"}"#.as_slice(),
            br#"{"code":0,"data":{"access_token":"","expires_in":60,"refresh_token":"refresh","refresh_expires_in":3600},"msg":"success"}"#.as_slice(),
            br#"{"code":0,"data":{"access_token":"access","expires_in":0,"refresh_token":"refresh","refresh_expires_in":3600},"msg":"success"}"#.as_slice(),
        ] {
            assert_eq!(
                decode_refresh_response(StatusCode::OK, body, 1_000)
                    .err()
                    .expect("malformed response must fail"),
                SafeError::response_contract()
            );
        }
    }

    #[test]
    fn formal_error_envelopes_map_without_forwarding_server_text() {
        let body = br#"{"code":100,"data":{},"msg":"server text","error":{"code":"auth.refresh_reused","category":"authentication","retryable":false,"request_id":"request-1","trace_id":"trace-1"}}"#;
        assert_eq!(
            decode_refresh_response(StatusCode::UNAUTHORIZED, body, 1_000)
                .err()
                .expect("authentication response must fail"),
            SafeError::authentication()
        );
    }

    #[test]
    fn request_contains_only_the_documented_refresh_field_and_required_headers() {
        let request = build_refresh_request("refresh-secret", "device-1").unwrap();
        assert_eq!(request.endpoint.as_str(), ADMIN_REFRESH_ENDPOINT);
        assert_eq!(
            request.headers.get("X-Admin-Client-Variant").unwrap(),
            "desktop"
        );
        assert_eq!(request.headers.get("platform").unwrap(), "admin");
        assert_eq!(request.headers.get("device-id").unwrap(), "device-1");
        assert_eq!(
            request.body.as_slice(),
            br#"{"refresh_token":"refresh-secret"}"#
        );
    }

    #[test]
    fn invalid_device_headers_are_rejected_before_network_io() {
        for value in ["", " leading", "line\r\nbreak"] {
            assert_eq!(
                build_refresh_request("refresh", value)
                    .err()
                    .expect("invalid device id must fail"),
                SafeError::policy()
            );
        }
    }

    #[tokio::test]
    async fn transport_timeout_stays_distinct_from_contract_and_authentication_errors() {
        let client = AdminHttpClient {
            transport: Arc::new(TimeoutTransport),
        };
        let current = SecretString::from("current-refresh");
        assert_eq!(
            client
                .rotate(&current, "device-1", 1_000)
                .await
                .err()
                .expect("timeout must fail"),
            SafeError::timeout()
        );
    }
}
