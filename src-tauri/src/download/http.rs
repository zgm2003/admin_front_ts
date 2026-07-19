use super::policy::{
    checked_downloaded, validate_content_length, validate_download_url,
    validate_resolved_addresses, RedirectBudget,
};
use super::store::CancellationSignal;
use crate::error::SafeError;
use futures_util::StreamExt;
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, ACCEPT_ENCODING, LOCATION, USER_AGENT};
use reqwest::{redirect::Policy, StatusCode, Url};
use std::net::{IpAddr, SocketAddr};
use std::time::Duration;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::net::lookup_host;

const DNS_TIMEOUT: Duration = Duration::from_secs(5);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);
const IDLE_TIMEOUT: Duration = Duration::from_secs(30);
const TOTAL_TIMEOUT: Duration = Duration::from_secs(10 * 60);
const HTTPS_PORT: u16 = 443;

#[derive(Clone, Default)]
pub(super) struct ManagedHttpClient;

impl ManagedHttpClient {
    pub(super) async fn download_to<F>(
        &self,
        url: Url,
        file: &mut File,
        signal: &CancellationSignal,
        mut progress: F,
    ) -> Result<u64, SafeError>
    where
        F: FnMut(u64, u64) -> Result<(), SafeError>,
    {
        tokio::time::timeout(
            TOTAL_TIMEOUT,
            self.download_inner(url, file, signal, &mut progress),
        )
        .await
        .map_err(|_| SafeError::download_timeout())?
    }

    async fn download_inner<F>(
        &self,
        mut url: Url,
        file: &mut File,
        signal: &CancellationSignal,
        progress: &mut F,
    ) -> Result<u64, SafeError>
    where
        F: FnMut(u64, u64) -> Result<(), SafeError>,
    {
        let mut redirects = RedirectBudget::new();
        let response = loop {
            if signal.is_cancelled() {
                return Err(SafeError::download_cancelled());
            }
            let response = self.request_once(&url, signal).await?;
            if matches!(
                response.status(),
                StatusCode::MOVED_PERMANENTLY
                    | StatusCode::FOUND
                    | StatusCode::SEE_OTHER
                    | StatusCode::TEMPORARY_REDIRECT
                    | StatusCode::PERMANENT_REDIRECT
            ) {
                let location = response
                    .headers()
                    .get(LOCATION)
                    .and_then(|value| value.to_str().ok())
                    .ok_or_else(SafeError::download_response)?;
                url = redirects.follow(&url, location)?;
                continue;
            }
            if response.status().is_redirection() || response.status() != StatusCode::OK {
                return Err(SafeError::download_response());
            }
            break response;
        };

        let total = validate_content_length(response.content_length())?;
        progress(0, total)?;
        let mut downloaded = 0u64;
        let mut stream = response.bytes_stream();
        loop {
            if signal.is_cancelled() {
                return Err(SafeError::download_cancelled());
            }
            let next = tokio::select! {
                _ = signal.cancelled() => return Err(SafeError::download_cancelled()),
                value = tokio::time::timeout(IDLE_TIMEOUT, stream.next()) => {
                    value.map_err(|_| SafeError::download_timeout())?
                }
            };
            let Some(chunk) = next else {
                break;
            };
            let chunk = chunk.map_err(classify_reqwest_error)?;
            downloaded = checked_downloaded(downloaded, chunk.len(), total)?;
            file.write_all(&chunk)
                .await
                .map_err(|_| SafeError::download_filesystem())?;
            progress(downloaded, total)?;
        }
        if downloaded != total {
            return Err(SafeError::download_response());
        }
        Ok(downloaded)
    }

    async fn request_once(
        &self,
        url: &Url,
        signal: &CancellationSignal,
    ) -> Result<reqwest::Response, SafeError> {
        let validated = validate_download_url(url.as_str())?;
        let host = validated
            .host_str()
            .ok_or_else(SafeError::download_policy)?;
        let resolved = tokio::select! {
            _ = signal.cancelled() => return Err(SafeError::download_cancelled()),
            value = tokio::time::timeout(DNS_TIMEOUT, lookup_host((host, HTTPS_PORT))) => {
                value
                    .map_err(|_| SafeError::download_timeout())?
                    .map_err(|_| SafeError::download_network())?
            }
        };
        let mut addresses: Vec<SocketAddr> = resolved.collect();
        let ips: Vec<IpAddr> = addresses.iter().map(|address| address.ip()).collect();
        validate_resolved_addresses(&ips)?;
        addresses.sort_unstable();
        addresses.dedup();

        let mut headers = HeaderMap::new();
        headers.insert(ACCEPT, HeaderValue::from_static("*/*"));
        headers.insert(ACCEPT_ENCODING, HeaderValue::from_static("identity"));
        headers.insert(
            USER_AGENT,
            HeaderValue::from_static(concat!("CloudAdmin/", env!("CARGO_PKG_VERSION"))),
        );
        let client = reqwest::Client::builder()
            .https_only(true)
            .no_proxy()
            .redirect(Policy::none())
            .connect_timeout(CONNECT_TIMEOUT)
            .resolve_to_addrs(host, &addresses)
            .default_headers(headers)
            .build()
            .map_err(|_| SafeError::download_policy())?;

        tokio::select! {
            _ = signal.cancelled() => Err(SafeError::download_cancelled()),
            response = tokio::time::timeout(IDLE_TIMEOUT, client.get(validated).send()) => {
                response
                    .map_err(|_| SafeError::download_timeout())?
                    .map_err(classify_reqwest_error)
            },
        }
    }
}

fn classify_reqwest_error(error: reqwest::Error) -> SafeError {
    if error.is_timeout() {
        SafeError::download_timeout()
    } else {
        SafeError::download_network()
    }
}
