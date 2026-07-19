# P08R Browser-only 人工验收清单

## 基线与自动化证据

| 项目 | 值 |
| --- | --- |
| 后端 Browser-only revision | `9cce01072c5713983f8646c69d30e8bc61c826d2` |
| 前端 Task 8 revision | `60b68c42d2888c921290f33167414b8b6c5a9ec1` |
| 前端最终 cutover revision | `39fe04755a4fc76a83ab385a961cb9ccbbb08f92` |
| Contract Bundle backend source | `5e6915c6d415daf0cc1fb53fe08767aff1ec77b6` |
| Contract Bundle manifest SHA256 | `d0a7649f4fe22ac5a095a108e7c8969fa1a626dea50fdf82f1fa19dfc0b8b1fa` |
| Frontend image ID / revision label | `sha256:cffc07471498bcf60239029c0ea54f411f639aeb27c3250d714ad9fb730558f2` / `39fe04755a4fc76a83ab385a961cb9ccbbb08f92` |
| API image ID / revision label | `sha256:27e4ff63e0c9b74805478faaeef0350f4366a442a34865b72e9ab6642b54164d` / `9cce01072c5713983f8646c69d30e8bc61c826d2` |
| Worker image ID / revision label | `sha256:27e4ff63e0c9b74805478faaeef0350f4366a442a34865b72e9ab6642b54164d` / `9cce01072c5713983f8646c69d30e8bc61c826d2` |
| Reconciliation run ID / script hash | `13` / `e66c16c5a6bab94f9bdeba321ef3c7929dab9e94f1a2153da9955d0d97c6a64f` |
| Session revocation count | 首次切换 `1`；修复后复核 active session `0`、Token DB2 `1 -> 0` |
| Docker smoke commands | `verify-retirement.ps1`、Docker API one-time smoke（SHA256 `e8d8214d3d1e7b8632d9c31014f1a9e9b0e643fd90b90249a79ecc262640c209`）、`check-admin-contract.ps1`、`docker-platform.ps1 status`，全部通过 |

## 用户功能验收

以下项目只能由用户在 Task 10 联合 Docker 切换后确认；Agent 不得预先勾选。

- [x] 密码登录无需 captcha，并且回车可以提交。
- [x] 邮箱发送验证码必须先通过 captcha。
- [x] 手机号发送验证码必须先通过 captcha。
- [x] Cookie refresh 能恢复登录态，logout 后受保护接口不再可用。
- [x] 切换前创建的旧桌面会话已经失效，无法继续 refresh。
- [x] 首次进入受保护路由正确，刷新后菜单选择可保持，直接输入受保护 URL 可恢复页面。
- [x] 队列监控可以在页面内嵌打开，也可以通过同源独立窗口打开。
- [x] 浏览器下载成功；外部支付跳转和允许的 HTTPS 外链行为正确。
- [x] 站内通知可以点击跳转，实时连接断开后能够重连且不重复消费通知。
- [x] 登录页和已登录 Layout 均能显示 online/offline 状态变化；401、500、契约错误不会伪装成离线。
- [x] 菜单中不存在客户端版本入口，客户端版本路由无法访问。
- [x] 从 v1 偏好迁移后，主题、语言和记住的账号仍能保持，历史桌面窗口字段不会恢复。

## 验收结论

- 用户：项目所有者（当前会话明确确认）
- 验收时间：2026-07-20 05:35:17 +08:00
- 结论：通过
- 未通过项及复现步骤：无
