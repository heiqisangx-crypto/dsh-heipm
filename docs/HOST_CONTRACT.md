# Host Contract

本文件记录 dsh-heipm **客户端**对 DSH 的全部脆弱依赖。升级 DSH 后先按表逐项核对；缺失的项必须降级，不能抛错到页面。

> 支持基线：`0.2.2-rc.1` 起（`engines.dsh: >=0.2.2-rc.1 <0.3.0-0`）。验证只分两档：**实测** = 在真实页面里跑过该特性；**静态核对** = 只在宿主构建产物里确认锚点存在，没在页面验证过。静态项在宿主升级后默认按不可用处理，允许降级。

## 原则

1. **Slot / 服务优先**：能用 `ctx.slots`、`ctx.get(...)` 解决的，不做 DOM。
2. **选择器集中**：所有 DOM 选择器只出现在 `client.js` 的 `HOST_CONTRACT` 与本文件里，不散落在组件中。
3. **失败关闭（fail-closed）**：锚点/服务缺失时，该特性静默不挂载，不半残、不报错。
4. **不碰宿主内部**：不替换宿主 React 组件、不读宿主 state、不删除或克隆宿主节点；类名只允许**稳定前缀**匹配（`[class*="_tableScroll"]`），禁止写死完整哈希类名（`_tableScroll_abc123`）。
5. **可一键关闭**：每个 UI 特性都有本地 kill switch，见下文。

## 依赖表

| 特性 | 依赖 | 类型 | 首次验证 | 缺失时 |
| --- | --- | --- | --- | --- |
| 工作区右键菜单 | `[data-row-key^="workspace:"]` | DOM `data-*` | 0.2.1-rc.3 | 不弹菜单 |
| 工作区右键菜单 | `workspaces` 客户端服务 | Service | 0.2.1-rc.3 | 不装监听 |
| 工作区右键菜单 | `[class*="projectText"] [class*="title"]` | DOM class | 0.2.1-rc.3 | 退回 `workspaces` 快照标题 |
| 打开项目根目录 | 服务端 `workspaceRegistry.list()` + `/dsh-heipm/api` 的 `open-folder` | Service | 0.2.1-rc.5 | 菜单项提示打开失败 |
| 主面板 / 侧栏入口 | `sidebar.panellist`、`main` 槽位 | Slot | 0.2.1-rc.3 | 不注册入口 |
| 任务清单样式 | `.pm-quest-*`（自有 class） | 自有 DOM | 0.2.1-rc.3 | 不影响宿主 |
| Markdown 表格 | `.cv-table`、`[class*="_tableScroll"]`、`[class*="_tableFill"]` | DOM class | 0.2.1-rc.3 | 不改表格 |
| 过程收纳（图标条） | `[data-slot="conversation.chat.flow"]` | DOM `data-*` | 0.2.2-rc.1（静态核对） | 不挂载 |
| 过程收纳（图标条） | 行：`[data-chat-flow-key][data-chat-flow-kind]`、`data-chat-group-part` | DOM `data-*` | 0.2.2-rc.1（静态核对） | 不挂载 |
| 过程收纳（图标条） | 思考：`[data-variant="think"]`；工具：`[data-tool]`、`[data-sample]` | DOM `data-*` | 0.2.2-rc.1（静态核对） | 该类行不收纳 |
| 过程收纳（图标条） | 展开控件 `[data-disclosure-row][aria-expanded]`；正文 `[class*="_thinkBody"]`、`[class*="_bodyWrap"]`、`[class*="_bodyScroll"]` | DOM class | 0.2.2-rc.1（静态核对） | 详情看不到，仍收纳 |
| 过程收纳（图标条） | `hm-proc-shelf`、`hm-proc-row`（自有 class） | 自有 DOM | 0.2.2-rc.1（静态核对） | 不影响宿主 |
| 经验流程 / 任务清单 | `systemPrompt`、`commands`、`skills` 服务 | Service | 0.2.1-rc.3 | 子插件不加载 |
| 样式设置页 | `ctx.slots.inject('settings.section')` → `register({ id, order, label, locale, inject })` | Slot | 0.2.2-rc.1（静态核对） | 设置里不出现该页，其余功能照常 |

> 「首次验证」列写的是版本号；同一格里标「（静态核对）」的条目只确认锚点存在，没有页面实测，按不可用处理。

> `docs` 里没有列出的选择器，不允许在代码里出现。

## 客户端分块约束

DSH 的 `client-modules` 加载器只接受**包根目录**下、文件名匹配 `client.<name>.js` 的相对分块：

```
client.procedures.js   ✅
client.quest.js        ✅
procedures/client.js   ❌ （目录 + 名字都不匹配）
```

报错形如 `client-modules: invalid relative chunk request "./procedures/client.js"`。Host 子插件的入口可以放进文件夹（`procedures/index.js`），但**浏览器分块必须留在包根**。

## 一键关闭 UI 特性

浏览器控制台执行，然后刷新：

```js
localStorage.setItem('dsh-heipm:ui:disabled:v1', JSON.stringify(['workspace-menu']))
```

恢复：

```js
localStorage.removeItem('dsh-heipm:ui:disabled:v1')
```

关闭后该特性不会安装监听、不会注入样式，页面回到宿主原生行为。

## DSH 升级 checklist

1. `cd D:/dsh-Workspace/dsh-heipm && npm test`，重点看 `test/ui-contract.mjs` 与 `test/workspace-menu.mjs`。
2. 真实页面：右键工作区行，确认「打开项目根目录 / 重命名 / 删除工作区」出现，点「打开项目根目录」能拉起资源管理器。
3. 打开项目管理面板，确认侧栏入口、项目列表、任务清单正常。
4. 逐项核对上面的依赖表；缺失的项按“缺失时”降级，或更新 `HOST_CONTRACT` + 本表。
5. 更新 `package.json` 的 `engines.dsh` 与 README 的兼容性说明。

## 新增 UI 特性时

1. 先找 Slot / 服务；找到就只写注册代码。
2. 找不到：把选择器加进 `HOST_CONTRACT`，并登记到本表。
3. 在 `client.js` 的 `UI_FEATURES` 里加一项 `{ id, mount }`；`mount` 返回清理函数。
4. 给 `id` 加一条 kill switch 测试与文档。
5. 保证：锚点不存在 → `mount` 返回空清理函数；抛错 → 只影响该特性。
