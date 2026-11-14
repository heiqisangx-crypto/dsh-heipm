---
name: quest-list
description: 维护任务清单：开始做某条时标 running、做完写证据标 awaiting、用户验收后才标 done；用户提出「新需求」时也用它拆任务。
whenToUse: 用户要开始或继续做任务清单里的某一条、说某条做完了、给出验收结论，或提出「新需求」时。
---

# quest-list（任务清单）

> **触发**：开始/继续做某条、报告做完、给出验收结论、提出「新需求」时。
> **存储**：任务清单存在项目下的 `.dsh/dsh-heipm/quest.db`（SQLite），**不要再读写任何 Markdown 清单文件**。

## 三步状态流转（必须，不许跳步）

1. **开工前** `set_state` → `running`。
2. **做完** 先 `set_evidence` 写证据，再 `set_state` → `awaiting`。
3. **用户验收后** 才 `set_state` → `done`；没验收就置 done 等于伪造证据。

状态含义：`open` 未完成 / `running` 执行中 / `awaiting` 写完待验证 / `done` 已验证。

## 工具

| 工具 | 用途 |
|------|------|
| `quest_read` | 读需求树：需求、子任务、状态、证据、计数 |
| `quest_write` | 写入，`op`：add_req / add_item / set_state / set_evidence / remove |

- **先读再写**：任何 `quest_write` 前先 `quest_read`，id 只有读出来才知道。
- **证据**：命令 + 输出、`文件:行号`、测试条数；「没报错」不算。
- **回复口径**：提到某条写 `id + 标题`（如 `r84-i1 文案同步`），只给 id 用户对不上号。
- `remove` 只给面板用，**agent 不要调用**。

## 常用写法

```js
quest_write({ op: 'add_req', title: '登录页验证码' })              // → { id: 'r5', seq: 5, state: 'empty' }
quest_write({ op: 'add_item', requirementId: 'r5', title: '生成接口' }) // → { id: 'r5-i1' }
quest_write({ op: 'set_state', itemId: 'r5-i1', state: 'running' })
quest_write({ op: 'set_evidence', itemId: 'r5-i1', evidence: 'npm test → 20 ok' })
quest_write({ op: 'set_state', itemId: 'r5-i1', state: 'awaiting' })
quest_write({ op: 'set_state', itemId: 'r5-i1', state: 'done' })
```

## 派生规则

- 空需求（无子任务）读出来是 `state: 'empty'`，表示还没拆任务，不是完成。
- 中间节点（有子任务）状态由叶子派生，不能手设；面板显示 `doneLeaves/leaves` 进度。
- 叶子全 `done` 时需求自动完成，重新打开子任务会撤销。
- 序号由 `seq` 管理，面板渲染，标题只存纯文字。
