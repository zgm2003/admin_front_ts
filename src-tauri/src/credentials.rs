use crate::error::SafeError;
use secrecy::{ExposeSecret, SecretString};
use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer};
use std::fmt;
use std::sync::Arc;

pub const CREDENTIAL_SERVICE: &str = "cn.zgm2003.admin.refresh";
pub const CREDENTIAL_ACCOUNT: &str = "current-session";

#[derive(Debug, Clone, Copy)]
pub struct CredentialBackendError;

#[doc(hidden)]
pub trait CredentialBackend: Send + Sync {
    fn set(&self, value: &str) -> Result<(), CredentialBackendError>;
    fn get(&self) -> Result<Option<String>, CredentialBackendError>;
    fn delete(&self) -> Result<(), CredentialBackendError>;
}

#[derive(Debug, Default)]
struct WindowsCredentialBackend;

impl WindowsCredentialBackend {
    fn entry(&self) -> Result<keyring::Entry, CredentialBackendError> {
        keyring::Entry::new(CREDENTIAL_SERVICE, CREDENTIAL_ACCOUNT)
            .map_err(|_| CredentialBackendError)
    }
}

impl CredentialBackend for WindowsCredentialBackend {
    fn set(&self, value: &str) -> Result<(), CredentialBackendError> {
        self.entry()?
            .set_password(value)
            .map_err(|_| CredentialBackendError)
    }

    fn get(&self) -> Result<Option<String>, CredentialBackendError> {
        match self.entry()?.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(_) => Err(CredentialBackendError),
        }
    }

    fn delete(&self) -> Result<(), CredentialBackendError> {
        match self.entry()?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(_) => Err(CredentialBackendError),
        }
    }
}

#[derive(Clone)]
pub struct CredentialStore {
    backend: Arc<dyn CredentialBackend>,
}

impl Default for CredentialStore {
    fn default() -> Self {
        Self {
            backend: Arc::new(WindowsCredentialBackend),
        }
    }
}

impl CredentialStore {
    #[doc(hidden)]
    pub fn from_backend(backend: Arc<dyn CredentialBackend>) -> Self {
        Self { backend }
    }

    pub fn seal(&self, input: RefreshCredentialInput) -> Result<(), SafeError> {
        self.replace(input.into_secret())
    }

    pub(crate) fn replace(&self, credential: SecretString) -> Result<(), SafeError> {
        self.backend
            .set(credential.expose_secret())
            .map_err(|_| SafeError::credential_store())
    }

    pub(crate) fn load(&self) -> Result<SecretString, SafeError> {
        let value = self
            .backend
            .get()
            .map_err(|_| SafeError::credential_store())?
            .ok_or_else(SafeError::credential_missing)?;
        if value.is_empty() || value.trim() != value {
            return Err(SafeError::credential_missing());
        }
        Ok(value.into())
    }

    pub fn clear(&self) -> Result<(), SafeError> {
        self.backend
            .delete()
            .map_err(|_| SafeError::credential_store())
    }
}

pub struct RefreshCredentialInput(SecretString);

impl RefreshCredentialInput {
    fn into_secret(self) -> SecretString {
        self.0
    }
}

impl fmt::Debug for RefreshCredentialInput {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("RefreshCredentialInput([REDACTED])")
    }
}

struct RefreshCredentialVisitor;

impl RefreshCredentialVisitor {
    fn validate<E: de::Error>(value: &str) -> Result<(), E> {
        if value.is_empty() || value.trim() != value {
            return Err(E::custom("refresh credential must be a non-empty string"));
        }
        Ok(())
    }
}

impl<'de> Visitor<'de> for RefreshCredentialVisitor {
    type Value = RefreshCredentialInput;

    fn expecting(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("a non-empty refresh credential string")
    }

    fn visit_borrowed_str<E: de::Error>(self, value: &'de str) -> Result<Self::Value, E> {
        Self::validate(value)?;
        Ok(RefreshCredentialInput(SecretString::from(value)))
    }

    fn visit_str<E: de::Error>(self, value: &str) -> Result<Self::Value, E> {
        Self::validate(value)?;
        Ok(RefreshCredentialInput(SecretString::from(value)))
    }

    fn visit_string<E: de::Error>(self, value: String) -> Result<Self::Value, E> {
        Self::validate(&value)?;
        Ok(RefreshCredentialInput(SecretString::from(value)))
    }
}

impl<'de> Deserialize<'de> for RefreshCredentialInput {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        deserializer.deserialize_string(RefreshCredentialVisitor)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use secrecy::ExposeSecret;
    use std::sync::{Arc, Mutex};

    #[derive(Default)]
    struct MemoryBackend {
        value: Mutex<Option<String>>,
        fail: Mutex<bool>,
    }

    impl CredentialBackend for MemoryBackend {
        fn set(&self, value: &str) -> Result<(), CredentialBackendError> {
            if *self.fail.lock().unwrap() {
                return Err(CredentialBackendError);
            }
            *self.value.lock().unwrap() = Some(value.to_owned());
            Ok(())
        }

        fn get(&self) -> Result<Option<String>, CredentialBackendError> {
            if *self.fail.lock().unwrap() {
                return Err(CredentialBackendError);
            }
            Ok(self.value.lock().unwrap().clone())
        }

        fn delete(&self) -> Result<(), CredentialBackendError> {
            if *self.fail.lock().unwrap() {
                return Err(CredentialBackendError);
            }
            *self.value.lock().unwrap() = None;
            Ok(())
        }
    }

    fn parsed(value: &str) -> RefreshCredentialInput {
        serde_json::from_str(&serde_json::to_string(value).unwrap()).unwrap()
    }

    #[test]
    fn seal_replaces_loads_and_clears_one_os_credential() {
        let backend = Arc::new(MemoryBackend::default());
        let store = CredentialStore::from_backend(backend);

        store.seal(parsed("first-refresh")).unwrap();
        store.seal(parsed("rotated-refresh")).unwrap();
        let loaded = store.load().unwrap();
        assert_eq!(loaded.expose_secret(), "rotated-refresh");

        store.clear().unwrap();
        store.clear().unwrap();
        assert_eq!(store.load().unwrap_err(), SafeError::credential_missing());
    }

    #[test]
    fn keyring_failures_are_static_and_never_disclose_the_credential() {
        let backend = Arc::new(MemoryBackend::default());
        *backend.fail.lock().unwrap() = true;
        let store = CredentialStore::from_backend(backend);
        let secret = "credential-that-must-not-leak";

        let error = store.seal(parsed(secret)).unwrap_err();
        let serialized = serde_json::to_string(&error).unwrap();
        assert_eq!(error, SafeError::credential_store());
        assert!(!serialized.contains(secret));
    }

    #[test]
    fn refresh_input_accepts_only_a_non_empty_string_and_redacts_debug() {
        let input = parsed("refresh-secret");
        assert_eq!(format!("{input:?}"), "RefreshCredentialInput([REDACTED])");
        assert!(serde_json::from_str::<RefreshCredentialInput>("\"\"").is_err());
        assert!(
            serde_json::from_str::<RefreshCredentialInput>(r#"{"refreshToken":"secret"}"#).is_err()
        );
    }
}
