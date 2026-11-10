<p align="center">
  <img src="icon.png" width="64" height="64" alt="dsh-heipm">
</p>

<h1 align="center">dsh-heipm</h1>

<p align="center">A DSH project manager: constraints, skills, procedures and quest lists in one panel.</p>

[About](#about) · [Features](#features) · [Sources](#sources--references) · [Layout](#layout) · [Screenshots](#screenshots) · [Install](#install) · [Configuration](#configuration) · [Style settings](#style-settings) · [Security](#security) · [Development](#development) · [Compatibility](#compatibility) · [License](#license)

> [中文](README.md) | English

## About

dsh-heipm aims to be a project manager that a programmer actually wants to use every day. The author is a programmer, and building this plugin is also an ongoing study of how DeepSeek Harness can fit into a project's daily life: where constraints live, where skills go, how a solved trap is kept, and who maintains the quest list.

DSH capabilities mostly live inside a session and vanish with it. This plugin turns them into files in the project: `AGENTS.md` for constraints, `.dsh/skills` for skills, `.dsh/dsh-heipm/procedures` for lessons, `.dsh/dsh-heipm/任务清单.md` for progress. The panel does three things — show them, edit them, and keep up when they change.

It also tidies the session itself: the process shelf folds reasoning and tool calls into an icon strip, and the style settings let the whole palette follow the reader's eyes.

The design therefore stays file-first (no extra database), zero runtime dependencies, fail-closed when a host contract is missing, and every UI feature can be switched off.

## Features

| Feature | What it does | Optional |
| --- | --- | --- |
| **Projects** | Reads the DSH workspace registry and supports subsequence fuzzy search (`/` focuses, `Esc` clears). | No |
| **Constraints** | Read and edit project/global `AGENTS.md` and `AGENTS.local.md` with version checks (409 on conflict) and a path whitelist. | No |
| **Skills** | Lists `.dsh/skills`, `skills/` and `.agents/skills` entries with names and descriptions. | No |
| **Procedures** | Shows knowledge cards under `.dsh/dsh-heipm/procedures/` with built-in index/template/tool scaffolds; drifted templates are flagged and can be updated one by one or all at once (confirmation first). | Yes (off by default) |
| **Quest list** | Parses `.dsh/dsh-heipm/任务清单.md` and cycles subtask states when ticked. | Yes (on by default) |
| **Per-module refresh** | Clicking a project or section reloads only that module; while the panel is visible a 3-second fingerprint check picks up external edits to constraints, skills, procedures and the quest list (a file being edited is only flagged, never overwritten). | No |
| **Workspace context menu** | Right-click a workspace row in the built-in DSH sidebar to rename it, remove its registration, or open the project root; colours follow the [style settings](#style-settings). | No |
| **Style settings** | A new **heipm style** entry in the settings sidebar: accent, panel, card, text, muted text, border and corner radius, applied immediately to the panel and every sub-plugin. | Yes (always mounted in the main plugin) |
| **Markdown table styling** | Rounded, outlined, zebra-striped wide tables with an expand/collapse toggle; colours follow the style settings. | Yes (off by default) |
| **Process shelf** | Reasoning and tool-call rows between two prose blocks collapse into one icon-only strip; clicking an icon opens a right-side drawer with that step's detail (reasoning text, or a tool's command and output) and its elapsed time. **Visual tidying only — measured to save no performance.** | Yes (ships with the Markdown sub-plugin) |

> The "Yes" rows are three separate sub-plugins (procedures, quest list, Markdown — the process shelf rides along with Markdown) plus the style settings page that always lives in the main plugin. Sub-plugins can be disabled independently in the profile; see [Configuration](#configuration) for when prompt/style changes take effect.

## Sources & references

**Procedures is not original to this plugin**: the prompt, the knowledge-card format (`INDEX.template.md` / `card-template.md` / `CLASSIFY.md`) and the "search the cards by task words before you start" rule come from [DSH-agent-procedures](https://github.com/MiHjy12138/DSH-agent-procedures). This repository only moves it into the panel, under `.dsh/dsh-heipm/procedures/`, and rewires it to the plugin's data contract.

The engineering discipline behind the rules draws on:

- [UB mode](https://github.com/unclebob/ub-mode) (Uncle Bob): make it work, then redesign from first principles; test behaviour, not implementation; attack the premise after two failures; subtract before you add.
- [AI Coding 的第一性](https://www.bilibili.com/opus/1261918888325545988) (Chinese): where human attention should go when AI writes code.

Thanks to the upstream author and these public materials.

## Layout

```text
index.js                 Host entry: panel API, theme file, sub-plugin state
client.js                Browser entry: UI features, process shelf, style settings page
client.procedures.js     Procedures client chunk (must stay at the package root)
client.quest.js          Quest-list client chunk (must stay at the package root)
procedures/              Procedures host sub-plugin: index.js / prompt.md / tools.js
quest-list/              Quest-list host sub-plugin: index.js / prompt.md / SKILL.md
markdown/                Markdown sub-plugin: index.js / styles.js / icon.png
templates/               Built-in card templates and tools
docs/HOST_CONTRACT.md    DSH dependency contract, kill switch and upgrade checklist
test/                    Dependency-free tests
```

> Browser chunks must stay at the package root and be named `client.*.js`; that is a hard constraint of DSH `client-modules`. Host sub-plugin entries may live in folders.

## Screenshots

![Project manager](docs/assets/overview.png)

![Workspace context menu](docs/assets/workspace-menu.png)

> Project and session names in the screenshots are blurred.

## Install

Requires DSH `>=0.2.2-rc.1 <0.2.3-0` (see `engines.dsh`) and Node `^22.19 || >=24`.
Current version: **`0.20.0-rc.1`**. This project is distributed **from GitHub only; it is not published to npm**.

1. Clone it anywhere:

   ```bash
   git clone https://github.com/heiqisangx-crypto/dsh-heipm.git D:/dsh-Workspace/dsh-heipm
   ```

   Or download the source archive for a tag from [Releases](https://github.com/heiqisangx-crypto/dsh-heipm/releases).

2. In your target profile (for example `~/.dsh/profiles/desktop`), edit `package.json`:

   - add `"dsh-heipm": "link:D:/dsh-Workspace/dsh-heipm"` to `dependencies`
   - add `"dsh-heipm"` to `dsh.profile.bundles`

3. Install the link and restart DSH:

   ```bash
   cd ~/.dsh/profiles/desktop
   pnpm install
   ```

   Alternatively restart DSH and let it install profile dependencies.

> The package keeps `"private": true` because it is not published to npm.

## Configuration

Sub-plugin defaults live in `cordis.patch.yml`. `dsh-heipm-procedures`, `dsh-heipm-quest-list` and `dsh-heipm-markdown` are all **optional**; enable them as needed:

| id | Default | Purpose |
| --- | --- | --- |
| `dsh-heipm` | on | Project manager panel (constraints / skills / quest list / context menu / style settings) |
| `dsh-heipm-procedures` | off | Procedures section, prompt and tools |
| `dsh-heipm-quest-list` | on | Quest-list prompt and skill |
| `dsh-heipm-markdown` | off | Session Markdown table styling and the process shelf |

Override by id in the profile `cordis.patch.yml`, for example:

```yaml
- id: dsh-heipm-procedures
  disabled: false
```

### When changes take effect

After enabling, disabling or updating any sub-plugin, **restart DSH**. Procedures and the quest list inject content into the system prompt (the quest list also registers the `quest-list` skill; procedures registers four `/proc-*` commands), and those changes only take effect in a **new session** — an existing session's system prompt is not hot-reloaded. Markdown styling injects no prompt; it only styles session tables through client-side CSS and folds process rows into the icon strip.

## Style settings

Settings → **heipm style** in the left sidebar.

| Option | Where it lands |
| --- | --- |
| Accent | Selected rows, buttons, hover states, table hover, process icons |
| Panel | Process drawer and workspace context menu background |
| Card | Table header, "collapse table" button, cards |
| Text | Panel body, table cells, drawer titles |
| Muted text | Secondary copy, paths, default icon colour |
| Border | Borders, dividers, table rules |
| Corner radius | Tables, icon strip, menu, buttons (0–24 px) |

- Changes apply **immediately** and are written to `~/.dsh/dsh-heipm/theme.json` after 400 ms, shared by every window.
- A row left on "Follow theme" falls back to DSH's own tokens; invalid values are treated as unset.
- Five live preview chips sit at the top (selected row / button / table head / drawer / border), and every colour row states what it affects.
- The settings page itself uses **host tokens only** — a bold palette can never make it unreadable.
- One palette covers light and dark; `color-mix()` needs Chromium 111+ (the current DSH build satisfies this).

## Security

- The local `/dsh-heipm/api` route accepts same-origin hosts only.
- File access is limited to whitelisted candidates (`AGENTS.md`, etc.) and registered project paths.
- Edits are capped at 512 KB; saves carry a version and return 409 on conflict.
- The theme is only written to `~/.dsh/dsh-heipm/theme.json`; broken JSON and invalid colours fall back to defaults.
- "Delete workspace" removes only the DSH registration; folders, files and session logs are kept.

## Development

No runtime dependencies; tests use Node built-ins only:

```bash
npm test
```

Tests cover the host data layer (collect / save / delete / quest list / per-module refresh and file fingerprints / theme file), client rendering, markdown styling, the process shelf, style settings, the workspace context menu, the UI contract and kill switches; **12 suites, 276 assertions** today.

## Compatibility

- `engines.dsh`: `>=0.2.2-rc.1 <0.2.3-0`, the same baseline as `dsh-ops` 0.5. Anchors are statically checked on `0.2.2-rc.1`.
- The client plugin depends on the `slots`, `locale` and `workspaces` services; the style settings page depends on the `settings.section` slot; the context menu relies on the sidebar's `data-row-key` attribute.
- The process shelf relies on transcript semantics (`data-chat-flow-kind`, `data-chat-group-part`, `data-variant="think"`, `data-tool`, `data-disclosure-row`) rather than CSS-module hashes.
- Every fragile dependency lives in `HOST_CONTRACT` in `client.js` and in [docs/HOST_CONTRACT.md](docs/HOST_CONTRACT.md). Re-check that document after each DSH upgrade.
- A broken UI feature can be disabled and falls back to native behaviour after a refresh:

  ```js
  localStorage.setItem('dsh-heipm:ui:disabled:v1', JSON.stringify(['process-shelf']))
  ```

  Known ids: `workspace-menu`, `process-shelf`.

## License

MIT © 2026 heiqisang and the dsh-heipm contributors. See [LICENSE](LICENSE).
