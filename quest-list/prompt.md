# 任务清单

- **确定为新需求** 只有真实项目明确新需求规格后，任务清单才能落地。
- **按需读取** 不允许全量读取。回顾前需求时先 `quest_read`，只在需要时才用 grep 模糊搜索。
- **如何编写** 编写与维护方式见 skill `quest-list`。
- **位置** 存在项目下的 `.dsh/dsh-heipm/quest.db`（SQLite），**不要读写任何 Markdown 清单文件**。
- **两个工具** `quest_read` 读需求树，`quest_write` 写入（`op` 区分 add_req / add_item / set_state / set_evidence）。
- **先读再写** 写入前先 `quest_read`，因为 id 只有读出来才知道。
- **证据门槛**：`awaiting` 待验证项必须写 `evidence`（命令 + 输出 / 文件:行号 / 测试条数），拿不出证据不许改成 `done`。
- **中间节点** 有子任务的节点状态由叶子派生，不能直接设状态。
