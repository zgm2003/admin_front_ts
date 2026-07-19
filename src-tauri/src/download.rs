mod http;
mod policy;
mod store;

#[cfg(test)]
mod tests;

use crate::error::SafeError;
use http::ManagedHttpClient;
use policy::{
    sanitize_filename, validate_completed_file, validate_download_url, validate_selected_target,
    ValidatedTarget,
};
use std::sync::Arc;
use std::time::Instant;
use store::DownloadStore;
use tauri::{AppHandle, Emitter};
use tauri_plugin_dialog::DialogExt;
use tokio::io::AsyncWriteExt;

pub use store::DownloadProgress;

pub struct DownloadManager {
    store: Arc<DownloadStore>,
    client: ManagedHttpClient,
}

impl Default for DownloadManager {
    fn default() -> Self {
        Self::new()
    }
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            store: Arc::new(DownloadStore::default()),
            client: ManagedHttpClient,
        }
    }

    pub async fn start(
        self: &Arc<Self>,
        app: AppHandle,
        url: String,
        suggested_filename: String,
    ) -> Result<String, SafeError> {
        let url = validate_download_url(&url)?;
        let suggested_filename = sanitize_filename(&suggested_filename)?;
        let dialog_app = app.clone();
        let dialog_filename = suggested_filename.clone();
        let selected = tokio::task::spawn_blocking(move || {
            dialog_app
                .dialog()
                .file()
                .set_file_name(dialog_filename)
                .blocking_save_file()
        })
        .await
        .map_err(|_| SafeError::download_filesystem())?
        .ok_or_else(SafeError::download_cancelled)?
        .into_path()
        .map_err(|_| SafeError::download_policy())?;
        let target = validate_selected_target(&selected)?;
        self.start_selected(app, url, target)
    }

    fn start_selected(
        self: &Arc<Self>,
        app: AppHandle,
        url: url::Url,
        target: ValidatedTarget,
    ) -> Result<String, SafeError> {
        let temporary = tempfile::Builder::new()
            .prefix(".cloudadmin-")
            .suffix(".part")
            .tempfile_in(&target.parent)
            .map_err(|_| SafeError::download_filesystem())?;
        let id = self.store.create(&target.filename)?;
        let manager = Arc::clone(self);
        let task_id = id.clone();
        tokio::spawn(async move {
            manager
                .run_download(app, task_id, url, target, temporary)
                .await;
        });
        Ok(id)
    }

    async fn run_download(
        &self,
        app: AppHandle,
        task_id: String,
        url: url::Url,
        target: ValidatedTarget,
        temporary: tempfile::NamedTempFile,
    ) {
        let signal = match self.store.signal(&task_id) {
            Ok(signal) => signal,
            Err(_) => return,
        };
        let (file, temporary_path) = temporary.into_parts();
        let mut file = tokio::fs::File::from_std(file);
        let mut started = false;
        let mut last_emit = Instant::now();
        let mut last_downloaded = 0u64;

        let result = self
            .client
            .download_to(url, &mut file, &signal, |downloaded, total| {
                if !started {
                    self.store.begin(&task_id, total)?;
                    started = true;
                }
                let now = Instant::now();
                let elapsed = now.duration_since(last_emit);
                let speed = if elapsed.as_millis() >= 500 {
                    ((downloaded.saturating_sub(last_downloaded)) as f64 / elapsed.as_secs_f64())
                        as u64
                } else {
                    0
                };
                let progress = self.store.update(&task_id, downloaded, total, speed)?;
                if elapsed.as_millis() >= 500 || downloaded == total {
                    let _ = app.emit("download-progress", progress);
                    last_emit = now;
                    last_downloaded = downloaded;
                }
                Ok(())
            })
            .await;

        let completed = async {
            let downloaded = result?;
            if signal.is_cancelled() {
                return Err(SafeError::download_cancelled());
            }
            file.flush()
                .await
                .map_err(|_| SafeError::download_filesystem())?;
            file.sync_all()
                .await
                .map_err(|_| SafeError::download_filesystem())?;
            drop(file);
            if signal.is_cancelled() {
                return Err(SafeError::download_cancelled());
            }
            let target = validate_selected_target(&target.path)?;
            let final_path = target.path.clone();
            temporary_path
                .persist_noclobber(&final_path)
                .map_err(|_| SafeError::download_filesystem())?;
            if signal.is_cancelled() {
                let _ = std::fs::remove_file(&final_path);
                return Err(SafeError::download_cancelled());
            }
            let canonical = match validate_completed_file(&final_path, &target.parent) {
                Ok(path) => path,
                Err(error) => {
                    let _ = std::fs::remove_file(&final_path);
                    return Err(error);
                }
            };
            let progress = match self.store.complete(&task_id, canonical, downloaded) {
                Ok(progress) => progress,
                Err(error) => {
                    let _ = std::fs::remove_file(&final_path);
                    return Err(error);
                }
            };
            let _ = app.emit("download-progress", progress);
            let _ = app.emit("download-completed", &task_id);
            Ok::<(), SafeError>(())
        }
        .await;

        if let Err(error) = completed {
            if let Ok(progress) = self.store.fail(&task_id, error) {
                let message = progress
                    .error
                    .clone()
                    .unwrap_or_else(|| error.message.to_owned());
                let _ = app.emit("download-progress", progress);
                let _ = app.emit("download-failed", (&task_id, message));
                eprintln!("[managed-download] task failed: {}", error.kind);
            }
        }
    }

    pub fn cancel(&self, task_id: &str) -> Result<(), SafeError> {
        self.store.cancel(task_id)
    }

    pub fn progress(&self, task_id: &str) -> Result<Option<DownloadProgress>, SafeError> {
        self.store.progress(task_id)
    }

    pub fn all(&self) -> Result<Vec<DownloadProgress>, SafeError> {
        self.store.all()
    }

    pub fn remove(&self, task_id: &str) -> Result<(), SafeError> {
        self.store.remove(task_id)
    }

    pub fn reveal(&self, task_id: &str) -> Result<(), SafeError> {
        let path = self.store.reveal_path(task_id)?;
        #[cfg(target_os = "windows")]
        std::process::Command::new("explorer.exe")
            .arg("/select,")
            .arg(path)
            .spawn()
            .map_err(|_| SafeError::download_filesystem())?;
        #[cfg(not(target_os = "windows"))]
        let _ = path;
        Ok(())
    }
}
