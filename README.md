<p align="center">
  <img src="icon.png" width="64" height="64" alt="dsh-heipm">
</p>

<h1 align="center">dsh-heipm</h1>

<p align="center">DSH 项目管理面板：把每个项目的约束、技能、经验流程与任务清单收在一处。</p>

[功能](#功能) · [目录结构](#目录结构) · [截图](#截图) · [安装](#安装) · [配置](#配置) · [安全边界](#安全边界) · [开发](#开发) · [兼容性](#兼容性) · [License](#license)

> 中文 | [English](README.en.md)

## 功能

- **项目列表**：从 DSH workspace registry 读取项目，支持子序列模糊搜索（`/` 聚焦，`Esc` 清除）。
- **约束**：读取/编辑项目与全局的 `AGENTS.md` / `AGENTS.local.md`，保存带版本校验，冲突返回 409，路径走白名单。
- **技能**：扫描 `.dsh/skills`、`skills/`、`.agents/skills`，展示名称与描述。
- **经验流程**：读取 `.dsh/dsh-heipm/procedures/` 下的知识卡，内置索引/模板/工具，可一键创建缺失文件；项目内的模板与插件内置版本不一致时标出「有更新」，支持逐个或一键更新（覆盖前二次确认）。
- **任务清单**：解析 `.dsh/dsh-heipm/任务清单.md`，子任务按「未完成 → 待验收 → 已完成」循环写回。
- **工作区右键菜单**：在 DSH 自带侧边栏的工作区行上右键，弹出「重命名 / 删除工作区」，样式沿用插件主题。
- **Markdown 表格样式**（可选子插件）：给会话里的宽表加圆角、描边与「展开/收起」。

## 目录结构

```text
index.js                 Host 包入口
client.js                浏览器主入口（UI 特性注册）
client.procedures.js     经验流程客户端分块（必须留在包根）
client.quest.js          任务清单客户端分块（必须留在包根）
procedures/              经验流程 Host 子插件：index.js / prompt.md / tools.js
quest-list/              任务清单 Host 子插件：index.js / prompt.md / SKILL.md
markdown/                Markdown 样式子插件：index.js / styles.js
templates/               内置知识卡模板与工具
docs/HOST_CONTRACT.md    DSH 依赖契约、降级开关与升级 checklist
test/                    零依赖测试
```

> 浏览器分块必须留在包根且命名为 `client.*.js`，这是 DSH `client-modules` 的硬约束；Host 子插件入口可以放进文件夹。

## 截图

![项目管理面板](docs/assets/overview.png)

![工作区右键菜单](docs/assets/workspace-menu.png)

> 截图中的项目名与会话名已做模糊处理。

## 安装

要求：DSH `>=0.2.0-rc.2 <0.2.2-0`（见 `engines.dsh`），Node `>=22.19`。
本项目**只从 GitHub 分发，未发布 npm**。

1. 克隆到任意目录：

   ```bash
   git clone https://github.com/heiqisangx-crypto/dsh-heipm.git D:/dsh-Workspace/dsh-heipm
   ```

2. 在目标 profile（例如 `~/.dsh/profiles/desktop`）的 `package.json` 中：

   - `dependencies` 增加 `"dsh-heipm": "link:D:/dsh-Workspace/dsh-heipm"`
   - `dsh.profile.bundles` 增加 `"dsh-heipm"`

3. 安装链接并重启 DSH：

   ```bash
   cd ~/.dsh/profiles/desktop
   pnpm install
   ```

   也可以直接重启 DSH，由它在启动时安装 profile 依赖。

> 因为只发 GitHub，`package.json` 保留了 `"private": true`，防止误发布到 npm。

## 配置

子插件默认值见 `cordis.patch.yml`：

| id | 默认 | 说明 |
| --- | --- | --- |
| `dsh-heipm` | 开 | 项目管理面板（约束 / 技能 / 任务清单 / 工作区右键菜单） |
| `dsh-heipm-procedures` | 关 | 经验流程分区、提示词与工具 |
| `dsh-heipm-quest-list` | 开 | 任务清单提示词与 `quest-list` 技能 |
| `dsh-heipm-markdown` | 关 | 会话 Markdown 表格样式 |

在 profile 的 `cordis.patch.yml` 里按 id 覆盖，例如启用经验流程：

```yaml
- id: dsh-heipm-procedures
  disabled: false
```

## 安全边界

- 本地 HTTP 路由 `/dsh-heipm/api` 只接受同源 Host。
- 文件读写限定在候选文件（`AGENTS.md` 等）与已注册项目的白名单路径内。
- 单文件编辑上限 512 KB；保存携带版本号，冲突返回 409。
- 「删除工作区」只移除 DSH 中的登记，不删除目录、文件或会话记录。

## 开发

零运行时依赖，测试只用 Node 内置模块：

```bash
npm test
```

测试覆盖 Host 侧（收集 / 保存 / 删除 / 初始化 / 任务清单）、客户端渲染、Markdown 表格样式、工作区右键菜单，以及 UI 契约与降级开关。

## 兼容性

- `engines.dsh`：`>=0.2.0-rc.2 <0.2.2-0`；开发与实测版本为 `0.2.1-rc.3`。
- 客户端插件依赖 `slots`、`locale`、`workspaces` 服务；右键菜单依赖侧边栏工作区行的 `data-row-key`。
- 所有脆弱依赖集中在 `client.js` 的 `HOST_CONTRACT` 与 [docs/HOST_CONTRACT.md](docs/HOST_CONTRACT.md)；DSH 升级后按该文档逐项核对。
- 某个 UI 特性异常时可一键关闭，刷新后回到宿主原生行为：

  ```js
  localStorage.setItem('dsh-heipm:ui:disabled:v1', JSON.stringify(['workspace-menu']))
  ```

## License

MIT © 2026 heiqisang and the dsh-heipm contributors，见 [LICENSE](LICENSE)。
