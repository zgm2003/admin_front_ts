use cloudadmin_lib::{
    credentials::{CredentialBackend, CredentialBackendError, CredentialStore},
    error::SafeError,
    http_policy::{
        rotate_stored_refresh_credential, AdminHttpClient, RefreshHttpRequest, RefreshHttpResponse,
        RefreshTransport, TransportFuture, ADMIN_REFRESH_ENDPOINT,
    },
};
use reqwest::StatusCode;
use std::sync::{Arc, Mutex};

#[derive(Default)]
struct MemoryBackend {
    value: Mutex<Option<String>>,
    operations: Mutex<Vec<&'static str>>,
}

impl MemoryBackend {
    fn with_value(value: &str) -> Self {
        Self {
            value: Mutex::new(Some(value.to_owned())),
            operations: Mutex::new(Vec::new()),
        }
    }

    fn value(&self) -> Option<String> {
        self.value.lock().unwrap().clone()
    }

    fn operations(&self) -> Vec<&'static str> {
        self.operations.lock().unwrap().clone()
    }
}

impl CredentialBackend for MemoryBackend {
    fn set(&self, value: &str) -> Result<(), CredentialBackendError> {
        self.operations.lock().unwrap().push("set");
        *self.value.lock().unwrap() = Some(value.to_owned());
        Ok(())
    }

    fn get(&self) -> Result<Option<String>, CredentialBackendError> {
        self.operations.lock().unwrap().push("get");
        Ok(self.value())
    }

    fn delete(&self) -> Result<(), CredentialBackendError> {
        self.operations.lock().unwrap().push("delete");
        *self.value.lock().unwrap() = None;
        Ok(())
    }
}

struct StaticTransport {
    response: Mutex<Option<Result<RefreshHttpResponse, SafeError>>>,
    request: Mutex<Option<(String, String, String)>>,
}

impl StaticTransport {
    fn response(response: RefreshHttpResponse) -> Self {
        Self {
            response: Mutex::new(Some(Ok(response))),
            request: Mutex::new(None),
        }
    }

    fn failure(error: SafeError) -> Self {
        Self {
            response: Mutex::new(Some(Err(error))),
            request: Mutex::new(None),
        }
    }
}

impl RefreshTransport for StaticTransport {
    fn execute<'a>(&'a self, request: RefreshHttpRequest) -> TransportFuture<'a> {
        let endpoint = request.endpoint().as_str().to_owned();
        let variant = request
            .headers()
            .get("X-Admin-Client-Variant")
            .and_then(|value| value.to_str().ok())
            .unwrap_or_default()
            .to_owned();
        let body = String::from_utf8(request.body().to_vec()).unwrap();
        *self.request.lock().unwrap() = Some((endpoint, variant, body));
        let response = self.response.lock().unwrap().take().unwrap();
        Box::pin(async move { response })
    }
}

#[tokio::test]
async fn successful_rotation_stores_the_next_refresh_before_returning_access_only() {
    let backend = Arc::new(MemoryBackend::with_value("current-refresh"));
    let store = CredentialStore::from_backend(backend.clone());
    let transport = Arc::new(StaticTransport::response(RefreshHttpResponse::json(
        StatusCode::OK,
        br#"{"code":0,"data":{"access_token":"next-access","expires_in":60,"refresh_token":"next-refresh","refresh_expires_in":3600},"msg":"success"}"#.to_vec(),
    )));
    let client = AdminHttpClient::from_transport(transport.clone());

    let access = rotate_stored_refresh_credential(&store, &client, "device-1")
        .await
        .unwrap();

    assert_eq!(access.access_token, "next-access");
    assert_eq!(backend.value().as_deref(), Some("next-refresh"));
    assert_eq!(backend.operations(), ["get", "set"]);
    let request = transport.request.lock().unwrap().clone().unwrap();
    assert_eq!(request.0, ADMIN_REFRESH_ENDPOINT);
    assert_eq!(request.1, "desktop");
    assert_eq!(request.2, r#"{"refresh_token":"current-refresh"}"#);
    let serialized = serde_json::to_string(&access).unwrap();
    assert!(!serialized.contains("next-refresh"));
}

#[tokio::test]
async fn authentication_failure_clears_the_stored_refresh_but_transient_failure_retains_it() {
    let revoked_backend = Arc::new(MemoryBackend::with_value("revoked-refresh"));
    let revoked_store = CredentialStore::from_backend(revoked_backend.clone());
    let revoked_transport = Arc::new(StaticTransport::response(RefreshHttpResponse::json(
        StatusCode::UNAUTHORIZED,
        br#"{"code":100,"data":{},"msg":"revoked","error":{"code":"auth.revoked","category":"authentication","retryable":false,"request_id":"request-1","trace_id":"trace-1"}}"#.to_vec(),
    )));
    let revoked_client = AdminHttpClient::from_transport(revoked_transport);
    assert_eq!(
        rotate_stored_refresh_credential(&revoked_store, &revoked_client, "device-1")
            .await
            .err()
            .expect("revoked refresh must fail"),
        SafeError::authentication()
    );
    assert_eq!(revoked_backend.value(), None);
    assert_eq!(revoked_backend.operations(), ["get", "delete"]);

    let transient_backend = Arc::new(MemoryBackend::with_value("retry-refresh"));
    let transient_store = CredentialStore::from_backend(transient_backend.clone());
    let transient_client =
        AdminHttpClient::from_transport(Arc::new(StaticTransport::failure(SafeError::network())));
    assert_eq!(
        rotate_stored_refresh_credential(&transient_store, &transient_client, "device-1")
            .await
            .err()
            .expect("transient refresh must fail"),
        SafeError::network()
    );
    assert_eq!(transient_backend.value().as_deref(), Some("retry-refresh"));
    assert_eq!(transient_backend.operations(), ["get"]);
}
