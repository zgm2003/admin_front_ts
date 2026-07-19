use crate::error::SafeError;
use crate::http_policy::is_public_ip;
use std::fs;
use std::io::ErrorKind;
use std::net::IpAddr;
use std::path::{Component, Path, PathBuf};
use url::Url;

#[cfg(target_os = "windows")]
use std::os::windows::fs::MetadataExt;

pub(super) const MAX_DOWNLOAD_BYTES: u64 = 1024 * 1024 * 1024;
const MAX_REDIRECTS: u8 = 5;
const ALLOWED_DOWNLOAD_HOSTS: [&str; 2] = ["cos.zgm2003.cn", "www.zgm2003.cn"];

#[derive(Clone)]
pub(super) struct ValidatedTarget {
    pub(super) parent: PathBuf,
    pub(super) path: PathBuf,
    pub(super) filename: String,
}

pub(super) fn validate_download_url(input: &str) -> Result<Url, SafeError> {
    let url = Url::parse(input).map_err(|_| SafeError::download_policy())?;
    let host = url.host_str().ok_or_else(SafeError::download_policy)?;
    if url.scheme() != "https"
        || !ALLOWED_DOWNLOAD_HOSTS.contains(&host)
        || !url.username().is_empty()
        || url.password().is_some()
        || url.port().is_some()
        || url.fragment().is_some()
    {
        return Err(SafeError::download_policy());
    }
    Ok(url)
}

pub(super) fn validate_resolved_addresses(addresses: &[IpAddr]) -> Result<(), SafeError> {
    if addresses.is_empty()
        || addresses
            .iter()
            .copied()
            .any(|address| !is_public_ip(address))
    {
        return Err(SafeError::download_policy());
    }
    Ok(())
}

#[derive(Default)]
pub(super) struct RedirectBudget {
    followed: u8,
}

impl RedirectBudget {
    pub(super) fn new() -> Self {
        Self::default()
    }

    pub(super) fn follow(&mut self, current: &Url, location: &str) -> Result<Url, SafeError> {
        if self.followed >= MAX_REDIRECTS {
            return Err(SafeError::download_policy());
        }
        let next = current
            .join(location)
            .map_err(|_| SafeError::download_policy())?;
        let next = validate_download_url(next.as_str())?;
        self.followed += 1;
        Ok(next)
    }
}

pub(super) fn validate_content_length(length: Option<u64>) -> Result<u64, SafeError> {
    match length {
        Some(length) if length <= MAX_DOWNLOAD_BYTES => Ok(length),
        _ => Err(SafeError::download_response()),
    }
}

pub(super) fn checked_downloaded(
    downloaded: u64,
    chunk_length: usize,
    declared_length: u64,
) -> Result<u64, SafeError> {
    let next = u64::try_from(chunk_length)
        .ok()
        .and_then(|chunk| downloaded.checked_add(chunk))
        .ok_or_else(SafeError::download_response)?;
    if next > declared_length || next > MAX_DOWNLOAD_BYTES {
        return Err(SafeError::download_response());
    }
    Ok(next)
}

pub(super) fn sanitize_filename(input: &str) -> Result<String, SafeError> {
    if input.is_empty()
        || input.trim() != input
        || input == "."
        || input == ".."
        || input.ends_with('.')
        || input.encode_utf16().count() > 255
        || input.chars().any(|character| {
            character.is_control()
                || matches!(
                    character,
                    '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*'
                )
        })
    {
        return Err(SafeError::download_policy());
    }

    let stem = input.split('.').next().unwrap_or_default().to_uppercase();
    let reserved = matches!(
        stem.as_str(),
        "CON" | "PRN" | "AUX" | "NUL" | "CLOCK$" | "CONIN$" | "CONOUT$"
    ) || stem.strip_prefix("COM").is_some_and(|suffix| {
        matches!(
            suffix,
            "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³"
        )
    }) || stem.strip_prefix("LPT").is_some_and(|suffix| {
        matches!(
            suffix,
            "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³"
        )
    });
    if reserved {
        return Err(SafeError::download_policy());
    }
    Ok(input.to_owned())
}

fn is_symlink_or_reparse(metadata: &fs::Metadata) -> bool {
    if metadata.file_type().is_symlink() {
        return true;
    }
    #[cfg(target_os = "windows")]
    if metadata.file_attributes() & 0x400 != 0 {
        return true;
    }
    false
}

pub(super) fn validate_selected_target(path: &Path) -> Result<ValidatedTarget, SafeError> {
    if !path.is_absolute()
        || path
            .components()
            .any(|component| matches!(component, Component::CurDir | Component::ParentDir))
    {
        return Err(SafeError::download_policy());
    }
    let filename = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(SafeError::download_policy)?;
    let filename = sanitize_filename(filename)?;
    let parent = path.parent().ok_or_else(SafeError::download_policy)?;

    for ancestor in parent.ancestors() {
        let metadata =
            fs::symlink_metadata(ancestor).map_err(|_| SafeError::download_filesystem())?;
        if is_symlink_or_reparse(&metadata) {
            return Err(SafeError::download_policy());
        }
    }
    if !fs::metadata(parent)
        .map_err(|_| SafeError::download_filesystem())?
        .is_dir()
    {
        return Err(SafeError::download_policy());
    }

    match fs::symlink_metadata(path) {
        Ok(metadata) if is_symlink_or_reparse(&metadata) => {
            return Err(SafeError::download_policy());
        }
        Ok(_) => return Err(SafeError::download_policy()),
        Err(error) if error.kind() == ErrorKind::NotFound => {}
        Err(_) => return Err(SafeError::download_filesystem()),
    }

    let parent = fs::canonicalize(parent).map_err(|_| SafeError::download_filesystem())?;
    let target = parent.join(&filename);
    if !target.starts_with(&parent) {
        return Err(SafeError::download_policy());
    }
    Ok(ValidatedTarget {
        parent,
        path: target,
        filename,
    })
}

pub(super) fn validate_completed_file(
    path: &Path,
    expected_parent: &Path,
) -> Result<PathBuf, SafeError> {
    let metadata = fs::symlink_metadata(path).map_err(|_| SafeError::download_filesystem())?;
    if is_symlink_or_reparse(&metadata) || !metadata.is_file() {
        return Err(SafeError::download_policy());
    }
    let canonical = fs::canonicalize(path).map_err(|_| SafeError::download_filesystem())?;
    if canonical != path || canonical.parent() != Some(expected_parent) {
        return Err(SafeError::download_policy());
    }
    Ok(canonical)
}
