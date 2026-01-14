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

### Nginx 配置示例

```nginx
server {
    listen 80;
    listen 443 ssl;
    listen 443 quic;
    listen [::]:443 ssl;
    listen [::]:443 quic;
    http2 on;
    listen [::]:80;
    
    server_name your-domain.com;
    
    # 前端项目入口
    index index.html;
    root /www/wwwroot/admin_front_ts/dist;

    # SSL 配置
    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS + HTTP/3
    add_header Strict-Transport-Security "max-age=31536000";
    add_header Alt-Svc 'h3=":443"; h3-29=":443"';
    
    error_page 497 https://$host$request_uri;
    error_page 404 /404.html;

    # ========== 流式 API 代理（AI 聊天等） ==========
    location /api/admin/AiChat/stream {
        proxy_pass http://127.0.0.1:8788;
        
        # 流式响应关键配置
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding on;
        
        # 传递客户端信息
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置（适配长连接）
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # ========== SPA 核心配置 ==========
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # 禁止访问敏感文件
    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env|\.svn|LICENSE|README.md) {
        return 404;
    }

    # 静态资源缓存
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$ {
        expires 30d;
        access_log off;
    }

    location ~ .*\.(js|css)?$ {
        expires 12h;
        access_log off;
    }

    access_log  /www/wwwlogs/frontend.log;
    error_log   /www/wwwlogs/frontend.error.log;
}
```

### 部署步骤

1. 构建项目：`npm run build`
2. 上传 `dist` 目录到服务器
3. 配置 Nginx 指向 `dist` 目录
4. 重载 Nginx：`nginx -s reload`

## 相关项目

- 后端服务：[admin_back](../admin_back)
- 展示博客：[admin_blog](https://gitee.com/zgm2003/admin_blog)
