# AI Chat 功能文档

## 当前已实现功能

### 1. 会话管理
| 功能 | 描述 | 文件位置 |
|------|------|----------|
| ✅ 会话列表 | 分页加载，支持无限滚动 | `useConversations.ts` |
| ✅ 新建会话 | 选择智能体后发送首条消息自动创建 | `index.vue` |
| ✅ 选择会话 | 点击切换，自动加载历史消息 | `index.vue` |
| ✅ 重命名会话 | 弹窗编辑标题 | `useConversations.ts` |
| ✅ 删除会话 | 确认后删除 | `useConversations.ts` |
| ✅ 归档/取消归档 | 会话归档管理 | `useConversations.ts` |
| ✅ 归档列表切换 | 查看已归档会话 | `useConversations.ts` |
| ✅ 自动生成标题 | 首次对话完成后自动获取AI生成的标题 | `useStreamChat.ts` |
| ✅ 按时间分组 | 今天/昨天/近一周/近一月/更早 | `ConversationDrawer` |
| ✅ 会话搜索 | 搜索会话标题，300ms 防抖 | `useConversations.ts`, `ConversationDrawer` |

### 2. 消息功能
| 功能 | 描述 | 文件位置 |
|------|------|----------|
| ✅ 消息列表 | 分页加载，支持上滑加载更多历史 | `useMessages.ts` |
| ✅ 发送消息 | 文本输入，支持 Enter 发送，Shift+Enter 换行 | `MessageInput/index.vue` |
| ✅ 流式输出 | SSE 实时显示 AI 回复，节流渲染（50ms flush + 100ms scroll） | `useStreamChat.ts` |
| ✅ 停止生成 | 流式输出中点击停止，调用后端 cancel 接口 | `useStreamChat.ts` |
| ✅ 复制消息 | 一键复制消息内容 | `useMessages.ts` |
| ✅ 删除消息 | 确认后删除单条消息 | `useMessages.ts` |
| ✅ 重新生成 | 删除 AI 回复并重新请求（仅最后一条 AI 消息） | `useStreamChat.ts` |
| ✅ 消息反馈 | 点赞/点踩，再次点击取消 | `useMessages.ts` |
| ✅ 图片附件 | 支持上传/粘贴/拖拽图片，最多5张，COS 云存储 | `MessageInput/index.vue` |
| ✅ 图片预览 | 点击消息中的图片全屏预览（el-image-viewer） | `MessageList/index.vue` |
| ✅ Markdown 渲染 | AI 回复支持代码高亮、表格、列表等 | `MarkdownRenderer` 组件 |
| ✅ 编辑消息 | 编辑已发送的用户消息，删除后续消息并重新生成 | `useStreamChat.ts`, `MessageList/index.vue` |
| ✅ 代码复制 | 代码块一键复制 | `MarkdownRenderer` 组件 |

### 3. 智能体
| 功能 | 描述 | 文件位置 |
|------|------|----------|
| ✅ 智能体列表 | 加载可用智能体，左侧面板展示 | `useAgents.ts` |
| ✅ 智能体搜索 | 远程搜索过滤 | `useAgents.ts` |
| ✅ 默认选中 | 自动选中第一个智能体，支持 localStorage 持久化 | `useAgents.ts` |
| ✅ 图片输入 | 前端允许上传图片；模型不做多模态配置，读不了就让模型调用自然报错 | `MessageInput` |

### 4. 智能体切换（断点续连）
| 功能 | 描述 | 文件位置 |
|------|------|----------|
| ✅ 切换不中断 SSE | 切换智能体时不取消正在进行的流式输出 | `useChatSessionManager.ts` |
| ✅ 会话状态快照 | 挂起时保存消息、会话列表、流式状态到 session | `useChatSessionManager.ts` |
| ✅ 后台流式写入 | 非活跃 agent 的 SSE 数据写入后台 session 而非 UI | `useStreamChat.ts` |
| ✅ 切回即恢复 | 切回 agent 时从 session 恢复完整 UI 状态 | `index.vue` |
| ✅ LRU 缓存淘汰 | 最多缓存 5 个 agent session，淘汰非流式的最久未访问 | `useChatSessionManager.ts` |
| ✅ 多流并行 | 多个 agent 可同时进行独立的流式输出 | `useStreamChat.ts` |
| ✅ 竞态保护 | 异步加载完成后检查是否仍为当前 agent | `index.vue` |

### 5. UI/UX
| 功能 | 描述 | 文件位置 |
|------|------|----------|
| ✅ 响应式布局 | 移动端适配，左右分栏切换，移动端返回按钮 | `index.vue` |
| ✅ 自动滚动 | 新消息/流式输出自动滚动到底部 | `useMessages.ts` |
| ✅ 加载状态 | 各种 loading 状态展示（智能体切换、消息加载等） | 各组件 |
| ✅ 国际化 | 中英文支持 | i18n |
| ✅ 欢迎界面 | 选中智能体但无会话时显示头像+名称+提示 | `index.vue` |
| ✅ 历史抽屉 | 右侧抽屉展示历史会话，支持分组/操作/无限滚动 | `ConversationDrawer` |
| ✅ 流式打字动画 | 三点跳动动画指示 AI 正在输出 | `MessageList/index.vue` |
| ✅ 拖拽上传 | 拖拽图片到输入区域上传 | `MessageInput/index.vue` |

---

## 对标 ChatGPT 缺少的功能

### 🔴 高优先级（核心体验）

| 功能 | 描述 | 难度 | 建议 |
|------|------|------|------|
| ✅ 编辑消息 | 编辑已发送的用户消息并重新生成 | ⭐⭐⭐ | 已实现：编辑 + 删除后续 + 重新流式生成 |
| ❌ 分支对话 | 同一消息多次重新生成，可切换查看 | ⭐⭐⭐⭐ | 需要树形消息结构 |
| ❌ 消息搜索 | 搜索历史消息内容 | ⭐⭐ | 后端全文搜索 |
| ✅ 会话搜索 | 搜索会话标题 | ⭐ | 已实现：后端 LIKE 查询 + 前端防抖搜索 |

### � 中优先级（增强体验）

| 功能 | 描述 | 难度 | 建议 |
|------|------|------|------|
| ❌ LaTeX 公式 | 数学公式渲染 | ⭐⭐ | 使用 KaTeX |
| ❌ 文件上传 | 支持 PDF、Word 等文档 | ⭐⭐⭐ | 需要后端解析 |
| ❌ 语音输入 | 语音转文字 | ⭐⭐⭐ | Web Speech API 或第三方服务 |
| ❌ 语音播放 | TTS 朗读回复 | ⭐⭐⭐ | 后端已有阿里云 TTS，需前端播放器 |
| ❌ 快捷指令 | / 命令快速输入 | ⭐⭐ | 输入框监听 / 触发 |
| ❌ 消息引用 | 引用之前的消息 | ⭐⭐ | UI 交互 + 消息关联 |

### 🟢 低优先级（锦上添花）

| 功能 | 描述 | 难度 | 建议 |
|------|------|------|------|
| ❌ 会话分组/文件夹 | 会话分类管理 | ⭐⭐ | 新增分组表 |
| ❌ 会话置顶 | 重要会话置顶 | ⭐ | 加 pinned 字段 |
| ❌ 会话分享 | 生成分享链接 | ⭐⭐⭐ | 需要权限控制 |
| ❌ 导出会话 | 导出为 Markdown/PDF | ⭐⭐ | 前端生成 |
| ❌ 快捷键 | Ctrl+Enter 发送等 | ⭐ | 键盘事件监听 |
| ❌ 消息时间戳 | 显示发送时间 | ⭐ | 简单展示 |
| ❌ 多模型切换 | 同一会话切换模型 | ⭐⭐ | 需要后端支持 |

---

## 技术架构

```
chat/
├── index.vue                      # 主组件（状态编排、agent 切换、session 恢复）
├── FEATURES.md                    # 本文档
├── composables/
│   ├── index.ts                   # 统一导出
│   ├── types.ts                   # 类型定义（Conversation, Message, Agent, StreamCallbacks）
│   ├── useConversations.ts        # 会话 CRUD + 分页 + 归档
│   ├── useMessages.ts             # 消息 CRUD + 分页 + 滚动
│   ├── useAgents.ts               # 智能体列表 + 选择 + localStorage 持久化
│   ├── useChatSessionManager.ts   # 多 agent 会话状态管理（LRU 缓存）
│   └── useStreamChat.ts           # 流式聊天核心（SSE 回调、节流渲染、多 agent 并行）
└── components/
    ├── AgentList/                 # 左侧智能体列表面板
    ├── ConversationDrawer/        # 右侧历史会话抽屉（按时间分组）
    ├── ConversationList/          # 会话列表组件（备用，Drawer 内已内联）
    ├── MessageList/               # 消息列表（气泡、附件、反馈、Markdown）
    └── MessageInput/              # 输入框（文本、图片上传、拖拽、粘贴）
```

### 断点续连架构（v2）

```
前端                                          后端
┌──────────────────────────────┐             ┌─────────────────┐
│  index.vue                   │             │  AiChatModule   │
│  ┌────────────────────────┐  │             │                 │
│  │ useChatSessionManager  │  │   SSE       │                 │
│  │  sessions: Map<agentId>│  │             │                 │
│  │  LRU(5) + 快照/恢复    │  │             │                 │
│  └────────────────────────┘  │             │                 │
│           ↕ 读写              │             │                 │
│  ┌────────────────────────┐  │             │                 │
│  │ useStreamChat          │  │             │                 │
│  │                        │  │             │                 │
│  │  send()  ──────────────┼──┼────────────►│  stream()       │
│  │  stop()  ──────────────┼──┼────────────►│  cancel()       │
│  │                        │  │             │                 │
│  │  onContent(delta)     ◄┼──┼─────────────┤  content event  │
│  │    ├─ 活跃 agent → UI  │  │             │                 │
│  │    └─ 后台 agent → ses │  │             │                 │
│  │  onDone(data)         ◄┼──┼─────────────┤  done event     │
│  └────────────────────────┘  │             │                 │
│                              │             └─────────────────┘
│  切换 agent 流程:             │                     │
│  1. suspendCurrentAgent()    │                     ▼
│     → 快照 UI → session      │             ┌─────────────────┐
│  2. selectAgent(new)         │             │    Database     │
│  3. resumeAgent(new)         │             │  ai_runs        │
│     → session → UI           │             │  ai_messages    │
│  4. SSE 连接不中断            │             └─────────────────┘
└──────────────────────────────┘
```

**核心机制：**
1. 每个 agent 有独立的 `ChatSession`，存储消息、会话列表、流式状态
2. 切换 agent 时 `suspend` 保存当前 UI 到 session，`resume` 从 session 恢复 UI
3. SSE 回调通过 `isActiveAgent()` 判断写入目标：活跃 → UI refs，后台 → session 对象
4. 节流渲染：delta 先写入 `deltaBuffer`，50ms 定时 flush，滚动 100ms 节流
5. LRU 淘汰：最多 5 个 session，淘汰时跳过正在流式输出的 session

---

## 代码质量

- **TypeScript 零错误**：所有 composables 和组件无 TS 诊断问题
- **类型安全**：统一类型定义在 `types.ts`，API 层类型从 `@/api/ai/chat` 重导出
- **关注点分离**：composables 各司其职，index.vue 只做状态编排
- **响应式安全**：session 快照使用浅拷贝避免引用污染
- **竞态保护**：异步操作完成后检查 `selectedAgentId` 是否仍匹配
- **资源清理**：`onUnmounted` 清理所有定时器和 RAF

---

## 更新日志

### 2026-02-12
- 新增：编辑消息 — 编辑用户消息后删除后续消息并重新生成 AI 回复
- 新增：会话搜索 — 后端 LIKE 查询 + 前端 300ms 防抖搜索
- 新增：`AiMessageApi.editContent` — 编辑消息内容接口
- 新增：`editAndResend()` — 编辑后重新流式生成
- 新增：`MessageList` 内联编辑模式（textarea + Enter 确认 + Esc 取消）

### 2026-02-11
- 新增：断点续连 v2 — 切换智能体不中断 SSE 流式输出
- 新增：`useChatSessionManager` — 多 agent 会话状态 LRU 缓存管理
- 重构：`useStreamChat` — 回调写入目标按 agent 活跃状态分流
- 重构：`index.vue` — `handleSelectAgent` 改为 suspend/resume 模式
- 删除：`cancelOnSwitch` — 不再切换时取消流式输出

### 2026-01-13
- 重构：移除断线重连/续传机制，简化为"切换即取消"
- 删除：`AiStreamCacheService`（Redis 缓存）
- 删除：`resume`、`resumeStream` 接口
- 优化：取消时保存已生成的部分内容到数据库
- 优化：代码量减少约 50%

### 2026-01-12
- 新增：停止生成功能（前后端完整实现）
- 重构：将 980 行单文件拆分为 composables 架构
- 优化：流式回调工厂函数，减少重复代码
- 修复：首次对话自动获取标题功能
