# 前端共享组件边界治理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清除页面层对 `AppDialog`、`AppTable`、`Search` 已有默认能力的重复实现和私有 DOM 穿透，让布局、响应式与默认行为只由共享组件维护，同时保持现有业务 UI 与交互不变。

**Architecture:** 按“共享组件补公开契约 -> 页面迁移 -> 机械清理 -> 架构守卫”顺序串行执行。共享组件只增加可复用能力，不增加页面专属 `variant`；页面只声明业务差异；质量脚本基于 SFC 结构和 TypeScript AST 检查真实边界违规，不禁止合理的专用 Element Plus 表格。

**Tech Stack:** Vue 3、TypeScript、Element Plus、Vitest、Vue Test Utils。

---

## 执行边界

- 只修改 `E:/admin/admin_front_ts`，不修改后端、数据库、接口、RBAC、Docker 配置或生成契约。
- 直接在当前唯一 checkout 上串行执行，不创建 worktree，避免再次触发 `ADMIN_DEV_SINGLE_CHECKOUT_REQUIRED`。
- 不做视觉重设计，不改变业务文案、权限、请求、表单校验、弹窗生命周期或数据表列含义。
- 不新增 `TableActionGroup`，不增加页面专属 `AppDialog variant`，不增加没有实际需求的 `mobileHeight`。
- 可以按任务创建本地提交，但不得 push；每次提交前只暂存本任务文件并执行 `git diff --cached --check`。
- 自动验证只运行本计划列出的定向 Vitest、`npm run lint:quality`、`git diff --check`。完整 `typecheck/test/build` 留给用户手动执行。
- 五个任务存在文件交叠，必须按顺序执行，不并行修改。

## 审查基线

| 类别 | 数量 | 处置 |
| --- | ---: | --- |
| 共享组件边界违规 | 7 组 | 3 个原生 `el-dialog`、3 个 `AppDialog` 私有 DOM 穿透、1 个 `AppTable` 私有 DOM 穿透全部清零 |
| 操作列重复布局 | 4 组 | 删除页面 wrapper/CSS，使用 `AppTable` 默认列居中与 Element Plus 按钮间距 |
| `AppTable` 外层重复滚动 | 18 处 | 直接父容器改为 `overflow: hidden`，滚动只归 `AppTable` 所有 |
| 纯默认值重复 | 101 处 | 删除 6 个表格高度、26 个 row key、14 个有效 tooltip、29 个移动宽度、3 个 append、5 个 destroy、12 个搜索宽度、5 个 clearable、1 个 collapse count |
| 无效 tooltip | 3 处 | 补足列 `minWidth`，让 tooltip 条件真正生效 |

以下是明确允许的例外，不纳入迁移：

- 32 个原生 `el-table`：22 个组件文档/演示，10 个弹窗结果表、统计矩阵或权限树。
- 知识库卡片侧栏中的原生 `el-pagination`。
- AI Chat 自己拥有的 `.toolbar-left` 等局部类；守卫只禁止页面通过 `:deep(...)` 穿透共享组件私有类。

### Task 1：补齐共享组件公开契约

**Files:**
- Modify: `src/components/AppDialog/src/dialog.ts`
- Modify: `src/components/AppDialog/src/index.vue`
- Modify: `src/components/Table/src/index.vue`
- Modify: `tests/component/dialog/AppDialog.test.ts`
- Modify: `tests/component/accessibility/dialog.test.ts`
- Modify: `tests/component/accessibility/table-form.test.ts`

- [ ] **Step 1：先写失败测试固定新契约**

在 `AppDialog.test.ts` 覆盖：

- `showHeader=false` 时不渲染可见 header，但 `ariaLabel` 或 `title` 仍为对话框提供可访问名称。
- `headerPadding`、`footerPadding` 接受 `AppDialogSize`，仅在显式传入时覆盖对应区域。
- 未传新 props 时保持 Element Plus 当前默认 padding。
- 消费者传入的 `class`、`style`、`data-*`、`@closed` 不被内部样式和焦点恢复逻辑吞掉。

在 `table-form.test.ts` 增加工具栏窄屏契约：左右槽仍存在、操作按钮不溢出，布局责任在 `AppTable` 内而不是页面 CSS。

- [ ] **Step 2：运行定向测试并确认 RED**

```powershell
npx vitest run tests/component/dialog/AppDialog.test.ts tests/component/accessibility/dialog.test.ts tests/component/accessibility/table-form.test.ts
```

Expected: 新 props 和窄屏工具栏断言失败；既有弹窗焦点与表格可访问性测试仍给出可识别结果。

- [ ] **Step 3：实现最小公开能力**

`AppDialog` 增加且只增加：

```ts
showHeader?: boolean       // default: true
headerPadding?: AppDialogSize
footerPadding?: AppDialogSize
```

实现要求：

- 将 `showHeader` 传给 Element Plus；隐藏 header 时把 `ariaLabel || title` 绑定为对话框可访问名称。
- padding 使用 `toCssLength` 和组件内部受控样式，仅显式传值时覆盖；页面不得再写 `.el-dialog__header/body/footer`。
- 合并而不是覆盖外部 `class/style/attrs`，继续保留 `fullscreen` 过滤、`@closed` 焦点恢复、现有 body 滚动逻辑。
- `AppTable` 在 `768px` 以下自行让 toolbar 纵向排列/换行，左右区域宽度稳定，右侧命令保持右对齐；桌面布局不变。

- [ ] **Step 4：运行定向测试并确认 GREEN**

```powershell
npx vitest run tests/component/dialog/AppDialog.test.ts tests/component/accessibility/dialog.test.ts tests/component/accessibility/table-form.test.ts
git diff --check
```

- [ ] **Step 5：创建本地提交**

```powershell
git add -- src/components/AppDialog/src/dialog.ts src/components/AppDialog/src/index.vue src/components/Table/src/index.vue tests/component/dialog/AppDialog.test.ts tests/component/accessibility/dialog.test.ts tests/component/accessibility/table-form.test.ts
git diff --cached --check
git commit -m "refactor(ui): expose shared dialog layout controls"
```

### Task 2：迁移弹窗并清除私有 DOM 穿透

**Files:**
- Modify: `src/views/Main/payment/redeem-codes/components/RedeemCodeGenerateDialog.vue`
- Modify: `src/views/Main/personal/wallet/components/RedeemCodeDialog.vue`
- Modify: `src/views/Main/system/mail/components/MailTemplatePanel.vue`
- Modify: `src/views/Layout/components/Header/components/SearchDialog.vue`
- Modify: `src/views/Main/ai/providers/components/ProviderFormDialog.vue`
- Modify: `src/views/Main/ai/providers/components/ProviderFormDialog.styles.css`
- Modify: `src/views/Login/components/ForgotPasswordDialog.vue`
- Modify: `src/views/Login/components/ForgotPasswordDialog.styles.scss`
- Modify: `tests/component/payment/RedeemCodePage.test.ts`
- Modify: `tests/component/payment/WalletRedeemCodeDialog.test.ts`
- Modify: `tests/component/system/mail-diagnostics-lifecycle.test.ts`
- Modify: `tests/component/login/LoginForm.test.ts`

- [ ] **Step 1：补充迁移前行为测试**

测试必须固定以下不变量：

- 兑换码生成/兑换提交中仍禁止遮罩关闭、Escape 和关闭按钮；关闭后输入与错误状态按原逻辑清理。
- 邮件模板编辑的 `@closed`、保存 loading 和表单重置时机不变。
- 忘记密码对话框关闭后仍恢复焦点，不出现双重 header padding。
- Header 搜索无可见标题栏，但有可访问名称；关闭与结果清理行为不变。

- [ ] **Step 2：运行迁移定向测试并记录基线**

```powershell
npx vitest run tests/component/payment/RedeemCodePage.test.ts tests/component/payment/WalletRedeemCodeDialog.test.ts tests/component/system/mail-diagnostics-lifecycle.test.ts tests/component/login/LoginForm.test.ts tests/component/accessibility/dialog.test.ts
```

- [ ] **Step 3：把 3 个原生弹窗迁到 `AppDialog`**

逐项映射现有 `v-model`、title、桌面 width、busy 关闭约束、`before-close`/`closed` 事件与 footer slot。省略 `AppDialog` 已默认的 `appendToBody`、`destroyOnClose` 和移动宽度，不重写业务状态机。

- [ ] **Step 4：用公开 props 替代 3 处穿透**

- `SearchDialog.vue`：使用 `:show-header="false"` 和 `aria-label`，删除 `.el-dialog__header/body` 穿透。
- `ProviderFormDialog.vue`：表面样式放在 `AppDialog` 根 class；header/footer 间距使用公开 padding props，删除私有选择器。
- `ForgotPasswordDialog.vue`：保留自定义 `#header`，使用 `header-padding="0"` 消除双重 padding；删除 `.el-dialog__*` 穿透。

- [ ] **Step 5：验证迁移结果**

```powershell
npx vitest run tests/component/payment/RedeemCodePage.test.ts tests/component/payment/WalletRedeemCodeDialog.test.ts tests/component/system/mail-diagnostics-lifecycle.test.ts tests/component/login/LoginForm.test.ts tests/component/accessibility/dialog.test.ts
rg -n --glob "*.vue" "<el-dialog" src/views
rg -n --glob "*.{vue,css,scss}" "el-dialog__(header|body|footer|headerbtn)" src/views
git diff --check
```

Expected: 测试通过；两个 `rg` 均无输出。

- [ ] **Step 6：创建本地提交**

```powershell
git add -- src/views/Layout/components/Header/components/SearchDialog.vue src/views/Login/components/ForgotPasswordDialog.vue src/views/Login/components/ForgotPasswordDialog.styles.scss src/views/Main/ai/providers/components/ProviderFormDialog.vue src/views/Main/ai/providers/components/ProviderFormDialog.styles.css src/views/Main/payment/redeem-codes/components/RedeemCodeGenerateDialog.vue src/views/Main/personal/wallet/components/RedeemCodeDialog.vue src/views/Main/system/mail/components/MailTemplatePanel.vue tests/component/payment/RedeemCodePage.test.ts tests/component/payment/WalletRedeemCodeDialog.test.ts tests/component/system/mail-diagnostics-lifecycle.test.ts tests/component/login/LoginForm.test.ts
git diff --cached --check
git commit -m "refactor(ui): migrate dialogs to shared boundary"
```

### Task 3：统一 `AppTable` 消费方式

**Files:**
- Modify operation layout: `src/views/Main/payment/config/index.vue`
- Modify operation layout: `src/views/Main/ai/providers/index.vue`
- Modify operation layout: `src/views/Main/payment/recharge/components/RechargeRecordsTable.vue`
- Modify operation layout: `src/views/Main/user/userManager/components/UserList/styles.css`
- Modify private toolbar: `src/views/Main/payment/redeem-codes/index.vue`
- Modify scroll ownership: the 18 files listed below
- Modify defaults/columns: the affected `AppTable` consumers listed below
- Modify: `tests/shared/ui/action-column-layout.test.ts`

18 个滚动归属文件：

```text
src/views/Main/ai/agents/index.vue
src/views/Main/ai/providers/index.vue
src/views/Main/ai/runs/components/RunList/index.vue
src/views/Main/notification/index.vue
src/views/Main/permission/authPlatform/index.vue
src/views/Main/permission/role/index.vue
src/views/Main/system/mail/components/MailLogPanel.vue
src/views/Main/system/mail/components/MailTemplatePanel.vue
src/views/Main/system/operationLog/index.vue
src/views/Main/system/setting/index.vue
src/views/Main/system/sms/components/SmsLogPanel.vue
src/views/Main/system/sms/components/SmsTemplatePanel.vue
src/views/Main/system/uploadConfig/components/UploadDriver/index.vue
src/views/Main/system/uploadConfig/components/UploadRule/index.vue
src/views/Main/system/uploadConfig/components/UploadSetting/index.vue
src/views/Main/user/userManager/components/SessionList/index.vue
src/views/Main/user/userManager/components/UserList/index.vue
src/views/Main/user/usersLoginLog/index.vue
```

- [ ] **Step 1：固定操作列和表格默认契约**

扩展 `action-column-layout.test.ts`，保留已有操作列宽度断言，并断言页面不再依赖操作按钮 wrapper 才能居中。不要删除合法的操作列 `width/fixed` 配置。

- [ ] **Step 2：删除页面重复布局**

- 删除 4 个操作列 wrapper 及其 `display:flex/justify-content:center/gap` CSS，slot 中直接渲染按钮。
- 删除兑换码页面对 `.table-toolbar/.toolbar-left/.toolbar-right` 的 `:deep` 穿透，窄屏交给 Task 1 的 `AppTable`。
- 将 18 个 `AppTable` 直接父容器的 `overflow:auto` 改为 `overflow:hidden`；不要修改日志查看器、弹窗内容、侧栏等真实滚动区。

- [ ] **Step 3：删除 `AppTable` 纯默认值**

- 删除 26 个 `AppTable row-key="id"`；保留权限树原生 `el-table` 的 row key。
- 删除以下 6 个 `height:'100%'` table props：`payment/wallets`、`payment/ledger`、`payment/redeem-codes`、`payment/recharge/RechargeRecordsTable`、`personal/wallet`、`ai/model-pricing`。
- 删除全部 14 个“已有 width/minWidth”的 `overflowTooltip:true`，依赖 `autoOverflowTooltip=true`。
- 不删除任何 `overflowTooltip:false`，它们是显式业务例外。

- [ ] **Step 4：修复 3 个实际无效的 tooltip**

`AppTable` 只有列具备 `width/minWidth` 时才启用 tooltip。为原意明确但当前无效的列补：

```ts
notification.content       -> minWidth: 260
userSession.device_id      -> minWidth: 220
setting.setting_value      -> minWidth: 320
```

补宽度后同样删除显式 `overflowTooltip:true`，让全局默认生效。

- [ ] **Step 5：运行定向验证**

```powershell
npx vitest run tests/shared/ui/action-column-layout.test.ts tests/component/accessibility/table-form.test.ts tests/component/payment/RedeemCodePage.test.ts tests/component/payment/PaymentRechargePage.test.ts tests/component/ai/ModelPricingPage.test.ts
rg -n --glob "*.{vue,css,scss}" ':deep\(\.(table-toolbar|table-wrapper|toolbar-left|toolbar-right|table-footer|flex-table)' src/views
rg -n --glob "*.vue" 'row-key="id"' src/views
git diff --check
```

Expected: 定向测试通过；私有表格穿透无输出；row-key 搜索只剩允许的原生 `el-table`。

- [ ] **Step 6：创建本地提交**

```powershell
git diff --name-only
# 核对输出后，将上方 Task 3 清单中的实际变更文件逐个传给 git add --
git diff --cached --check
git commit -m "refactor(ui): centralize shared table layout"
```

不得用 `git add -- src/views` 目录级暂存，以免带入执行期间出现的用户改动。

### Task 4：清理 `AppDialog` 与 `Search` 默认值

**Files:**
- Modify: all current `src/views` results from the exact baseline searches below
- Modify: `src/views/Layout/components/Header/components/search-dialog.ts`
- Modify: `src/views/Main/ai/runs/components/RunList/detail-dialog.ts`
- Modify: `src/views/Main/payment/config/index.vue`

- [ ] **Step 1：保存机械清理基线**

```powershell
rg -n --glob "*.{vue,ts}" '94vw' src/views
rg -n --glob "*.vue" 'append-to-body|destroy-on-close' src/views
rg -n --glob "*.{vue,ts}" 'clearable:\s*true|overflowTooltip\s*:\s*true' src/views
```

Task 3 完成后的预期基线是：29 个 `94vw`、3 个 `append-to-body`、5 个 `destroy-on-close`、5 个 `clearable:true`，且 `overflowTooltip:true` 已为 0。若执行时出现新增结果，先判定是否属于共享组件默认值，再纳入同一任务，不能盲目全局替换。

- [ ] **Step 2：删除 29 个重复移动宽度**

- 将 `:width="isMobile ? '94vw' : '<desktop>'"` 改为固定桌面 `width="<desktop>"`，移动宽度由 `AppDialog` 默认值接管。
- 删除显式 `mobile-width="94vw"`。
- `search-dialog.ts`、`detail-dialog.ts` 删除 layout 中的 `width` 字段，消费页面直接传桌面宽度。
- `payment/config/index.vue` 的 `dialogLayout` 删除 `width`，页面直接传桌面宽度。
- 仍用于响应式高度、top 或页面其他布局的 `isMobile` 必须保留；只因宽度存在的 import/computed 才删除。

- [ ] **Step 3：删除其余 `AppDialog` 默认值**

删除 3 个显式 `append-to-body` 和 5 个显式 `destroy-on-close`。不要触碰 `el-drawer`、原生专用组件或值为 `false` 的显式例外。

- [ ] **Step 4：删除 `Search` 默认值**

- 在 `SearchField` 配置中删除 12 个等于组件默认值的宽度：普通字段 `150`、`date-range` 字段 `300`；保留其他业务宽度和所有表格列宽。
- 删除 AI Run 搜索配置中的 5 个 `clearable:true`；保留 `clearable:false`。
- 删除 SessionList 的 `:collapse-count="1"`；其他非默认折叠数量保留。

- [ ] **Step 5：定向验证 UI 行为未改变**

```powershell
npx vitest run tests/component/dialog/AppDialog.test.ts tests/component/accessibility/dialog.test.ts tests/component/accessibility/table-form.test.ts tests/component/login/LoginPolicyConfirmDialog.test.ts tests/component/ai/ToolGenerateDialog.test.ts
rg -n --glob "*.{vue,ts}" '94vw' src/views
rg -n --glob "*.{vue,ts}" 'clearable:\s*true|overflowTooltip\s*:\s*true' src/views
rg -n -B 8 --glob "*.vue" 'append-to-body|destroy-on-close' src/views
git diff --check
```

Expected: 测试通过；前两个 `rg` 无输出；最后一个只剩 `ModelPriceDrawer.vue` 中合法的原生 `el-drawer destroy-on-close`。业务宽度、`clearable:false`、`overflowTooltip:false` 和非默认 collapse count 均仍存在。

- [ ] **Step 6：创建本地提交**

```powershell
git diff --name-only
# 核对输出后，将上方 Task 4 清单中的实际变更文件逐个传给 git add --
git diff --cached --check
git commit -m "refactor(ui): remove duplicated component defaults"
```

不得用 `git add -- src/views` 目录级暂存，以免带入执行期间出现的用户改动。

### Task 5：加入共享 UI 架构守卫并收口

**Files:**
- Modify: `scripts/quality-checks.mjs`
- Modify: `tests/shared/smoke/empty-wrapper-check.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1：先写质量守卫失败测试**

新增导出：

```js
findSharedUIBoundaryViolations(projectRoot = process.cwd(), filesOverride)
```

fixture 至少覆盖：

- 能抓到 views 中的原生 `el-dialog`、对 `AppDialog/AppTable` 私有类的 `:deep` 穿透。
- 能抓到 `AppTable row-key="id"`、view 中的 `94vw`、默认 AppDialog attrs、默认 table props、`overflowTooltip:true`、Search 默认 width/clearable/collapse count。
- 合法的 `AppTable`、`AppDialog`、`Search` 通过。
- 专用原生 `el-table`、权限矩阵、AI Chat 自有 `.toolbar-left` 不误报。
- 每条结果包含稳定的 rule、相对路径和行号，`runQualityChecks` 能打印可直接定位的信息。

- [ ] **Step 2：确认测试 RED**

```powershell
npx vitest run tests/shared/smoke/empty-wrapper-check.test.ts
```

Expected: FAIL，因为新导出和规则尚不存在。

- [ ] **Step 3：实现结构化扫描**

- 把 `@vue/compiler-sfc` 作为直接 devDependency 写入 `package.json/package-lock.json`，版本与当前 Vue 3.5 系列一致；不得依赖偶然提升的传递依赖。
- `.vue` 使用 `@vue/compiler-sfc` 分离 template/script/style；脚本对象使用现有 `typescript` AST，禁止对整个文件做无边界字符串替换。
- 外部 `.css/.scss` 只检查明确的 `:deep(...)` 私有选择器；不要全局禁止 `.toolbar-left`。
- 将守卫接入现有 `runQualityChecks`，与 empty wrapper、table hook 规则同时汇总，不因第一类错误提前返回。

使用项目 npm 锁文件更新依赖声明：

```powershell
npm install --save-dev @vue/compiler-sfc@^3.5.24
```

- [ ] **Step 4：运行守卫及全部定向测试**

```powershell
npx vitest run tests/shared/smoke/empty-wrapper-check.test.ts tests/shared/ui/action-column-layout.test.ts tests/component/dialog/AppDialog.test.ts tests/component/accessibility/dialog.test.ts tests/component/accessibility/table-form.test.ts tests/component/payment/RedeemCodePage.test.ts tests/component/payment/WalletRedeemCodeDialog.test.ts tests/component/payment/PaymentRechargePage.test.ts tests/component/system/mail-diagnostics-lifecycle.test.ts tests/component/login/LoginForm.test.ts tests/component/login/LoginPolicyConfirmDialog.test.ts tests/component/ai/ToolGenerateDialog.test.ts tests/component/ai/ModelPricingPage.test.ts
npm run lint:quality
git diff --check
```

Expected: 所有定向测试通过；`lint:quality` 输出 `[quality-checks] ok`；diff 无空白错误。

- [ ] **Step 5：人工审查变更边界**

```powershell
git diff --stat
git diff -- src/components src/views scripts/quality-checks.mjs tests package.json package-lock.json
git status --short
```

确认没有后端文件、接口契约、路由注册、i18n 文案或业务请求变化；确认 7/4/18/101 四组基线全部有对应 diff，允许例外仍在。

- [ ] **Step 6：创建最终本地提交**

```powershell
git add -- scripts/quality-checks.mjs tests/shared/smoke/empty-wrapper-check.test.ts package.json package-lock.json
git diff --cached --check
git commit -m "test(ui): guard shared component boundaries"
git status --short --branch
```

Expected: 本地分支包含 5 个可审查提交，工作区干净，未 push。

---

## 用户手动可选的完整门禁

本计划执行代理不得自动运行以下命令。需要专项验收时由用户手动执行：

```powershell
npm run typecheck
npm test
npm run build
```

若手动门禁发现问题，只修复与本计划 diff 有因果关系的失败；不得借机扩大为全仓重构。
