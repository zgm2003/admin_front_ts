# AI Chat MVP

当前对话页是最小 WebSocket MVP：

- 智能体列表：只使用启用的 chat 场景智能体。
- 会话列表：`ai_conversations`，按 `last_message_at` 展示和排序。
- 消息列表：`ai_messages`，当前只渲染 `content_type=text`。
- 发送：`POST /api/admin/v1/ai-conversations/:id/messages`。
- 回复：共享 `/api/admin/v1/realtime/ws`，按 `conversation_id + request_id` 分发。
- 会话切换：缓存按 `conversation_id` 管理，未完成回复不会因切换会话而丢失。

不在本 MVP 范围：运行监控、工具、RAG、附件、消息编辑、消息评价、取消生成。
