# 全场景发送验证码 Captcha 收口设计

## 目标

所有用户验证码发送动作必须先完成一次性滑块 captcha，覆盖：

- 登录：`login`
- 忘记密码：`forget`
- 绑定或更换手机号：`bind_phone`
- 绑定或更换邮箱：`bind_email`
- 验证码修改密码：`change_password`

手机号使用固定 mock 验证码时也不得绕过 captcha。

## API 契约

所有 `/auth/send-code` 请求必须携带：

```json
{
  "account": "user@example.com",
  "scene": "bind_email",
  "captcha_id": "captcha-id",
  "captcha_answer": { "x": 120, "y": 80 }
}
```

`scene=login` 额外必须携带 `login_type=email|phone`，并且账号格式必须与选择的登录方式一致。

后端在生成、缓存或发送验证码之前消费并校验 captcha。缺失、错误或过期的 captcha 一律拒绝；前端校验不能代替后端校验。

Captcha 没有独立的预校验接口。用户确认滑块后，由同一个 `POST /auth/send-code` 原子校验 proof 并发送验证码；只有接口成功才代表 captcha 通过。失败契约为：

- 缺少 proof：HTTP `400`、顶层 `code=100`、`error.code=captcha.required`。
- proof 错误、过期或已消费：HTTP `400`、顶层 `code=100`、`error.code=captcha.invalid_or_expired`。
- 失败时不得生成、缓存或发送邮箱/手机号验证码。
- challenge 一次性消费，失败后客户端必须获取新 challenge，不能重放旧 proof。

## 前端设计

共享 `SendCode` 组件统一负责非登录场景的完整状态机：

1. 检查账号与外部禁用状态。
2. 获取 captcha challenge 并打开共享滑块浮层。
3. 用户完成滑块后提交带 captcha proof 的发送请求。
4. 仅在发送成功后显示成功提示并启动倒计时。
5. 发送成功后关闭浮层并清理 challenge。
6. 发送失败后保持浮层打开、展示后端错误并自动获取新 challenge；不得启动倒计时。

登录验证码继续由 `useLoginForm` 编排，因为它还需要表单字段校验和显式 `login_type`；其请求契约与其他场景保持一致。

忘记密码界面的自定义发送按钮改为复用 `SendCode`，删除独立的裸请求与重复倒计时。个人资料中的手机号、邮箱和验证码改密码入口已经使用 `SendCode`，因此自动获得同一 captcha 流程。

`UserSendCodeParams` 改为判别联合类型，所有场景在编译期都必须提供 `captcha_id` 与 `captcha_answer`；登录场景额外要求 `login_type`。

## 校验与错误处理

- `bind_phone` 只允许合法手机号。
- `bind_email` 只允许合法邮箱。
- `forget`、`change_password` 允许合法邮箱或手机号。
- `login` 由登录表单按选中类型校验。
- captcha 加载失败时不发送验证码并保留可重试入口。
- 请求失败时不启动倒计时、不关闭浮层，并自动替换已消费的 challenge。

## 测试与验收

- 后端表格测试覆盖五个 scene 缺少 captcha 均被拒绝。
- 后端测试覆盖 captcha 失败不写验证码缓存，captcha 成功后才发送。
- 前端测试保证不存在不带 captcha proof 的 `UsersApi.sendCode` 调用。
- 前端测试覆盖共享组件的打开 captcha、完成后发送、成功后倒计时以及失败不倒计时。
- 前端测试分别覆盖登录与共享 SendCode 的失败路径：浮层保留、旧 challenge 清除、新 challenge 获取、发送成功回调不执行。
- Docker 重建后，在登录、忘记密码、改手机号、改邮箱、验证码改密码入口逐一确认先出现滑块；用户确认滑块前无 `/auth/send-code` 请求，服务端返回成功前不得启动发送倒计时。

## 非目标

- 不改变验证码校验/消费接口。
- 不改变密码验证方式本身。
- 不新增短信供应商；手机号仍可使用现有 mock 验证码实现。
