---
name: quest-list
description: 维护任务清单：开始做某条时标 running、做完写证据标 awaiting、用户验收后才标 done；用户提出「新需求」时也用它拆任务。
whenToUse: 用户要开始或继续做任务清单里的某一条、说某条做完了、给出验收结论，或提出「新需求」时。
---

# quest-list（任务清单）

> **触发**：开始/继续做某条、报告做完、给出验收结论、提出「新需求」时。
> **存储**：任务清单存在项目下的 `.dsh/dsh-heipm/quest.db`（SQLite），**不要再读写任何 Markdown 清单文件**。

## 三步状态流转（必须，不许跳步）

1. **开工前**：`set_state` → `running`。还没动手就留 `open` 是错的。
2. **做完**：先 `set_evidence` 写证据，再 `set_state` → `awaiting`。
3. **用户验收后**：才 `set_state` → `done`。用户没验收就自行置 `done` 等于伪造证据。

## 两个工具

| 工具 | 用途 |
|------|------|
| `quest_read` | 读需求树：需求、子任务、状态、证据、计数 |
| `quest_write` | 写入入口，用 `op` 区分操作 |

**先读再写**：任何 `quest_write` 之前先 `quest_read`，因为 id 只有读出来才知道。

## 状态

| 状态 | 含义 |
|------|------|
| `open` | 未完成 |
| `running` | **执行中** —— 正在做这一条 |
| `awaiting` | 已动手、**未验证** |
| `done` | 已验证且有证据 |

- 动手做某一条时标 `running`，做完标 `awaiting`，验证通过再标 `done`。
- 干完必须离开 `running`，否则面板会一直转圈。
- **有子任务的节点不能直接设状态**：它的状态由叶子节点派生，工具会拒绝。

## 证据门槛

- `awaiting` 就等于声明「写完了但还没证明」，它必须带证据。
- 证据写进 `evidence` 字段：命令 + 输出、`文件:行号`、或测试条数。
- 没有证据**不许**设成 `done`。
- 「没报错」「看着对」不是证据。

## 常用写法

新增一个需求（自动分配序号，**标题里不写序号、不写状态标记**）：

```
quest_write({ op: 'add_req', title: '登录页验证码' })
→ { ok: true, result: { id: 'r5', seq: 5, title: '登录页验证码', state: 'empty' } }
```

给它加子任务：

```
quest_write({ op: 'add_item', requirementId: 'r5', title: '设计验证码生成接口' })
→ { ok: true, result: { id: 'r5-i1', ... } }
```

开始做某一条：

```
quest_write({ op: 'set_state', itemId: 'r5-i1', state: 'running' })
```

写证据并标待验收：

```
quest_write({ op: 'set_evidence', itemId: 'r5-i1', evidence: 'src/api/captcha.ts:24' })
quest_write({ op: 'set_state', itemId: 'r5-i1', state: 'awaiting' })
```

验证通过：

```
quest_write({ op: 'set_state', itemId: 'r5-i1', state: 'done' })
```

## 空需求

新建的需求没有子任务时，读出来是 `state: 'empty'`。它表示**还没拆任务**，不是完成。

## 底层规则

- **序号**由 `seq` 字段管理，标题只存纯文字。序号由面板渲染，不进正文。
- **需求完成**是算出来的：所有叶子子任务都是 `done` 才算完成。空需求永远是 `empty`。
- **中间节点**（有子任务的节点）显示 `doneLeaves/leaves` 进度，不能手动设状态。
- `remove` 只给面板用，**agent 不要调用**。
