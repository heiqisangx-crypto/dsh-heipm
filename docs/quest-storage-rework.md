# 任务清单存储改造（Quest Storage Rework）

> 本文件是本次改造的需求与方案记录，**不写入** `.dsh/dsh-heipm/任务清单.md`。

## 一、背景

`任务清单.md`（458 行 / 73 个需求）单文件方案暴露出致命问题：

- `read` 默认只读 2000 行，超出部分静默截断；
- `write` 无长度校验，一次全量写回就把被截断的残本覆盖回磁盘。

根因是「读全文 → 改一处 → 写全文」。文件长度只是让它更早暴露。

## 二、前提（用户确认）

1. 任务清单**不参与 git 控制**；
2. 换持久层后，**读取方式同步改变**，不再用 `read` 直接读存储文件；
3. 旧的 `任务清单.md` **直接剔除**。

## 三、目标

| 目标 | 说明 |
|---|---|
| 存储改为 SQLite | `node:sqlite`，零第三方依赖，与插件 `dependencies: {}` 一致 |
| 状态独立成列 | 行首的 `[ ]/[~]/[O]/[√]` 标记改为 `item.state` 字段 |
| 证据独立成列 | 证据行从标题中拆出，存 `item.evidence` |
| 稳定 id | 面板与 agent 都以 `id` 定位，不再用行号 |
| 序号与标题分离 | `seq` 是唯一真值，`title` 只存纯文字；序号由面板用**独立样式**渲染，不进正文 |
| 双形态工具入口 | 同一份实现在 PTC 与 native 下都可用 |

## 四、数据模型

```sql
CREATE TABLE requirement (
  id         TEXT PRIMARY KEY,
  seq        INTEGER NOT NULL,
  title      TEXT NOT NULL,
  state      TEXT NOT NULL,
  sort       INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE item (
  id             TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES requirement(id) ON DELETE CASCADE,
  parent_id      TEXT NULL,
  title          TEXT NOT NULL,
  state          TEXT NOT NULL DEFAULT 'open',
  evidence       TEXT NULL,
  sort           INTEGER NOT NULL,
  line_no        INTEGER,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX idx_item_req   ON item(requirement_id, sort);
CREATE INDEX idx_item_state ON item(state);
```

状态取值：`open` / `running` / `awaiting` / `done`。

## 五、工具接口（两个入口）

| 名称 | 职责 |
|---|---|
| `quest_read` | 读需求树，返回需求、子任务、状态、证据、计数 |
| `quest_write` | 写入统一入口，`op` 区分操作 |

标题约定：agent 与面板**都不传序号**，`title` 只写正文（如 `过程图标条：运行中的步骤显示旋转圈`）。序号取 `requirement.seq`，由面板以独立样式（徽章/序号块）展示，不拼进标题字符串。

`quest_write` 的 `op` 取值（用户已确认）：

| op | 用途 | 面板 | agent |
|---|---|---|---|
| `add_req` | 新增需求，自动分配序号 | ✅ | ✅ |
| `add_item` | 新增子任务 | ✅ | ✅ |
| `set_state` | 改状态 | ✅ | ✅ |
| `set_evidence` | 写/追加证据 | ✅ | ✅ |
| `remove` | 删除需求或子任务 | ✅ | ❌ |

## 六、PTC 可见性（已定论，无需配置）

**P1 已废弃**：`dsh-ops/lib/ptc/config.js:20-22` 对 `allowedTools` / `alwaysLoaded`
做白名单校验，只接受 dsh-ops 自己的 API 名；填外部工具名会直接抛错。
`cordis.patch.yml` 也无法绕过 —— 这条路线不通。

**实际采用**：PTC 只是让工具从 schema 消失，运行时仍可调用。

| 场景 | 表现 |
|---|---|
| native 预设 | `quest_read` / `quest_write` 直接出现在工具列表 |
| OPS-PTC 预设 | 不出现在列表，但 `run_code` 里 `tools.quest_write(...)` 可正常调用 |

因此**不需要任何 patch 配置**：`quest-list/SKILL.md` 写明工具名即可。
（本项目的实测证据：在 PTC 预设下完成了 73 需求迁移与后续所有写入。）

## 七、迁移

1. 用现有 `parseQuestMarkdown` 解析旧 `任务清单.md`，打印总数与逐条状态；
2. 导入 SQLite；
3. 从库读回，与第 1 步逐条比对（标题、层级、状态、计数全等）；
4. 比对通过后删除 `任务清单.md`。

## 八、验收标准

- [x] `quest.db` 建库、读写、事务全部可用 ｜ 证据：`test/quest-store.mjs` → 20 ok
- [x] 迁移后 73 个需求、全部子任务的标题与状态逐条一致 ｜ 证据：`scripts/migrate-quest.mjs` → `mismatches=0`
- [x] 面板勾选通过 `itemId` 写回，不再使用行号 ｜ 证据：`client.quest.js:370`；`test/host.mjs`「a task id survives a round trip through the panel」
- [ ] **需求序号由 `seq` 渲染成独立样式块** ｜ 未做，见下文遗留
- [x] `quest_read` / `quest_write` 在 native 预设下可直接调用 ｜ 证据：`test/quest-tools.mjs` → 14 ok
- [x] `quest_read` / `quest_write` 在 OPS-PTC 预设下可调用 ｜ 证据：PTC 会话内完成迁移与全部写入
- [x] `npm test` 全绿 ｜ 证据：`EXIT=0`、354 条

### 遗留

- 面板需求序号还没有独立样式块（当前序号不显示，标题也不含序号）。
- 面板还没有接入 `add_req` / `add_item` / `remove` 入口，目前只有 agent 和状态勾选。

## 九、文件范围（待 review）

| 文件 | 内容 |
|---|---|
| 新增 `quest-store.js` | SQLite 封装 + 迁移 ✅ |
| 新增 `quest-tools.js` | `quest_read` / `quest_write` ✅ |
| 新增 `scripts/parse-legacy.mjs` | 旧格式解析器（仅迁移用）✅ |
| 新增 `scripts/migrate-quest.mjs` | 导入 + 逐条核对 ✅ |
| 新增 `scripts/finalize-quest.mjs` | 快照 + 删除旧文件 ✅ |
| `index.js` | 读写改走 store，删除旧解析（1585 → 1357 行）✅ |
| `client.quest.js` | `line` → `itemId`（仅 1 处）✅ |
| `quest-list/SKILL.md` / `prompt.md` | 改教 agent 用新工具 ✅ |
| `cordis.patch.yml` | 无需改动（P1 已废弃）✅ |
