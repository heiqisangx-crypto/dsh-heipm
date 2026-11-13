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

## 六、PTC 可见性方案（P1）

`dsh-ops/lib/publication/ptc.js` 的机制：

- `ptc.js:44` —— `resident = new Set([...PTC_RESIDENT_TOOLS, ...config.alwaysLoaded])`
- `ptc.js:61` —— `loadable = [...config.allowedTools, 'result']`
- 可见性 = `resident.has(api) || entry.selected.has(api)`

P1 做法：在 `dsh-heipm/cordis.patch.yml` 里，给 `preset-ops-ptc` 的 `dsh-ops` 配置追加 `alwaysLoaded: ['quest_read', 'quest_write']`，让工具在 PTC 下常驻可见。

**待实测**：该 patch 能否改到其他插件插入的条目。失败则退 P3：由 `quest-list/SKILL.md` 教 agent 先 `load_sdk` 再用。

## 七、迁移

1. 用现有 `parseQuestMarkdown` 解析旧 `任务清单.md`，打印总数与逐条状态；
2. 导入 SQLite；
3. 从库读回，与第 1 步逐条比对（标题、层级、状态、计数全等）；
4. 比对通过后删除 `任务清单.md`。

## 八、验收标准

- [ ] `quest.db` 建库、读写、事务全部可用
- [ ] 迁移后 73 个需求、全部子任务的标题与状态逐条一致
- [ ] 面板勾选通过 `itemId` 写回，不再使用行号
- [ ] 需求序号由 `seq` 渲染成独立样式块，标题文本不含序号
- [ ] `quest_read` / `quest_write` 在 native 预设下可直接调用
- [ ] `quest_read` / `quest_write` 在 OPS-PTC 预设下可调用（P1 成功或 P3 兜底生效）
- [ ] `npm test` 全绿

## 九、文件范围（待 review）

| 文件 | 内容 |
|---|---|
| 新增 `quest-store.js` | SQLite 封装 + 迁移 |
| `index.js` | 读写改走 store，删除旧解析（约 250 行） |
| `client.quest.js` | `line` → `itemId`（仅 1 处） |
| `quest-list/SKILL.md` | 改教 agent 用新工具 |
| 测试 | 新增 + `test/host.mjs` |
| `cordis.patch.yml` | P1 的 `alwaysLoaded` 补丁 |
