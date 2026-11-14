window.__ModuleLoader__.load({
  id: 'dsh-heipm',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useMemo, useRef, useState } = React

    const NS = 'projectManager'
    const API_PATH = 'dsh-heipm/api'
    const DISPLAY_FILE = 'AGENTS.md'

    const EN = {
      'nav.label': 'Projects',
      'style.nav': 'heipm style',
      'style.desc': 'Colors used by the heipm panel and every sub-plugin. Leave a row on "Follow theme" to reuse the DSH theme color.',
      'style.accent': 'Accent',
      'style.panel': 'Panel',
      'style.card': 'Card',
      'style.ink': 'Text',
      'style.dim': 'Muted text',
      'style.line': 'Border',
      'style.radius': 'Corner radius',
      'style.preview': 'Live preview of the surfaces these colours drive',
      'style.previewSelect': 'Selected item',
      'style.previewButton': 'Button',
      'style.previewHead': 'Table head',
      'style.previewPanel': 'Drawer / menu',
      'style.previewMuted': 'Border & muted text',
      'style.accentHint': 'Selected rows, buttons, hover states, table hover, process icons',
      'style.panelHint': 'Process drawer and workspace context menu background',
      'style.cardHint': 'Table header, "collapse table" button, card backgrounds',
      'style.inkHint': 'Panel body text, table cells, drawer titles',
      'style.dimHint': 'Secondary copy, paths, default icon colour',
      'style.lineHint': 'Borders, dividers, table rules',
      'style.radiusHint': 'Tables, icon shelf, menu, buttons',
      'style.follow': 'Follow theme',
      'style.clear': 'Clear',
      'style.reset': 'Restore defaults',
      'style.note': 'Changes apply immediately and are saved to ~/.dsh/dsh-heipm/theme.json.',
      'page.subtitle': 'Pick a project on the left, then choose what to manage: constraints, skills, or procedures.',
      'page.subtitle.basic': 'Pick a project on the left, then choose what to manage: constraints or skills.',
      'col.projects': 'Projects',
      'col.sections': 'Manage',
      'search.placeholder': 'Filter projects…',
      'search.clear': 'Clear filter',
      'search.noResults': 'No project matches this filter.',
      'search.results': 'matches',
      'count.files': 'files',
      'group.global': 'Global',
      'group.projects': 'Projects',
      'scope.dsh': 'DSH global',
      'scope.shared': 'Shared global',
      'global.scoped.title': 'Global group: constraints only',
      'global.scoped.body': 'Skills and procedures are counted per project. Pick a project on the left to inspect them.',
      'global.scoped.body.basic': 'Skills are counted per project. Pick a project on the left to inspect them.',
      'action.retry': 'Try again',
      'action.reload': 'Reload',
      'action.save': 'Save',
      'action.saving': 'Saving…',
      'action.delete': 'Delete',
      'action.deleting': 'Deleting…',
      'action.revert': 'Revert',
      'action.expandAll': 'Expand all',
      'action.collapseAll': 'Collapse all',
      'status.loading': 'Loading projects…',
      'status.saved': 'Saved. Loaded constraint files are re-checked before your next message.',
      'status.deleted': 'Deleted. The session notices the removal before its next message.',
      'status.unsaved': 'Unsaved changes',
      'status.savedShort': 'Up to date',
      'status.existing': 'Existing',
      'status.missing': 'Not created',
      'status.tooLarge': 'This file is too large to edit here (over 512 KB).',
      'status.unsupported': 'You can read this file here, but editing is limited to AGENTS.md constraint files.',
      'error.load': 'Could not load projects.',
      'error.save': 'Could not save this file.',
      'error.delete': 'Could not delete this file.',
      'error.conflict': 'This file changed on disk after it was loaded. Reload it before saving again.',
      'error.forbidden': 'This page is not allowed to change this file.',
      'error.section': 'This section failed to render.',
      'error.noProject': 'Pick a project on the left to manage it.',
      'error.noFile': 'Pick a file on the left to read it.',
      'tree.root': 'Project root',
      'tree.browse': 'Browse',
      'tree.noProjects': 'No project is registered yet. Global constraints are still available below.',
      'editor.emptyTitle': 'No AGENTS.md here',
      'editor.emptyBody': 'This scope has no AGENTS.md candidate to edit.',
      'editor.missingHint': 'This file does not exist yet. Saving will create it.',
      'editor.stale': 'This file changed on disk. Reload it before saving so external edits are not overwritten.',
      'editor.tooLargeHint': 'Open this file in an editor instead; its size exceeds the inline limit.',
      'editor.placeholder': 'Write project or global instructions here…',
      'editor.lines': 'lines',
      'editor.unsavedHint': 'Press Ctrl+S to save',
      'confirm.discard': 'Discard unsaved changes?',
      'confirm.delete': 'Delete this constraint file? This cannot be undone.',
      'ctx.open': 'Open project root',
      'ctx.rename': 'Rename',
      'ctx.delete': 'Delete workspace',
      'ctx.renameTitle': 'Rename workspace',
      'ctx.renameBody': 'The folder on disk does not move; only the display name changes.',
      'ctx.renameLabel': 'Workspace name',
      'ctx.deleteTitle': 'Delete workspace?',
      'ctx.deleteBody': '"{name}" is removed from the list. Its folder and every session log stay on disk; its sessions move to Ungrouped.',
      'ctx.unnamed': 'this workspace',
      'ctx.confirm': 'Confirm',
      'ctx.cancel': 'Cancel',
      'ctx.deleteConfirm': 'Delete',
      'ctx.working': 'Working…',
      'ctx.error.blank': 'Enter a workspace name.',
      'ctx.error.conflict': 'Another workspace already uses that name.',
      'ctx.error.rename': 'Could not rename this workspace.',
      'ctx.error.delete': 'Could not delete this workspace.',
      'ctx.error.open': 'Could not open this project root.',
      'section.constraints.title': 'Constraints',
      'section.constraints.desc': 'AGENTS.md files that guide every session in this project.',
      'section.skills.title': 'Skills',
      'section.skills.desc': 'Reusable instruction packs discovered from the project.',
      'section.procedures.title': 'Procedures',
      'section.procedures.desc': 'Recorded pitfalls and their fixes, kept under .dsh/dsh-heipm/procedures/.',
      'section.quest.title': 'Task list',
      'section.quest.desc': 'Requirements and subtasks stored in .dsh/dsh-heipm/quest.db; tick a subtask to cycle its state.',
      'section.quest.title': 'Task list',
      'section.quest.desc': 'Requirements and subtasks stored in .dsh/dsh-heipm/quest.db; tick a subtask to cycle its state.',
      'empty.skills.title': 'No skill directory found',
      'empty.skills.body': 'Add a skill under .dsh/skills/<name>/SKILL.md (or skills/, .agents/skills/). The list below refreshes with the panel.',
      'skill.description': 'Description',
      'skill.noDescription': 'No description in front matter',
      'card.card': 'Card',
      'procedures.block.title': 'Procedures',
      'hint.readonly': 'Read only',
    }

    const ZH = {
      'nav.label': '项目管理',
      'style.nav': 'heipm 样式',
      'style.desc': '主面板与所有子插件共用的颜色。某一行停在「跟随主题」时，就用 DSH 主题本身的颜色。',
      'style.accent': '强调色',
      'style.panel': '面板底色',
      'style.card': '卡片底色',
      'style.ink': '正文颜色',
      'style.dim': '次要文字',
      'style.line': '边框颜色',
      'style.radius': '圆角',
      'style.preview': '这些颜色作用范围的实时预览',
      'style.previewSelect': '选中项',
      'style.previewButton': '按钮',
      'style.previewHead': '表格表头',
      'style.previewPanel': '抽屉 / 菜单',
      'style.previewMuted': '边框与次要文字',
      'style.accentHint': '影响：选中行、按钮、hover、表格悬停、过程图标',
      'style.panelHint': '影响：过程收纳抽屉、工作区右键菜单的底色',
      'style.cardHint': '影响：表格表头、「收起表格」按钮、卡片底',
      'style.inkHint': '影响：面板正文、表格单元格、抽屉标题',
      'style.dimHint': '影响：次要说明、路径、图标默认色',
      'style.lineHint': '影响：边框、分隔线、表格横线',
      'style.radiusHint': '影响：表格、图标条、菜单、按钮圆角',
      'style.follow': '跟随主题',
      'style.clear': '清除',
      'style.reset': '恢复默认',
      'style.note': '改动立即生效，保存在 ~/.dsh/dsh-heipm/theme.json。',
      'page.subtitle': '在左侧选择项目，再选择要管理的内容：约束、技能或经验流程。',
      'page.subtitle.basic': '在左侧选择项目，再选择要管理的内容：约束或技能。',
      'col.projects': '项目',
      'col.sections': '管理',
      'search.placeholder': '筛选项目…',
      'search.clear': '清除筛选',
      'search.noResults': '没有匹配的项目。',
      'search.results': '个匹配',
      'count.files': '个文件',
      'group.global': '全局',
      'group.projects': '项目',
      'scope.dsh': 'DSH 全局',
      'scope.shared': '共享全局',
      'global.scoped.title': '全局分组仅支持约束',
      'global.scoped.body': '技能与经验流程按项目统计，请在左侧选择具体项目查看。',
      'global.scoped.body.basic': '技能按项目统计，请在左侧选择具体项目查看。',
      'action.retry': '重试',
      'action.reload': '重新加载',
      'action.save': '保存',
      'action.saving': '保存中…',
      'action.delete': '删除',
      'action.deleting': '删除中…',
      'action.revert': '还原',
      'action.expandAll': '全部展开',
      'action.collapseAll': '全部收起',
      'status.loading': '正在读取项目…',
      'status.saved': '已保存。下一次发送消息前会重新校验已加载的约束。',
      'status.deleted': '已删除。会话会在下一次发送消息前感知到移除。',
      'status.unsaved': '有未保存的修改',
      'status.savedShort': '已是最新',
      'status.existing': '已存在',
      'status.missing': '未创建',
      'status.tooLarge': '文件超过 512 KB，无法在此编辑。',
      'status.unsupported': '此处可查看该文件，但只有 AGENTS.md 约束文件支持编辑。',
      'error.load': '读取项目失败。',
      'error.save': '保存失败。',
      'error.delete': '删除失败。',
      'error.conflict': '文件在加载后已在磁盘上被修改，请重新加载后再保存。',
      'error.forbidden': '当前页面无权修改该文件。',
      'error.section': '该分区渲染失败。',
      'error.noProject': '请在左侧选择一个项目。',
      'error.noFile': '请在左侧选择一个文件。',
      'tree.root': '项目根',
      'tree.browse': '浏览',
      'tree.noProjects': '还没有注册项目，仍可编辑下方全局约束。',
      'editor.emptyTitle': '这里没有 AGENTS.md',
      'editor.emptyBody': '当前作用域下没有可编辑的 AGENTS.md。',
      'editor.missingHint': '该文件尚不存在，保存后将创建。',
      'editor.stale': '该文件已在磁盘更新。重新加载后再保存，才不会覆盖外部改动。',
      'editor.tooLargeHint': '请用外部编辑器打开；文件大小超过内联编辑上限。',
      'editor.placeholder': '在这里编写全局或项目约束…',
      'editor.lines': '行',
      'editor.unsavedHint': '按 Ctrl+S 保存',
      'confirm.discard': '放弃未保存的修改？',
      'confirm.delete': '删除这个约束文件？此操作不可撤销。',
      'ctx.open': '打开项目根目录',
      'ctx.rename': '重命名',
      'ctx.delete': '删除工作区',
      'ctx.renameTitle': '重命名工作区',
      'ctx.renameBody': '磁盘上的目录不会移动，只修改显示名称。',
      'ctx.renameLabel': '工作区名称',
      'ctx.deleteTitle': '删除工作区？',
      'ctx.deleteBody': '「{name}」会从列表中移除；目录和所有会话记录都会保留，其中的会话会移到「未分组」。',
      'ctx.unnamed': '该工作区',
      'ctx.confirm': '确认',
      'ctx.cancel': '取消',
      'ctx.deleteConfirm': '删除',
      'ctx.working': '处理中…',
      'ctx.error.blank': '请输入工作区名称。',
      'ctx.error.conflict': '该名称已被其他工作区使用。',
      'ctx.error.rename': '重命名失败，请重试。',
      'ctx.error.delete': '删除失败，请重试。',
      'ctx.error.open': '打开项目根目录失败，请重试。',
      'section.constraints.title': '约束',
      'section.constraints.desc': '指导该项目每个会话的 AGENTS.md 文件。',
      'section.skills.title': '技能',
      'section.skills.desc': '从项目中发现的、可复用的指令包。',
      'section.procedures.title': '经验流程',
      'section.procedures.desc': '记录踩坑与解法的经验流程，存放在 .dsh/dsh-heipm/procedures/ 下。',
      'section.quest.title': '任务清单',
      'section.quest.desc': '存放在 .dsh/dsh-heipm/quest.db 的需求与子任务；点勾选框切换状态。',
      'empty.skills.title': '未发现技能目录',
      'empty.skills.body': '在 .dsh/skills/<名称>/SKILL.md（或 skills/、.agents/skills/）下添加技能，下方列表会随刷新更新。',
      'skill.description': '描述',
      'skill.noDescription': '前置信息中没有描述',
      'card.card': '卡片',
      'procedures.block.title': '经验流程',
      'hint.readonly': '只读',
    }

    const CSS = `
      .pm-page {
        /* Interactive accent for this panel only: orange hover/pressed.
           Local variables keep the shared theme (and other plugins) untouched. */
        --pm-accent: var(--hm-accent, #d9730d);
        --pm-accent-strong: color-mix(in srgb, var(--hm-accent, #d9730d) 78%, #000);
        --pm-accent-soft: color-mix(in srgb, var(--hm-accent, #d9730d) 12%, transparent);
        --pm-accent-softer: color-mix(in srgb, var(--hm-accent, #d9730d) 7%, transparent);
        --pm-accent-ring: color-mix(in srgb, var(--hm-accent, #d9730d) 45%, transparent);
        --pm-accent-ink: #ffffff;
      }
      /* The host theme may be switched manually, so the dark palette follows the
         probe colour the page sets from the theme's live --dsw-alias-bg-base
         rather than the OS preference. */
      .pm-page[data-scheme='dark'] {
        --pm-accent: var(--hm-accent, #ff9f43);
        --pm-accent-strong: color-mix(in srgb, var(--hm-accent, #ff9f43) 78%, #fff);
        --pm-accent-soft: color-mix(in srgb, var(--hm-accent, #ff9f43) 18%, transparent);
        --pm-accent-softer: color-mix(in srgb, var(--hm-accent, #ff9f43) 10%, transparent);
        --pm-accent-ring: color-mix(in srgb, var(--hm-accent, #ff9f43) 50%, transparent);
        --pm-accent-ink: #241503;
      }
      .pm-scheme-probe {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
        color: var(--dsw-alias-bg-base);
      }
      .pm-page {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        position: relative;
        color: var(--dsw-alias-label-primary);
        background: var(--dsw-alias-bg-base);
        font-family: inherit;
      }
      .pm-zoom-badge {
        position: absolute;
        right: 16px;
        bottom: 14px;
        z-index: 3;
        padding: 4px 8px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 6px;
        background: var(--dsw-alias-bg-overlay);
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 1.4;
        pointer-events: none;
      }
      .pm-btn {
        font: inherit;
        font-size: 12.5px;
        padding: 6px 12px;
        border-radius: 8px;
        border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
        cursor: pointer;
      }
      .pm-btn:hover:not(:disabled) {
        background: var(--pm-accent-soft);
        border-color: var(--pm-accent);
        color: var(--pm-accent-strong);
      }
      .pm-btn:active:not(:disabled) {
        background: var(--pm-accent);
        border-color: var(--pm-accent);
        color: var(--pm-accent-ink);
      }
      .pm-btn:focus-visible { outline: 2px solid var(--pm-accent-ring); outline-offset: 1px; }
      .pm-btn:disabled { opacity: .5; cursor: default; }
      .pm-btn.primary { background: var(--pm-accent); border-color: transparent; color: var(--pm-accent-ink); }
      .pm-btn.primary:hover:not(:disabled) { background: var(--pm-accent-strong); border-color: transparent; color: var(--pm-accent-ink); }
      .pm-btn.primary:active:not(:disabled) { background: var(--pm-accent-strong); color: var(--pm-accent-ink); }
      .pm-btn.danger { color: var(--dsw-alias-state-error-primary); }
      .pm-body { display: flex; flex: 1 1 auto; min-height: 0; }

      .pm-col { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid var(--dsw-alias-border-l1); }
      .pm-col.projects { flex: 0 0 auto; width: var(--pm-projects-width, 264px); min-width: 180px; background: var(--dsw-alias-bg-layer-1); }
      .pm-col.sections { flex: 0 0 auto; width: var(--pm-sections-width, 208px); min-width: 160px; background: var(--dsw-alias-bg-base); }
      .pm-col.main { flex: 1 1 auto; border-right: 0; min-width: 0; }
      .pm-col-head {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        padding: 12px 14px 8px; font-size: 11.5px; font-weight: 600; letter-spacing: .04em;
        text-transform: uppercase; color: var(--dsw-alias-label-secondary);
      }
      .pm-scroll { flex: 1 1 auto; overflow: auto; padding: 0 8px 14px; }
      .pm-search {
        display: flex; align-items: center; gap: 6px; margin: 12px 14px 8px;
        padding: 0 8px; height: 30px; border-radius: 8px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2);
      }
      .pm-search input {
        flex: 1 1 auto; min-width: 0; border: 0; outline: 0; background: transparent;
        font: inherit; font-size: 12.5px; color: var(--dsw-alias-label-primary);
      }
      .pm-search button {
        border: 0; background: transparent; color: var(--dsw-alias-label-secondary);
        cursor: pointer; font-size: 14px; line-height: 1; padding: 2px;
      }
      .pm-search:focus-within { border-color: var(--pm-accent); box-shadow: 0 0 0 2px var(--pm-accent-softer); }
      .pm-search button:hover { color: var(--pm-accent-strong); }
      .pm-search-meta { margin: 0 14px 6px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .pm-group-label {
        display: flex; align-items: center; gap: 6px; width: 100%;
        margin: 10px 0 4px; padding: 4px 6px; border: 0; border-radius: 6px;
        background: transparent; font: inherit; font-size: 11px; font-weight: 600;
        letter-spacing: .04em; text-transform: uppercase; color: var(--dsw-alias-label-secondary);
        text-align: left; cursor: pointer;
      }
      .pm-group-label:hover { color: var(--pm-accent-strong); }
      .pm-group-label:focus-visible { outline: 2px solid var(--pm-accent-ring); outline-offset: -2px; }
      .pm-group-caret { flex: 0 0 8px; color: var(--pm-accent); font-size: 9px; }
      .pm-group-name { flex: 1 1 auto; }
      .pm-group-count {
        flex: 0 0 auto; padding: 1px 7px; border-radius: 999px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-secondary); font-size: 10.5px; letter-spacing: 0;
        text-transform: none;
      }
      .pm-item {
        display: flex; align-items: center; gap: 9px; width: 100%;
        padding: 8px 9px; margin: 1px 0; border: 0; border-radius: 8px;
        background: transparent; color: inherit; text-align: left; cursor: pointer; font: inherit;
      }
      .pm-item:hover { background: var(--pm-accent-soft); }
      .pm-item:active { background: var(--pm-accent); }
      .pm-item:active .pm-item-title,
      .pm-item:active .pm-item-path { color: var(--pm-accent-ink); }
      .pm-item:active .pm-item-icon { color: var(--pm-accent-ink); }
      .pm-item:focus-visible { outline: 2px solid var(--pm-accent-ring); outline-offset: -2px; }
      .pm-item.active { background: var(--pm-accent-soft); }
      .pm-item.active .pm-item-title { color: var(--pm-accent-strong); font-weight: 600; }
      .pm-item.active .pm-item-icon { color: var(--pm-accent); }
      .pm-item-main { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; gap: 2px; }
      .pm-item-title { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .pm-item-path {
        font-size: 11px; color: var(--dsw-alias-label-secondary);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: left;
      }
      .pm-item-count {
        flex: 0 0 auto; font-size: 11px; min-width: 18px; text-align: center;
        padding: 1px 6px; border-radius: 999px;
        background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
      }
      .pm-item-icon { flex: 0 0 auto; display: grid; place-items: center; color: var(--dsw-alias-label-secondary); }
      .pm-empty-nav { padding: 14px; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }

      .pm-main { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: auto; }
      .pm-placeholder {
        margin: auto; display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 48px 28px; text-align: center; color: var(--dsw-alias-label-secondary);
      }
      .pm-placeholder strong { font-size: 14px; color: var(--dsw-alias-label-primary); }
      .pm-placeholder span { font-size: 12.5px; line-height: 1.6; max-width: 48ch; }
      .pm-placeholder code {
        max-width: 56ch; font-size: 11.5px; line-height: 1.5;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        color: var(--dsw-alias-state-error-primary);
        white-space: pre-wrap; word-break: break-word;
      }
      .pm-section-head {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
        padding: 20px 24px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1);
      }
      .pm-section-head h2 { margin: 0; font-size: 15.5px; font-weight: 600; }
      .pm-section-head p { margin: 4px 0 0; font-size: 12.5px; line-height: 1.55; color: var(--dsw-alias-label-secondary); max-width: 76ch; }
      .pm-section-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
      .pm-section-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
      .pm-banner {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        margin: 12px 24px 0; padding: 9px 12px; border-radius: 8px; font-size: 12.5px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2);
      }
      .pm-banner.success { border-color: var(--dsw-alias-state-success-primary); }
      .pm-banner.warn { background: var(--dsw-alias-bg-layer-1); border-color: var(--dsw-alias-state-warn-primary); }
      .pm-banner.error { color: var(--dsw-alias-state-error-primary); }

      .pm-card {
        display: flex; flex-direction: column; gap: 8px;
        margin: 12px 24px; padding: 14px 16px; border-radius: 10px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
      }
      .pm-card-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
      .pm-card-body { font-size: 12.5px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
      .pm-badge {
        font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px;
        border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary);
        background: var(--dsw-alias-bg-layer-2); white-space: nowrap;
      }
      .pm-badge.on { color: var(--pm-accent-strong); border-color: currentColor; }
      .pm-list { display: flex; flex-direction: column; gap: 1px; margin: 0; padding: 0; list-style: none; }
      .pm-row {
        display: flex; align-items: center; gap: 10px; width: 100%;
        padding: 8px 10px; border: 0; border-radius: 8px; background: transparent;
        color: inherit; text-align: left; cursor: pointer; font: inherit;
      }
      .pm-row:hover { background: var(--pm-accent-soft); }
      .pm-row:active { background: var(--pm-accent); }
      .pm-row:active .pm-row-title,
      .pm-row:active .pm-row-path { color: var(--pm-accent-ink); }
      .pm-row:focus-visible { outline: 2px solid var(--pm-accent-ring); outline-offset: -2px; }
      .pm-row.active { background: var(--pm-accent-soft); }
      .pm-row.static { cursor: default; }
      .pm-row.static:hover,
      .pm-row.static:active { background: transparent; }
      .pm-row-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
      .pm-row-title { font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .pm-row-path {
        font-size: 11px; color: var(--dsw-alias-label-secondary);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }

      /* knowledge procedures: index/template block, tile grid, markdown preview */
      .pm-btn.sm { font-size: 11.5px; padding: 4px 9px; }
      .pm-template-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .pm-template-chip { flex: 0 0 auto; }
      .pm-template-chip .pm-btn.sm { padding: 3px 8px; }
      .pm-template-tile .pm-btn.sm { padding: 3px 8px; }
      .pm-tools { margin-top: 10px; padding-top: 12px; border-top: 1px dashed var(--dsw-alias-border-l1); }
      .pm-tools-head {
        display: flex; align-items: center; gap: 8px;
        font-size: 12.5px; font-weight: 600;
      }
      .pm-tool-row {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
        gap: 8px; margin-top: 8px;
      }
      .pm-tool {
        display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0;
        padding: 7px 10px; border-radius: 8px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2);
      }
      .pm-tool.on { background: var(--dsw-alias-bg-layer-1); }
      .pm-tool-name {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.5px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .pm-tool .pm-btn.sm { flex: 0 0 auto; }
      .pm-index-note { margin: 0; font-size: 11.5px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }

      .pm-editor { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
      .pm-split-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
      .pm-resizer {
        flex: 0 0 6px;
        margin-left: -3px;
        position: relative;
        z-index: 1;
        cursor: col-resize;
        background: transparent;
        touch-action: none;
        outline: none;
      }
      .pm-resizer-grip {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 2px;
        width: 2px;
        border-radius: 1px;
        background: transparent;
        transition: background 120ms ease;
      }
      .pm-resizer:hover .pm-resizer-grip,
      .pm-resizer:focus-visible .pm-resizer-grip { background: var(--pm-accent); }
      .pm-resizer.dragging .pm-resizer-grip { background: var(--pm-accent-strong); box-shadow: 0 0 0 2px var(--pm-accent-softer); }
      .pm-resizer.dragging { cursor: col-resize; }
      .pm-resizer.left { margin-left: 0; margin-right: -3px; }
      .pm-resizer.left .pm-resizer-grip { left: auto; right: 2px; }
      body.pm-resizing .pm-page,
      body.pm-resizing .pm-page * { user-select: none !important; }
      .pm-body.resizing .pm-col { user-select: none; }
      @media (max-width: 1180px) {
        .pm-split-main { min-height: 46vh; }
      }
      .pm-editor-head { padding: 14px 24px 10px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .pm-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; min-width: 0; }
      .pm-chip { font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); }
      .pm-breadcrumb-path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .pm-subline { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 6px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .pm-subline code { font-size: 11.5px; }
      .pm-code-wrap {
        flex: 1 1 auto; min-height: 0; display: flex; margin: 12px 24px 0;
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; overflow: hidden;
        background: var(--dsw-alias-bg-layer-1);
      }
      .pm-gutter {
        flex: 0 0 auto; padding: 10px 8px; overflow: hidden; text-align: right;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.55;
        color: var(--dsw-alias-label-secondary); border-right: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-layer-2); user-select: none;
      }
      .pm-textarea {
        flex: 1 1 auto; min-width: 0; resize: none; border: 0; outline: 0; padding: 10px 12px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.55;
        color: var(--dsw-alias-label-primary); background: transparent; tab-size: 2;
      }
      .pm-footer {
        display: flex; align-items: center; gap: 10px; padding: 12px 24px 16px;
      }
      .pm-save-state { flex: 1 1 auto; font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .pm-save-state.dirty { color: var(--pm-accent-strong); }
      .pm-loading { display: flex; align-items: center; gap: 10px; margin: auto; font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
      .pm-spinner {
        width: 14px; height: 14px; border-radius: 999px;
        border: 2px solid var(--dsw-alias-border-l1); border-top-color: var(--pm-accent);
        animation: pm-spin .75s linear infinite;
      }
      @keyframes pm-spin { to { transform: rotate(360deg); } }
      @media (max-width: 980px) {
        .pm-body { flex-direction: column; overflow: auto; }
        .pm-col.projects { flex: 0 0 auto; width: auto; min-width: 0; max-height: 34vh; border-right: 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
        .pm-col.sections { flex: 0 0 auto; width: auto; min-width: 0; max-height: 26vh; border-right: 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
        .pm-col.main { min-height: 46vh; }
        .pm-resizer { display: none; }
      }
        /* knowledge procedures styles ship inside procedures/client.js */
    `

    function apiUrl() {
      return new URL(API_PATH, document.baseURI).toString()
    }

    async function api(payload, signal) {
      const response = await fetch(apiUrl(), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      })
      let body = null
      try {
        body = await response.json()
      } catch {
        body = null
      }
      if (!response.ok || !body || body.ok !== true) {
        const error = new Error((body && body.error) || `HTTP ${response.status}`)
        error.status = response.status
        error.code = body && body.code
        throw error
      }
      return body
    }

    /* ----- color scheme probe ----- */

    function relativeLuminance(rgb) {
      const channels = rgb.map(value => {
        const channel = value / 255
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    }

    function parseColor(value) {
      const text = String(value || '').trim()
      let match = /^#([0-9a-f]{6})$/i.exec(text)
      if (match) {
        const hex = match[1]
        return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16))
      }
      match = /^#([0-9a-f]{3})$/i.exec(text)
      if (match) return match[1].split('').map(char => parseInt(char + char, 16))
      match = /^rgba?\(([^)]+)\)$/i.exec(text)
      if (match) {
        const parts = match[1].split(/[,\s/]+/).filter(Boolean).slice(0, 3).map(Number)
        if (parts.length === 3 && parts.every(Number.isFinite)) return parts
      }
      return null
    }

    function useColorScheme(probeRef) {
      const [scheme, setScheme] = useState('light')

      useEffect(() => {
        const probe = probeRef.current
        if (!probe) return undefined
        let frame = 0
        const measure = () => {
          const rgb = parseColor(window.getComputedStyle(probe).color)
          if (!rgb) return
          const next = relativeLuminance(rgb) < 0.35 ? 'dark' : 'light'
          setScheme(current => current === next ? current : next)
        }
        const schedule = () => {
          if (frame) return
          frame = window.requestAnimationFrame(() => {
            frame = 0
            measure()
          })
        }
        schedule()
        const observer = typeof window.MutationObserver === 'function'
          ? new window.MutationObserver(schedule)
          : null
        if (observer) {
          observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-theme', 'data-color-scheme'],
          })
        }
        const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
        if (media && media.addEventListener) media.addEventListener('change', schedule)
        return () => {
          if (frame) window.cancelAnimationFrame(frame)
          if (observer) observer.disconnect()
          if (media && media.removeEventListener) media.removeEventListener('change', schedule)
        }
      }, [probeRef])

      return scheme
    }

    /* ----- data helpers ----- */

    function allFiles(data) {
      const files = []
      for (const scope of data.globals || []) {
        for (const file of scope.files || []) {
          if (file.name !== DISPLAY_FILE) continue
          files.push({ ...file, scopeId: scope.id, scopeLabel: scope.label, scopePath: scope.path, scopeKind: 'global' })
        }
      }
      for (const project of data.projects || []) {
        for (const directory of project.directories || []) {
          for (const file of directory.files || []) {
            if (file.name !== DISPLAY_FILE) continue
            files.push({
              ...file,
              scopeId: project.id,
              scopeLabel: project.title,
              scopePath: project.path,
              scopeKind: 'project',
              project,
              directory,
            })
          }
        }
      }
      return files
    }

    function formatBytes(size) {
      const value = Number(size || 0)
      if (value < 1024) return `${value} B`
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10 * 1024 ? 1 : 0)} KB`
      return `${(value / (1024 * 1024)).toFixed(1)} MB`
    }

    function fuzzyToken(text, token) {
      const haystack = String(text || '').toLowerCase()
      if (!haystack) return -1
      const at = haystack.indexOf(token)
      if (at >= 0) return 100 - Math.min(40, at) - Math.min(20, Math.max(0, haystack.length - token.length))
      let cursor = 0
      let score = 0
      let last = -1
      for (const character of token) {
        const found = haystack.indexOf(character, cursor)
        if (found < 0) return -1
        score += 8 - Math.min(6, Math.max(0, found - last - 1))
        cursor = found + 1
        last = found
      }
      return score
    }

    function scoreFields(fields, tokens) {
      if (!tokens.length) return 0
      let total = 0
      for (const token of tokens) {
        let best = -1
        for (const field of fields) {
          const score = fuzzyToken(field, token)
          if (score > best) best = score
        }
        if (best < 0) return -1
        total += best
      }
      return total
    }

    function isTypingTarget(target) {
      if (!target) return false
      const tag = String(target.tagName || '').toLowerCase()
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
    }

    function patchFile(data, filePath, patch) {
      return {
        ...data,
        globals: (data.globals || []).map(scope => ({
          ...scope,
          files: (scope.files || []).map(file => file.path === filePath ? { ...file, ...patch } : file),
        })),
        projects: (data.projects || []).map(project => ({
          ...project,
          directories: (project.directories || []).map(directory => ({
            ...directory,
            files: (directory.files || []).map(file => file.path === filePath ? { ...file, ...patch } : file),
          })),
        })),
      }
    }

    /* ----- icons ----- */

    function PanelIcon({ size = 18, active = false }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: active ? 2 : 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block' },
      },
        h('path', { d: 'M3 7.5a1.5 1.5 0 0 1 1.5-1.5h4l1.8 2h9.2A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z' }),
        h('path', { d: 'M6.5 13h2M6.5 16h2' }),
        h('path', { d: 'M11 13h6.5M11 16h4.5' }),
        h('circle', { cx: '17.5', cy: '16', r: '1.6' }),
      )
    }

    function SearchIcon() {
      return h('svg', {
        width: 13,
        height: 13,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        'aria-hidden': true,
        style: { display: 'block', flex: '0 0 auto' },
      },
        h('circle', { cx: '11', cy: '11', r: '6' }),
        h('path', { d: 'M16 16l5 5' }),
      )
    }

    function SectionIcon({ kind, size = 16 }) {
      const paths = {
        init: [h('path', { key: 'a', d: 'M12 4v10' }), h('path', { key: 'b', d: 'M8 8l4-4 4 4' }), h('path', { key: 'c', d: 'M5 16v3h14v-3' })],
        constraints: [h('path', { key: 'a', d: 'M6.5 3.5h8l3 3v14h-11z' }), h('path', { key: 'b', d: 'M14.5 3.5v3h3' }), h('path', { key: 'c', d: 'M9 11h6M9 14h6M9 17h3' })],
        skills: [h('path', { key: 'a', d: 'M12 3.5l2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z' })],
        procedures: [h('path', { key: 'a', d: 'M4 5.5h11l4 4v9H4z' }), h('path', { key: 'b', d: 'M8 12h7M8 15h4' })],
        quest: [h('path', { key: 'a', d: 'M5 6h2l1.4 1.4M5 11h2l1.4 1.4M5 16h2l1.4 1.4' }), h('path', { key: 'b', d: 'M11 6.5h8M11 11.5h8M11 16.5h5' })],
      }
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block' },
      }, paths[kind] || [])
    }

    /* ----- small building blocks ----- */

    function Badge({ on, children }) {
      return h('span', { className: `pm-badge${on ? ' on' : ''}` }, children)
    }

    function Placeholder({ icon, title, body }) {
      return h('div', { className: 'pm-placeholder' },
        h(PanelIcon, { size: 32, active: true }),
        h('strong', null, title),
        h('span', null, body),
      )
    }

    /* A section that throws must not take the whole application down: without a
       boundary the host root unmounts and the user sees a black page. The key on
       this boundary changes with project + section, so switching away resets it. */
    class SectionBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }
      static getDerivedStateFromError(error) {
        return { error }
      }
      componentDidCatch(error) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[dsh-heipm] section failed to render', error)
        }
      }
      render() {
        if (this.state.error) {
          return h('div', { className: 'pm-placeholder' },
            h('strong', null, this.props.t('error.section')),
            h('code', null, String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)),
            h('button', { type: 'button', className: 'pm-btn', onClick: () => this.setState({ error: null }) }, this.props.t('action.retry')),
          )
        }
        return this.props.children
      }
    }

    /* ----- editor for AGENTS.md constraint files ----- */

    function EditorPane({ file, t, onSaved, onDeleted, reload, stale, onStaleReload, onDirtyChange }) {
      const [draft, setDraft] = useState('')
      const [base, setBase] = useState('')
      const [fileError, setFileError] = useState(null)
      const [notice, setNotice] = useState(null)
      const [saving, setSaving] = useState(false)
      const [deleting, setDeleting] = useState(false)
      const gutterRef = useRef(null)
      const saveRef = useRef(() => {})

      const editable = file.scopeKind === 'project' || file.scopeKind === 'global'
      const dirty = draft !== base
      const busy = saving || deleting

      useEffect(() => {
        if (typeof onDirtyChange === 'function') onDirtyChange(dirty)
      }, [dirty, onDirtyChange])
      useEffect(() => () => {
        if (typeof onDirtyChange === 'function') onDirtyChange(false)
      }, [])
      const disabled = Boolean(file.tooLarge || (file.error && file.exists))
      const lineCount = Math.max(1, draft.split('\n').length)

      useEffect(() => {
        const content = typeof file.content === 'string' ? file.content : ''
        setDraft(content)
        setBase(content)
        setFileError(file.error || null)
        setNotice(null)
      }, [file.path, file.version, file.content, file.error])

      useEffect(() => {
        if (!notice) return undefined
        const timer = setTimeout(() => setNotice(null), 3200)
        return () => clearTimeout(timer)
      }, [notice])

      async function save() {
        if (!editable || saving || deleting) return
        if (!dirty && file.exists) return
        setSaving(true)
        setFileError(null)
        try {
          const result = await api({
            action: 'save',
            path: file.path,
            content: draft,
            version: file.exists ? file.version : null,
          })
          setBase(draft)
          setNotice({ kind: 'success', text: t('status.saved') })
          onSaved(file.path, { content: draft, version: result.version || null, size: result.size || 0 })
        } catch (error) {
          if (error && error.status === 409) setFileError(t('error.conflict'))
          else if (error && error.status === 403) setFileError(t('error.forbidden'))
          else setFileError(`${t('error.save')} ${error && error.message ? error.message : ''}`.trim())
        } finally {
          setSaving(false)
        }
      }
      saveRef.current = save

      async function removeFile() {
        if (!editable || !file.exists || busy) return
        if (!window.confirm(`${t('confirm.delete')}\n${file.displayPath}`)) return
        setDeleting(true)
        setFileError(null)
        try {
          await api({ action: 'delete', path: file.path, version: file.version })
          setDraft('')
          setBase('')
          setNotice({ kind: 'success', text: t('status.deleted') })
          onDeleted(file.path)
        } catch (error) {
          if (error && error.status === 409) setFileError(t('error.conflict'))
          else if (error && error.status === 403) setFileError(t('error.forbidden'))
          else setFileError(`${t('error.delete')} ${error && error.message ? error.message : ''}`.trim())
        } finally {
          setDeleting(false)
        }
      }

      useEffect(() => {
        const onKey = event => {
          if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 's') {
            event.preventDefault()
            saveRef.current()
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [])

      const canSave = editable && !disabled && (dirty || !file.exists)

      return h('div', { className: 'pm-editor' },
        h('div', { className: 'pm-editor-head' },
          h('div', { className: 'pm-breadcrumb' },
            h('span', { className: 'pm-chip' }, file.scopeLabel),
            h('span', { className: 'pm-breadcrumb-path', title: file.path }, file.relativePath || file.name),
          ),
          h('div', { className: 'pm-subline' },
            h(Badge, { on: file.exists }, file.exists ? t('status.existing') : t('status.missing')),
            dirty ? h('span', { className: 'pm-badge on' }, t('status.unsaved')) : null,
            h('code', null, file.displayPath),
            file.exists ? h('span', null, formatBytes(file.size)) : null,
          ),
        ),
        fileError || notice || !file.exists || file.tooLarge || stale
          ? h('div', null,
              stale
                ? h('div', { className: 'pm-banner warn' },
                    h('span', null, t('editor.stale')),
                    h('button', { type: 'button', className: 'pm-btn', onClick: onStaleReload }, t('action.reload')),
                  )
                : null,
              fileError
                ? h('div', { className: 'pm-banner error' },
                    h('span', null, fileError),
                    h('button', { type: 'button', className: 'pm-btn', onClick: reload }, t('action.reload')),
                  )
                : null,
              notice ? h('div', { className: `pm-banner ${notice.kind || ''}` }, h('span', null, notice.text)) : null,
              !file.exists && !fileError ? h('div', { className: 'pm-banner warn' }, h('span', null, t('editor.missingHint'))) : null,
              file.tooLarge ? h('div', { className: 'pm-banner warn' }, h('span', null, t('status.tooLarge'))) : null,
            )
          : null,
        file.tooLarge
          ? h(Placeholder, { title: t('status.tooLarge'), body: t('editor.tooLargeHint') })
          : h('div', { className: 'pm-code-wrap' },
              h('div', { className: 'pm-gutter', ref: gutterRef },
                Array.from({ length: lineCount }, (_, index) => h('div', { key: index }, index + 1)),
              ),
              h('textarea', {
                className: 'pm-textarea',
                value: draft,
                onChange: event => setDraft(event.target.value),
                onScroll: event => {
                  if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop
                },
                spellCheck: false,
                wrap: 'off',
                'aria-label': file.name,
                placeholder: t('editor.placeholder'),
                disabled: disabled || !editable,
              }),
            ),
        h('div', { className: 'pm-footer' },
          h('span', { className: `pm-save-state${dirty ? ' dirty' : ''}` },
            dirty ? `${t('status.unsaved')} · ${t('editor.unsavedHint')}` : t('status.savedShort'),
          ),
          editable && file.exists
            ? h('button', { type: 'button', className: 'pm-btn danger', disabled: busy, onClick: removeFile },
                deleting ? t('action.deleting') : t('action.delete'))
            : null,
          h('button', {
            type: 'button',
            className: 'pm-btn',
            disabled: !dirty || busy || !editable,
            onClick: () => { setDraft(base); setFileError(null) },
          }, t('action.revert')),
          h('button', {
            type: 'button',
            className: 'pm-btn primary',
            disabled: !canSave || busy,
            onClick: save,
          }, saving ? t('action.saving') : t('action.save')),
        ),
      )
    }

    /* ----- section: constraints ----- */

    function scopeFiles(data, scope) {
      if (!data || !scope) return []
      const all = allFiles(data)
      if (scope.kind === 'project') return all.filter(file => file.scopeId === scope.id)
      return all.filter(file => file.scopeKind === 'global' && file.scopeId === scope.id)
    }

    function resolveScopeFile(data, scope) {
      const files = scopeFiles(data, scope)
      const root = files.filter(file => file.directory && file.directory.relativePath === '.')
      const pool = root.length ? root : files
      return pool.find(file => file.exists) || pool[0] || null
    }

    /* ----- section: skills ----- */

    function SkillsSection({ t, project }) {
      const inventory = project && project.inventory ? project.inventory : null
      const skills = inventory && inventory.skills ? inventory.skills : { roots: [], items: [] }
      const items = Array.isArray(skills.items) ? skills.items : []
      const roots = Array.isArray(skills.roots) ? skills.roots : []
      return h('div', { className: 'pm-section-body', style: { overflow: 'auto' } },
        items.length === 0
          ? h('div', { className: 'pm-card' },
              h('div', { className: 'pm-card-title' }, t('empty.skills.title')),
              h('div', { className: 'pm-card-body' }, t('empty.skills.body')),
            )
          : h('div', { className: 'pm-card' },
              h('div', { className: 'pm-card-title' }, t('section.skills.title'), h(Badge, { on: true }, `${items.length}`)),
              h('ul', { className: 'pm-list' }, items.map(skill => h('li', { key: skill.id },
                h('div', { className: 'pm-row static' },
                  h('span', { className: 'pm-item-icon' }, h(SectionIcon, { kind: 'skills', size: 14 })),
                  h('span', { className: 'pm-row-main' },
                    h('span', { className: 'pm-row-title' }, skill.name),
                    h('span', { className: 'pm-row-path' }, skill.description || skill.displayPath),
                  ),
                  h(Badge, { on: skill.exists }, skill.root),
                ),
              ))),
            ),
        h('div', { className: 'pm-card' },
          h('div', { className: 'pm-card-title' }, t('tree.browse')),
          h('div', { className: 'pm-card-body' }, roots.join(' · ')),
        ),
      )
    }

    /* ----- knowledge procedures: package-local chunk ----- */

    let proceduresApi = null
    let proceduresError = null
    let proceduresReady = null
    let proceduresHost = null
    let questApi = null
    let questError = null
    let questReady = null
    let questHost = null

    /* ----- session markdown styling: tables get a richer look plus an expand toggle ----- */

    const MARKDOWN_CSS = "/* dsh-heipm-markdown · 会话 Markdown 表格美化（默认关闭）\n * DOM 契约（实测于 dsh-web-frontend 0.2.1-rc.3，与 dsh-streamfold 同一套思路：认结构属性，不认哈希类名）：\n *   表格外壳 div 同时带哈希类 _tableScroll_* / _tableFill_*，只有 4 列及以上才追加字面量 md-table-wide；\n *   3 列以内走 _tableFill_*（width:100%），两者都要覆盖，所以一律用 [class*=\"_tableScroll\"] + [class*=\"_tableFill\"]。\n * 视觉：圆角描边 + 高对比表头 + 强调线 + 斑马纹；表上方一行按钮控制「收起 = 整表隐藏 / 展开 = 整表显示」，\n * 默认展开，按钮对任何行数的表都可用。\n * 色值写死，不依赖可能缺失的宿主令牌。\n */\n.cv-table,\n.pm-table,\n[class*=\"_tableScroll\"],\n[class*=\"_tableFill\"] {\n  --hm-table-head: var(--hm-card, #262a31);\n  --hm-table-zebra: color-mix(in srgb, var(--hm-line, #94a3b8) 8%, transparent);\n  --hm-table-line: color-mix(in srgb, var(--hm-line, #94a3b8) 22%, transparent);\n  --hm-table-line-strong: color-mix(in srgb, var(--hm-line, #94a3b8) 38%, transparent);\n  --hm-table-row: var(--hm-ink, #eceef2);\n  --hm-table-row-dim: var(--hm-dim, #a8adb8);\n  --hm-table-hover: var(--hm-accent, #ff9f43);\n  position: relative;\n}\n\n.cv-table > table,\n.pm-table > table,\n[class*=\"_tableScroll\"] > table,\n[class*=\"_tableFill\"] > table {\n  background: transparent;\n  border: 1px solid var(--hm-table-line);\n  border-radius: var(--hm-radius, 10px);\n  border-collapse: separate;\n  border-spacing: 0;\n  overflow: hidden;\n}\n\n.cv-table > table tbody tr,\n.pm-table > table tbody tr,\n[class*=\"_tableScroll\"] > table tbody tr,\n[class*=\"_tableFill\"] > table tbody tr {\n  background-color: transparent;\n}\n\n.cv-table > table thead th,\n.pm-table > table thead th,\n[class*=\"_tableScroll\"] > table thead th,\n[class*=\"_tableFill\"] > table thead th {\n  background: var(--hm-table-head);\n  border-bottom: 1px solid var(--hm-table-line-strong);\n  color: var(--hm-table-row);\n  font-weight: 600;\n  padding: 10px 14px;\n  position: relative;\n}\n\n.cv-table > table thead th::after,\n.pm-table > table thead th::after,\n[class*=\"_tableScroll\"] > table thead th::after,\n[class*=\"_tableFill\"] > table thead th::after {\n  background: linear-gradient(90deg, var(--hm-table-hover), transparent 85%);\n  bottom: -1px;\n  content: \"\";\n  height: 2px;\n  left: 0;\n  opacity: .55;\n  position: absolute;\n  right: 0;\n}\n\n.cv-table > table tbody td,\n.pm-table > table tbody td,\n[class*=\"_tableScroll\"] > table tbody td,\n[class*=\"_tableFill\"] > table tbody td {\n  background: transparent;\n  border-bottom: 1px solid var(--hm-table-line);\n  color: var(--hm-table-row);\n  font-size: .95em;\n  line-height: 1.6;\n  padding: 9px 14px;\n  transition: background-color .15s ease;\n}\n\n.cv-table > table tbody tr:nth-child(even),\n.pm-table > table tbody tr:nth-child(even),\n[class*=\"_tableScroll\"] > table tbody tr:nth-child(even),\n[class*=\"_tableFill\"] > table tbody tr:nth-child(even) {\n  background-color: var(--hm-table-zebra);\n}\n\n.cv-table > table tbody tr:hover,\n.pm-table > table tbody tr:hover,\n[class*=\"_tableScroll\"] > table tbody tr:hover,\n[class*=\"_tableFill\"] > table tbody tr:hover {\n  background-color: color-mix(in srgb, var(--hm-accent, #ff9f43) 14%, transparent);\n}\n\n.cv-table > table tbody tr:last-child td,\n.pm-table > table tbody tr:last-child td,\n[class*=\"_tableScroll\"] > table tbody tr:last-child td,\n[class*=\"_tableFill\"] > table tbody tr:last-child td {\n  border-bottom: 0;\n}\n\n.cv-table > table th:first-child,\n.pm-table > table th:first-child,\n.cv-table > table td:first-child,\n.pm-table > table td:first-child,\n[class*=\"_tableScroll\"] > table th:first-child,\n[class*=\"_tableScroll\"] > table td:first-child,\n[class*=\"_tableFill\"] > table th:first-child,\n[class*=\"_tableFill\"] > table td:first-child {\n  padding-left: 14px;\n}\n\n.cv-table > table th:last-child,\n.pm-table > table th:last-child,\n.cv-table > table td:last-child,\n.pm-table > table td:last-child,\n[class*=\"_tableScroll\"] > table th:last-child,\n[class*=\"_tableScroll\"] > table td:last-child,\n[class*=\"_tableFill\"] > table th:last-child,\n[class*=\"_tableFill\"] > table td:last-child {\n  padding-right: 14px;\n}\n\n/* 收起 = 整张表都不显示（不是压扁成一条渐变虚线）；展开 = 完整显示。 */\n.cv-table-collapsed > table,\n.hm-table-collapsed > table {\n  display: none;\n}\n\n.hm-table-toggle {\n  align-items: center;\n  appearance: none;\n  box-sizing: border-box;\n  background: var(--hm-card, #262a31);\n  border: 1px solid rgba(148, 163, 184, .38);\n  border-radius: 999px;\n  color: var(--hm-dim, #a8adb8);\n  cursor: pointer;\n  display: inline-flex;\n  font-family: inherit;\n  font-size: 12px;\n  font-weight: 400;\n  gap: 6px;\n  justify-content: flex-start;\n  line-height: 1;\n  margin: 0 0 8px;\n  padding: 6px 12px;\n  user-select: none;\n  width: 100%;\n}\n\n.hm-table-toggle:hover {\n  border-color: var(--hm-accent, #ff9f43);\n  color: var(--hm-ink, #eceef2);\n}\n\n.hm-table-toggle::before {\n  color: var(--hm-accent, #ff9f43);\n  content: \"▾\";\n  display: inline-block;\n  transition: transform .2s ease;\n}\n\n.hm-table-toggle[aria-expanded=\"false\"]::before {\n  transform: rotate(-90deg);\n}\n\n.hm-table-toggle-label::after {\n  content: \"收起表格\";\n}\n\n.hm-table-toggle[aria-expanded=\"false\"] .hm-table-toggle-label::after {\n  content: \"展开表格\";\n}\n"

    function markdownScopeCss(css) {
      return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"/g, "'").trim()
    }

    const MARKDOWN_TOGGLE_MARK = 'data-hm-table-toggle'
    const MARKDOWN_HOST_MARK = 'cv-table'
    const MARKDOWN_COLLAPSED_CLASS = 'cv-table-collapsed'
    const COLLAPSED_SELECTORS = '[class*="cv-table"], .hm-table-collapsed'

    function markdownTableToggle(doc) {
      const toggle = doc.createElement('button')
      toggle.type = 'button'
      toggle.className = 'hm-table-toggle'
      toggle.setAttribute(MARKDOWN_TOGGLE_MARK, '')
      toggle.setAttribute('aria-expanded', 'false')
      toggle.title = '展开或收起这个表格'
      const text = doc.createElement('span')
      text.className = 'hm-table-toggle-label'
      toggle.appendChild(text)
      return toggle
    }

    /* 只认真正的「表格外壳」：宿主哈希外壳、我们自己盖的章，或知识卡预览里的 .pm-table。
     * 普通正文容器（如 .pm-md）也含表格，但它是内容容器，不能当外壳，否则按钮会被挂到整段正文头上。 */
    function isMarkdownTableHost(node) {
      if (!node || !node.getAttribute) return false
      if (node.getAttribute(MARKDOWN_HOST_MARK) !== null) return true
      for (const name of String(node.className || '').split(/\s+/)) {
        if (!name) continue
        if (name.indexOf('_tableScroll') === 0 || name.indexOf('_tableFill') === 0) return true
        if (name === 'pm-table') return true
      }
      return false
    }

    /* 外壳里只能有这一张表；塞了别的内容就说明它是容器，不是外壳。 */
    function isSingleTableShell(wrapper) {
      if (!isMarkdownTableHost(wrapper)) return false
      const tables = wrapper.querySelectorAll ? wrapper.querySelectorAll('table') : []
      return tables.length === 1
    }

    /* 收起即整表隐藏、展开即整表显示：只翻一个类，显隐全交给样式表。 */
    function markdownTableState(toggle, wrapper) {
      const expanded = toggle.getAttribute('aria-expanded') === 'true'
      if (wrapper.classList) wrapper.classList.toggle(MARKDOWN_COLLAPSED_CLASS, !expanded)
    }

    /* 同一段正文里可能有好几张表，所以按钮按「紧贴自己的表格」去重，不能按父容器去重。 */
    function ownMarkdownToggle(wrapper) {
      const previous = wrapper.previousElementSibling
      if (previous && previous.getAttribute && previous.getAttribute(MARKDOWN_TOGGLE_MARK) !== null) return previous
      return null
    }

    /* 按钮被 React 重渲染挤走后，重新挂回表格前面，保证始终紧贴自己的表格。 */
    function decorateMarkdownTable(wrapper) {
      if (!wrapper || typeof wrapper.querySelector !== 'function') return 0
      if (!isSingleTableShell(wrapper)) return 0
      const parent = wrapper.parentNode
      if (!parent || typeof parent.insertBefore !== 'function') return 0
      if (wrapper.classList && typeof wrapper.classList.add === 'function') wrapper.classList.add(MARKDOWN_HOST_MARK)
      const existing = ownMarkdownToggle(wrapper)
      if (existing) {
        markdownTableState(existing, wrapper)
        return 0
      }
      const toggle = markdownTableToggle(wrapper.ownerDocument)
      toggle.addEventListener('click', event => {
        if (event && typeof event.preventDefault === 'function') event.preventDefault()
        if (!wrapper || wrapper.isConnected === false || !isSingleTableShell(wrapper)) {
          if (typeof toggle.remove === 'function') toggle.remove()
          return
        }
        const next = toggle.getAttribute('aria-expanded') !== 'true'
        toggle.setAttribute('aria-expanded', next ? 'true' : 'false')
        markdownTableState(toggle, wrapper)
      })
      parent.insertBefore(toggle, wrapper)
      markdownTableState(toggle, wrapper)
      return 1
    }

    /* React 重渲染会把表格搬走、留下孤零零的按钮：凡是后面紧邻的已经不是表格外壳，就摘掉。 */
    function cleanStaleMarkdownToggles(scope) {
      if (!scope || typeof scope.querySelectorAll !== 'function') return 0
      let removed = 0
      for (const stale of scope.querySelectorAll('[' + MARKDOWN_TOGGLE_MARK + ']')) {
        const next = stale.nextElementSibling
        if (!next || !isSingleTableShell(next)) {
          if (typeof stale.remove === 'function') stale.remove()
          removed += 1
        }
      }
      return removed
    }

    function decorateMarkdownTables(root) {
      if (!root || typeof root.querySelectorAll !== 'function') return 0
      let count = 0
      const scopes = []
      for (const table of root.querySelectorAll('table')) {
        const parent = table.parentElement || table.parentNode
        if (!parent) continue
        if (parent.tagName === 'TABLE') continue
        const scope = parent.parentNode || parent
        if (scope && scopes.indexOf(scope) < 0) scopes.push(scope)
      }
      for (const scope of scopes) cleanStaleMarkdownToggles(scope)
      for (const table of root.querySelectorAll('table')) {
        const parent = table.parentElement || table.parentNode
        if (!parent) continue
        if (parent.tagName === 'TABLE') continue
        count += decorateMarkdownTable(parent)
      }
      return count
    }

    /* 复原要走「表格 → 外壳」这条路，别只靠属性选择器，免得宿主改了类名就漏清。 */
    function releaseMarkdownWrapper(wrapper) {
      if (!wrapper) return
      if (!wrapper.classList || typeof wrapper.classList.remove !== 'function') return
      wrapper.classList.remove(MARKDOWN_COLLAPSED_CLASS)
      wrapper.classList.remove('hm-table-collapsed')
      wrapper.classList.remove('cv-table-expanded')
      wrapper.classList.remove('hm-table-expanded')
      wrapper.classList.remove(MARKDOWN_HOST_MARK)
    }

    function stripMarkdownTables(root) {
      if (!root || typeof root.querySelectorAll !== 'function') return
      for (const toggle of root.querySelectorAll('[' + MARKDOWN_TOGGLE_MARK + ']')) {
        if (typeof toggle.remove === 'function') toggle.remove()
      }
      for (const table of root.querySelectorAll('table')) {
        const parent = table.parentElement || table.parentNode
        if (parent) releaseMarkdownWrapper(parent)
      }
      for (const wrapper of root.querySelectorAll(COLLAPSED_SELECTORS)) {
        releaseMarkdownWrapper(wrapper)
      }
    }

    function installMarkdownStyles(doc, css) {
      if (!doc || !doc.head || typeof doc.createElement !== 'function' || !css) return () => {}
      let tag = null
      if (typeof doc.querySelector === 'function') tag = doc.querySelector('style[data-plugin-css="heipm:markdown"]')
      const children = doc.head.children
      if (children) {
        for (let index = 0; index < children.length; index += 1) {
          const node = children[index]
          if (!tag && node && node.getAttribute && node.getAttribute('data-plugin-css') === 'heipm:markdown') tag = node
        }
      }
      if (!tag) {
        tag = doc.createElement('style')
        tag.setAttribute('data-dsh-heipm-markdown', '')
        if (tag.dataset) tag.dataset.plugin = 'dsh-heipm/markdown'
        tag.setAttribute('data-plugin-css', 'heipm:markdown')
        doc.head.appendChild(tag)
      }
      tag.textContent = css
      return () => {
        if (!tag) return
        if (typeof tag.remove === 'function') return tag.remove()
        if (tag.parentNode && Array.isArray(tag.parentNode.children)) {
          tag.parentNode.children = tag.parentNode.children.filter(node => node !== tag)
        }
      }
    }

    /* 流式输出会整段替换正文，所以「样式标签被摘掉」时也要重新挂上，而不是只在启动时挂一次。 */
    /* 子插件开关由宿主侧读「服务在 + 补丁没关掉」得出，浏览器这里定时问一次，关掉就立刻撤样式。 */
    async function markdownEnabled() {
      try {
        const body = await api({ action: 'markdown' })
        return body && body.enabled === true
      } catch {
        return null
      }
    }

    function createMarkdownStyling() {
      if (typeof document === 'undefined' || !document.head) return null
      const css = markdownScopeCss(MARKDOWN_CSS)
      const canObserve = typeof MutationObserver === 'function'
      let stopStyles = () => {}
      let headObserver = null
      let tableObserver = null
      let tableRoot = null
      const ensureStyles = () => {
        const tag = typeof document.querySelector === 'function'
          ? document.querySelector('style[data-plugin-css="heipm:markdown"]')
          : null
        if (tag && tag.parentNode === document.head) return
        if (headObserver) headObserver.disconnect()
        headObserver = null
        stopStyles()
        stopStyles = installMarkdownStyles(document, css)
        if (!canObserve) return
        headObserver = new MutationObserver(ensureStyles)
        headObserver.observe(document.head, { childList: true })
        headObserver.observe(document.documentElement, { childList: true })
      }
      const ensureTables = () => {
        const root = document.body || document.documentElement
        if (!root || root === tableRoot) return
        if (tableObserver) tableObserver.disconnect()
        tableObserver = canObserve ? new MutationObserver(records => {
          for (const record of records) {
            for (const node of record.addedNodes) {
              if (node.nodeType === 1) decorateMarkdownTables(node)
            }
          }
        }) : null
        if (tableObserver) tableObserver.observe(root, { childList: true, subtree: true })
        tableRoot = root
      }
      ensureStyles()
      ensureTables()
      decorateMarkdownTables(document)
      let stopShelf = () => {}
      try {
        stopShelf = createProcessShelf()
      } catch (error) {
        if (typeof console !== 'undefined') console.error('[heipm-markdown] process shelf failed', error)
      }
      return () => {
        if (tableObserver) tableObserver.disconnect()
        if (headObserver) headObserver.disconnect()
        tableObserver = null
        headObserver = null
        tableRoot = null
        stopShelf()
        stopStyles()
        stripMarkdownTables(document)
      }
    }

    /* 开关是一问一答：开着就确保装好，关着就撤干净，两种状态来回切都不用刷新页面。 */
    function startMarkdownStyling() {
      if (typeof document === 'undefined' || !document.head) return () => {}
      let dispose = null
      let stopped = false
      /* 只有宿主明确回答「关」才撤；问不到（旧宿主还没这个接口）就照常显示，别把样式一起吞掉。 */
      const settle = enabled => {
        if (stopped) return
        if (enabled === false) {
          if (dispose) {
            dispose()
            dispose = null
          }
          return
        }
        if (!dispose) {
          try {
            dispose = createMarkdownStyling()
          } catch (error) {
            if (typeof console !== 'undefined') console.error('[heipm-markdown] styling failed', error)
          }
        }
      }
      const tick = () => {
        markdownEnabled().then(settle, () => {})
      }
      tick()
      const timer = setInterval(tick, 2000)
      return () => {
        stopped = true
        clearInterval(timer)
        if (dispose) dispose()
        dispose = null
      }
    }


    /* ----- session process shelf: 过程行收进一条只有图标的框，点图标看详情 ----- */

    const PROC_SHELF_ATTR = 'data-hm-proc-shelf'
    const PROC_STEP_ATTR = 'data-hm-proc-step'
    const PROC_ROW_CLASS = 'hm-proc-row'
    const PROC_SHELF_CLASS = 'hm-proc-shelf'
    const PROC_STEP_CLASS = 'hm-proc-step'
    const PROC_SPIN_CLASS = 'hm-proc-spin'
    const PROC_POP_CLASS = 'hm-proc-drawer'
    const PROC_POP_HEAD_CLASS = 'hm-proc-drawer-head'
    const PROC_DRAWER_TITLE_CLASS = 'hm-proc-drawer-title'
    const PROC_DRAWER_META_CLASS = 'hm-proc-drawer-meta'
    const PROC_DRAWER_BODY_CLASS = 'hm-proc-drawer-body'
    /* 每步的起止时间：只认我们亲眼看到「running → 停」的步骤，历史步骤没有这段数据。 */
    const PROC_STEP_TIMES = typeof Map === 'function' ? new Map() : null
    /* 刚打开的抽屉不该被同一次手势里的「点外面」立刻关掉。 */
    let PROC_DRAWER_OPENED_AT = 0
    /* 抽屉开着时还在跑的那一步：收起宿主行会卸载正文，所以保持展开并持续重克隆。 */
    let PROC_DRAWER_LIVE = null
    const PROC_DRAWER_FOLLOW_PX = 48
    const PROC_DRAWER_GEO_KEY = 'heipm:proc-drawer:geo:v1'
    const PROC_FOLLOW_KEY = 'heipm:proc-drawer:follow:v1'
    let PROC_DRAWER_FOLLOW = readFollowState()
    const PROC_PIN_KEY = 'heipm:proc-drawer:pin:v1'
    let PROC_DRAWER_PINNED = readPinState()
    const PROC_DRAWER_MIN_W = 360
    const PROC_DRAWER_MIN_H = 220

    const PROCESS_SHELF_CSS = `
.hm-proc-row{display:none!important}
.hm-proc-shelf{align-items:center;align-self:flex-start;background:color-mix(in srgb, var(--hm-line, #94a3b8) 7%, transparent);border:1px solid color-mix(in srgb, var(--hm-line, #94a3b8) 28%, transparent);border-radius:var(--hm-radius, 10px);display:inline-flex;flex-wrap:wrap;gap:2px;margin:2px 0 6px;max-width:100%;padding:3px 6px}
.hm-proc-step{align-items:center;appearance:none;background:transparent;border:0;border-radius:9px;box-sizing:border-box;color:var(--hm-dim, #a8adb8);cursor:pointer;display:inline-flex;height:32px;justify-content:center;line-height:1;padding:0;width:32px}
.hm-proc-step:hover{background:color-mix(in srgb, var(--hm-accent, #ff9f43) 18%, transparent);color:var(--hm-accent, #ff9f43)}
.hm-proc-step[aria-expanded="true"]{background:color-mix(in srgb, var(--hm-accent, #ff9f43) 22%, transparent);color:var(--hm-accent, #ff9f43)}
.hm-proc-step svg{display:block;fill:currentColor;height:19px;width:19px}
.hm-proc-step[data-hm-proc-running="true"]{color:var(--hm-accent, #ff9f43)}
.hm-proc-step[data-hm-proc-running="true"] svg{display:none}
.hm-proc-spin{display:block;width:16px;height:16px;box-sizing:border-box;border-radius:999px;border:2px solid color-mix(in srgb, var(--hm-accent, #ff9f43) 30%, transparent);border-top-color:var(--hm-accent, #ff9f43);animation:hm-proc-spin .7s linear infinite}
@keyframes hm-proc-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.hm-proc-spin{animation-duration:2.4s}}
.hm-proc-drawer-follow[aria-pressed="true"] svg{display:none}
.hm-proc-drawer-follow[aria-pressed="true"]::before{content:'';display:block;flex:0 0 auto;width:11px;height:11px;box-sizing:border-box;border-radius:999px;border:2px solid color-mix(in srgb, var(--hm-accent, #ff9f43) 30%, transparent);border-top-color:var(--hm-accent, #ff9f43);animation:hm-proc-spin .7s linear infinite}
.hm-proc-drawer{background:var(--hm-panel, #1b1f26);border:1px solid color-mix(in srgb, var(--hm-line, #94a3b8) 30%, transparent);border-radius:var(--hm-radius, 10px);box-shadow:0 24px 64px rgba(0,0,0,.5);box-sizing:border-box;color:var(--hm-ink, #eceef2);display:flex;flex-direction:column;font-size:13px;line-height:1.65;overflow:hidden;position:fixed;z-index:1500}
.hm-proc-drawer[hidden]{display:none}
.hm-proc-drawer-head{align-items:center;border-bottom:1px solid color-mix(in srgb, var(--hm-line, #94a3b8) 22%, transparent);cursor:move;display:flex;flex:0 0 auto;gap:10px;padding:14px 16px;user-select:none}
.hm-proc-drawer-grip{background:linear-gradient(135deg, transparent 0 50%, color-mix(in srgb, var(--hm-line, #94a3b8) 50%, transparent) 50% 100%);border-bottom-right-radius:var(--hm-radius, 10px);bottom:0;cursor:nwse-resize;height:16px;position:absolute;right:0;width:16px}
.hm-proc-drawer-title{color:var(--hm-ink, #eceef2);font-size:14px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hm-proc-drawer-meta{color:var(--hm-dim, #a8adb8);font-size:12px;margin-left:auto;white-space:nowrap}
.hm-proc-drawer-close{appearance:none;background:transparent;border:0;border-radius:8px;color:var(--hm-dim, #a8adb8);cursor:pointer;flex:0 0 auto;font-size:18px;height:28px;line-height:1;padding:0;width:28px}
.hm-proc-drawer-close:hover{background:color-mix(in srgb, var(--hm-line, #94a3b8) 14%, transparent);color:var(--hm-ink, #eceef2)}
.hm-proc-drawer-follow{appearance:none;background:transparent;border:1px solid color-mix(in srgb, var(--hm-line, #94a3b8) 35%, transparent);border-radius:8px;color:var(--hm-dim, #a8adb8);cursor:pointer;flex:0 0 auto;font-size:12px;height:26px;line-height:1;padding:0 9px;white-space:nowrap}
.hm-proc-drawer-follow:hover{border-color:color-mix(in srgb, var(--hm-accent, #ff9f43) 55%, transparent);color:var(--hm-accent, #ff9f43)}
.hm-proc-drawer-follow[aria-pressed="true"]{background:color-mix(in srgb, var(--hm-accent, #ff9f43) 22%, transparent);border-color:color-mix(in srgb, var(--hm-accent, #ff9f43) 60%, transparent);color:var(--hm-accent, #ff9f43)}
.hm-proc-drawer-pin{appearance:none;background:transparent;border:1px solid color-mix(in srgb, var(--hm-line, #94a3b8) 35%, transparent);border-radius:8px;color:var(--hm-dim, #a8adb8);cursor:pointer;flex:0 0 auto;font-size:12px;height:26px;line-height:1;padding:0 9px;white-space:nowrap}
.hm-proc-drawer-pin:hover{border-color:color-mix(in srgb, var(--hm-accent, #ff9f43) 55%, transparent);color:var(--hm-accent, #ff9f43)}
.hm-proc-drawer-pin[aria-pressed="true"]{background:color-mix(in srgb, var(--hm-accent, #ff9f43) 22%, transparent);border-color:color-mix(in srgb, var(--hm-accent, #ff9f43) 60%, transparent);color:var(--hm-accent, #ff9f43)}
.hm-proc-drawer-follow,.hm-proc-drawer-pin{align-items:center;display:inline-flex;gap:5px}
.hm-proc-drawer-follow svg,.hm-proc-drawer-pin svg{display:block;fill:currentColor;height:13px;width:13px}
.hm-proc-drawer-body{display:flex;flex:1 1 auto;flex-direction:column;min-height:0;overflow:auto;padding:14px 16px}
.hm-proc-drawer-body>*{flex:1 1 auto;min-height:0;max-height:none!important;overflow:visible!important}
.hm-proc-drawer-body [class*="_body"],.hm-proc-drawer-body [class*="_bodyScroll"],.hm-proc-drawer-body [class*="_ioSection"],.hm-proc-drawer-body [class*="_code"]{max-height:none!important;overflow:visible!important}
`

    /* 一行算「过程」还是「正文」：只看 kind / groupPart / 内容特征，不认哈希类名。 */
    function classifyFlowRow(row) {
      const kind = row && row.kind
      /* turn-process 是宿主自己的「已折叠 N 行」摘要按钮，不是一步：藏掉，但不给图标。 */
      if (kind === 'turn-process') return 'skip'
      if (kind === 'tool-call') return 'process'
      if (kind === 'assistant-step') {
        if (row.part === 'reasoning') return 'process'
        if (row.part === 'response') return 'prose'
        if (row.hasProse) return 'prose'
        return row.hasThinking || row.hasTool ? 'process' : 'prose'
      }
      return 'prose'
    }

    /* 连续的过程行算一组；中间夹一条正文就断开，「跳过」的行不打断。 */
    function planProcessGroups(roles) {
      const groups = []
      let current = []
      for (let index = 0; index < roles.length; index += 1) {
        const role = roles[index]
        if (role === 'process') current.push(index)
        else if (role === 'skip') continue
        else if (current.length) {
          groups.push(current)
          current = []
        }
      }
      if (current.length) groups.push(current)
      return groups
    }

    function insideThinking(node) {
      return !!(node && node.closest && node.closest(HOST_CONTRACT.rowThinking))
    }

    function flowHasProse(row) {
      for (const node of row.querySelectorAll('p, ul, ol, pre, table, blockquote, h1, h2, h3, h4, h5, h6')) {
        if (!insideThinking(node)) return true
      }
      return false
    }

    function describeFlowRow(row) {
      return {
        kind: row.getAttribute('data-chat-flow-kind'),
        part: row.getAttribute('data-chat-group-part') || '',
        hasThinking: !!row.querySelector(HOST_CONTRACT.rowThinking),
        hasTool: !!row.querySelector(HOST_CONTRACT.rowTool),
        hasProse: flowHasProse(row),
      }
    }

    function svgIcon(doc, path) {
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '0 0 16 16')
      svg.setAttribute('aria-hidden', 'true')
      const shape = doc.createElementNS('http://www.w3.org/2000/svg', 'path')
      shape.setAttribute('d', path)
      shape.setAttribute('fill', 'currentColor')
      svg.appendChild(shape)
      return svg
    }

    const FOLLOW_ICON = 'M8 3.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2zm0 2.4a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4z'
    const PIN_ICON = 'M8 1.4a4.6 4.6 0 0 0-4.6 4.6c0 3.4 4.6 8.6 4.6 8.6s4.6-5.2 4.6-8.6A4.6 4.6 0 0 0 8 1.4zm0 2.3a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6z'

    /* 图标在文字左边；标签单独一个 span，刷新文案时不重画图标。 */
    function appendButtonIcon(button, doc, path) {
      const icon = svgIcon(doc, path)
      const shape = icon.querySelector('path')
      if (shape) shape.setAttribute('fill-rule', 'evenodd')
      icon.setAttribute('class', 'hm-proc-drawer-icon')
      const label = doc.createElement('span')
      label.className = 'hm-proc-drawer-label'
      button.appendChild(icon)
      button.appendChild(label)
    }

    /* 图标直接借宿主的：行标题前方那个 svg；借不到才画一个自己的。 */
    /* 只借「行首图标」：宿主展开时 leading 里只剩收起箭头，不能当图标用。 */
    function rowIcon(row, doc) {
      const leading = row.querySelector('[class*="_leading"]')
      const svgs = leading ? leading.querySelectorAll('svg') : []
      const toggle = row.querySelector('[data-disclosure-row][aria-expanded]')
      const open = !!(toggle && toggle.getAttribute('aria-expanded') === 'true')
      let host = null
      /* 收起态：图标 + 悬停箭头（2 个 svg）或只有图标（1 个）；展开态：只有箭头。 */
      if (svgs.length >= 2) host = svgs[0]
      else if (svgs.length === 1 && !open) host = svgs[0]
      if (host && typeof host.cloneNode === 'function') {
        const clone = host.cloneNode(true)
        clone.setAttribute('aria-hidden', 'true')
        return clone
      }
      const kind = row.getAttribute('data-chat-flow-kind')
      const path = kind === 'tool-call'
        ? 'M8 2.4l5.6 5.6L8 13.6 2.4 8z'
        : 'M8 1.4l1.5 4.1 4.1 1.5-4.1 1.5L8 12.6 6.5 8.5 2.4 7l4.1-1.5z'
      return svgIcon(doc, path)
    }

    function rowSummary(row) {
      const label = row.querySelector(HOST_CONTRACT.rowDisclosure)
      const text = label ? label.textContent : row.textContent
      return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 60)
    }

    /* 展开/收起靠宿主自己的控件：它不响应除非 aria-expanded 真的变了。 */
    function processToggle(row) {
      for (const node of row.querySelectorAll('[data-sample][aria-expanded]')) return node
      for (const node of row.querySelectorAll(HOST_CONTRACT.rowDisclosure)) {
        if (node.getAttribute('aria-expanded') !== null) return node
      }
      return null
    }

    function expandProcessRow(row) {
      const toggle = processToggle(row)
      if (!toggle || toggle.getAttribute('aria-expanded') === 'true') return false
      if (typeof toggle.click === 'function') toggle.click()
      return true
    }

    function collapseProcessRow(row) {
      const toggle = processToggle(row)
      if (!toggle || toggle.getAttribute('aria-expanded') !== 'true') return
      if (typeof toggle.click === 'function') toggle.click()
    }

    function detailBodyOf(row) {
      return row.querySelector(HOST_CONTRACT.rowBody)
        || row.querySelector('[data-sample="bash"]')
        || row.querySelector('.ioCard')
        || row
    }

    function later(fn) {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(fn))
        return
      }
      setTimeout(fn, 50)
    }

    /* 一步的耗时：只有「我们看着它从 running 变成结束」的步骤才有数。 */
    function stepTiming(key) {
      if (!PROC_STEP_TIMES || key === null || key === undefined) return null
      return PROC_STEP_TIMES.get(String(key)) || null
    }

    function formatStepTime(ms) {
      if (!(ms >= 0)) return ''
      if (ms < 1000) return Math.round(ms) + 'ms'
      const seconds = ms / 1000
      if (seconds < 60) return (seconds < 10 ? seconds.toFixed(1) : String(Math.round(seconds))) + 's'
      return Math.floor(seconds / 60) + 'm ' + Math.round(seconds % 60) + 's'
    }

    /* 单步没有 token 数据，能拿到的只有整轮用量；有就顺带显示，没有就不显示。 */
    function turnUsageText(row) {
      const turn = row.getAttribute('data-chat-turn')
      if (turn === null || turn === undefined || !row.parentElement) return ''
      let tail = null
      for (const node of row.parentElement.querySelectorAll('[data-chat-flow-kind="turn-tail"]')) {
        if (node.getAttribute('data-chat-turn') === String(turn)) {
          tail = node
          break
        }
      }
      if (!tail) return ''
      const text = String(tail.textContent || '').replace(/\s+/g, ' ').trim()
      return text.length > 48 ? '' : text
    }

    function ensureProcessDrawer(doc) {
      const existing = doc.querySelector('.' + PROC_POP_CLASS)
      if (existing) return existing
      const drawer = doc.createElement('aside')
      drawer.className = PROC_POP_CLASS
      drawer.setAttribute('role', 'dialog')
      drawer.setAttribute('aria-label', '步骤详情')
      drawer.setAttribute('data-plugin-ui', 'heipm:process-shelf')
      drawer.hidden = true
      const head = doc.createElement('div')
      head.className = PROC_POP_HEAD_CLASS
      const title = doc.createElement('span')
      title.className = PROC_DRAWER_TITLE_CLASS
      const meta = doc.createElement('span')
      meta.className = PROC_DRAWER_META_CLASS
      const follow = doc.createElement('button')
      follow.type = 'button'
      follow.className = 'hm-proc-drawer-follow'
      follow.addEventListener('click', () => setDrawerFollow(doc, !PROC_DRAWER_FOLLOW))
      appendButtonIcon(follow, doc, FOLLOW_ICON)
      const pin = doc.createElement('button')
      pin.type = 'button'
      pin.className = 'hm-proc-drawer-pin'
      pin.addEventListener('click', () => setDrawerPin(doc, !PROC_DRAWER_PINNED))
      appendButtonIcon(pin, doc, PIN_ICON)
      const close = doc.createElement('button')
      close.type = 'button'
      close.className = 'hm-proc-drawer-close'
      close.setAttribute('aria-label', '关闭')
      close.textContent = '×'
      close.addEventListener('click', () => closeProcessDrawer(doc, 'close-button'))
      head.appendChild(title)
      head.appendChild(meta)
      head.appendChild(follow)
      head.appendChild(pin)
      head.appendChild(close)
      const body = doc.createElement('div')
      body.className = PROC_DRAWER_BODY_CLASS
      const grip = doc.createElement('div')
      grip.className = 'hm-proc-drawer-grip'
      grip.setAttribute('aria-hidden', 'true')
      drawer.appendChild(head)
      syncFollowButton(drawer)
      syncPinButton(drawer)
      drawer.appendChild(body)
      drawer.appendChild(grip)
      doc.body.appendChild(drawer)
      wireDrawerMove(drawer, doc)
      return drawer
    }

    function fillProcessDrawer(drawer, row, doc) {
      const title = drawer.querySelector('.' + PROC_DRAWER_TITLE_CLASS)
      const meta = drawer.querySelector('.' + PROC_DRAWER_META_CLASS)
      const body = drawer.querySelector('.' + PROC_DRAWER_BODY_CLASS)
      if (title) title.textContent = rowSummary(row) || '过程'
      const parts = []
      const tool = row.querySelector('[data-tool]')
      if (tool) parts.push(tool.getAttribute('data-tool'))
      const timing = stepTiming(row.getAttribute('data-chat-flow-key'))
      if (timing && timing.end) parts.push('耗时 ' + formatStepTime(timing.end - timing.start))
      else if (timing) parts.push('进行中')
      const usage = turnUsageText(row)
      if (usage) parts.push(usage)
      if (meta) meta.textContent = parts.join(' · ')
      const detail = detailBodyOf(row)
      if (!body) return
      body.textContent = ''
      if (detail && detail !== row && typeof detail.cloneNode === 'function') {
        const clone = detail.cloneNode(true)
        /* 宿主给正文挂了行内 max-height/overflow（限高小窗），抽屉里要占满，清掉。 */
        if (clone.querySelectorAll) {
          for (const node of clone.querySelectorAll('[style]')) {
            if (!node.style) continue
            node.style.maxHeight = ''
            node.style.height = ''
            node.style.overflow = ''
          }
        }
        body.appendChild(clone)
      } else body.appendChild(doc.createTextNode('这一步没有可展开的正文'))
    }

    /* 抽屉是一扇独立小窗：能拖、能拉、位置和大小记住。 */
    function readDrawerGeo() {
      try {
        if (typeof localStorage === 'undefined') return null
        const raw = localStorage.getItem(PROC_DRAWER_GEO_KEY)
        if (!raw) return null
        const geo = JSON.parse(raw)
        const pick = key => (Number.isFinite(Number(geo[key])) ? Number(geo[key]) : null)
        const left = pick('left')
        const top = pick('top')
        const width = pick('width')
        const height = pick('height')
        if (left === null || top === null || width === null || height === null) return null
        return { left, top, width, height }
      } catch (error) {
        return null
      }
    }

    function saveDrawerGeo(geo) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(PROC_DRAWER_GEO_KEY, JSON.stringify(geo))
      } catch (error) {
        /* 存不下就算了，下次用默认位置 */
      }
    }

    function viewportSize(doc) {
      const root = doc && doc.documentElement
      const width = (root && root.clientWidth) || (typeof window !== 'undefined' && window.innerWidth) || 1200
      const height = (root && root.clientHeight) || (typeof window !== 'undefined' && window.innerHeight) || 800
      return { width, height }
    }

    function clampDrawerGeo(doc, geo) {
      const view = viewportSize(doc)
      const width = Math.min(Math.max(geo.width, PROC_DRAWER_MIN_W), Math.max(PROC_DRAWER_MIN_W, view.width - 16))
      const height = Math.min(Math.max(geo.height, PROC_DRAWER_MIN_H), Math.max(PROC_DRAWER_MIN_H, view.height - 16))
      return {
        left: Math.min(Math.max(geo.left, 8), Math.max(8, view.width - width - 8)),
        top: Math.min(Math.max(geo.top, 8), Math.max(8, view.height - height - 8)),
        width,
        height,
      }
    }

    function defaultDrawerGeo(doc) {
      const view = viewportSize(doc)
      const width = Math.min(520, Math.max(PROC_DRAWER_MIN_W, view.width - 32))
      const height = Math.min(Math.round(view.height * 0.72), Math.max(PROC_DRAWER_MIN_H, view.height - 32))
      return { left: view.width - width - 24, top: Math.round((view.height - height) / 2), width, height }
    }

    function applyDrawerGeo(drawer, doc, geo) {
      const box = clampDrawerGeo(doc, geo)
      drawer.style.left = box.left + 'px'
      drawer.style.top = box.top + 'px'
      drawer.style.width = box.width + 'px'
      drawer.style.height = box.height + 'px'
      drawer.__hmGeo = box
      return box
    }

    function placeDrawer(drawer, doc) {
      applyDrawerGeo(drawer, doc, readDrawerGeo() || defaultDrawerGeo(doc))
    }

    /* 按住头部挪、按住右下角拉；松手才写一次 localStorage。 */
    function wireDrawerMove(drawer, doc) {
      const head = drawer.querySelector('.' + PROC_POP_HEAD_CLASS)
      const grip = drawer.querySelector('.hm-proc-drawer-grip')
      const begin = (event, mode) => {
        if (!event || (typeof event.button === 'number' && event.button !== 0)) return
        if (mode === 'move' && event.target && typeof event.target.closest === 'function' && event.target.closest('button')) return
        const rect = drawer.getBoundingClientRect ? drawer.getBoundingClientRect() : null
        if (!rect) return
        if (event.preventDefault) event.preventDefault()
        const start = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height }
        const move = ev => {
          const dx = ev.clientX - start.x
          const dy = ev.clientY - start.y
          const next = mode === 'move'
            ? { left: start.left + dx, top: start.top + dy, width: start.width, height: start.height }
            : { left: start.left, top: start.top, width: start.width + dx, height: start.height + dy }
          applyDrawerGeo(drawer, doc, next)
        }
        const end = () => {
          doc.removeEventListener('mousemove', move, true)
          doc.removeEventListener('mouseup', end, true)
          if (drawer.__hmGeo) saveDrawerGeo(drawer.__hmGeo)
        }
        doc.addEventListener('mousemove', move, true)
        doc.addEventListener('mouseup', end, true)
      }
      if (head && head.addEventListener) head.addEventListener('mousedown', event => begin(event, 'move'))
      if (grip && grip.addEventListener) grip.addEventListener('mousedown', event => begin(event, 'resize'))
    }

    function processRowByKey(doc, key) {
      if (key === null || key === undefined) return null
      const value = String(key).replace(/["\\]/g, '\\$&')
      return doc.querySelector(HOST_CONTRACT.flowRow + '[data-chat-flow-key="' + value + '"]')
    }

    /* 「跟随」开关：状态记进 localStorage；点谁固定谁是默认行为。 */
    function readFollowState() {
      try {
        if (typeof localStorage === 'undefined') return false
        return localStorage.getItem(PROC_FOLLOW_KEY) === '1'
      } catch (error) {
        return false
      }
    }

    function writeFollowState(on) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(PROC_FOLLOW_KEY, on ? '1' : '0')
      } catch (error) {
        /* 存不下就只在本页生效 */
      }
    }

    function isRunningStep(row) {
      if (!row || typeof row.querySelector !== 'function') return false
      return !!(row.querySelector('[data-state="running"]') || row.querySelector('[data-streaming]'))
    }

    /* 有正在跑的步骤就跟它；都跑完了就停在最后一步。 */
    function pickFollowIndex(roles, running) {
      let last = -1
      let runningIndex = -1
      for (let index = 0; index < roles.length; index += 1) {
        if (roles[index] !== 'process') continue
        last = index
        if (running[index]) runningIndex = index
      }
      return runningIndex >= 0 ? runningIndex : last
    }

    function currentStepRow(doc) {
      const containers = flowContainers(doc)
      for (let index = containers.length - 1; index >= 0; index -= 1) {
        const rows = topFlowRows(containers[index])
        if (!rows.length) continue
        const roles = rows.map((row, at) => roleOfFlowRow(row, at === rows.length - 1))
        const pick = pickFollowIndex(roles, rows.map(isRunningStep))
        if (pick >= 0) return rows[pick]
      }
      return null
    }

    function stepButtonById(doc, id) {
      const value = String(id || '').replace(/["\\]/g, '\\$&')
      return doc.querySelector('.' + PROC_STEP_CLASS + '[data-hm-proc-id="' + value + '"]')
    }

    /* 「固定」开关：开着时点外面不关窗；Esc 和 × 仍然能关。 */
    function readPinState() {
      try {
        if (typeof localStorage === 'undefined') return false
        return localStorage.getItem(PROC_PIN_KEY) === '1'
      } catch (error) {
        return false
      }
    }

    function writePinState(on) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(PROC_PIN_KEY, on ? '1' : '0')
      } catch (error) {
        /* 存不下就只在本页生效 */
      }
    }

    function setButtonLabel(button, text) {
      const label = button.querySelector('.hm-proc-drawer-label')
      if (label) label.textContent = text
      else button.textContent = text
    }

    function syncPinButton(drawer) {
      const button = drawer.querySelector('.hm-proc-drawer-pin')
      if (!button) return
      button.setAttribute('aria-pressed', PROC_DRAWER_PINNED ? 'true' : 'false')
      setButtonLabel(button, PROC_DRAWER_PINNED ? '已固定' : '固定')
      button.title = PROC_DRAWER_PINNED ? '已固定：点击外面不会关闭，点此恢复' : '固定窗口：点击外面不关闭'
    }

    function setDrawerPin(doc, on) {
      PROC_DRAWER_PINNED = !!on
      writePinState(PROC_DRAWER_PINNED)
      const drawer = doc.querySelector('.' + PROC_POP_CLASS)
      if (drawer) syncPinButton(drawer)
    }

    function syncFollowButton(drawer) {
      const button = drawer.querySelector('.hm-proc-drawer-follow')
      if (!button) return
      button.setAttribute('aria-pressed', PROC_DRAWER_FOLLOW ? 'true' : 'false')
      setButtonLabel(button, PROC_DRAWER_FOLLOW ? '跟随中' : '跟随')
      button.title = PROC_DRAWER_FOLLOW ? '正在跟随当前模型步，点此关闭' : '跟随当前模型步'
    }

    /* 跟随中：当前步换了就把抽屉切过去，老步骤收回原样。 */
    function adoptFollowStep(doc) {
      const live = PROC_DRAWER_LIVE
      if (!PROC_DRAWER_FOLLOW || !live) return false
      const drawer = doc.querySelector('.' + PROC_POP_CLASS)
      if (!drawer || drawer.hidden) return false
      const row = currentStepRow(doc)
      if (!row || row === live.row) return false
      const id = String(row.getAttribute('data-chat-flow-key') || '')
      for (const other of doc.querySelectorAll('.' + PROC_STEP_CLASS + '[aria-expanded="true"]')) {
        other.setAttribute('aria-expanded', 'false')
      }
      const button = stepButtonById(doc, id)
      if (button) button.setAttribute('aria-expanded', 'true')
      drawer.setAttribute('data-hm-proc-owner', id)
      fillProcessDrawer(drawer, row, doc)
      startDrawerLive(doc, drawer, row, id)
      return true
    }

    function setDrawerFollow(doc, on) {
      PROC_DRAWER_FOLLOW = !!on
      writeFollowState(PROC_DRAWER_FOLLOW)
      const drawer = doc.querySelector('.' + PROC_POP_CLASS)
      if (drawer) syncFollowButton(drawer)
      if (PROC_DRAWER_FOLLOW) adoptFollowStep(doc)
    }

    function stopDrawerLive(collapse) {
      const live = PROC_DRAWER_LIVE
      PROC_DRAWER_LIVE = null
      if (!live) return
      if (live.observer && typeof live.observer.disconnect === 'function') live.observer.disconnect()
      if (live.timer) clearTimeout(live.timer)
      if (collapse && live.row && live.row.isConnected) collapseProcessRow(live.row)
    }

    /* 只盯当前这一步的正文，别的行动了不关我们的事。 */
    function watchLiveRow(live) {
      if (live.observer && typeof live.observer.disconnect === 'function') live.observer.disconnect()
      live.observer = null
      if (typeof MutationObserver !== 'function' || !live.row) return
      const detail = detailBodyOf(live.row)
      const target = detail && detail !== live.row ? detail : live.row
      live.target = target
      live.observer = new MutationObserver(() => scheduleDrawerRefresh())
      live.observer.observe(target, { childList: true, subtree: true, characterData: true })
    }

    function scheduleDrawerRefresh() {
      const live = PROC_DRAWER_LIVE
      if (!live || live.timer) return
      live.timer = setTimeout(() => {
        live.timer = 0
        if (PROC_DRAWER_LIVE !== live) return
        refreshOpenDrawer()
      }, 120)
    }

    /* 重克隆会重置滚动：原本贴底就继续跟，否则留在原地。 */
    function refreshOpenDrawer() {
      const live = PROC_DRAWER_LIVE
      if (!live) return
      if (PROC_DRAWER_FOLLOW && adoptFollowStep(live.doc)) return
      const doc = live.doc
      const drawer = doc.querySelector('.' + PROC_POP_CLASS)
      if (!drawer || drawer.hidden) {
        stopDrawerLive(true)
        return
      }
      if (!live.row || !live.row.isConnected) {
        const row = processRowByKey(doc, live.key)
        if (!row) return
        live.row = row
        expandProcessRow(row)
      }
      const detail = detailBodyOf(live.row)
      if (detail === live.row) {
        /* 正文还没挂上：先展开等它，短暂等待期间不动抽屉，免得闪一下占位文案。 */
        expandProcessRow(live.row)
        if (live.fillCount > 0 && live.waitTicks < 10) {
          live.waitTicks += 1
          scheduleDrawerRefresh()
          return
        }
      } else live.waitTicks = 0
      const target = detail === live.row ? live.row : detail
      if (target !== live.target) watchLiveRow(live)
      const body = drawer.querySelector('.' + PROC_DRAWER_BODY_CLASS)
      if (!body) return
      const before = body.scrollTop || 0
      const atBottom = body.scrollHeight - before - body.clientHeight <= PROC_DRAWER_FOLLOW_PX
      fillProcessDrawer(drawer, live.row, doc)
      live.fillCount += 1
      if (live.forceBottom) {
        live.forceBottom = false
        body.scrollTop = body.scrollHeight
      } else {
        body.scrollTop = atBottom ? body.scrollHeight : before
      }
    }

    function startDrawerLive(doc, drawer, row, id) {
      if (PROC_DRAWER_LIVE) stopDrawerLive(true)
      const live = {
        doc,
        drawer,
        row,
        id,
        key: row.getAttribute('data-chat-flow-key'),
        observer: null,
        target: null,
        timer: 0,
        fillCount: 0,
        waitTicks: 0,
        forceBottom: true,
      }
      PROC_DRAWER_LIVE = live
      watchLiveRow(live)
      refreshOpenDrawer()
    }

    function closeProcessDrawer(doc, reason) {
      const drawer = doc.querySelector('.' + PROC_POP_CLASS)
      if (!drawer || drawer.hidden) return
      /* 打开后一小段窗口内，非显式关闭一律忽略（防同一手势里被当成「点外面」）。 */
      if ((reason === 'outside' || reason === 'toggle-same') && Date.now() - PROC_DRAWER_OPENED_AT < 250) {
        if (typeof window !== 'undefined' && window.__heipmProc) {
          window.__heipmProc.lastBlockedClose = { reason: reason, at: Date.now() }
        }
        return
      }
      /* 诊断：记下是谁把抽屉关掉的，别靠猜。 */
      if (typeof window !== 'undefined' && window.__heipmProc) {
        window.__heipmProc.lastClose = { reason: reason || 'unknown', at: Date.now() }
      }
      if (reason !== 'dispose' && typeof console !== 'undefined') {
        console.warn('[heipm-proc] drawer closed:', reason || 'unknown')
      }
      /* 关掉抽屉就不再跟踪这一步，顺手把它收回原样。 */
      stopDrawerLive(reason !== 'dispose')
      drawer.hidden = true
      drawer.removeAttribute('data-hm-proc-owner')
      for (const button of doc.querySelectorAll('.' + PROC_STEP_CLASS + '[aria-expanded="true"]')) {
        button.setAttribute('aria-expanded', 'false')
      }
    }

    /* 先开抽屉、再补内容：中间不经过「关闭」，避免一闪即关。 */
    function toggleProcessDetail(button, row, doc) {
      const drawer = ensureProcessDrawer(doc)
      const id = button.getAttribute('data-hm-proc-id')
      if (!drawer.hidden && drawer.getAttribute('data-hm-proc-owner') === id) {
        closeProcessDrawer(doc, 'toggle-same')
        return
      }
      /* 跟随中点开了别的步：只有点的正好是正在跑的当前步才继续跟随。 */
      if (PROC_DRAWER_FOLLOW && !(isRunningStep(row) && row === currentStepRow(doc))) {
        setDrawerFollow(doc, false)
      }
      for (const other of doc.querySelectorAll('.' + PROC_STEP_CLASS + '[aria-expanded="true"]')) {
        other.setAttribute('aria-expanded', 'false')
      }
      button.setAttribute('aria-expanded', 'true')
      drawer.setAttribute('data-hm-proc-owner', id)
      PROC_DRAWER_OPENED_AT = Date.now()
      placeDrawer(drawer, doc)
      fillProcessDrawer(drawer, row, doc)
      drawer.hidden = false
      /* 详情是「点开才挂载」的：借宿主开关把正文挂上，抽屉开着期间保持展开。 */
      if (!expandProcessRow(row)) {
        stopDrawerLive(true)
        return
      }
      const fill = attempt => {
        if (drawer.hidden || !row.isConnected) return
        const body = detailBodyOf(row)
        if (body === row && attempt < 2) {
          setTimeout(() => fill(attempt + 1), 120)
          return
        }
        fillProcessDrawer(drawer, row, doc)
        /* 不收起：收起会卸载正文，后面就没有可跟踪的更新源（行本身是 display:none）。 */
        startDrawerLive(doc, drawer, row, id)
      }
      later(() => fill(0))
    }

    /* 运行中的一步：图标换成旋转圈；跑完换回原图标。 */
    function stepSpinner(doc) {
      const spin = doc.createElement('span')
      spin.className = PROC_SPIN_CLASS
      spin.setAttribute('aria-hidden', 'true')
      return spin
    }

    function syncStepRunning(button, running, doc) {
      const next = running ? 'true' : 'false'
      if (button.getAttribute('data-hm-proc-running') === next) return
      button.setAttribute('data-hm-proc-running', next)
      const old = button.querySelector('.' + PROC_SPIN_CLASS)
      if (old) old.remove()
      if (running) button.appendChild(stepSpinner(doc))
    }

    /* 按 key 找回每组按钮对应的行，再据此刷新圈。 */
    function syncShelfRunning(container, rows) {
      const buttons = container.querySelectorAll('.' + PROC_STEP_CLASS)
      if (!buttons.length) return
      const byKey = typeof Map === 'function' ? new Map() : null
      for (const row of rows) {
        if (byKey) byKey.set(row.getAttribute('data-chat-flow-key'), row)
      }
      for (const button of buttons) {
        const row = byKey ? byKey.get(button.getAttribute('data-hm-proc-id')) : null
        syncStepRunning(button, !!(row && isRunningStep(row)), container.ownerDocument)
      }
    }

    function shelfButton(row, doc) {
      const button = doc.createElement('button')
      button.type = 'button'
      button.className = PROC_STEP_CLASS
      button.setAttribute(PROC_STEP_ATTR, '')
      button.setAttribute('data-hm-proc-id', String(row.getAttribute('data-chat-flow-key') || ''))
      button.setAttribute('aria-expanded', 'false')
      const summary = rowSummary(row)
      button.title = summary || '过程'
      button.setAttribute('aria-label', button.title)
      button.appendChild(rowIcon(row, doc))
      syncStepRunning(button, isRunningStep(row), doc)
      button.addEventListener('click', event => {
        if (event) {
          if (typeof event.preventDefault === 'function') event.preventDefault()
          if (typeof event.stopPropagation === 'function') event.stopPropagation()
        }
        toggleProcessDetail(button, row, doc)
      })
      return button
    }

    /* 步骤从「运行中」变成「结束」时记下耗时；挂载时就已结束的历史步骤不编数据。 */
    function trackStepTiming(row) {
      if (!PROC_STEP_TIMES) return
      const key = row.getAttribute('data-chat-flow-key')
      if (key === null || key === undefined) return
      const running = !!(row.querySelector('[data-state="running"]') || row.querySelector('[data-streaming]'))
      const now = Date.now()
      const entry = PROC_STEP_TIMES.get(key)
      if (!entry) {
        if (running) PROC_STEP_TIMES.set(key, { start: now, end: 0 })
        return
      }
      if (running) {
        if (entry.end) {
          entry.start = now
          entry.end = 0
        }
        return
      }
      if (!entry.end) entry.end = now
    }

    function decorateProcessShelf(first, members, doc) {
      const parent = first.parentNode
      if (!parent) return 0
      for (const row of members) row.classList.add(PROC_ROW_CLASS)
      const keys = members.map(row => row.getAttribute('data-chat-flow-key')).join('|')
      let shelf = first.previousElementSibling
      if (!shelf || shelf.getAttribute(PROC_SHELF_ATTR) === null) {
        shelf = doc.createElement('div')
        shelf.className = PROC_SHELF_CLASS
        shelf.setAttribute(PROC_SHELF_ATTR, '')
        parent.insertBefore(shelf, first)
      }
      if (shelf.getAttribute('data-hm-proc-keys') === keys) return 0
      shelf.setAttribute('data-hm-proc-keys', keys)
      shelf.textContent = ''
      for (const row of members) shelf.appendChild(shelfButton(row, doc))
      return 1
    }

    function topFlowRows(container) {
      const rows = []
      for (const row of container.querySelectorAll(HOST_CONTRACT.flowRow)) {
        const parent = row.parentElement
        /* 只跳过「行里的行」；官方分组体 [data-step-process-content] 里的行正是过程行，必须处理。 */
        if (parent && parent.closest('[data-chat-flow-kind]')) continue
        rows.push(row)
      }
      return rows
    }

    function flowContainers(root) {
      const found = []
      if (!root || typeof root.querySelectorAll !== 'function') return found
      if (root.getAttribute && root.getAttribute('data-slot') === 'conversation.chat.flow') found.push(root)
      for (const node of root.querySelectorAll(HOST_CONTRACT.chatFlow)) {
        if (found.indexOf(node) < 0) found.push(node)
      }
      /* 兜底：槽位属性哪天不在了，退回认最外层的 [data-chat-flow] 列。 */
      if (!found.length) {
        for (const node of root.querySelectorAll('[data-chat-flow]')) {
          const parent = node.parentElement
          if (parent && parent.closest('[data-chat-flow]')) continue
          found.push(node)
        }
      }
      return found
    }

    /* 每行的归类只在第一次算；只有最后一行（还在流式长）每次重算。 */
    const PROCESS_ROLES = typeof WeakMap === 'function' ? new WeakMap() : null
    const PROCESS_KEYS = typeof WeakMap === 'function' ? new WeakMap() : null

    function roleOfFlowRow(row, last) {
      if (!last && PROCESS_ROLES && PROCESS_ROLES.has(row)) return PROCESS_ROLES.get(row)
      const role = classifyFlowRow(describeFlowRow(row))
      if (PROCESS_ROLES) PROCESS_ROLES.set(row, role)
      return role
    }

    function decorateFlowContainer(container) {
      const doc = container.ownerDocument
      const rows = topFlowRows(container)
      if (!rows.length) return 0
      const roles = rows.map((row, index) => roleOfFlowRow(row, index === rows.length - 1))
      /* 计时要在「签名没变」的提前返回之前做，否则步骤跑完了也拿不到结束时间。 */
      for (let index = 0; index < rows.length; index += 1) {
        if (roles[index] === 'process') trackStepTiming(rows[index])
      }
      /* 签名不变时下面会提前返回，圈要在这里刷新，跑完才能停。 */
      syncShelfRunning(container, rows)
      const signature = rows.map(row => row.getAttribute('data-chat-flow-key')).join('|') + '#' + roles.join(',')
      /* React 重建行后旧元素会丢 class，所以「签名没变」也得确认隐藏还在，不能直接跳过。 */
      const settled = roles.every((role, index) => role === 'prose' || rows[index].classList.contains(PROC_ROW_CLASS))
      if (settled && PROCESS_KEYS && PROCESS_KEYS.get(container) === signature) return 0
      const groups = planProcessGroups(roles)
      const live = new Set()
      let created = 0
      for (let index = 0; index < rows.length; index += 1) {
        if (roles[index] !== 'skip') continue
        live.add(rows[index])
        rows[index].classList.add(PROC_ROW_CLASS)
      }
      for (const group of groups) {
        const members = group.map(index => rows[index])
        for (const row of members) {
          live.add(row)
          row.classList.add(PROC_ROW_CLASS)
        }
        created += decorateProcessShelf(members[0], members, doc)
      }
      for (const row of container.querySelectorAll('.' + PROC_ROW_CLASS)) {
        if (!live.has(row)) row.classList.remove(PROC_ROW_CLASS)
      }
      const keep = new Set()
      for (const group of groups) keep.add(rows[group[0]].getAttribute('data-chat-flow-key'))
      for (const shelf of container.querySelectorAll('[' + PROC_SHELF_ATTR + ']')) {
        const keys = String(shelf.getAttribute('data-hm-proc-keys') || '')
        const firstKey = keys ? keys.split('|')[0] : ''
        if (!keep.has(firstKey)) {
          shelf.remove()
          continue
        }
        const next = shelf.nextElementSibling
        if (!next || !next.classList || !next.classList.contains(PROC_ROW_CLASS)) shelf.remove()
      }
      if (PROCESS_KEYS) PROCESS_KEYS.set(container, signature)
      return created
    }

    function decorateProcessShelves(root) {
      let created = 0
      for (const container of flowContainers(root)) created += decorateFlowContainer(container)
      return created
    }

    function installProcessShelfStyles(doc) {
      let tag = doc.querySelector('style[data-plugin-css="heipm:process-shelf"]')
      if (!tag) {
        tag = doc.createElement('style')
        tag.setAttribute('data-plugin-css', 'heipm:process-shelf')
        tag.setAttribute('data-dsh-heipm-process-shelf', '')
        doc.head.appendChild(tag)
      }
      tag.textContent = PROCESS_SHELF_CSS
      return () => {
        if (tag && typeof tag.remove === 'function') tag.remove()
      }
    }

    function createProcessShelf() {
      if (typeof document === 'undefined' || !document.body) return () => {}
      if (typeof document.querySelector !== 'function' || typeof document.querySelectorAll !== 'function') return () => {}
      if (typeof document.createElement !== 'function' || typeof document.addEventListener !== 'function') return () => {}
      if (typeof MutationObserver !== 'function') return () => {}
      if (uiFeatureDisabled('process-shelf')) return () => {}
      const doc = document
      const dropStyles = installProcessShelfStyles(doc)
      let scheduled = false
      let stopped = false
      const run = () => {
        scheduled = false
        if (stopped) return
        decorateProcessShelves(doc)
        if (PROC_DRAWER_LIVE) {
          if (PROC_DRAWER_FOLLOW) adoptFollowStep(doc)
          scheduleDrawerRefresh()
        }
      }
      const schedule = () => {
        if (scheduled || stopped) return
        scheduled = true
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run)
        else setTimeout(run, 30)
      }
      const observer = new MutationObserver(records => {
        for (const record of records) {
          if (record.type === 'attributes') {
            schedule()
            return
          }
          for (const node of record.addedNodes) {
            if (node.nodeType !== 1) continue
            const marked = node.getAttribute && node.getAttribute('data-chat-flow-key') !== null
            const holds = node.querySelector && node.querySelector(HOST_CONTRACT.flowRow)
            if (marked || holds) {
              schedule()
              return
            }
          }
          if (record.removedNodes.length) {
            schedule()
            return
          }
        }
      })
      observer.observe(doc.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-state', 'data-streaming', 'data-expanded'],
      })
      /* 点外面关闭回来了；刚打开的 250ms 内不算数（closeProcessDrawer 里挡）。 */
      const onPointerDown = event => {
        const target = event && event.target
        if (target && target.closest && (target.closest('.' + PROC_STEP_CLASS) || target.closest('.' + PROC_POP_CLASS))) return
        if (PROC_DRAWER_PINNED) return
        closeProcessDrawer(doc, 'outside')
      }
      const onKeyDown = event => {
        if (event && event.key === 'Escape') closeProcessDrawer(doc, 'escape')
      }
      doc.addEventListener('mousedown', onPointerDown, true)
      doc.addEventListener('keydown', onKeyDown, true)
      /* 诊断面：页面里量「收纳了几组、藏了几行」，比肉眼猜可靠。 */
      if (typeof window !== 'undefined') {
        window.__heipmProc = {
          report: () => ({
            build: 'a2.8',
            flows: doc.querySelectorAll(HOST_CONTRACT.chatFlow).length,
            rows: doc.querySelectorAll(HOST_CONTRACT.flowRow).length,
            shelves: doc.querySelectorAll('[' + PROC_SHELF_ATTR + ']').length,
            steps: doc.querySelectorAll('.' + PROC_STEP_CLASS).length,
            hidden: doc.querySelectorAll('.' + PROC_ROW_CLASS).length,
            timed: PROC_STEP_TIMES ? PROC_STEP_TIMES.size : 0,
            live: PROC_DRAWER_LIVE ? PROC_DRAWER_LIVE.fillCount : 0,
            follow: PROC_DRAWER_FOLLOW,
            pinned: PROC_DRAWER_PINNED,
          }),
          rescan: () => run(),
          refreshDrawer: () => refreshOpenDrawer(),
          setFollow: on => { setDrawerFollow(doc, on); return PROC_DRAWER_FOLLOW },
          setPin: on => { setDrawerPin(doc, on); return PROC_DRAWER_PINNED },
          dumpDrawer: () => {
            const body = doc.querySelector('.' + PROC_DRAWER_BODY_CLASS)
            const child = body && body.firstElementChild
            return {
              child: child ? String(child.className) : null,
              height: child && child.getBoundingClientRect ? Math.round(child.getBoundingClientRect().height) : 0,
              html: body ? String(body.innerHTML || '').slice(0, 240) : '',
            }
          },
        }
      }
      run()
      return () => {
        stopped = true
        observer.disconnect()
        doc.removeEventListener('mousedown', onPointerDown, true)
        doc.removeEventListener('keydown', onKeyDown, true)
        if (typeof window !== 'undefined' && window.__heipmProc) delete window.__heipmProc
        closeProcessDrawer(doc, 'dispose')
        const drawer = doc.querySelector('.' + PROC_POP_CLASS)
        if (drawer) drawer.remove()
        for (const shelf of doc.querySelectorAll('[' + PROC_SHELF_ATTR + ']')) shelf.remove()
        for (const row of doc.querySelectorAll('.' + PROC_ROW_CLASS)) row.classList.remove(PROC_ROW_CLASS)
        dropStyles()
      }
    }

    /* ----- heipm 样式：设置页 + 全局 CSS 变量（主插件与所有子插件共用） ----- */

    const THEME_COLOR_KEYS = ['accent', 'panel', 'card', 'ink', 'dim', 'line']
    /* 空字符串 = 不覆盖，组件 CSS 自己回落到宿主主题令牌。 */
    const THEME_DEFAULTS = { accent: '', panel: '', card: '', ink: '', dim: '', line: '', radius: 10 }

    function normalizeTheme(input) {
      const source = input && typeof input === 'object' ? input : {}
      const theme = {}
      for (const key of THEME_COLOR_KEYS) {
        const value = typeof source[key] === 'string' ? source[key].trim() : ''
        theme[key] = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : ''
      }
      const radius = Number(source.radius)
      theme.radius = Number.isFinite(radius) ? Math.min(24, Math.max(0, Math.round(radius))) : THEME_DEFAULTS.radius
      return theme
    }

    /* 静态样式 + 变量写在同一个标签里：改主题只换这一个 style 的内容。 */
    const THEME_STATIC_CSS = [
      '/* 设置页自己的可读性优先：只用宿主主题令牌，不跟 heipm 样式走。 */',
      '.pm-style{display:flex;flex-direction:column;gap:14px;max-width:640px;color:var(--dsw-alias-label-primary,#eceef2)}',
      '.pm-style-desc{color:var(--dsw-alias-label-secondary,#a8adb8);font-size:13px;line-height:1.6;margin:0}',
      '.pm-style-row{align-items:center;display:grid;gap:12px;grid-template-columns:minmax(190px,1fr) 44px 104px auto}',
      '.pm-style-text{display:flex;flex-direction:column;gap:3px;min-width:0}',
      '.pm-style-label{color:var(--dsw-alias-label-primary,#eceef2);font-size:13px}',
      '.pm-style-hint{color:var(--dsw-alias-label-secondary,#a8adb8);font-size:12px;line-height:1.5}',
      '.pm-style-preview{border:1px solid var(--dsw-alias-border-l1,rgba(148,163,184,.38));border-radius:10px;display:flex;flex-wrap:wrap;gap:8px;padding:12px 14px}',
      '.pm-style-preview-title{color:var(--dsw-alias-label-secondary,#a8adb8);font-size:12px;flex:0 0 100%;margin:0}',
      '.pm-style-chip{align-items:center;border:1px solid var(--dsw-alias-border-l1,rgba(148,163,184,.38));border-radius:8px;color:var(--dsw-alias-label-secondary,#a8adb8);display:inline-flex;font-size:12px;gap:8px;padding:5px 10px}',
      '.pm-style-dot{border-radius:4px;display:inline-block;height:12px;width:12px}',
      '.pm-style-swatch{appearance:none;background:transparent;border:1px solid var(--dsw-alias-border-l1,rgba(148,163,184,.38));border-radius:8px;cursor:pointer;height:30px;padding:2px;width:44px}',
      '.pm-style-value{color:var(--dsw-alias-label-secondary,#a8adb8);font-family:ui-monospace,monospace;font-size:12px}',
      '.pm-style-clear{appearance:none;background:transparent;border:1px solid var(--dsw-alias-border-l1,rgba(148,163,184,.38));border-radius:8px;color:var(--dsw-alias-label-secondary,#a8adb8);cursor:pointer;font-size:12px;padding:4px 10px}',
      '.pm-style-clear:hover{border-color:var(--dsw-alias-border-l2,rgba(148,163,184,.6));color:var(--dsw-alias-label-primary,#eceef2)}',
      '.pm-style-range{accent-color:var(--dsw-alias-label-primary,#eceef2);width:100%}',
      '.pm-style-actions{display:flex;gap:10px;margin-top:4px}',
      '.pm-style-reset{appearance:none;background:transparent;border:1px solid var(--dsw-alias-border-l1,rgba(148,163,184,.38));border-radius:8px;color:var(--dsw-alias-label-primary,#eceef2);cursor:pointer;font-size:13px;padding:7px 16px}',
      '.pm-style-reset:hover{border-color:var(--dsw-alias-border-l2,rgba(148,163,184,.6))}',
      '.pm-style-note{color:var(--dsw-alias-label-secondary,#a8adb8);font-size:12px;margin:0}',
    ].join('')

    function themeCssText(theme) {
      const t = normalizeTheme(theme)
      const vars = []
      for (const key of THEME_COLOR_KEYS) {
        if (t[key]) vars.push('--hm-' + key + ':' + t[key] + ';')
      }
      vars.push('--hm-radius:' + t.radius + 'px;')
      return ':root{' + vars.join('') + '}' + THEME_STATIC_CSS
    }

    const themeState = { theme: { ...THEME_DEFAULTS }, listeners: [] }

    function applyTheme(theme, doc) {
      const target = doc || (typeof document === 'undefined' ? null : document)
      if (!target || !target.head) return null
      let tag = target.querySelector('style[data-plugin-css="heipm:theme"]')
      if (!tag) {
        tag = target.createElement('style')
        tag.setAttribute('data-plugin-css', 'heipm:theme')
        tag.setAttribute('data-dsh-heipm-theme', '')
        target.head.appendChild(tag)
      }
      themeState.theme = normalizeTheme(theme)
      tag.textContent = themeCssText(themeState.theme)
      for (const fn of themeState.listeners.slice()) {
        try { fn(themeState.theme) } catch {}
      }
      return themeState.theme
    }

    async function loadTheme(doc) {
      try {
        const body = await api({ action: 'theme.get' })
        if (body && body.theme) applyTheme(body.theme, doc)
      } catch {}
    }

    async function saveTheme(theme) {
      const body = await api({ action: 'theme.set', theme })
      if (body && body.theme) applyTheme(body.theme)
      return body && body.theme ? body.theme : null
    }

    /* 设置页组件在独立分块里加载；未就绪时渲染空，就绪后自动重渲染。 */
    let StyleSection = null
    let settingsChunk = Promise.resolve(null)
    try {
      if (typeof require.async === 'function') settingsChunk = require.async('./client.settings.js')
    } catch (error) {
      console.warn('heipm: settings chunk unavailable', error)
    }
    const settingsReady = settingsChunk
      .then(mod => {
        if (!mod) return null
        StyleSection = mod.createHeipmStyleSection({ useState, useRef, useEffect, applyTheme, saveTheme, themeState, THEME_DEFAULTS })
        return StyleSection
      })
      .catch(error => { console.warn('heipm: settings chunk failed', error); return null })

    function HeipmStyleSection(props) {
      const [ready, setReady] = useState(Boolean(StyleSection))
      useEffect(() => {
        if (StyleSection) return undefined
        let alive = true
        settingsReady.then(() => { if (alive) setReady(Boolean(StyleSection)) })
        return () => { alive = false }
      }, [])
      if (!ready || !StyleSection) return null
      return h(StyleSection, props)
    }


    /* ----- workspace context menu on the host sidebar ----- */

    const WS_CTX_CSS = `
      .pm-ctx,
      .pm-ctx-overlay {
        --pm-ctx-accent: var(--hm-accent, #d9730d);
        --pm-ctx-accent-strong: color-mix(in srgb, var(--hm-accent, #d9730d) 78%, #000);
        --pm-ctx-accent-soft: color-mix(in srgb, var(--hm-accent, #d9730d) 13%, transparent);
        --pm-ctx-accent-ring: color-mix(in srgb, var(--hm-accent, #d9730d) 45%, transparent);
        --pm-ctx-accent-ink: #ffffff;
        --pm-ctx-danger: var(--dsw-alias-state-error-primary, #ec1313);
        --pm-ctx-danger-soft: rgba(236, 19, 19, .10);
        --pm-ctx-danger-ink: #ffffff;
        --pm-ctx-radius: var(--hm-radius, var(--dsw-radius-lg, 10px));
        --pm-ctx-line: var(--dsw-alias-border-l1, rgba(0, 0, 0, .08));
        --pm-ctx-ink: var(--dsw-alias-label-primary, #1b1b1c);
        --pm-ctx-dim: var(--dsw-alias-label-secondary, #61666b);
        --pm-ctx-surface: var(--dsw-specific-menu, var(--dsw-alias-bg-layer-2, #ffffff));
        --pm-ctx-panel: var(--dsw-alias-bg-layer-1, #ffffff);
        --pm-ctx-field: var(--dsw-alias-bg-layer-2, #f9fafb);
        z-index: 1300;
        font: inherit;
      }
      body[data-ds-dark-theme] .pm-ctx,
      body[data-ds-dark-theme] .pm-ctx-overlay {
        --pm-ctx-accent: var(--hm-accent, #ff9f43);
        --pm-ctx-accent-strong: color-mix(in srgb, var(--hm-accent, #ff9f43) 78%, #fff);
        --pm-ctx-accent-soft: color-mix(in srgb, var(--hm-accent, #ff9f43) 18%, transparent);
        --pm-ctx-accent-ring: color-mix(in srgb, var(--hm-accent, #ff9f43) 50%, transparent);
        --pm-ctx-accent-ink: #241503;
        --pm-ctx-danger: var(--dsw-alias-state-error-primary, #f25a5a);
        --pm-ctx-danger-soft: rgba(242, 90, 90, .16);
      }
      .pm-ctx {
        position: fixed;
        box-sizing: border-box;
        min-width: 178px;
        padding: 5px;
        border: 1px solid var(--pm-ctx-line);
        border-radius: var(--pm-ctx-radius);
        background: var(--pm-ctx-surface);
        box-shadow: 0 12px 32px rgba(0, 0, 0, .32), 0 2px 6px rgba(0, 0, 0, .14);
        color: var(--pm-ctx-ink);
        font-size: 12.5px;
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
      }
      .pm-ctx:focus { outline: none; }
      .pm-ctx-item {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        box-sizing: border-box;
        padding: 7px 10px;
        border: 0;
        border-radius: calc(var(--pm-ctx-radius) - 3px);
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .pm-ctx-item:hover,
      .pm-ctx-item:focus-visible {
        background: var(--pm-ctx-accent-soft);
        color: var(--pm-ctx-accent-strong);
        outline: none;
      }
      .pm-ctx-item.danger { color: var(--pm-ctx-danger); }
      .pm-ctx-item.danger:hover,
      .pm-ctx-item.danger:focus-visible {
        background: var(--pm-ctx-danger-soft);
        color: var(--pm-ctx-danger);
      }
      .pm-ctx-icon { display: inline-flex; width: 15px; height: 15px; flex: none; }
      .pm-ctx-icon svg { display: block; width: 15px; height: 15px; }
      .pm-ctx-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(0, 0, 0, .42);
        z-index: 1301;
      }
      .pm-ctx-dialog {
        box-sizing: border-box;
        width: min(420px, 100%);
        padding: 18px 18px 14px;
        border: 1px solid var(--pm-ctx-line);
        border-radius: calc(var(--pm-ctx-radius) + 2px);
        background: var(--pm-ctx-panel);
        color: var(--pm-ctx-ink);
        box-shadow: 0 24px 70px rgba(0, 0, 0, .5);
        font-size: 13px;
      }
      .pm-ctx-dialog h2 {
        margin: 0 0 8px;
        font-size: 14.5px;
        font-weight: 650;
        letter-spacing: .01em;
      }
      .pm-ctx-dialog-body {
        margin: 0 0 12px;
        color: var(--pm-ctx-dim);
        font-size: 12.5px;
        line-height: 1.6;
      }
      .pm-ctx-label-row {
        display: block;
        margin: 0 0 6px;
        color: var(--pm-ctx-dim);
        font-size: 11.5px;
      }
      .pm-ctx-input {
        box-sizing: border-box;
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--pm-ctx-line);
        border-radius: 8px;
        background: var(--pm-ctx-field);
        color: var(--pm-ctx-ink);
        font: inherit;
        font-size: 13px;
        outline: none;
      }
      .pm-ctx-input:focus {
        border-color: var(--pm-ctx-accent);
        box-shadow: 0 0 0 2px var(--pm-ctx-accent-ring);
      }
      .pm-ctx-input:disabled { opacity: .7; }
      .pm-ctx-error {
        min-height: 18px;
        margin-top: 6px;
        color: var(--pm-ctx-danger);
        font-size: 11.5px;
        line-height: 1.5;
      }
      .pm-ctx-foot {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }
      .pm-ctx-btn {
        padding: 6px 14px;
        border: 1px solid var(--pm-ctx-line);
        border-radius: 8px;
        background: var(--pm-ctx-field);
        color: var(--pm-ctx-ink);
        font: inherit;
        font-size: 12.5px;
        cursor: pointer;
      }
      .pm-ctx-btn:hover:not(:disabled) { border-color: var(--pm-ctx-accent); color: var(--pm-ctx-accent-strong); }
      .pm-ctx-btn:focus-visible { outline: 2px solid var(--pm-ctx-accent-ring); outline-offset: 1px; }
      .pm-ctx-btn:disabled { opacity: .6; cursor: default; }
      .pm-ctx-btn.primary {
        border-color: transparent;
        background: var(--pm-ctx-accent);
        color: var(--pm-ctx-accent-ink);
      }
      .pm-ctx-btn.primary:hover:not(:disabled) { border-color: transparent; color: var(--pm-ctx-accent-ink); }
      .pm-ctx-btn.danger {
        border-color: transparent;
        background: var(--pm-ctx-danger);
        color: var(--pm-ctx-danger-ink);
      }
      .pm-ctx-btn.danger:hover:not(:disabled) { border-color: transparent; color: var(--pm-ctx-danger-ink); }
      .pm-ctx-toast {
        position: fixed;
        left: 50%;
        bottom: 32px;
        z-index: 2147483000;
        transform: translateX(-50%);
        max-width: min(360px, 90vw);
        padding: 8px 14px;
        border: 1px solid var(--pm-ctx-line);
        border-radius: 999px;
        background: var(--pm-ctx-surface);
        color: var(--pm-ctx-ink);
        box-shadow: 0 8px 24px rgba(0, 0, 0, .18);
        font-size: 12.5px;
        line-height: 1.5;
        pointer-events: none;
      }
    `

    const WS_CTX_ICON = {
      open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
      rename: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
      delete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    }

    function workspaceKeyId(value) {
      const key = String(value == null ? '' : value)
      if (!key.startsWith('workspace:')) return null
      const id = key.slice('workspace:'.length)
      return id || null
    }

    /* Fragile DSH DOM couplings live here. Update docs/HOST_CONTRACT.md with any change. */
    const HOST_CONTRACT = {
      workspaceRow: '[data-row-key^="workspace:"]',
      workspaceTitle: '[class*="projectText"] [class*="title"]',
      chatFlow: '[data-slot="conversation.chat.flow"]',
      flowRow: '[data-chat-flow-key][data-chat-flow-kind]',
      rowThinking: '[data-variant="think"]',
      rowDisclosure: '[data-disclosure-row]',
      rowTool: '[data-tool], [data-sample]',
      rowBody: '[class*="_thinkBody"], [class*="_bodyWrap"], [class*="_bodyScroll"]',
    }

    const UI_DISABLED_KEY = 'dsh-heipm:ui:disabled:v1'

    function uiFeatureDisabled(id) {
      if (typeof window === 'undefined' || !window.localStorage) return false
      try {
        const raw = window.localStorage.getItem(UI_DISABLED_KEY)
        if (!raw) return false
        const disabled = JSON.parse(raw)
        return Array.isArray(disabled) && disabled.includes(id)
      } catch {
        return false
      }
    }

    function workspaceRowId(target) {
      if (!target || typeof target.closest !== 'function') return null
      const row = target.closest(HOST_CONTRACT.workspaceRow)
      if (!row || typeof row.getAttribute !== 'function') return null
      return workspaceKeyId(row.getAttribute('data-row-key'))
    }

    function normalizeWorkspaceTitle(value) {
      return String(value == null ? '' : value).replace(/\s+/g, ' ').trim()
    }

    function clampMenuPosition(x, y, width, height, viewportWidth, viewportHeight) {
      const margin = 8
      const maxLeft = Math.max(margin, viewportWidth - width - margin)
      const maxTop = Math.max(margin, viewportHeight - height - margin)
      return {
        left: Math.min(Math.max(margin, x), maxLeft),
        top: Math.min(Math.max(margin, y), maxTop),
      }
    }

    function workspaceRows(workspaces) {
      try {
        const list = workspaces && workspaces.list
        const snapshot = list && typeof list.getSnapshot === 'function' ? list.getSnapshot() : null
        return snapshot && Array.isArray(snapshot.items) ? snapshot.items : []
      } catch {
        return []
      }
    }

    function workspaceTitleOf(workspaces, id) {
      const found = workspaceRows(workspaces).find(item => item && (item.workspaceId === id || item.id === id))
      return found && typeof found.title === 'string' ? found.title : ''
    }

    function workspaceErrorText(error, t, fallbackKey) {
      const text = String(error && error.message ? error.message : error || '')
      if (/name-conflict|already in use|已被其他工作区/i.test(text)) return t('ctx.error.conflict')
      if (/gateway\/bad-request|non-blank/i.test(text)) return t('ctx.error.blank')
      return t(fallbackKey)
    }

    function installWorkspaceMenuStyles(doc) {
      if (!doc || !doc.head || typeof doc.createElement !== 'function') return () => {}
      if (typeof doc.querySelector === 'function' && doc.querySelector('style[data-plugin-css="heipm:workspace-menu"]')) return () => {}
      const tag = doc.createElement('style')
      tag.setAttribute('data-plugin-css', 'heipm:workspace-menu')
      tag.textContent = WS_CTX_CSS
      doc.head.appendChild(tag)
      return () => {
        if (typeof tag.remove === 'function') tag.remove()
      }
    }

    function installWorkspaceContextMenu(workspaces, t) {
      if (typeof document === 'undefined' || !document.body || !workspaces) return () => {}
      const doc = document
      const win = typeof window === 'undefined' ? null : window
      const stopStyles = installWorkspaceMenuStyles(doc)
      let menu = null
      let dialog = null
      let lastFocus = null

      const create = (tag, className, text) => {
        const node = doc.createElement(tag)
        if (className) node.className = className
        if (text !== undefined) node.textContent = text
        return node
      }

      const closeMenu = () => {
        if (!menu) return
        if (typeof menu.__cleanup === 'function') menu.__cleanup()
        if (menu.parentNode) menu.parentNode.removeChild(menu)
        menu = null
      }

      const closeDialog = () => {
        if (!dialog) return
        if (typeof dialog.__cleanup === 'function') dialog.__cleanup()
        if (dialog.parentNode) dialog.parentNode.removeChild(dialog)
        dialog = null
        const focus = lastFocus
        lastFocus = null
        if (focus && typeof focus.focus === 'function') {
          try { focus.focus() } catch {}
        }
      }

      const showToast = message => {
        const node = create('div', 'pm-ctx-toast', message)
        node.setAttribute('role', 'status')
        doc.body.appendChild(node)
        if (win && typeof win.setTimeout === 'function') {
          win.setTimeout(() => {
            if (node.parentNode) node.parentNode.removeChild(node)
          }, 2600)
        }
      }

      const openFolder = async id => {
        try {
          await api({ action: 'open-folder', workspaceId: id })
        } catch {
          showToast(t('ctx.error.open'))
        }
      }

      const notifyChanged = () => {
        try {
          if (!win || typeof win.CustomEvent !== 'function' || typeof win.dispatchEvent !== 'function') return
          win.dispatchEvent(new win.CustomEvent('dsh-heipm:workspaces-changed'))
        } catch {}
      }

      const menuItem = (iconName, label, danger, onPick) => {
        const button = create('button', `pm-ctx-item${danger ? ' danger' : ''}`)
        button.type = 'button'
        button.setAttribute('role', 'menuitem')
        const icon = create('span', 'pm-ctx-icon')
        icon.innerHTML = WS_CTX_ICON[iconName] || ''
        const text = create('span', 'pm-ctx-label', label)
        button.appendChild(icon)
        button.appendChild(text)
        button.addEventListener('click', event => {
          event.preventDefault()
          event.stopPropagation()
          onPick()
        })
        return button
      }

      const openShell = label => {
        closeMenu()
        closeDialog()
        lastFocus = doc.activeElement
        const overlay = create('div', 'pm-ctx-overlay')
        const panel = create('div', 'pm-ctx-dialog')
        panel.setAttribute('role', 'dialog')
        panel.setAttribute('aria-modal', 'true')
        panel.setAttribute('aria-label', label)
        panel.appendChild(create('h2', 'pm-ctx-dialog-title', label))
        overlay.appendChild(panel)
        doc.body.appendChild(overlay)
        dialog = overlay
        const onKeyDown = event => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          event.stopPropagation()
          closeDialog()
        }
        const onPointerDown = event => {
          if (event.target === overlay) closeDialog()
        }
        doc.addEventListener('keydown', onKeyDown, true)
        overlay.addEventListener('pointerdown', onPointerDown)
        overlay.__cleanup = () => {
          doc.removeEventListener('keydown', onKeyDown, true)
          overlay.removeEventListener('pointerdown', onPointerDown)
        }
        return panel
      }

      const openRename = (id, currentTitle) => {
        const panel = openShell(t('ctx.renameTitle'))
        panel.appendChild(create('p', 'pm-ctx-dialog-body', t('ctx.renameBody')))
        const form = create('form', 'pm-ctx-form')
        form.appendChild(create('div', 'pm-ctx-label-row', t('ctx.renameLabel')))
        const input = create('input', 'pm-ctx-input')
        input.type = 'text'
        input.value = currentTitle
        input.maxLength = 200
        input.autocomplete = 'off'
        input.spellcheck = false
        form.appendChild(input)
        const error = create('div', 'pm-ctx-error')
        form.appendChild(error)
        const foot = create('div', 'pm-ctx-foot')
        const cancel = create('button', 'pm-ctx-btn', t('ctx.cancel'))
        cancel.type = 'button'
        const confirm = create('button', 'pm-ctx-btn primary', t('ctx.confirm'))
        confirm.type = 'submit'
        foot.appendChild(cancel)
        foot.appendChild(confirm)
        form.appendChild(foot)
        panel.appendChild(form)

        let busy = false
        const setBusy = value => {
          busy = value
          input.disabled = value
          cancel.disabled = value
          confirm.disabled = value
          confirm.textContent = value ? t('ctx.working') : t('ctx.confirm')
        }
        form.addEventListener('submit', async event => {
          event.preventDefault()
          if (busy) return
          const next = normalizeWorkspaceTitle(input.value)
          error.textContent = ''
          if (!next) {
            error.textContent = t('ctx.error.blank')
            if (typeof input.focus === 'function') input.focus()
            return
          }
          if (next === normalizeWorkspaceTitle(currentTitle)) {
            closeDialog()
            return
          }
          setBusy(true)
          try {
            await workspaces.rename(id, next)
            closeDialog()
            notifyChanged()
          } catch (failure) {
            error.textContent = workspaceErrorText(failure, t, 'ctx.error.rename')
            setBusy(false)
          }
        })
        cancel.addEventListener('click', () => closeDialog())
        if (typeof input.focus === 'function') input.focus()
        if (typeof input.select === 'function') input.select()
      }

      const openDelete = (id, title) => {
        const panel = openShell(t('ctx.deleteTitle'))
        panel.appendChild(create('p', 'pm-ctx-dialog-body', t('ctx.deleteBody', { name: title || t('ctx.unnamed') })))
        const error = create('div', 'pm-ctx-error')
        panel.appendChild(error)
        const foot = create('div', 'pm-ctx-foot')
        const cancel = create('button', 'pm-ctx-btn', t('ctx.cancel'))
        cancel.type = 'button'
        const confirm = create('button', 'pm-ctx-btn danger', t('ctx.deleteConfirm'))
        confirm.type = 'button'
        foot.appendChild(cancel)
        foot.appendChild(confirm)
        panel.appendChild(foot)

        let busy = false
        const setBusy = value => {
          busy = value
          cancel.disabled = value
          confirm.disabled = value
          confirm.textContent = value ? t('ctx.working') : t('ctx.deleteConfirm')
        }
        confirm.addEventListener('click', async () => {
          if (busy) return
          error.textContent = ''
          setBusy(true)
          try {
            await workspaces.delete(id)
            closeDialog()
            notifyChanged()
          } catch (failure) {
            error.textContent = workspaceErrorText(failure, t, 'ctx.error.delete')
            setBusy(false)
          }
        })
        cancel.addEventListener('click', () => closeDialog())
        if (typeof cancel.focus === 'function') cancel.focus()
      }

      const openMenu = (id, x, y, fallbackTitle) => {
        closeMenu()
        closeDialog()
        const title = workspaceTitleOf(workspaces, id) || fallbackTitle || ''
        const node = create('div', 'pm-ctx')
        node.setAttribute('role', 'menu')
        node.setAttribute('tabindex', '-1')
        node.appendChild(menuItem('open', t('ctx.open'), false, () => {
          closeMenu()
          openFolder(id)
        }))
        node.appendChild(menuItem('rename', t('ctx.rename'), false, () => {
          closeMenu()
          openRename(id, title)
        }))
        node.appendChild(menuItem('delete', t('ctx.delete'), true, () => {
          closeMenu()
          openDelete(id, title)
        }))
        node.style.visibility = 'hidden'
        doc.body.appendChild(node)
        const bounds = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : { width: 0, height: 0 }
        const viewportWidth = win && Number.isFinite(win.innerWidth) ? win.innerWidth : 1280
        const viewportHeight = win && Number.isFinite(win.innerHeight) ? win.innerHeight : 800
        const spot = clampMenuPosition(x, y, bounds.width, bounds.height, viewportWidth, viewportHeight)
        node.style.left = `${spot.left}px`
        node.style.top = `${spot.top}px`
        node.style.visibility = ''
        menu = node
        const onPointerDown = event => {
          if (node.contains(event.target)) return
          closeMenu()
        }
        const onKeyDown = event => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            closeMenu()
            return
          }
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
          const items = Array.from(node.querySelectorAll('.pm-ctx-item'))
          if (!items.length) return
          event.preventDefault()
          const index = items.indexOf(doc.activeElement)
          const step = event.key === 'ArrowDown' ? 1 : -1
          const next = index < 0 ? 0 : (index + step + items.length) % items.length
          if (typeof items[next].focus === 'function') items[next].focus()
        }
        const onDismiss = () => closeMenu()
        doc.addEventListener('pointerdown', onPointerDown, true)
        doc.addEventListener('keydown', onKeyDown, true)
        if (win) {
          win.addEventListener('resize', onDismiss)
          win.addEventListener('scroll', onDismiss, true)
          win.addEventListener('blur', onDismiss)
        }
        node.__cleanup = () => {
          doc.removeEventListener('pointerdown', onPointerDown, true)
          doc.removeEventListener('keydown', onKeyDown, true)
          if (!win) return
          win.removeEventListener('resize', onDismiss)
          win.removeEventListener('scroll', onDismiss, true)
          win.removeEventListener('blur', onDismiss)
        }
        if (typeof node.focus === 'function') node.focus()
      }

      const rowTitle = row => {
        try {
          const title = row.querySelector(HOST_CONTRACT.workspaceTitle)
          if (title && title.textContent) return String(title.textContent).trim()
          return String(row.textContent || '').trim()
        } catch {
          return ''
        }
      }

      const onContextMenu = event => {
        if (event.defaultPrevented) return
        const target = event.target
        if (!target || typeof target.closest !== 'function') return
        if (target.closest('.pm-ctx, .pm-ctx-overlay')) return
        const row = target.closest(HOST_CONTRACT.workspaceRow)
        const id = row ? workspaceKeyId(row.getAttribute('data-row-key')) : null
        if (menu) closeMenu()
        if (!id) return
        event.preventDefault()
        event.stopPropagation()
        openMenu(id, event.clientX || 0, event.clientY || 0, rowTitle(row))
      }

      doc.addEventListener('contextmenu', onContextMenu, true)
      return () => {
        closeMenu()
        closeDialog()
        doc.removeEventListener('contextmenu', onContextMenu, true)
        stopStyles()
      }
    }

    const UI_FEATURES = [
      {
        id: 'workspace-menu',
        mount: (workspaces, t) => installWorkspaceContextMenu(workspaces, t),
      },
    ]

    /* One failing feature must not take the rest of the client down. */
    function installClientFeatures(ctx, workspaces, t) {
      for (const feature of UI_FEATURES) {
        if (uiFeatureDisabled(feature.id)) {
          console.info(`[dsh-heipm] UI feature "${feature.id}" disabled by ${UI_DISABLED_KEY}`)
          continue
        }
        try {
          ctx.effect(() => feature.mount(workspaces, t), `dsh-heipm: ui:${feature.id}`)
        } catch (error) {
          console.error(`[dsh-heipm] UI feature "${feature.id}" skipped`, error)
        }
      }
    }

    function ensureProcedures(host) {
      if (host) proceduresHost = host
      if (proceduresReady) return proceduresReady
      proceduresReady = require.async('./client.procedures.js').then(
        mod => {
          proceduresApi = mod.createProceduresUi({
            Badge,
            api,
            ResizeHandle,
            formatBytes,
            loadStoredWidth,
            saveStoredWidth,
            locale: proceduresHost ? proceduresHost.locale : null,
            registerLocale: proceduresHost ? proceduresHost.registerLocale : () => {},
            previewSpec: {
              key: WIDTH_KEYS.preview,
              min: PREVIEW_MIN,
              max: PREVIEW_MAX,
              default: PREVIEW_DEFAULT,
              step: PREVIEW_STEP,
            },
          })
          return proceduresApi
        },
        error => {
          proceduresError = error
          throw error
        },
      )
      proceduresReady.catch(() => {})
      return proceduresReady
    }

    function ProceduresSectionLazy(props) {
      const [state, setState] = useState(() => ({ api: proceduresApi, error: proceduresError }))
      useEffect(() => {
        if (state.api || state.error) return undefined
        let alive = true
        ensureProcedures().then(
          api => { if (alive) setState({ api, error: null }) },
          error => { if (alive) setState({ api: null, error }) },
        )
        return () => { alive = false }
      }, [state.api, state.error])
      if (state.api) return h(state.api.ProceduresSection, props)
      if (state.error) {
        return h('div', { className: 'pm-placeholder' },
          h('strong', null, props.t('error.section')),
          h('code', null, String((state.error && state.error.message) || state.error)),
        )
      }
      return h('div', { className: 'pm-loading' }, h('span', { className: 'pm-spinner' }), h('span', null, props.t('status.loading')))
    }

    /* ----- task list: package-local chunk ----- */

    function ensureQuest(host) {
      if (host) questHost = host
      if (questReady) return questReady
      questReady = require.async('./client.quest.js').then(
        mod => {
          questApi = mod.createQuestUi({
            api,
            locale: questHost ? questHost.locale : null,
            registerLocale: questHost ? questHost.registerLocale : () => {},
          })
          return questApi
        },
        error => {
          questError = error
          throw error
        },
      )
      questReady.catch(() => {})
      return questReady
    }

    function QuestSectionLazy(props) {
      const [state, setState] = useState(() => ({ api: questApi, error: questError }))
      useEffect(() => {
        if (state.api || state.error) return undefined
        let alive = true
        ensureQuest().then(
          api => { if (alive) setState({ api, error: null }) },
          error => { if (alive) setState({ api: null, error }) },
        )
        return () => { alive = false }
      }, [state.api, state.error])
      if (state.api) return h(state.api.QuestSection, props)
      if (state.error) {
        return h('div', { className: 'pm-placeholder' },
          h('strong', null, props.t('error.section')),
          h('code', null, String((state.error && state.error.message) || state.error)),
        )
      }
      return h('div', { className: 'pm-loading' }, h('span', { className: 'pm-spinner' }), h('span', null, props.t('status.loading')))
    }


    /* ----- resizable column ----- */

    const WIDTH_KEYS = {
      projects: 'dsh-heipm:projectsWidth:v1',
      sections: 'dsh-heipm:sectionsWidth:v1',
      preview: 'dsh-heipm:proceduresPreviewWidth:v1',
    }
    const PROJECTS_MIN = 180
    const PROJECTS_MAX = 560
    const PROJECTS_DEFAULT = 264
    const PROJECTS_STEP = 16
    const SECTIONS_MIN = 160
    const SECTIONS_MAX = 360
    const SECTIONS_DEFAULT = 208
    const SECTIONS_STEP = 8
    const PREVIEW_MIN = 20
    const PREVIEW_MAX = 70
    const PREVIEW_DEFAULT = 42
    const PREVIEW_STEP = 2

    function loadStoredWidth(key, fallback, min, max) {
      try {
        const value = Number(window.localStorage.getItem(key))
        if (Number.isFinite(value) && value >= min && value <= max) return Math.round(value)
      } catch {}
      return fallback
    }

    function saveStoredWidth(key, value) {
      try {
        window.localStorage.setItem(key, String(value))
      } catch {}
    }

    /* ----- panel-only zoom (Ctrl+wheel) -----
       Root-level zoom changes the whole application because DSH is one document.
       This page owns its own subtree, so scaling `.pm-page` keeps every other
       panel untouched and disappears together with the page on unmount. */

    const ZOOM_KEY = 'dsh-heipm:zoom:v1'
    const ZOOM_STEPS = [0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]
    const ZOOM_MIN = ZOOM_STEPS[0]
    const ZOOM_MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1]
    const ZOOM_WHEEL_THRESHOLD = 24
    const ZOOM_WHEEL_COOLDOWN = 220
    const ZOOM_WHEEL_SESSION = 400

    function nearestZoom(value) {
      return ZOOM_STEPS.reduce(
        (best, step) => (Math.abs(step - value) < Math.abs(best - value) ? step : best),
        1,
      )
    }

    function loadZoom() {
      try {
        const value = Number(window.localStorage.getItem(ZOOM_KEY))
        if (Number.isFinite(value) && value >= ZOOM_MIN && value <= ZOOM_MAX) return nearestZoom(value)
      } catch {}
      return 1
    }

    function saveZoom(value) {
      try {
        window.localStorage.setItem(ZOOM_KEY, String(value))
      } catch {}
    }

    function paintZoom(element, factor) {
      // `zoom` scales the element's own coordinate space, so its percentage
      // sizes (height/width: 100%) keep filling the parent at every factor.
      // Compensating with width/height here would shrink the painted area and
      // expose the window background — that was the earlier bug.
      element.style.removeProperty('width')
      element.style.removeProperty('height')
      // Resize drags measure in painted pixels; expose the factor so a drag can
      // convert back to the page's own (unzoomed) coordinate space.
      element.dataset.pmZoom = String(factor)
      if (factor === 1) {
        element.style.removeProperty('zoom')
        return
      }
      element.style.zoom = String(factor)
    }

    function usePanelZoom(pageRef, setZoomLabel) {
      useEffect(() => {
        const element = pageRef.current
        if (!element) return undefined
        let factor = loadZoom()
        let wheelAcc = 0
        let wheelAt = 0
        let lastStepAt = 0
        let labelTimer = 0

        paintZoom(element, factor)

        function announce(value) {
          setZoomLabel(Math.round(value * 100))
          if (labelTimer) clearTimeout(labelTimer)
          labelTimer = setTimeout(() => setZoomLabel(null), 900)
        }

        function setFactor(next) {
          factor = nearestZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next)))
          saveZoom(factor)
          paintZoom(element, factor)
          announce(factor)
        }

        function step(direction) {
          const index = ZOOM_STEPS.indexOf(nearestZoom(factor))
          const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, index + direction))]
          if (next !== factor) setFactor(next)
        }

        function onWheel(event) {
          if (!event.ctrlKey && !event.metaKey) return
          if (event.deltaY === 0) return
          event.preventDefault()
          event.stopPropagation()
          const now = performance.now()
          if (now - wheelAt > ZOOM_WHEEL_SESSION) wheelAcc = 0
          wheelAt = now
          wheelAcc += event.deltaY
          if (Math.abs(wheelAcc) < ZOOM_WHEEL_THRESHOLD) return
          wheelAcc = 0
          if (now - lastStepAt < ZOOM_WHEEL_COOLDOWN) return
          lastStepAt = now
          step(event.deltaY < 0 ? 1 : -1)
        }

        function onKey(event) {
          // The page may stay mounted while another panel is active.
          if (!element.isConnected || element.offsetWidth === 0) return
          if (!(event.ctrlKey || event.metaKey) || event.altKey) return
          if (event.key === '0') {
            event.preventDefault()
            setFactor(1)
            return
          }
          if (event.key === '=' || event.key === '+') {
            event.preventDefault()
            step(1)
            return
          }
          if (event.key === '-' || event.key === '_') {
            event.preventDefault()
            step(-1)
          }
        }

        element.addEventListener('wheel', onWheel, { passive: false })
        window.addEventListener('keydown', onKey, true)

        return () => {
          element.removeEventListener('wheel', onWheel)
          window.removeEventListener('keydown', onKey, true)
          if (labelTimer) clearTimeout(labelTimer)
          paintZoom(element, 1)
        }
      }, [pageRef, setZoomLabel])
    }

    function clampColumnWidth(value, available, min, max, percent) {
      let upper = max
      // Leave at least 30% of the row for the content column, but never below min.
      if (!percent && available > 0) upper = Math.floor(available * 0.7)
      upper = Math.max(min, Math.min(max, upper))
      return Math.round(Math.max(min, Math.min(upper, value)))
    }

    function ResizeHandle({
      value,
      min,
      max,
      step,
      unit = 'px',
      invert = false,
      onResize,
      onReset,
      onDragChange,
      label,
    }) {
      const [dragging, setDragging] = useState(false)
      const dragRef = useRef(null)
      const percent = unit === '%'
      const unitLabel = percent ? '%' : 'px'

      useEffect(() => {
        if (typeof onDragChange === 'function') onDragChange(dragging)
      }, [dragging, onDragChange])

      // Dragging must not select text anywhere on the page, including the
      // columns owned by sibling sections.
      useEffect(() => {
        if (!dragging) return undefined
        const body = document.body
        if (!body || !body.classList) return undefined
        body.classList.add('pm-resizing')
        return () => body.classList.remove('pm-resizing')
      }, [dragging])

      useEffect(() => {
        if (!dragging) return undefined
        const onMove = event => {
          const drag = dragRef.current
          if (!drag) return
          const clientX = event.touches && event.touches[0] ? event.touches[0].clientX : event.clientX
          if (!Number.isFinite(clientX)) return
          const delta = clientX - drag.startX
          if (Math.abs(delta) < 2 && !drag.moved) return
          drag.moved = true
          // A right-anchored column grows as the pointer moves left.
          const direction = drag.invert ? -1 : 1
          const raw = drag.percent
            ? drag.startValue + (direction * delta / Math.max(1, drag.availableVisual)) * 100
            : drag.startValue + (direction * delta) / drag.zoom
          onResize(clampColumnWidth(raw, drag.available, drag.min, drag.max, drag.percent))
        }
        const onUp = () => {
          dragRef.current = null
          setDragging(false)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        window.addEventListener('touchmove', onMove, { passive: false })
        window.addEventListener('touchend', onUp)
        window.addEventListener('touchcancel', onUp)
        return () => {
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
          window.removeEventListener('touchmove', onMove)
          window.removeEventListener('touchend', onUp)
          window.removeEventListener('touchcancel', onUp)
        }
      }, [dragging, onResize, percent])

      function start(event) {
        if (event.button !== undefined && event.button !== 0) return
        const handle = event.currentTarget
        const parent = handle.parentElement
        const availableVisual = parent ? parent.getBoundingClientRect().width : 0
        const page = handle.closest ? handle.closest('.pm-page') : null
        const zoomValue = page && page.dataset ? Number(page.dataset.pmZoom) : 1
        const zoom = Number.isFinite(zoomValue) && zoomValue > 0 ? zoomValue : 1
        const clientX = event.touches && event.touches[0] ? event.touches[0].clientX : event.clientX
        dragRef.current = {
          startX: clientX,
          startValue: value,
          // Page zoom scales painted pixels; store the unzoomed width so the
          // column keeps its layout size relative to the rest of the page.
          available: availableVisual / zoom,
          availableVisual,
          zoom,
          invert,
          min,
          max,
          percent,
          moved: false,
        }
        setDragging(true)
        if (event.cancelable) event.preventDefault()
      }

      return h('div', {
        className: `pm-resizer${invert ? ' left' : ''}${dragging ? ' dragging' : ''}`,
        role: 'separator',
        'aria-orientation': 'vertical',
        'aria-label': label,
        'aria-valuenow': value,
        'aria-valuemin': min,
        'aria-valuemax': max,
        tabIndex: 0,
        title: `${label} · ${value}${unitLabel}`,
        onMouseDown: start,
        onTouchStart: start,
        onDoubleClick: onReset,
        onKeyDown: event => {
          const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
          if (direction) {
            event.preventDefault()
            const next = value + direction * step * (invert ? -1 : 1)
            onResize(clampColumnWidth(next, 0, min, max, percent))
          } else if (event.key === 'Home') {
            event.preventDefault()
            onReset()
          }
        },
      }, h('span', { className: 'pm-resizer-grip' }))
    }

    /* ----- page ----- */

    const SECTION_KEYS = ['constraints', 'skills', 'procedures', 'quest']
    const LIST_GROUPS_KEY = 'dsh-heipm:listGroupsCollapsed:v1'

    function loadCollapsedGroups() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(LIST_GROUPS_KEY) || '[]')
        return Array.isArray(parsed) ? parsed.filter(value => value === 'projects' || value === 'globals') : []
      } catch {
        return []
      }
    }

    function saveCollapsedGroups(value) {
      try {
        window.localStorage.setItem(LIST_GROUPS_KEY, JSON.stringify(value))
      } catch {}
    }

    function ProjectManagerPage({ t, locale }) {
      const [data, setData] = useState(null)
      const [phase, setPhase] = useState('loading')
      const [loadError, setLoadError] = useState(null)
      const [reloadKey, setReloadKey] = useState(0)
      const [query, setQuery] = useState('')
      const [selectionId, setSelectionId] = useState(null)
      const [section, setSection] = useState('constraints')
      const [projectsWidth, setProjectsWidth] = useState(() => loadStoredWidth(WIDTH_KEYS.projects, PROJECTS_DEFAULT, PROJECTS_MIN, PROJECTS_MAX))
      const [sectionsWidth, setSectionsWidth] = useState(() => loadStoredWidth(WIDTH_KEYS.sections, SECTIONS_DEFAULT, SECTIONS_MIN, SECTIONS_MAX))
      const [resizing, setResizing] = useState(false)
      const [questCounts, setQuestCounts] = useState(null)
      const [questToken, setQuestToken] = useState(0)
      const [sectionError, setSectionError] = useState({})
      const [stale, setStale] = useState(null)
      const [collapsedGroups, setCollapsedGroups] = useState(() => loadCollapsedGroups())
      const dirtyRef = useRef(false)
      const stampsRef = useRef(null)
      const questStampRef = useRef(null)
      const scopeRef = useRef(null)
      const refreshRef = useRef(null)
      const searchRef = useRef(null)
      const schemeProbeRef = useRef(null)
      const pageRef = useRef(null)
      const [zoomLabel, setZoomLabel] = useState(null)
      const scheme = useColorScheme(schemeProbeRef)

      usePanelZoom(pageRef, setZoomLabel)

      const [, setLocaleTick] = useState(0)
      useEffect(() => locale.subscribe(() => setLocaleTick(tick => tick + 1)), [locale])

      useEffect(() => {
        const onChanged = () => setReloadKey(key => key + 1)
        window.addEventListener('dsh-heipm:workspaces-changed', onChanged)
        return () => window.removeEventListener('dsh-heipm:workspaces-changed', onChanged)
      }, [])

      useEffect(() => {
        const controller = new AbortController()
        setPhase('loading')
        setLoadError(null)
        api({ action: 'list' }, controller.signal)
          .then(result => { setData(result); setPhase('ready') })
          .catch(error => {
            if (error && error.name === 'AbortError') return
            setLoadError(error && error.message ? error.message : String(error))
            setPhase('error')
          })
        return () => controller.abort()
      }, [reloadKey])

      useEffect(() => {
        const onKey = event => {
          if (event.key === '/' && !isTypingTarget(event.target)) {
            event.preventDefault()
            if (searchRef.current) searchRef.current.focus()
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [])

      const items = useMemo(() => {
        if (!data) return []
        const list = []
        for (const project of data.projects || []) list.push({ kind: 'project', id: project.id, title: project.title, path: project.displayPath, project })
        for (const entry of data.globals || []) list.push({ kind: 'global', id: entry.id, title: t(entry.id === 'dsh' ? 'scope.dsh' : 'scope.shared'), path: entry.displayPath, project: null })
        return list
      }, [data, t])

      const tokens = useMemo(() => query.trim() ? query.trim().toLowerCase().split(/\s+/).filter(Boolean) : [], [query])

      const filtered = useMemo(() => {
        if (!tokens.length) return items
        const scored = []
        for (const item of items) {
          const score = scoreFields([item.title, item.path, item.id], tokens)
          if (score >= 0) scored.push({ ...item, score })
        }
        scored.sort((left, right) => right.score - left.score)
        return scored
      }, [items, tokens])

      const current = useMemo(() => {
        if (!filtered.length) return null
        const found = filtered.find(item => `${item.kind}:${item.id}` === selectionId)
        return found || filtered[0]
      }, [filtered, selectionId])

      const currentKey = current ? `${current.kind}:${current.id}` : ''
      scopeRef.current = current
      useEffect(() => {
        if (current && currentKey !== selectionId) setSelectionId(currentKey)
      }, [currentKey])

      useEffect(() => {
        if (!current) return
        stampsRef.current = null
        questStampRef.current = null
        setSectionError({})
        setStale(null)
        dirtyRef.current = false
        primeStamp(current)
      }, [currentKey])

      useEffect(() => {
        const timer = setInterval(() => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
          const scope = scopeRef.current
          if (!scope) return
          const payload = { action: 'stamp' }
          if (scope.kind === 'project') payload.projectPath = scope.project.path
          api(payload).then(result => {
            if (scopeRef.current !== scope) return
            const stamps = result && result.stamps
            if (!stamps) return
            const previous = stampsRef.current
            stampsRef.current = stamps
            if (!previous) return
            if (scope.kind === 'global') {
              if (previous.globals !== stamps.globals) refreshRef.current(scope, 'constraints')
              return
            }
            if (previous.constraints !== stamps.constraints) refreshRef.current(scope, 'constraints')
            if (previous.skills !== stamps.skills) refreshRef.current(scope, 'skills')
            if (previous.procedures !== stamps.procedures) refreshRef.current(scope, 'procedures')
            const known = questStampRef.current === null ? previous.quest : questStampRef.current
            if (stamps.quest !== known) {
              questStampRef.current = stamps.quest
              setQuestToken(token => token + 1)
            }
          }).catch(() => {})
        }, 3000)
        return () => clearInterval(timer)
      }, [currentKey])

      function toggleGroup(key) {
        setCollapsedGroups(previous => {
          const next = previous.includes(key) ? previous.filter(value => value !== key) : [...previous, key]
          saveCollapsedGroups(next)
          return next
        })
      }

      function applyRefresh(result) {
        if (!result) return
        if (result.scopeKind === 'global') {
          setData(previous => previous
            ? { ...previous, globals: (previous.globals || []).map(entry => entry.id === result.id ? { ...entry, files: result.files } : entry) }
            : previous)
          return
        }
        setData(previous => {
          if (!previous) return previous
          return {
            ...previous,
            projects: (previous.projects || []).map(entry => {
              if (entry.path !== result.projectPath) return entry
              return {
                ...entry,
                directories: result.directories || entry.directories,
                inventory: result.inventory ? { ...entry.inventory, ...result.inventory } : entry.inventory,
              }
            }),
          }
        })
      }

      async function primeStamp(scope) {
        try {
          const payload = { action: 'stamp' }
          if (scope && scope.kind === 'project') payload.projectPath = scope.project.path
          const result = await api(payload)
          if (result && result.stamps) stampsRef.current = result.stamps
        } catch {}
      }

      async function refreshScope(scope, part) {
        if (!scope) return
        const key = part === 'all' || part === 'constraints' ? 'constraints' : part
        setSectionError(previous => ({ ...previous, [key]: null }))
        try {
          if (part === 'quest') {
            setQuestToken(token => token + 1)
            return
          }
          const payload = scope.kind === 'global'
            ? { action: 'refresh', globalId: scope.id }
            : { action: 'refresh', projectPath: scope.project.path, part }
          const result = await api(payload)
          const touchesConstraints = part === 'all' || part === 'constraints'
          if (touchesConstraints && dirtyRef.current) setStale(result)
          else {
            applyRefresh(result)
            if (touchesConstraints) setStale(null)
          }
          await primeStamp(scopeRef.current || scope)
        } catch (error) {
          setSectionError(previous => ({ ...previous, [key]: error && error.message ? error.message : String(error) }))
        }
      }
      refreshRef.current = refreshScope

      function select(item) {
        setSelectionId(`${item.kind}:${item.id}`)
        dirtyRef.current = false
        setStale(null)
        refreshScope(item, 'all')
      }

      function reload() {
        setReloadKey(key => key + 1)
      }

      function onSaved(filePath, patch) {
        setData(previous => patchFile(previous, filePath, { ...patch, exists: true, tooLarge: false, error: null }))
      }
      function onDeleted(filePath) {
        setData(previous => patchFile(previous, filePath, { exists: false, content: null, version: null, size: 0, tooLarge: false, error: null }))
      }

      const scope = current || null
      const proceduresEnabled = !data || data.proceduresEnabled !== false
      const questEnabled = !data || data.questEnabled !== false
      const sections = SECTION_KEYS
        .filter(key => key !== 'procedures' || proceduresEnabled)
        .filter(key => key !== 'quest' || questEnabled)
        .map(key => ({
          key,
          title: t(`section.${key}.title`),
          desc: t(`section.${key}.desc`),
          available: true,
        }))
      const activeSection = sections.find(entry => entry.key === section) || sections[1]
      const projectItems = filtered.filter(item => item.kind === 'project')
      const globalItems = filtered.filter(item => item.kind === 'global')
      const projectCount = tokens.length ? projectItems.length : (data && data.projects ? data.projects.length : 0)
      const projectsOpen = tokens.length > 0 || !collapsedGroups.includes('projects')
      const globalsOpen = tokens.length > 0 || !collapsedGroups.includes('globals')

      function renderSection() {
        if (!data || !scope) return null
        if (scope.kind === 'global' && activeSection.key !== 'constraints') {
          return h(Placeholder, {
            title: t('global.scoped.title'),
            body: t(proceduresEnabled ? 'global.scoped.body' : 'global.scoped.body.basic'),
          })
        }
        if (activeSection.key === 'constraints') {
          const file = resolveScopeFile(data, scope)
          if (!file) return h(Placeholder, { title: t('editor.emptyTitle'), body: t('editor.emptyBody') })
          return h('div', { className: 'pm-split-main' },
            h(EditorPane, {
              key: `${file.path}@${file.version || 'new'}`,
              file,
              t,
              onSaved,
              onDeleted,
              reload,
              stale,
              onStaleReload: () => {
                if (!stale) return
                applyRefresh(stale)
                setStale(null)
              },
              onDirtyChange: value => { dirtyRef.current = Boolean(value) },
            }),
          )
        }
        if (activeSection.key === 'skills') return h(SkillsSection, { t, project: scope.project })
        if (activeSection.key === 'quest') {
          return h(QuestSectionLazy, {
            project: scope.project,
            active: section === 'quest',
            onCounts: setQuestCounts,
            refreshToken: questToken,
            onStamp: value => { questStampRef.current = value },
          })
        }
        return h(ProceduresSectionLazy, { t, project: scope.project, onReload: reload })
      }

      return h('div', { className: 'pm-page', 'data-scheme': scheme, ref: pageRef },
        h('style', null, CSS),
        h('span', { className: 'pm-scheme-probe', ref: schemeProbeRef, 'aria-hidden': true }),
        zoomLabel === null ? null : h('div', { className: 'pm-zoom-badge' }, `${zoomLabel}%`),
        !data && phase === 'loading'
          ? h('div', { className: 'pm-loading' }, h('span', { className: 'pm-spinner' }), h('span', null, t('status.loading')))
          : null,
        !data && phase === 'error'
          ? h('div', { className: 'pm-placeholder' },
              h('strong', null, t('error.load')),
              h('code', null, loadError || ''),
              h('button', { type: 'button', className: 'pm-btn', onClick: reload }, t('action.retry')),
            )
          : null,
        data
          ? h('div', {
              className: `pm-body${resizing ? ' resizing' : ''}`,
              style: {
                '--pm-projects-width': `${projectsWidth}px`,
                '--pm-sections-width': `${sectionsWidth}px`,
              },
            },
              h('aside', { className: 'pm-col projects' },
                h('div', { className: 'pm-search' },
                  h(SearchIcon),
                  h('input', {
                    ref: searchRef,
                    type: 'text',
                    value: query,
                    onChange: event => setQuery(event.target.value),
                    onKeyDown: event => {
                      if (event.key === 'Escape') { setQuery(''); event.currentTarget.blur() }
                    },
                    placeholder: t('search.placeholder'),
                    'aria-label': t('search.placeholder'),
                    autoComplete: 'off',
                    spellCheck: false,
                  }),
                  query ? h('button', {
                    type: 'button',
                    title: t('search.clear'),
                    'aria-label': t('search.clear'),
                    onClick: () => { setQuery(''); if (searchRef.current) searchRef.current.focus() },
                  }, '×') : null,
                ),
                tokens.length ? h('div', { className: 'pm-search-meta' }, `${filtered.length} ${t('search.results')}`) : null,
                h('div', { className: 'pm-scroll' },
                  tokens.length && filtered.length === 0
                    ? h('div', { className: 'pm-empty-nav' }, t('search.noResults'))
                    : [
                        filtered.some(item => item.kind === 'project')
                          ? h('button', {
                              key: 'gp',
                              type: 'button',
                              className: 'pm-group-label',
                              'aria-expanded': projectsOpen,
                              onClick: () => toggleGroup('projects'),
                            },
                              h('span', { className: 'pm-group-caret', 'aria-hidden': 'true' }, projectsOpen ? '▾' : '▸'),
                              h('span', { className: 'pm-group-name' }, t('group.projects')),
                              h('span', { className: 'pm-group-count' }, String(projectCount)),
                            )
                          : null,
                        projectsOpen
                          ? projectItems.map(item => h('button', {
                              key: `project:${item.id}`,
                              type: 'button',
                              className: `pm-item${current && current.kind === 'project' && current.id === item.id ? ' active' : ''}`,
                              title: item.path,
                              onClick: () => select(item),
                            },
                              h('span', { className: 'pm-item-icon' }, h(PanelIcon, { size: 15, active: current && current.id === item.id })),
                              h('span', { className: 'pm-item-main' },
                                h('span', { className: 'pm-item-title' }, item.title),
                                h('span', { className: 'pm-item-path' }, item.path),
                              ),
                            ))
                          : null,
                        filtered.some(item => item.kind === 'global')
                          ? h('button', {
                              key: 'gg',
                              type: 'button',
                              className: 'pm-group-label',
                              'aria-expanded': globalsOpen,
                              onClick: () => toggleGroup('globals'),
                            },
                              h('span', { className: 'pm-group-caret', 'aria-hidden': 'true' }, globalsOpen ? '▾' : '▸'),
                              h('span', { className: 'pm-group-name' }, t('group.global')),
                            )
                          : null,
                        globalsOpen
                          ? globalItems.map(item => h('button', {
                              key: `global:${item.id}`,
                              type: 'button',
                              className: `pm-item${current && current.kind === 'global' && current.id === item.id ? ' active' : ''}`,
                              title: item.path,
                              onClick: () => select(item),
                            },
                              h('span', { className: 'pm-item-icon' }, h(SectionIcon, { kind: 'constraints', size: 15 })),
                              h('span', { className: 'pm-item-main' },
                                h('span', { className: 'pm-item-title' }, item.title),
                                h('span', { className: 'pm-item-path' }, item.path),
                              ),
                            ))
                          : null,
                        !tokens.length && (data.projects || []).length === 0
                          ? h('div', { className: 'pm-empty-nav', key: 'none' }, t('tree.noProjects'))
                          : null,
                      ],
                ),
              ),
              h(ResizeHandle, {
                value: projectsWidth,
                min: PROJECTS_MIN,
                max: PROJECTS_MAX,
                step: PROJECTS_STEP,
                label: t('col.projects'),
                onDragChange: setResizing,
                onResize: width => {
                  setProjectsWidth(current => {
                    if (current === width) return current
                    saveStoredWidth(WIDTH_KEYS.projects, width)
                    return width
                  })
                },
                onReset: () => {
                  saveStoredWidth(WIDTH_KEYS.projects, PROJECTS_DEFAULT)
                  setProjectsWidth(PROJECTS_DEFAULT)
                },
              }),
              h('aside', { className: 'pm-col sections' },
                h('div', { className: 'pm-col-head' }, t('col.sections')),
                h('div', { className: 'pm-scroll' },
                  scope
                    ? sections.map(entry => h('button', {
                        key: entry.key,
                        type: 'button',
                        className: `pm-item${activeSection && activeSection.key === entry.key ? ' active' : ''}`,
                        title: entry.desc,
                        onClick: () => {
                          setSection(entry.key)
                          if (scope) refreshScope(scope, entry.key)
                        },
                      },
                        h('span', { className: 'pm-item-icon' }, h(SectionIcon, { kind: entry.key, size: 15 })),
                        h('span', { className: 'pm-item-main' }, h('span', { className: 'pm-item-title' }, entry.title)),
                        entry.key === 'quest' && questCounts && questCounts.total > 0
                          ? h('span', { className: 'pm-item-count' }, `${questCounts.done}/${questCounts.total}`)
                          : null,
                      ))
                    : h('div', { className: 'pm-empty-nav' }, t('error.noProject')),
                ),
              ),
              h(ResizeHandle, {
                value: sectionsWidth,
                min: SECTIONS_MIN,
                max: SECTIONS_MAX,
                step: SECTIONS_STEP,
                label: t('col.sections'),
                onResize: width => {
                  setSectionsWidth(current => {
                    if (current === width) return current
                    saveStoredWidth(WIDTH_KEYS.sections, width)
                    return width
                  })
                },
                onReset: () => {
                  saveStoredWidth(WIDTH_KEYS.sections, SECTIONS_DEFAULT)
                  setSectionsWidth(SECTIONS_DEFAULT)
                },
              }),
              h('main', { className: 'pm-col main' },
                !scope
                  ? h(Placeholder, { title: t('error.noProject'), body: t(proceduresEnabled ? 'page.subtitle' : 'page.subtitle.basic') })
                  : h('div', { style: { display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' } },
                      h('div', { className: 'pm-section-head' },
                        h('div', null,
                          h('h2', null, activeSection.title),
                          h('p', null, activeSection.desc),
                        ),
                        h('div', { className: 'pm-section-actions' },
                          sectionError[activeSection.key]
                            ? h('button', {
                                type: 'button',
                                className: 'pm-btn',
                                title: sectionError[activeSection.key],
                                onClick: () => refreshScope(scope, activeSection.key),
                              }, t('action.retry'))
                            : null,
                          h('span', { className: 'pm-badge' }, scope.kind === 'project' ? scope.title : scope.path),
                        ),
                      ),
                      h(SectionBoundary, { key: `${scope.kind}:${scope.id}:${activeSection.key}`, t }, renderSection()),
                    ),
              ),
            )
          : null,
      )
    }

    function apply(ctx) {
      const locale = ctx.locale
      const disposers = []
      disposers.push(locale.register(NS, 'en', EN))
      disposers.push(locale.register(NS, 'zh', ZH))
      const t = locale.bind(NS)
      const workspaces = typeof ctx.get === 'function' ? ctx.get('workspaces') : null
      ensureProcedures({ locale, registerLocale: dispose => disposers.push(dispose) })
      ensureQuest({ locale, registerLocale: dispose => disposers.push(dispose) })
      installClientFeatures(ctx, workspaces, t)
      /* 主题先落地再挂设置页：打开页面就是用户上次选的颜色。 */
      loadTheme()
      ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'heipm-style',
        order: 40,
        label: () => t('style.nav'),
        locale: NS,
        inject: () => ({ t }),
      }, HeipmStyleSection)), 'dsh-heipm: heipm style settings')
      ctx.effect(startMarkdownStyling, 'dsh-heipm: session markdown styling')
      ctx.effect(() => () => {
        for (const dispose of disposers) {
          try { dispose() } catch {}
        }
      }, 'dsh-heipm: locale dictionaries')

      function ProjectsPanel(props) {
        return h(ProjectManagerPage, { ...props, t, locale })
      }

      ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: 'projects',
        order: 20,
        label: () => t('nav.label'),
      }, PanelIcon)), 'dsh-heipm: sidebar entry')

      ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: 'projects',
      }, ProjectsPanel)), 'dsh-heipm: main panel')
    }

    return {
      inject: ['slots', 'locale', 'workspaces'],
      apply,
      __test: {
        installWorkspaceContextMenu,
        HOST_CONTRACT,
        uiFeatureDisabled,
        classifyFlowRow,
        planProcessGroups,
        pickFollowIndex,
        createProcessShelf,
        PROCESS_SHELF_CSS,
        workspaceKeyId,
        workspaceRowId,
        normalizeWorkspaceTitle,
        clampMenuPosition,
        workspaceTitleOf,
        workspaceErrorText,
        normalizeTheme,
        themeCssText,
        THEME_DEFAULTS,
        THEME_COLOR_KEYS,
      },
    }
  },
})
