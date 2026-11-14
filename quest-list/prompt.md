# 任务清单

- **位置** 存在项目下的 `.dsh/dsh-heipm/quest.db`（SQLite），**不要读写任何 Markdown 清单文件**；细节见 skill `quest-list`。
- **两个工具** `quest_read` 读需求树，`quest_write` 写（op：add_req / add_item / set_state / set_evidence；remove 归面板）。
- **先读再写** 写之前先 `quest_read`，id 只有读出来才知道。
- **按需读取** 不全量读；回顾旧需求先 `quest_read`，必要时才 grep。
- **确定为新需求** 只有用户明确新需求规格，才新建需求条目。
- **状态流转（必须，不许跳步）** 开工前置 `running`；做完写 `evidence` 再置 `awaiting`；**只有用户验收后**才置 `done`。不许留 `open`，也不许自行判定完成。
- **证据门槛** `awaiting` 必须带 `evidence`（命令 + 输出 / 文件:行号 / 测试条数），没有证据不许 `done`。
- **复杂任务** 跨文件 / 多步依赖 / 需分轮验证时，用 `add_item` 传 `parentId` 拆成子任务（可多层）；父节点状态由叶子派生，规范见 skill `quest-list`。
- **中间节点** 状态由叶子派生，不能直接设。
- **回复口径** 任何提到需求或任务的地方（正文、标题、表格、结论）都写「id + 标题」，**禁止单独出现 id**；例：`r84 dsh-heipm 技术债清理`、`r84-i1 文案同步`。
- **发送前自查** 回复里每个 id 后面都得跟标题，缺了就补。
