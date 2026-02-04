use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

/// 下载任务状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Pending,    // 等待中
    Downloading, // 下载中
    Paused,     // 已暂停
    Completed,  // 已完成
    Failed,     // 失败
    Cancelled,  // 已取消
}

/// 下载进度信息
#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgress {
    pub id: String,
    pub status: DownloadStatus,
    pub downloaded: u64,      // 已下载字节数
    pub total: u64,           // 总字节数
    pub speed: u64,           // 下载速度 (bytes/s)
    pub progress: f64,        // 进度百分比 (0-100)
    pub filename: String,
    pub save_path: String,
    pub error: Option<String>,
}

/// 下载任务
struct DownloadTask {
    id: String,
    url: String,
    save_path: PathBuf,
    filename: String,
    status: DownloadStatus,
    downloaded: u64,
    total: u64,
    speed: u64,
    progress: f64,
    error: Option<String>,
    cancel_flag: Arc<Mutex<bool>>,
}

/// 下载管理器
pub struct DownloadManager {
    tasks: Arc<Mutex<HashMap<String, DownloadTask>>>,
    client: Client,
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
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
    ) -> Result<(), String> {
        let mut tasks = self.tasks.lock().unwrap();
        
        if tasks.contains_key(&id) {
            return Err("任务 ID 已存在".to_string());
        }

        tasks.insert(
            id.clone(),
            DownloadTask {
                id,
                url,
                save_path,
                filename,
                status: DownloadStatus::Pending,
                downloaded: 0,
                total: 0,
                speed: 0,
                progress: 0.0,
                error: None,
                cancel_flag: Arc::new(Mutex::new(false)),
            },
        );

        Ok(())
    }

    /// 开始下载
    pub async fn start_download(&self, id: String, app: AppHandle) -> Result<(), String> {
        let (url, save_path, _filename, cancel_flag) = {
            let mut tasks = self.tasks.lock().unwrap();
            let task = tasks.get_mut(&id).ok_or("任务不存在")?;
            
            if !matches!(task.status, DownloadStatus::Pending | DownloadStatus::Paused) {
                return Err("任务状态不允许开始下载".to_string());
            }

            task.status = DownloadStatus::Downloading;
            (
                task.url.clone(),
                task.save_path.clone(),
                task.filename.clone(),
                task.cancel_flag.clone(),
            )
        };

        let tasks = self.tasks.clone();
        let client = self.client.clone();
        let task_id = id.clone();

        tokio::spawn(async move {
            let result = Self::download_file(
                client,
                &url,
                &save_path,
                &task_id,
                tasks.clone(),
                app.clone(),
                cancel_flag,
            )
            .await;

            let mut tasks = tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(&task_id) {
                match result {
                    Ok(_) => {
                        task.status = DownloadStatus::Completed;
                        task.progress = 100.0;
                        let _ = app.emit("download-completed", task_id.clone());
                    }
                    Err(e) => {
                        task.status = DownloadStatus::Failed;
                        task.error = Some(e.clone());
                        let _ = app.emit("download-failed", (task_id.clone(), e));
                    }
                }
            }
        });

        Ok(())
    }

    /// 执行文件下载
    async fn download_file(
        client: Client,
        url: &str,
        save_path: &PathBuf,
        task_id: &str,
        tasks: Arc<Mutex<HashMap<String, DownloadTask>>>,
        app: AppHandle,
        cancel_flag: Arc<Mutex<bool>>,
    ) -> Result<(), String> {
        // 检查取消标志
        if *cancel_flag.lock().unwrap() {
            return Err("下载已取消".to_string());
        }

        // 发送 HTTP 请求（带超时）
        let response = tokio::time::timeout(
            std::time::Duration::from_secs(30),
            client.get(url).send()
        )
        .await
        .map_err(|_| "请求超时".to_string())?
        .map_err(|e| format!("请求失败: {}", e))?;

        // 再次检查取消标志
        if *cancel_flag.lock().unwrap() {
            return Err("下载已取消".to_string());
        }

        if !response.status().is_success() {
            return Err(format!("HTTP 错误: {}", response.status()));
        }

        let total_size = response.content_length().unwrap_or(0);

        // 更新总大小
        {
            let mut tasks = tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id) {
                task.total = total_size;
            }
        }

        // 创建文件
        let mut file = File::create(save_path)
            .map_err(|e| format!("创建文件失败: {}", e))?;

        let mut stream = response.bytes_stream();
        let mut downloaded: u64 = 0;
        let mut last_update = std::time::Instant::now();
        let mut last_downloaded = 0u64;

        // 流式下载（支持取消）
        loop {
            // 使用 tokio::select! 实现可中断的下载
            tokio::select! {
                // 检查取消标志
                _ = async {
                    loop {
                        if *cancel_flag.lock().unwrap() {
                            break;
                        }
                        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
                    }
                } => {
                    // 取消下载
                    let _ = std::fs::remove_file(save_path);
                    return Err("下载已取消".to_string());
                }
                
                // 下载数据
                chunk_result = stream.next() => {
                    match chunk_result {
                        Some(Ok(chunk)) => {
                            file.write_all(&chunk)
                                .map_err(|e| format!("写入文件失败: {}", e))?;

                            downloaded += chunk.len() as u64;

                            let now = std::time::Instant::now();
                            if now.duration_since(last_update).as_millis() >= 500 {
                                let elapsed = now.duration_since(last_update).as_secs_f64();
                                let speed = ((downloaded - last_downloaded) as f64 / elapsed) as u64;
                                let progress = if total_size > 0 {
                                    (downloaded as f64 / total_size as f64) * 100.0
                                } else {
                                    0.0
                                };

                                // 更新任务状态
                                {
                                    let mut tasks = tasks.lock().unwrap();
                                    if let Some(task) = tasks.get_mut(task_id) {
                                        task.downloaded = downloaded;
                                        task.speed = speed;
                                        task.progress = progress;
                                    }
                                }

                                // 发送进度事件
                                let _ = app.emit(
                                    "download-progress",
                                    DownloadProgress {
                                        id: task_id.to_string(),
                                        status: DownloadStatus::Downloading,
                                        downloaded,
                                        total: total_size,
                                        speed,
                                        progress,
                                        filename: save_path
                                            .file_name()
                                            .unwrap_or_default()
                                            .to_string_lossy()
                                            .to_string(),
                                        save_path: save_path.to_string_lossy().to_string(),
                                        error: None,
                                    },
                                );

                                last_update = now;
                                last_downloaded = downloaded;
                            }
                        }
                        Some(Err(e)) => {
                            // 下载出错
                            let _ = std::fs::remove_file(save_path);
                            return Err(format!("下载数据失败: {}", e));
                        }
                        None => {
                            // 下载完成
                            break;
                        }
                    }
                }
            }
        }

        file.flush().map_err(|e| format!("保存文件失败: {}", e))?;
        
        // 下载完成后发送最终进度
        let final_progress = if total_size > 0 {
            (downloaded as f64 / total_size as f64) * 100.0
        } else {
            100.0
        };
        
        let _ = app.emit(
            "download-progress",
            DownloadProgress {
                id: task_id.to_string(),
                status: DownloadStatus::Downloading,
                downloaded,
                total: total_size,
                speed: 0,
                progress: final_progress,
                filename: save_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
                save_path: save_path.to_string_lossy().to_string(),
                error: None,
            },
        );
        
        Ok(())
    }

    /// 取消下载
    pub fn cancel_download(&self, id: &str) -> Result<(), String> {
        let mut tasks = self.tasks.lock().unwrap();
        let task = tasks.get_mut(id).ok_or("任务不存在")?;

        if !matches!(task.status, DownloadStatus::Downloading | DownloadStatus::Paused) {
            return Err("任务状态不允许取消".to_string());
        }

        *task.cancel_flag.lock().unwrap() = true;
        task.status = DownloadStatus::Cancelled;

        Ok(())
    }

    /// 获取任务进度
    pub fn get_progress(&self, id: &str) -> Option<DownloadProgress> {
        let tasks = self.tasks.lock().unwrap();
        tasks.get(id).map(|task| DownloadProgress {
            id: task.id.clone(),
            status: task.status.clone(),
            downloaded: task.downloaded,
            total: task.total,
            speed: task.speed,
            progress: task.progress,
            filename: task.filename.clone(),
            save_path: task.save_path.to_string_lossy().to_string(),
            error: task.error.clone(),
        })
    }

    /// 获取所有任务
    pub fn get_all_tasks(&self) -> Vec<DownloadProgress> {
        let tasks = self.tasks.lock().unwrap();
        tasks
            .values()
            .map(|task| DownloadProgress {
                id: task.id.clone(),
                status: task.status.clone(),
                downloaded: task.downloaded,
                total: task.total,
                speed: task.speed,
                progress: task.progress,
                filename: task.filename.clone(),
                save_path: task.save_path.to_string_lossy().to_string(),
                error: task.error.clone(),
            })
            .collect()
    }

    /// 删除任务
    pub fn remove_task(&self, id: &str) -> Result<(), String> {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.remove(id).ok_or("任务不存在")?;
        Ok(())
    }
}
