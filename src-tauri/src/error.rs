use serde::Serialize;
use std::fmt;

/// 统一错误类型
#[derive(Debug, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    /// 任务已存在
    TaskExists(String),
    /// 任务不存在
    TaskNotFound(String),
    /// 任务状态不允许该操作
    InvalidState(String),
    /// 下载已取消
    Cancelled,
    /// 请求超时
    Timeout,
    /// 网络错误
    Network(String),
    /// HTTP 状态码错误
    Http(String),
    /// IO 错误（上下文 + 错误信息）
    Io(String, String),
    /// 通用错误
    #[allow(dead_code)]
    Other(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::TaskExists(id) => write!(f, "任务 ID 已存在: {}", id),
            Self::TaskNotFound(id) => write!(f, "任务不存在: {}", id),
            Self::InvalidState(msg) => write!(f, "{}", msg),
            Self::Cancelled => write!(f, "下载已取消"),
            Self::Timeout => write!(f, "请求超时"),
            Self::Network(e) => write!(f, "网络错误: {}", e),
            Self::Http(status) => write!(f, "HTTP 错误: {}", status),
            Self::Io(ctx, e) => write!(f, "{}: {}", ctx, e),
            Self::Other(msg) => write!(f, "{}", msg),
        }
    }
}

impl AppError {
    /// 从 reqwest::Error 构造网络错误
    pub fn network(e: reqwest::Error) -> Self {
        Self::Network(e.to_string())
    }

    /// 从 IO 错误构造（带上下文）
    pub fn io(context: impl Into<String>, e: std::io::Error) -> Self {
        Self::Io(context.into(), e.to_string())
    }
}

// Tauri invoke 直接返回 AppError（通过 Serialize 自动转换）
// Tauri 2.x 对实现了 Serialize 的类型自动实现 Into<InvokeError>
