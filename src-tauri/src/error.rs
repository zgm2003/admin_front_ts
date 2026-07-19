use serde::Serialize;
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct SafeError {
    pub kind: &'static str,
    pub message: &'static str,
}

impl SafeError {
    pub const fn credential_store() -> Self {
        Self {
            kind: "credential_store",
            message: "系统安全凭证存储不可用",
        }
    }

    pub const fn credential_missing() -> Self {
        Self {
            kind: "credential_missing",
            message: "登录凭证不存在，请重新登录",
        }
    }

    pub const fn policy() -> Self {
        Self {
            kind: "policy",
            message: "请求目标不符合安全策略",
        }
    }

    pub const fn timeout() -> Self {
        Self {
            kind: "timeout",
            message: "认证服务请求超时",
        }
    }

    pub const fn network() -> Self {
        Self {
            kind: "network",
            message: "无法连接认证服务",
        }
    }

    pub const fn response_contract() -> Self {
        Self {
            kind: "response_contract",
            message: "认证服务响应不符合正式契约",
        }
    }

    pub const fn authentication() -> Self {
        Self {
            kind: "authentication",
            message: "登录凭证已失效，请重新登录",
        }
    }

    pub const fn server() -> Self {
        Self {
            kind: "server",
            message: "认证服务暂时不可用",
        }
    }

    pub const fn download_cancelled() -> Self {
        Self {
            kind: "download_cancelled",
            message: "已取消下载",
        }
    }

    pub const fn download_policy() -> Self {
        Self {
            kind: "download_policy",
            message: "下载请求不符合安全策略",
        }
    }

    pub const fn download_timeout() -> Self {
        Self {
            kind: "download_timeout",
            message: "下载请求超时",
        }
    }

    pub const fn download_network() -> Self {
        Self {
            kind: "download_network",
            message: "无法连接下载服务",
        }
    }

    pub const fn download_response() -> Self {
        Self {
            kind: "download_response",
            message: "下载服务响应不符合安全要求",
        }
    }

    pub const fn download_filesystem() -> Self {
        Self {
            kind: "download_filesystem",
            message: "无法安全保存下载文件",
        }
    }

    pub const fn download_task_missing() -> Self {
        Self {
            kind: "download_task_missing",
            message: "下载任务不存在",
        }
    }

    pub const fn download_task_state() -> Self {
        Self {
            kind: "download_task_state",
            message: "下载任务状态不允许此操作",
        }
    }
}

impl fmt::Display for SafeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.message)
    }
}

impl std::error::Error for SafeError {}
