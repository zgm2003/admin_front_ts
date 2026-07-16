# 智澜后台管理系统 · 前端

基于 Vue 3 + TypeScript + Vite + Element Plus 构建的企业级后台管理系统前端。

## 技术栈

- **框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **UI 组件库**：Element Plus
- **状态管理**：Pinia
- **路由**：Vue Router
- **国际化**：Vue I18n
- **HTTP 请求**：Axios

## 本地开发

当前 runtime env 由 Vite `.env.*` 文件提供，`VITE_GO_API_BASE_URL` 是必填项。HTTP client 会在请求 path 前拼接 `/api/admin/v1`，所以这里填写 Go API origin，不要带 `/api/admin/v1` 后缀。

```env
# .env.development 默认值
VITE_GO_API_BASE_URL=http://localhost:8080
# 可选显式覆盖；不填时会从 VITE_GO_API_BASE_URL 推导 /api/admin/v1/realtime/ws
VITE_WEB_SOCKET_URL=ws://localhost:8080/api/admin/v1/realtime/ws
VITE_PLATFORM=admin
```

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
src/
├── api/           # API 接口封装
├── assets/        # 静态资源
├── components/    # 公共组件
├── hooks/         # 组合式函数
├── i18n/          # 国际化配置
├── router/        # 路由配置
├── store/         # Pinia 状态管理
├── utils/         # 工具函数
└── views/         # 页面组件
    ├── Layout/    # 布局框架
    ├── Login/     # 登录页
    ├── Main/      # 业务页面
    └── Error/     # 错误页面
```

## 生产部署

前端长期部署 runbook 只维护在 root repo，避免 `admin_front_ts` 复制第二份生产真相：

```text
E:/admin_go/docs/deployment/frontend-github-actions-scp.md
E:/admin_go/docs/deployment/docker-first-backend.md
```

通用生产边界：

```text
<frontend-domain>  Vue 静态站点
<api-domain>       Go REST API 后端入口
HTTP API           https://<api-domain>/api/admin/v1/...
Realtime WS        wss://<api-domain>/api/admin/v1/realtime/ws
```

GitHub Actions 生产构建仍必须从 Repository secrets / variables 注入 `VITE_GO_API_BASE_URL` 和 `VITE_WEB_SOCKET_URL`；仓库里的 `.env.production` 同步当前线上默认值，供手工/本地 production build 使用，不准改回 `example.com` 占位。

生产前端 Nginx 至少需要保证 Vue history fallback：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

`VITE_WEB_SOCKET_URL` 默认指向后端域名 `<api-domain>`。如果临时改成前端同域地址，前端站点必须把 `/api/admin/v1/realtime/ws` 精确反代到 Go 后端；不要让它落到 Vue history fallback。

## Docker runtime

The production-style frontend image uses pinned Node and unprivileged Nginx stages. Local full-stack Compose publishes Nginx at `http://localhost:5173`; Nginx proxies `/api/` and WebSocket upgrades to the Go API service and serves Vue history fallback for application routes.

```powershell
docker build -t admin-frontend:local .
docker run --rm -p 127.0.0.1:5173:8080 admin-frontend:local
```

`VITE_GO_API_BASE_URL`, `VITE_WEB_SOCKET_URL`, and `VITE_PLATFORM` are public build arguments. Production builds must provide their real HTTPS/WSS origin; secrets must never be passed as frontend build arguments.

不要再使用旧 `/api/admin/AiChat/stream`、`127.0.0.1:8788`、`/wss` 或 `/api/admin/WebSocket/bind` 文档示例。AI conversation events 走 Go WebSocket envelope；取消走 REST `POST /api/admin/v1/ai-conversations/:id/messages/cancel`。

## 相关项目

- 后端服务：[admin_back](../admin_back)
- 展示博客：[admin_blog](https://gitee.com/zgm2003/admin_blog)
