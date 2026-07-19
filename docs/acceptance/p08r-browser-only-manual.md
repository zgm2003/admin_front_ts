# P08R Browser-only 人工验收清单

## 基线与自动化证据

| 项目 | 值 |
| --- | --- |
| 后端 Browser-only revision | `006f1ff41c1f3564f99a2e3fc74389af87d246fb` |
| 前端 Task 8 revision | `60b68c42d2888c921290f33167414b8b6c5a9ec1` |
| 前端最终 cutover revision | 待 Task 9 提交后由 Task 10 填写 |
| Contract Bundle backend source | `5e6915c6d415daf0cc1fb53fe08767aff1ec77b6` |
| Contract Bundle manifest SHA256 | `d0a7649f4fe22ac5a095a108e7c8969fa1a626dea50fdf82f1fa19dfc0b8b1fa` |
| Frontend image ID / revision label | 待 Task 10 填写 |
| API image ID / revision label | 待 Task 10 填写 |
| Worker image ID / revision label | 待 Task 10 填写 |
| Reconciliation run ID / report hash | 待 Task 10 填写 |
| Session revocation count | 待 Task 10 填写 |
| Docker smoke commands | 待 Task 10 填写 |

## 用户功能验收

以下项目只能由用户在 Task 10 联合 Docker 切换后确认；Agent 不得预先勾选。

- [ ] 密码登录无需 captcha，并且回车可以提交。
- [ ] 邮箱发送验证码必须先通过 captcha。
- [ ] 手机号发送验证码必须先通过 captcha。
- [ ] Cookie refresh 能恢复登录态，logout 后受保护接口不再可用。
- [ ] 切换前创建的旧桌面会话已经失效，无法继续 refresh。
- [ ] 首次进入受保护路由正确，刷新后菜单选择可保持，直接输入受保护 URL 可恢复页面。
- [ ] 队列监控可以在页面内嵌打开，也可以通过同源独立窗口打开。
- [ ] 浏览器下载成功；外部支付跳转和允许的 HTTPS 外链行为正确。
- [ ] 站内通知可以点击跳转，实时连接断开后能够重连且不重复消费通知。
- [ ] 登录页和已登录 Layout 均能显示 online/offline 状态变化；401、500、契约错误不会伪装成离线。
- [ ] 菜单中不存在客户端版本入口，客户端版本路由无法访问。
- [ ] 从 v1 偏好迁移后，主题、语言和记住的账号仍能保持，历史桌面窗口字段不会恢复。

## 验收结论

- 用户：待填写
- 验收时间：待填写
- 结论：待用户明确确认
- 未通过项及复现步骤：待用户填写
