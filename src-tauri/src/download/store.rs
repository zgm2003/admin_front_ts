use crate::error::SafeError;
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tokio::sync::Notify;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgress {
    pub id: String,
    pub status: DownloadStatus,
    pub downloaded: u64,
    pub total: u64,
    pub speed: u64,
    pub progress: f64,
    pub filename: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Clone)]
pub(super) struct CancellationSignal {
    cancelled: Arc<AtomicBool>,
    notify: Arc<Notify>,
}

impl CancellationSignal {
    pub(super) fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::Acquire)
    }

    pub(super) async fn cancelled(&self) {
        if self.is_cancelled() {
            return;
        }
        self.notify.notified().await;
    }

    fn cancel(&self) {
        self.cancelled.store(true, Ordering::Release);
        self.notify.notify_one();
    }
}

struct TaskState {
    status: DownloadStatus,
    downloaded: u64,
    total: u64,
    speed: u64,
    error: Option<&'static str>,
    completed_path: Option<PathBuf>,
}

struct DownloadTask {
    id: String,
    filename: String,
    signal: CancellationSignal,
    state: Mutex<TaskState>,
}

impl DownloadTask {
    fn progress(&self) -> Result<DownloadProgress, SafeError> {
        let state = self
            .state
            .lock()
            .map_err(|_| SafeError::download_task_state())?;
        let progress = if state.total == 0 {
            if state.status == DownloadStatus::Completed {
                100.0
            } else {
                0.0
            }
        } else {
            (state.downloaded as f64 / state.total as f64 * 100.0).min(100.0)
        };
        Ok(DownloadProgress {
            id: self.id.clone(),
            status: state.status,
            downloaded: state.downloaded,
            total: state.total,
            speed: state.speed,
            progress,
            filename: self.filename.clone(),
            error: state.error.map(str::to_owned),
        })
    }
}

#[derive(Default)]
pub(super) struct DownloadStore {
    tasks: Mutex<HashMap<String, Arc<DownloadTask>>>,
}

impl DownloadStore {
    pub(super) fn create(&self, filename: &str) -> Result<String, SafeError> {
        let mut tasks = self
            .tasks
            .lock()
            .map_err(|_| SafeError::download_task_state())?;
        let id = (0..8)
            .map(|_| uuid::Uuid::new_v4().to_string())
            .find(|candidate| !tasks.contains_key(candidate))
            .ok_or_else(SafeError::download_task_state)?;
        let task = Arc::new(DownloadTask {
            id: id.clone(),
            filename: filename.to_owned(),
            signal: CancellationSignal {
                cancelled: Arc::new(AtomicBool::new(false)),
                notify: Arc::new(Notify::new()),
            },
            state: Mutex::new(TaskState {
                status: DownloadStatus::Pending,
                downloaded: 0,
                total: 0,
                speed: 0,
                error: None,
                completed_path: None,
            }),
        });
        tasks.insert(id.clone(), task);
        Ok(id)
    }

    fn task(&self, id: &str) -> Result<Arc<DownloadTask>, SafeError> {
        self.tasks
            .lock()
            .map_err(|_| SafeError::download_task_state())?
            .get(id)
            .cloned()
            .ok_or_else(SafeError::download_task_missing)
    }

    pub(super) fn begin(&self, id: &str, total: u64) -> Result<CancellationSignal, SafeError> {
        let task = self.task(id)?;
        let mut state = task
            .state
            .lock()
            .map_err(|_| SafeError::download_task_state())?;
        if state.status != DownloadStatus::Pending {
            return Err(SafeError::download_task_state());
        }
        state.status = DownloadStatus::Downloading;
        state.total = total;
        drop(state);
        Ok(task.signal.clone())
    }

    pub(super) fn signal(&self, id: &str) -> Result<CancellationSignal, SafeError> {
        Ok(self.task(id)?.signal.clone())
    }

    pub(super) fn update(
        &self,
        id: &str,
        downloaded: u64,
        total: u64,
        speed: u64,
    ) -> Result<DownloadProgress, SafeError> {
        let task = self.task(id)?;
        let mut state = task
            .state
            .lock()
            .map_err(|_| SafeError::download_task_state())?;
        if state.status != DownloadStatus::Downloading {
            return Err(SafeError::download_task_state());
        }
        state.downloaded = downloaded;
        state.total = total;
        state.speed = speed;
        drop(state);
        task.progress()
    }

    pub(super) fn complete(
        &self,
        id: &str,
        canonical_path: PathBuf,
        total: u64,
    ) -> Result<DownloadProgress, SafeError> {
        let task = self.task(id)?;
        let mut state = task
            .state
            .lock()
            .map_err(|_| SafeError::download_task_state())?;
        if state.status != DownloadStatus::Downloading {
            return Err(SafeError::download_task_state());
        }
        state.status = DownloadStatus::Completed;
        state.downloaded = total;
        state.total = total;
        state.speed = 0;
        state.completed_path = Some(canonical_path);
        drop(state);
        task.progress()
    }

    pub(super) fn fail(&self, id: &str, error: SafeError) -> Result<DownloadProgress, SafeError> {
        let task = self.task(id)?;
        let mut state = task
            .state
            .lock()
            .map_err(|_| SafeError::download_task_state())?;
        let safe_error = if task.signal.is_cancelled() || state.status == DownloadStatus::Cancelled
        {
            state.status = DownloadStatus::Cancelled;
            SafeError::download_cancelled()
        } else if matches!(
            state.status,
            DownloadStatus::Pending | DownloadStatus::Downloading
        ) {
            state.status = DownloadStatus::Failed;
            error
        } else {
            return Err(SafeError::download_task_state());
        };
        state.speed = 0;
        state.error = Some(safe_error.message);
        drop(state);
        task.progress()
    }

    pub(super) fn cancel(&self, id: &str) -> Result<(), SafeError> {
        let task = self.task(id)?;
        let mut state = task
            .state
            .lock()
            .map_err(|_| SafeError::download_task_state())?;
        if !matches!(
            state.status,
            DownloadStatus::Pending | DownloadStatus::Downloading
        ) {
            return Err(SafeError::download_task_state());
        }
        state.status = DownloadStatus::Cancelled;
        state.speed = 0;
        state.error = Some(SafeError::download_cancelled().message);
        task.signal.cancel();
        drop(state);
        Ok(())
    }

    pub(super) fn progress(&self, id: &str) -> Result<Option<DownloadProgress>, SafeError> {
        let task = self
            .tasks
            .lock()
            .map_err(|_| SafeError::download_task_state())?
            .get(id)
            .cloned();
        task.map(|task| task.progress()).transpose()
    }

    pub(super) fn all(&self) -> Result<Vec<DownloadProgress>, SafeError> {
        let tasks: Vec<Arc<DownloadTask>> = self
            .tasks
            .lock()
            .map_err(|_| SafeError::download_task_state())?
            .values()
            .cloned()
            .collect();
        tasks.into_iter().map(|task| task.progress()).collect()
    }

    pub(super) fn remove(&self, id: &str) -> Result<(), SafeError> {
        let task = self.task(id)?;
        let state = task
            .state
            .lock()
            .map_err(|_| SafeError::download_task_state())?;
        if matches!(
            state.status,
            DownloadStatus::Pending | DownloadStatus::Downloading
        ) {
            return Err(SafeError::download_task_state());
        }
        drop(state);
        self.tasks
            .lock()
            .map_err(|_| SafeError::download_task_state())?
            .remove(id)
            .ok_or_else(SafeError::download_task_missing)?;
        Ok(())
    }

    pub(super) fn reveal_path(&self, id: &str) -> Result<PathBuf, SafeError> {
        let task = self.task(id)?;
        let state = task
            .state
            .lock()
            .map_err(|_| SafeError::download_task_state())?;
        if state.status != DownloadStatus::Completed {
            return Err(SafeError::download_task_state());
        }
        let recorded = state
            .completed_path
            .clone()
            .ok_or_else(SafeError::download_task_state)?;
        drop(state);

        let metadata =
            fs::symlink_metadata(&recorded).map_err(|_| SafeError::download_filesystem())?;
        if metadata.file_type().is_symlink() || !metadata.is_file() {
            return Err(SafeError::download_policy());
        }
        let canonical =
            fs::canonicalize(&recorded).map_err(|_| SafeError::download_filesystem())?;
        if canonical != recorded {
            return Err(SafeError::download_policy());
        }
        Ok(canonical)
    }
}
