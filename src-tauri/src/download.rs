use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

use crate::error::AppError;

/// 下载任务状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

/// 下载进度信息（前端可见）
#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgress {
    pub id: String,
    pub status: DownloadStatus,
    pub downloaded: u64,
    pub total: u64,
    pub speed: u64,
    pub progress: f64,
    pub filename: String,
    pub save_path: String,
    pub error: Option<String>,
}

/// 单个任务的内部状态（独立锁）
struct TaskState {
    status: DownloadStatus,
    downloaded: u64,
    total: u64,
    speed: u64,
    progress: f64,
    error: Option<String>,
}

/// 下载任务
struct DownloadTask {
    id: String,
    url: String,
    save_path: PathBuf,
    filename: String,
    cancel_flag: Arc<AtomicBool>,
    state: Arc<Mutex<TaskState>>,
}

impl DownloadTask {
    fn to_progress(&self) -> DownloadProgress {
        let state = self.state.lock().unwrap();
        DownloadProgress {
            id: self.id.clone(),
            status: state.status.clone(),
            downloaded: state.downloaded,
            total: state.total,
            speed: state.speed,
            progress: state.progress,
            filename: self.filename.clone(),
            save_path: self.save_path.to_string_lossy().to_string(),
            error: state.error.clone(),
        }
    }
}

/// 下载上下文（收拢 download_file 参数）
struct DownloadContext {
    url: String,
    save_path: PathBuf,
    task_id: String,
    state: Arc<Mutex<TaskState>>,
    cancel_flag: Arc<AtomicBool>,
    app: AppHandle,
    filename: String,
}

/// 下载管理器
pub struct DownloadManager {
    tasks: Mutex<HashMap<String, DownloadTask>>,
    client: Client,
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            tasks: Mutex::new(HashMap::new()),
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
        }
    }

    /// 创建下载任务
    pub fn create_task(
        &self,
        id: String,
        url: String,
        save_path: PathBuf,
        filename: String,
    ) -> Result<(), AppError> {
        let mut tasks = self.tasks.lock().unwrap();

        if tasks.contains_key(&id) {
            return Err(AppError::TaskExists(id));
        }

        tasks.insert(id.clone(), DownloadTask {
            id,
            url,
            save_path,
            filename,
            cancel_flag: Arc::new(AtomicBool::new(false)),
            state: Arc::new(Mutex::new(TaskState {
                status: DownloadStatus::Pending,
                downloaded: 0,
                total: 0,
                speed: 0,
                progress: 0.0,
                error: None,
            })),
        });

        Ok(())
    }

    /// 开始下载
    pub async fn start_download(&self, id: String, app: AppHandle) -> Result<(), AppError> {
        let ctx = {
            let tasks = self.tasks.lock().unwrap();
            let task = tasks.get(&id).ok_or_else(|| AppError::TaskNotFound(id.clone()))?;

            {
                let mut state = task.state.lock().unwrap();
                if !matches!(state.status, DownloadStatus::Pending | DownloadStatus::Paused) {
                    return Err(AppError::InvalidState("任务状态不允许开始下载".into()));
                }
                state.status = DownloadStatus::Downloading;
            }

            DownloadContext {
                url: task.url.clone(),
                save_path: task.save_path.clone(),
                task_id: task.id.clone(),
                state: Arc::clone(&task.state),
                cancel_flag: Arc::clone(&task.cancel_flag),
                app: app.clone(),
                filename: task.filename.clone(),
            }
        };
        // 锁已释放，spawn 异步下载

        let client = self.client.clone();
        tokio::spawn(async move {
            let result = Self::download_file(&client, &ctx).await;

            let mut state = ctx.state.lock().unwrap();
            match result {
                Ok(_) => {
                    state.status = DownloadStatus::Completed;
                    state.progress = 100.0;
                    let _ = ctx.app.emit("download-completed", &ctx.task_id);
                }
                Err(e) => {
                    let msg = e.to_string();
                    state.status = if ctx.cancel_flag.load(Ordering::Relaxed) {
                        DownloadStatus::Cancelled
                    } else {
                        DownloadStatus::Failed
                    };
                    state.error = Some(msg.clone());
                    let _ = ctx.app.emit("download-failed", (&ctx.task_id, &msg));
                }
            }
        });

        Ok(())
    }

    /// 执行文件下载
    async fn download_file(client: &Client, ctx: &DownloadContext) -> Result<(), AppError> {
        if ctx.cancel_flag.load(Ordering::Relaxed) {
            return Err(AppError::Cancelled);
        }

        let response = tokio::time::timeout(
            std::time::Duration::from_secs(30),
            client.get(&ctx.url).send(),
        )
        .await
        .map_err(|_| AppError::Timeout)?
        .map_err(AppError::network)?;

        if ctx.cancel_flag.load(Ordering::Relaxed) {
            return Err(AppError::Cancelled);
        }

        if !response.status().is_success() {
            return Err(AppError::Http(response.status().to_string()));
        }

        let total_size = response.content_length().unwrap_or(0);
        {
            let mut state = ctx.state.lock().unwrap();
            state.total = total_size;
        }

        let mut file = File::create(&ctx.save_path)
            .map_err(|e| AppError::io("创建文件失败", e))?;

        let mut stream = response.bytes_stream();
        let mut downloaded: u64 = 0;
        let mut last_update = std::time::Instant::now();
        let mut last_downloaded = 0u64;

        while let Some(chunk_result) = stream.next().await {
            // 每个 chunk 检查取消
            if ctx.cancel_flag.load(Ordering::Relaxed) {
                drop(file);
                let _ = std::fs::remove_file(&ctx.save_path);
                return Err(AppError::Cancelled);
            }

            let chunk = chunk_result.map_err(AppError::network)?;
            file.write_all(&chunk)
                .map_err(|e| AppError::io("写入文件失败", e))?;

            downloaded += chunk.len() as u64;

            // 每 500ms 更新一次进度
            let now = std::time::Instant::now();
            if now.duration_since(last_update).as_millis() >= 500 {
                let elapsed = now.duration_since(last_update).as_secs_f64();
                let speed = ((downloaded - last_downloaded) as f64 / elapsed) as u64;
                let progress = if total_size > 0 {
                    (downloaded as f64 / total_size as f64) * 100.0
                } else {
                    0.0
                };

                {
                    let mut state = ctx.state.lock().unwrap();
                    state.downloaded = downloaded;
                    state.speed = speed;
                    state.progress = progress;
                }

                let _ = ctx.app.emit("download-progress", DownloadProgress {
                    id: ctx.task_id.clone(),
                    status: DownloadStatus::Downloading,
                    downloaded,
                    total: total_size,
                    speed,
                    progress,
                    filename: ctx.filename.clone(),
                    save_path: ctx.save_path.to_string_lossy().to_string(),
                    error: None,
                });

                last_update = now;
                last_downloaded = downloaded;
            }
        }

        file.flush().map_err(|e| AppError::io("保存文件失败", e))?;

        // 发送最终进度
        let final_progress = if total_size > 0 {
            (downloaded as f64 / total_size as f64) * 100.0
        } else {
            100.0
        };
        let _ = ctx.app.emit("download-progress", DownloadProgress {
            id: ctx.task_id.clone(),
            status: DownloadStatus::Completed,
            downloaded,
            total: total_size,
            speed: 0,
            progress: final_progress,
            filename: ctx.filename.clone(),
            save_path: ctx.save_path.to_string_lossy().to_string(),
            error: None,
        });

        Ok(())
    }

    /// 取消下载
    pub fn cancel_download(&self, id: &str) -> Result<(), AppError> {
        let tasks = self.tasks.lock().unwrap();
        let task = tasks.get(id).ok_or_else(|| AppError::TaskNotFound(id.into()))?;

        let state = task.state.lock().unwrap();
        if !matches!(state.status, DownloadStatus::Downloading | DownloadStatus::Paused) {
            return Err(AppError::InvalidState("任务状态不允许取消".into()));
        }
        drop(state);

        task.cancel_flag.store(true, Ordering::Relaxed);
        Ok(())
    }

    /// 获取任务进度
    pub fn get_progress(&self, id: &str) -> Option<DownloadProgress> {
        let tasks = self.tasks.lock().unwrap();
        tasks.get(id).map(|t| t.to_progress())
    }

    /// 获取所有任务摘要
    pub fn get_all_tasks(&self) -> Vec<DownloadProgress> {
        let tasks = self.tasks.lock().unwrap();
        tasks.values().map(|t| t.to_progress()).collect()
    }

    /// 删除任务
    pub fn remove_task(&self, id: &str) -> Result<(), AppError> {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.remove(id).ok_or_else(|| AppError::TaskNotFound(id.into()))?;
        Ok(())
    }
}
