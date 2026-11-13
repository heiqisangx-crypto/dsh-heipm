window.__ModuleLoader__.load({
  id: 'dsh-heipm',
  chunk: 'client.quest.js',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useMemo, useRef, useState } = React

    const NS = 'dsh-heipm/quest'

    const EN = {
      'summary.open': 'Open {count}',
      'summary.awaiting': 'Awaiting {count}',
      'summary.done': 'Done {count}',
      'summary.pending': 'Read-only: changes here are not written back.',
      'group.open': 'Unfinished requirements',
      'group.done': 'Finished requirements',
      'group.showDone': 'Show {count} finished requirements',
      'group.hideDone': 'Hide finished requirements',
      'summary.reading': 'Reading the task list...',
      'state.open': 'Open',
      'state.running': 'Running',
      'state.awaiting': 'Awaiting',
      'state.done': 'Done',
      'summary.running': 'Running {count}',
      'action.expand': 'Show subtasks',
      'action.collapse': 'Hide subtasks',
      'action.toggle': 'Cycle: open -> awaiting -> done -> open',
      'action.addReq': 'New requirement',
      'action.addReqPrompt': 'Requirement title (no number, no marker):',
      'action.addItem': 'Add subtask',
      'action.addItemPrompt': 'Subtask title:',
      'action.rename': 'Rename',
      'action.renamePrompt': 'New title:',
      'action.remove': 'Delete',
      'action.removeConfirm': 'Delete "{label}"? Subtasks go with it.',
      'seq.title': 'Requirement number',
      'action.cancel': 'Cancel',
      'action.confirm': 'OK',
      'action.retry': 'Try again',
      'error.load': 'Could not read the task list.',
      'error.staleAlert': 'The task list changed on disk; reloading.',
      'error.tooLarge': 'This task list is too large to show here.',
      'empty.title': 'No task list yet',
      'empty.body': 'This project has no {path}. Ask for a new requirement to create it, then refresh.',
      'view.all': 'All tasks',
      'view.track': 'Tracking',
      'layout.label': 'Arrangement',
      'layout.list': 'List',
      'layout.grid': 'Cards',
      'legacy.note': 'Found an old Markdown task list that has not been migrated: {path}. Run this once:',
      'legacy.copy': 'Click to copy the migration command',
      'legacy.copied': 'Migration command copied.',
      'size.label': 'Card width',
      'track.pick': 'Track requirement',
      'track.untrack': 'Stop tracking',
      'track.active': 'Tracking',
      'track.empty': 'Nothing tracked yet. Pick a requirement below to keep it in view.',
      'track.left': '{count} left',
      'track.locked': 'Tracked: stays expanded',
      'track.picker': 'Track a requirement (click again to stop)',
    }

    const ZH = {
      'summary.open': '未完成 {count}',
      'summary.awaiting': '待验收 {count}',
      'summary.done': '已完成 {count}',
      'summary.pending': '只读视图：这里的切换不会写回文件。',
      'group.open': '未完成的需求',
      'group.done': '已完成的需求',
      'group.showDone': '展开 {count} 条已完成需求',
      'group.hideDone': '收起已完成需求',
      'summary.reading': '正在读取任务清单…',
      'state.open': '未完成',
      'state.running': '执行中',
      'state.awaiting': '待验收',
      'state.done': '已完成',
      'summary.running': '执行中 {count}',
      'action.expand': '展开子任务',
      'action.collapse': '收起子任务',
      'action.toggle': '点击切换：未完成 → 待验收 → 已完成 → 未完成',
      'action.addReq': '新增需求',
      'action.addReqPrompt': '需求标题（不写序号、不写状态标记）：',
      'action.addItem': '加子任务',
      'action.addItemPrompt': '子任务标题：',
      'action.rename': '改名',
      'action.renamePrompt': '新的标题：',
      'action.remove': '删除',
      'action.removeConfirm': '删除「{label}」？子任务会一起删掉。',
      'seq.title': '需求序号',
      'action.cancel': '取消',
      'action.confirm': '确定',
      'action.retry': '重试',
      'error.load': '读取任务清单失败。',
      'error.staleAlert': '任务清单在磁盘上已被修改，正在重新加载。',
      'error.tooLarge': '任务清单太大，无法在这里显示。',
      'empty.title': '还没有任务清单',
      'empty.body': '这个项目下没有 {path}。提出「新需求」后会生成，再刷新即可看到。',
      'view.all': '全部任务',
      'view.track': '任务跟踪',
      'layout.label': '排列方式',
      'layout.list': '列表',
      'layout.grid': '卡片',
      'legacy.note': '检测到旧版任务清单尚未迁移：{path}。请先运行一次：',
      'legacy.copy': '点击复制迁移命令',
      'legacy.copied': '迁移命令已复制。',
      'size.label': '卡片宽度',
      'track.pick': '跟踪需求',
      'track.untrack': '取消跟踪',
      'track.active': '跟踪中',
      'track.empty': '还没有跟踪任何需求，在下面选一个放进来。',
      'track.left': '剩 {count}',
      'track.locked': '跟踪中：保持展开',
      'track.picker': '跟踪需求（再点一次取消）',
      'track.open': '跟踪需求',
      'track.close': '收起',
      'track.selected': '已跟踪 {count}',
      'track.all': '全部 {count}',
      'track.search': '搜索需求…',
      'track.none': '没有匹配的需求',
    }

    const CSS = `      .pm-quest-list { display: flex; flex-direction: column; gap: 10px; padding: 0 20px 32px; overflow: auto; min-height: 0; }
      .pm-quest-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .pm-quest-chip {
        display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px; border-radius: 999px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); white-space: nowrap;
      }
      .pm-quest-chip::before { content: ''; width: 7px; height: 7px; border-radius: 999px; background: var(--dsw-alias-border-l1); }
      .pm-quest-chip[data-kind="open"]::before { background: var(--dsw-alias-label-secondary); }
      .pm-quest-chip[data-kind="awaiting"]::before { background: var(--pm-accent); }
      .pm-quest-chip[data-kind="done"]::before { background: #2ea043; }
      .pm-quest-card { min-height: 38px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
      .pm-quest-card[data-state="done"] { opacity: .8; }
      .pm-quest-row { display: flex; align-items: flex-start; gap: 8px; padding: 5px 12px; border-radius: 8px; }
      .pm-quest-row:hover { background: var(--pm-accent-softer); }
      .pm-quest-row.is-parent { align-items: center; padding: 6px 18px 6px 10px; }
      .pm-quest-toggle {
        flex: 0 0 auto; display: grid; place-items: center; width: 22px; height: 22px; margin-top: 0;
        border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer;
      }
      .pm-quest-toggle:hover { color: var(--pm-accent-strong); background: var(--pm-accent-soft); }
      .pm-quest-toggle:focus-visible { outline: 2px solid var(--pm-accent-ring); outline-offset: 1px; }
      .pm-quest-caret { display: inline-block; transition: transform .15s ease; }
      .pm-quest-toggle[aria-expanded="true"] .pm-quest-caret { transform: rotate(90deg); }
      .pm-quest-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
      .pm-quest-head { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
      /* 需求序号：由 requirement.seq 渲染的独立徽章，不进标题正文。 */
      /* 排列方式切换 */
      /* 顶部整块固定在列表顶部，不随滚轮滑走 */
      .pm-quest-headbar { position: sticky; top: 0; z-index: 6; margin: 0 -20px; padding: 14px 20px 10px; background: var(--dsw-alias-bg-layer-1); border-bottom: 1px solid var(--dsw-alias-border-l1); display: flex; flex-direction: column; gap: 8px; }
      .pm-quest-controls { display: inline-flex; align-items: center; gap: 10px; margin-left: auto; }
      .pm-quest-legacy { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; border: 1px solid color-mix(in srgb, #d9a441 55%, transparent); background: color-mix(in srgb, #d9a441 12%, transparent); font-size: 12px; color: var(--dsw-alias-label-primary); }
      .pm-quest-legacy-note { flex: 1 1 220px; min-width: 0; }
      .pm-quest-legacy-cmd { flex: 0 1 auto; max-width: 100%; padding: 3px 8px; border-radius: 6px; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l1); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.5px; cursor: copy; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .pm-quest-layout { display: inline-flex; border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px; overflow: hidden; }
      .pm-quest-slider { display: inline-flex; align-items: center; gap: 6px; }
      .pm-quest-slider[data-hidden="true"] { visibility: hidden; }
      .pm-quest-slider input[type="range"] { width: 96px; accent-color: var(--pm-accent); cursor: pointer; }
      .pm-quest-slider-value { font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; min-width: 38px; }
      .pm-quest-layout-btn { padding: 3px 10px; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 12px; cursor: pointer; }
      .pm-quest-layout-btn[data-on="true"] { background: color-mix(in srgb, var(--pm-accent) 16%, transparent); color: var(--pm-accent-strong); font-weight: 600; }
      /* 卡片视图：网格排布，不能展开，点整张卡切换追踪 */
      .pm-quest-group-body[data-layout="grid"] { display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--pm-card-min, 240px), 1fr)); gap: 10px; }

      .pm-quest-gridcard { display: flex; flex-direction: column; gap: 6px; min-height: 68px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); text-align: left; font: inherit; color: inherit; cursor: pointer; }
      .pm-quest-gridcard:hover { border-color: var(--pm-accent); background: var(--pm-accent-softer); }
      .pm-quest-gridcard[data-tracked="true"] { border-color: var(--pm-accent); box-shadow: inset 3px 0 0 var(--pm-accent); }
      .pm-quest-gridcard[data-state="done"] { opacity: .8; }
      .pm-quest-gridcard-head { display: flex; align-items: center; gap: 8px; }
      .pm-quest-gridcard-state { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .pm-quest-gridcard-state[data-state="done"] { color: #2ea043; }
      .pm-quest-gridcard-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--pm-accent); }
      .pm-quest-gridcard-title { font-size: 13px; font-weight: 600; line-height: 1.5; color: var(--dsw-alias-label-primary); word-break: break-word; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .pm-quest-gridcard-meta { font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .pm-quest-overlay { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, .38); }
      .pm-quest-dialog { width: min(560px, calc(100vw - 48px)); padding: 20px 24px; border-radius: 10px; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); box-shadow: 0 18px 48px rgba(0, 0, 0, .35); display: flex; flex-direction: column; gap: 10px; }
      .pm-quest-dialog-title { font-size: 14px; font-weight: 700; }
      .pm-quest-dialog-body { font-size: 12.5px; color: var(--dsw-alias-label-secondary); display: flex; flex-direction: column; gap: 6px; }
      .pm-quest-dialog-label { color: var(--dsw-alias-label-secondary); }
      .pm-quest-input { box-sizing: border-box; width: 100%; min-height: 34px; padding: 7px 11px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-size: 13px; outline: none; }
      .pm-quest-input:focus { border-color: var(--pm-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--pm-accent) 22%, transparent); }
      .pm-quest-dialog-foot { display: flex; justify-content: flex-end; gap: 8px; }
      .pm-quest-btn { padding: 5px 14px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-primary); font-size: 12.5px; cursor: pointer; }
      .pm-quest-btn:hover { border-color: var(--pm-accent); color: var(--pm-accent-strong); }
      .pm-quest-btn.primary { background: var(--pm-accent); border-color: var(--pm-accent); color: #fff; }
      .pm-quest-btn.primary:hover { filter: brightness(1.08); color: #fff; }
      .pm-quest-add { flex: 0 0 auto; margin-left: auto; white-space: nowrap; padding: 2px 10px; border-radius: 6px; border: 1px dashed color-mix(in srgb, var(--pm-accent) 45%, transparent); background: transparent; color: var(--pm-accent-strong); font-size: 12px; cursor: pointer; }
      .pm-quest-add:hover { background: color-mix(in srgb, var(--pm-accent) 10%, transparent); border-style: solid; }
      .pm-quest-mini { flex: 0 0 auto; width: 18px; height: 18px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-secondary) 30%, transparent); background: transparent; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1; cursor: pointer; opacity: 0; }
      .pm-quest-row:hover .pm-quest-mini, .pm-quest-row:focus-within .pm-quest-mini, .pm-quest-solo .pm-quest-mini { opacity: 1; }
      .pm-quest-mini:hover { border-color: var(--pm-accent); color: var(--pm-accent-strong); }
      .pm-quest-mini-danger:hover { border-color: #d9534f; color: #d9534f; }
      .pm-quest-seq { flex: 0 0 auto; min-height: 18px; padding: 0 5px; display: inline-flex; align-items: center; justify-content: center; border-radius: 5px; font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--pm-accent-strong); background: color-mix(in srgb, var(--pm-accent) 12%, transparent); border: 1px solid color-mix(in srgb, var(--pm-accent) 32%, transparent); }
      .pm-quest-head-text { flex: 1 1 auto; min-width: 0; font-size: 13.5px; font-weight: 600; line-height: 1.55; color: var(--dsw-alias-label-primary); word-break: break-word; }
      .pm-quest-text { flex: 1 1 auto; min-width: 0; font-size: 12.5px; line-height: 1.7; color: var(--dsw-alias-label-primary); word-break: break-word; cursor: pointer; }
      .pm-quest-row.leaf[data-state="done"] .pm-quest-text { color: var(--dsw-alias-label-secondary); }
      .pm-quest-group { display: flex; flex-direction: column; gap: 8px; }
      .pm-quest-group-head {
        display: flex; align-items: center; gap: 8px; padding: 6px 2px 2px; border: 0; background: transparent;
        color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; letter-spacing: .02em; cursor: pointer; text-align: left;
      }
      .pm-quest-group-head:hover { color: var(--pm-accent-strong); }
      .pm-quest-group-head .pm-quest-caret { transition: transform .15s ease; }
      .pm-quest-group-head[aria-expanded="true"] .pm-quest-caret { transform: rotate(90deg); }
      .pm-quest-group-count { font-variant-numeric: tabular-nums; opacity: .75; }
      .pm-quest-group-body { display: flex; flex-direction: column; gap: 10px; }
      .pm-quest-solo { min-height: 38px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
      .pm-quest-solo .pm-quest-head { align-items: center; padding: 6px 18px 6px 10px; cursor: default; }
      .pm-quest-solo .pm-quest-head-text { font-size: 13px; font-weight: 500; }
      .pm-quest-code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .92em; padding: 1px 5px; border-radius: 5px; background: var(--pm-accent-softer); color: var(--pm-accent-strong); }
      .pm-quest-children { display: flex; flex-direction: column; gap: 1px; padding: 2px 0 2px 8px; border-left: 1px solid var(--dsw-alias-border-l1); margin-left: 10px; }
      .pm-quest-box {
        flex: 0 0 auto; display: grid; place-items: center; width: 17px; height: 17px; margin-top: 3px;
        padding: 0; border-radius: 5px; border: 1.5px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base);
        color: transparent; font-size: 11px; font-weight: 700; line-height: 1; cursor: pointer;
        transition: border-color .12s ease, background .12s ease;
      }
      .pm-quest-box:hover:not(:disabled) { border-color: var(--pm-accent); }
      .pm-quest-box:focus-visible { outline: 2px solid var(--pm-accent-ring); outline-offset: 2px; }
      .pm-quest-box[data-state="awaiting"] { border-color: var(--pm-accent); color: var(--pm-accent); background: var(--pm-accent-softer); }
      .pm-quest-box[data-state="done"] { border-color: #2ea043; background: #2ea043; color: #ffffff; }
      .pm-quest-box[data-state="running"] { border-color: var(--pm-accent); color: var(--pm-accent); background: var(--pm-accent-softer); }
      .pm-quest-spin {
        display: block; width: 11px; height: 11px; border-radius: 999px; box-sizing: border-box;
        border: 2px solid color-mix(in srgb, var(--pm-accent) 30%, transparent); border-top-color: var(--pm-accent);
        animation: pm-quest-spin .7s linear infinite;
      }
      @keyframes pm-quest-spin { to { transform: rotate(360deg); } }
      .pm-quest-chip[data-kind="running"]::before { background: var(--pm-accent); }
      @media (prefers-reduced-motion: reduce) { .pm-quest-spin { animation-duration: 2.4s; } }
      .pm-quest-box:disabled { cursor: progress; opacity: .6; }
      .pm-quest-label {
        flex: 0 0 auto; margin-top: 2px; padding: 1px 8px; border-radius: 999px; font-size: 11px; line-height: 1.6; white-space: nowrap;
        border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary);
      }
      .pm-quest-label[data-state="done"] { color: #2ea043; border-color: color-mix(in srgb, #2ea043 55%, transparent); }
      .pm-quest-banner { font-size: 12px; color: var(--dsw-alias-state-error-primary); }
      .pm-quest-tabs { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding-bottom: 2px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .pm-quest-tab {
        display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; margin-bottom: -3px; border: 0; border-bottom: 2px solid transparent;
        background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 13px; cursor: pointer;
      }
      .pm-quest-tab:hover { color: var(--pm-accent-strong); }
      .pm-quest-tab[aria-selected="true"] { color: var(--pm-accent-strong); border-bottom-color: var(--pm-accent); font-weight: 600; }
      .pm-quest-tab-count { font-variant-numeric: tabular-nums; opacity: .75; }
      .pm-quest-pickbar { display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
      .pm-quest-pickhead { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
      .pm-quest-pickopen {
        display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px;
        border: 1px dashed var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-secondary);
        font: inherit; font-size: 12px; cursor: pointer;
      }
      .pm-quest-pickopen:hover, .pm-quest-pickopen[aria-expanded="true"] { border-color: var(--pm-accent); color: var(--pm-accent-strong); }
      .pm-quest-picknote { font-size: 12px; color: var(--dsw-alias-label-secondary); cursor: default; }
      .pm-quest-panel {
        display: flex; flex-direction: column; gap: 2px; max-height: 280px; overflow: auto; padding: 6px;
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-base);
      }
      .pm-quest-panel-search { position: sticky; top: 0; z-index: 1; padding: 2px 4px 6px; background: var(--dsw-alias-bg-base); }
      .pm-quest-panel-search input {
        width: 100%; box-sizing: border-box; padding: 5px 9px; border-radius: 8px; font: inherit; font-size: 12px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
      }
      .pm-quest-option {
        display: flex; align-items: center; gap: 8px; width: 100%; padding: 5px 8px; border: 0; border-radius: 7px;
        background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; text-align: left; cursor: pointer;
      }
      .pm-quest-option:hover { background: var(--pm-accent-softer); }
      .pm-quest-option[data-on="true"] { color: var(--pm-accent-strong); }
      .pm-quest-option-tick { flex: 0 0 auto; width: 14px; text-align: center; color: var(--pm-accent-strong); }
      .pm-quest-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .pm-quest-option-num { flex: 0 0 auto; font-variant-numeric: tabular-nums; opacity: .7; }
      .pm-quest-panel-empty { padding: 6px 8px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .pm-quest-label[data-state="tracked"] { color: var(--pm-accent-strong); border-color: var(--pm-accent); background: var(--pm-accent-soft); }
      .pm-quest-track {
        flex: 0 0 auto; margin-top: 2px; padding: 0 7px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1);
        background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11px; line-height: 1.6; cursor: pointer; opacity: 0;
      }
      .pm-quest-row:hover .pm-quest-track, .pm-quest-track[data-on="true"] { opacity: 1; }
      .pm-quest-track:hover { border-color: var(--pm-accent); color: var(--pm-accent-strong); }
      .pm-quest-track[data-on="true"] { border-color: var(--pm-accent); color: var(--pm-accent-strong); background: var(--pm-accent-soft); }`

    const NEXT_STATE = { open: 'running', running: 'awaiting', awaiting: 'done', done: 'open' }

    /** 把树拍平成一层，子任务在前序遍历里紧跟父节点。 */
    function flatten(nodes, out = []) {
      for (const node of nodes) {
        out.push(node)
        if (node.children && node.children.length) flatten(node.children, out)
      }
      return out
    }

    /** 只渲染行内代码与加粗，其余按纯文本输出。 */
    function renderInline(text) {
      const parts = String(text || '').split(new RegExp("([*][*][^*]+[*][*]|`[^`]+`)", 'g'))
      return parts.map((part, index) => {
        if (!part) return null
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return h('strong', { key: index }, part.slice(2, -2))
        if (part.length > 2 && part.charAt(0) === '`' && part.charAt(part.length - 1) === '`') return h('code', { key: index, className: 'pm-quest-code' }, part.slice(1, -1))
        return h(React.Fragment, { key: index }, part)
      })
    }

    /** 自下而上统计每个节点下还有几个未完成的叶子。 */
    function countPending(nodes, results = {}) {
      for (const node of nodes) {
        const children = node.children || []
        if (children.length) {
          countPending(children, results)
          results[node.line] = children.reduce((sum, child) => sum + (results[child.line] || 0), 0)
        } else {
          results[node.line] = node.state === 'done' ? 0 : 1
        }
      }
      return results
    }

    function normalize(payload) {
      const items = Array.isArray(payload.items) ? payload.items : []
      const counts = payload.counts || {}
      return {
        ...payload,
        items,
        counts: {
          total: Number(counts.total || 0),
          done: Number(counts.done || 0),
          awaiting: Number(counts.awaiting || 0),
          open: Number(counts.open || 0),
          running: Number(counts.running || 0),
        },
        pending: countPending(items),
      }
    }

    /** 跟踪态存浏览器本地，不写任务清单文件。 */
    function readTracked(projectPath) {
      try {
        const raw = window.localStorage.getItem('dsh-heipm:quest:tracked:' + projectPath)
        const list = JSON.parse(raw || '[]')
        return Array.isArray(list) ? list.map(Number).filter(Number.isFinite) : []
      } catch {
        return []
      }
    }

    function writeTracked(projectPath, lines) {
      try {
        window.localStorage.setItem('dsh-heipm:quest:tracked:' + projectPath, JSON.stringify(lines))
      } catch {}
    }

    /** 排列方式（列表 / 卡片）存浏览器本地，不进任务清单。 */
    function readLayout(projectPath) {
      try {
        const raw = window.localStorage.getItem('dsh-heipm:quest:layout:' + projectPath)
        return raw === 'grid' ? 'grid' : 'list'
      } catch {
        return 'list'
      }
    }

    function writeLayout(projectPath, layout) {
      try {
        window.localStorage.setItem('dsh-heipm:quest:layout:' + projectPath, layout)
      } catch {}
    }

    /** 卡片宽度：拖动滑块设定像素值，只影响宽度，高度始终由内容决定。 */
    const CARD_MIN_WIDTH = 160
    const CARD_MAX_WIDTH = 440
    const CARD_DEFAULT_WIDTH = 240

    function clampCardWidth(value) {
      const n = Math.round(Number(value))
      if (!Number.isFinite(n)) return CARD_DEFAULT_WIDTH
      return Math.min(CARD_MAX_WIDTH, Math.max(CARD_MIN_WIDTH, n))
    }

    function readCardWidth(projectPath) {
      try {
        const raw = window.localStorage.getItem('dsh-heipm:quest:cardwidth:' + projectPath)
        return raw === null ? CARD_DEFAULT_WIDTH : clampCardWidth(raw)
      } catch {
        return CARD_DEFAULT_WIDTH
      }
    }

    function writeCardWidth(projectPath, width) {
      try {
        window.localStorage.setItem('dsh-heipm:quest:cardwidth:' + projectPath, String(clampCardWidth(width)))
      } catch {}
    }

    /** 大任务下未完成子任务数；没有子任务返回 null。 */
    function openInBranch(node) {
      const children = node.children || []
      if (!children.length) return null
      return flatten(children).filter(child => child.state !== 'done').length
    }

    const STYLE_ATTR = 'heipm:quest'

    /** 插件没有 styles 服务，自建一个 style 标签挂到 head，且只装一次。 */
    function installStyles() {
      if (typeof document === 'undefined' || !document.head || typeof document.createElement !== 'function') return
      if (typeof document.head.querySelector === 'function' && document.head.querySelector('style[data-plugin-css="' + STYLE_ATTR + '"]')) return
      const tag = document.createElement('style')
      tag.setAttribute('data-plugin-css', STYLE_ATTR)
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    function createQuestUi({ api, locale, registerLocale }) {
      installStyles()
      registerLocale(locale.register(NS, { en: EN, zh: ZH }))
      const t = locale.bind(NS)

      function QuestSection({ project, active, onCounts, refreshToken, onStamp }) {
        const [doc, setDoc] = useState(null)
        const [phase, setPhase] = useState('loading')
        const [error, setError] = useState(null)
        const [notice, setNotice] = useState(null)
        const [expanded, setExpanded] = useState({})
        const [busy, setBusy] = useState({})
        const [reloadKey, setReloadKey] = useState(0)
        const [showDone, setShowDone] = useState(false)
        const [view, setView] = useState('all')
        // 排列方式：list = 一行行，grid = 小卡片。任务跟踪始终用 list。
        const [layout, setLayout] = useState('list')
        const [cardWidth, setCardWidth] = useState(CARD_DEFAULT_WIDTH)
        const [tracked, setTracked] = useState([])
        const [picking, setPicking] = useState(false)
        const [pickQuery, setPickQuery] = useState('')
        // 输入/确认弹窗：Electron 不支持 window.prompt，改用页内弹窗。
        const [ask, setAsk] = useState(null)
        const askResolve = useRef(null)
        const alive = useRef(true)
        const projectPath = project && project.path ? project.path : null

        useEffect(() => {
          alive.current = true
          return () => { alive.current = false }
        }, [])

        useEffect(() => {
          setView('all')
          setPicking(false)
          setPickQuery('')
          setTracked(projectPath ? readTracked(projectPath) : [])
          setLayout(projectPath ? readLayout(projectPath) : 'list')
          setCardWidth(projectPath ? readCardWidth(projectPath) : CARD_DEFAULT_WIDTH)
          setDoc(null)
          setPhase('loading')
          setError(null)
          setNotice(null)
          setExpanded({})
        }, [projectPath])

        useEffect(() => {
          if (!projectPath || !active) return undefined
          const controller = new AbortController()
          api({ action: 'quest', projectPath }, controller.signal)
            .then(result => {
              if (!alive.current) return
              const next = normalize(result)
              setDoc(next)
              setPhase('ready')
              if (typeof onStamp === 'function') onStamp(next.version || '-')
              const flat = flatten(next.items)
              const target = flat.find(item => !(item.children && item.children.length) && item.state !== 'done' && item.parent !== null && item.parent !== undefined)
              if (target) setExpanded({ 0: true, [target.parent]: true })
            })
            .catch(failure => {
              if (!alive.current || (failure && failure.name === 'AbortError')) return
              setError(failure && failure.message ? failure.message : String(failure))
              setPhase('error')
            })
          return () => controller.abort()
        }, [projectPath, active, reloadKey, refreshToken])

        const counts = doc ? doc.counts : { total: 0, done: 0, awaiting: 0, open: 0 }
        useEffect(() => {
          if (typeof onCounts === 'function') onCounts(counts)
        }, [counts.total, counts.done, counts.awaiting, counts.open, counts.running, onCounts])

        /** 旧 Markdown 还没迁移：给出可复制的命令，绝不偷偷导入。 */
        function migrateCommand() {
          const target = projectPath || '<项目路径>'
          return 'node node_modules/dsh-heipm/scripts/migrate-quest.mjs "' + target + '"'
        }

        async function copyMigrateCommand() {
          const text = migrateCommand()
          try {
            if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(text)
              setNotice(t('legacy.copied'))
              return
            }
          } catch {}
          setNotice(text)
        }

        /** 切排列方式：立刻写本地，刷新页面后保持。 */
        function changeLayout(next) {
          setLayout(next)
          if (projectPath) writeLayout(projectPath, next)
        }

        /** 拖滑块改卡片宽度：只改宽度，高度仍由内容决定。 */
        function changeCardWidth(next) {
          const width = clampCardWidth(next)
          setCardWidth(width)
          if (projectPath) writeCardWidth(projectPath, width)
        }

        function toggleTrack(line) {
          const next = tracked.includes(line) ? tracked.filter(value => value !== line) : tracked.concat(line)
          setTracked(next)
          if (projectPath) writeTracked(projectPath, next)
        }

        function toggleBranch(line) {
          setExpanded(current => ({ ...current, [line]: !current[line] }))
        }

        /** 打开页内弹窗，返回用户输入的文本；取消返回 null。 */
        function askText(title, label, initial = '') {
          return new Promise(resolve => {
            askResolve.current = resolve
            setAsk({ kind: 'text', title, label, value: initial })
          })
        }

        function askConfirm(title, label) {
          return new Promise(resolve => {
            askResolve.current = resolve
            setAsk({ kind: 'confirm', title, label, value: '' })
          })
        }

        function settleAsk(value) {
          const resolve = askResolve.current
          askResolve.current = null
          setAsk(null)
          if (typeof resolve === 'function') resolve(value)
        }

        /** 新增需求：页内输入框，拿到标题就走宿主 action。 */
        async function addRequirement() {
          if (!projectPath) return
          const title = await askText(t('action.addReq'), t('action.addReqPrompt'))
          if (!title || !title.trim()) return
          setBusy(current => ({ ...current, __add: true }))
          setNotice(null)
          api({ action: 'quest-create', projectPath, kind: 'req', title: title.trim() })
            .then(result => {
              if (!alive.current) return
              setDoc(normalize(result))
              if (typeof onStamp === 'function') onStamp(normalize(result).version || '-')
            })
            .catch(failure => setNotice(failure && failure.message ? failure.message : String(failure)))
            .finally(() => setBusy(current => ({ ...current, __add: false })))
        }

        /** 新增子任务：isRequirement 为真就挂在需求下，否则挂在某个子任务下。 */
        async function addItem(nodeId, isRequirement) {
          if (!projectPath) return
          const title = await askText(t('action.addItem'), t('action.addItemPrompt'))
          if (!title || !title.trim()) return
          setNotice(null)
          const payload = { action: 'quest-create', projectPath, kind: 'item', title: title.trim() }
          if (isRequirement) payload.requirementId = nodeId
          else payload.parentId = nodeId
          api(payload)
            .then(result => { if (alive.current) setDoc(normalize(result)) })
            .catch(failure => setNotice(failure && failure.message ? failure.message : String(failure)))
        }

        /** 改标题：需求与子任务都走同一个 action。 */
        async function renameItem(id, label) {
          if (!projectPath) return
          const title = await askText(t('action.rename'), t('action.renamePrompt'), label || '')
          if (!title || !title.trim() || title.trim() === label) return
          setNotice(null)
          api({ action: 'quest-rename', projectPath, id, title: title.trim() })
            .then(result => {
              if (!alive.current) return
              setDoc(normalize(result))
              if (typeof onStamp === 'function') onStamp(normalize(result).version || '-')
            })
            .catch(failure => setNotice(failure && failure.message ? failure.message : String(failure)))
        }

        /** 删除节点：需求连同子任务一起删，所以先确认。 */
        async function removeItem(id, label) {
          if (!projectPath) return
          const ok = await askConfirm(t('action.remove'), t('action.removeConfirm', { label }))
          if (!ok) return
          setNotice(null)
          api({ action: 'quest-remove', projectPath, id })
            .then(result => {
              if (!alive.current) return
              setDoc(normalize(result))
              if (typeof onStamp === 'function') onStamp(normalize(result).version || '-')
            })
            .catch(failure => setNotice(failure && failure.message ? failure.message : String(failure)))
        }

        function cycle(item) {
          if (!doc || doc.keepOpen) return
          const nextState = NEXT_STATE[item.state] || 'awaiting'
          setBusy(current => ({ ...current, [item.line]: true }))
          setNotice(null)
          api({ action: 'quest-state', projectPath, itemId: item.id, state: nextState, version: doc.version })
            .then(result => {
              if (!alive.current) return
              const next = normalize(result)
              setDoc(next)
              if (typeof onStamp === 'function') onStamp(next.version || '-')
              setExpanded(current => {
                const open = { ...current }
                for (const entry of flatten(next.items)) {
                  if (entry.children && entry.children.length && open[entry.line] === undefined) open[entry.line] = Boolean(current[entry.parent])
                }
                return open
              })
            })
            .catch(failure => {
              if (!alive.current) return
              if (failure && failure.code === 'stale') {
                setNotice(t('error.staleAlert'))
                setReloadKey(key => key + 1)
                return
              }
              setNotice(failure && failure.message ? failure.message : String(failure))
            })
            .then(() => {
              if (alive.current) setBusy(current => ({ ...current, [item.line]: false }))
            })
        }

        function renderLeaf(item) {
          const disabled = Boolean(doc.keepOpen || busy[item.line])
          const label = item.state === 'done' ? '✓' : item.state === 'awaiting' ? '–' : ''
          const spinner = item.state === 'running'
            ? h('span', { className: 'pm-quest-spin', 'aria-hidden': true })
            : null
          return h('div', { key: item.line, className: 'pm-quest-row leaf', 'data-state': item.state, 'data-line': item.line },
            h('button', {
              type: 'button',
              className: 'pm-quest-box',
              'data-state': item.state,
              role: 'checkbox',
              'aria-checked': item.state === 'done' ? 'true' : (item.state === 'awaiting' || item.state === 'running') ? 'mixed' : 'false',
              title: t('action.toggle'),
              'aria-label': item.label + ' · ' + t('state.' + item.state),
              disabled,
              onClick: () => cycle(item),
            }, spinner || label),
            h('span', { className: 'pm-quest-text', onClick: () => cycle(item), onDoubleClick: () => { if (item.id) renameItem(item.id, item.label) } }, renderInline(item.label)),
            item.id ? h('button', {
              type: 'button', className: 'pm-quest-mini', title: t('action.addItem'), 'aria-label': t('action.addItem'),
              onClick: (event) => { event.stopPropagation(); addItem(item.id, false) },
            }, '+') : null,
            item.id ? h('button', {
              type: 'button', className: 'pm-quest-mini', title: t('action.rename'), 'aria-label': t('action.rename'),
              onClick: (event) => { event.stopPropagation(); renameItem(item.id, item.label) },
            }, '\u270E') : null,
            item.id ? h('button', {
              type: 'button', className: 'pm-quest-mini pm-quest-mini-danger', title: t('action.remove'), 'aria-label': t('action.remove'),
              onClick: (event) => { event.stopPropagation(); removeItem(item.id, item.label) },
            }, '\u00D7') : null,
          )
        }

        /** 大块需求由子任务决定状态，本身不可勾选，只显示未完成/已完成。 */
        function isFinished(item) {
          const children = item.children || []
          if (children.length) return (doc.pending[item.line] || 0) === 0
          return item.state === 'done'
        }

        function renderSolo(item) {
          const done = isFinished(item)
          return h('div', { key: item.line, className: 'pm-quest-row is-parent pm-quest-solo', 'data-state': done ? 'done' : 'open', 'data-line': item.line },
            h('div', { className: 'pm-quest-body' },
              h('div', { className: 'pm-quest-head' },
                item.seq ? h('span', { className: 'pm-quest-seq', title: t('seq.title') || String(item.seq) }, String(item.seq)) : null,
                h('span', { className: 'pm-quest-head-text' }, renderInline(item.label)),
                h('span', { className: 'pm-quest-label', 'data-state': done ? 'done' : 'open' }, done ? t('state.done') : t('state.open')),
                item.id ? h('button', {
                  type: 'button', className: 'pm-quest-mini', title: t('action.addItem'), 'aria-label': t('action.addItem'),
                  onClick: (event) => { event.stopPropagation(); addItem(item.id, true) },
                }, '+') : null,
                item.id ? h('button', {
                  type: 'button', className: 'pm-quest-mini', title: t('action.rename'), 'aria-label': t('action.rename'),
                  onClick: (event) => { event.stopPropagation(); renameItem(item.id, item.label) },
                }, '\u270E') : null,
                item.id ? h('button', {
                  type: 'button', className: 'pm-quest-mini pm-quest-mini-danger', title: t('action.remove'), 'aria-label': t('action.remove'),
                  onClick: (event) => { event.stopPropagation(); removeItem(item.id, item.label) },
                }, '\u00D7') : null,
              ),
            ),
          )
        }

        function renderBranch(item, depth = 0) {
          const children = item.children || []
          const isTracked = depth === 0 && tracked.includes(item.line)
          // 被跟踪的大任务保持展开，点标题不会收起。
          const isOpen = isTracked || Boolean(expanded[item.line])
          const isDone = (doc.pending[item.line] || 0) === 0
          const caret = h('svg', {
            width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
            strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', className: 'pm-quest-caret', 'aria-hidden': true,
          }, h('path', { d: 'M9 5l7 7-7 7' }))
          return h('div', {
            key: item.line,
            className: depth === 0 ? 'pm-quest-row is-parent pm-quest-card' : 'pm-quest-row is-parent',
            'data-state': isDone ? 'done' : 'open',
            'data-line': item.line,
          },
            h('button', {
              type: 'button',
              className: 'pm-quest-toggle',
              'aria-expanded': isOpen,
              title: isTracked ? t('track.locked') : isOpen ? t('action.collapse') : t('action.expand'),
              'aria-label': isTracked ? t('track.locked') : isOpen ? t('action.collapse') : t('action.expand'),
              'aria-disabled': isTracked ? 'true' : undefined,
              onClick: () => { if (!isTracked) toggleBranch(item.line) },
            }, caret),
            h('div', { className: 'pm-quest-body' },
              h('button', { type: 'button', className: 'pm-quest-head', onClick: () => { if (!isTracked) toggleBranch(item.line) } },
                item.seq ? h('span', { className: 'pm-quest-seq', title: t('seq.title') || String(item.seq) }, String(item.seq)) : null,
                h('span', { className: 'pm-quest-head-text' }, renderInline(item.label)),
                h('span', { className: 'pm-quest-label', 'data-state': isDone ? 'done' : 'open' }, isDone ? t('state.done') : t('state.open')),
                isTracked ? h('span', { className: 'pm-quest-label', 'data-state': 'tracked' }, t('track.active')) : null,
                h('button', {
                  type: 'button',
                  className: 'pm-quest-mini',
                  title: t('action.addItem'),
                  'aria-label': t('action.addItem'),
                  onClick: (event) => { event.stopPropagation(); if (item.id) addItem(item.id, depth === 0) },
                }, '+'),
                h('button', {
                  type: 'button',
                  className: 'pm-quest-mini',
                  title: t('action.rename'),
                  'aria-label': t('action.rename'),
                  onClick: (event) => { event.stopPropagation(); if (item.id) renameItem(item.id, item.label) },
                }, '\u270E'),
                h('button', {
                  type: 'button',
                  className: 'pm-quest-mini pm-quest-mini-danger',
                  title: t('action.remove'),
                  'aria-label': t('action.remove'),
                  onClick: (event) => { event.stopPropagation(); if (item.id) removeItem(item.id, item.label) },
                }, '×'),
                depth === 0
                  ? h('button', {
                      type: 'button',
                      className: 'pm-quest-track',
                      'data-on': isTracked ? 'true' : 'false',
                      'data-line': item.line,
                      title: isTracked ? t('track.untrack') : t('track.pick'),
                      'aria-label': isTracked ? t('track.untrack') : t('track.pick'),
                      onClick: () => toggleTrack(item.line),
                    }, isTracked ? t('track.untrack') : t('track.pick'))
                  : null,
              ),
              isOpen
                ? h('div', { className: 'pm-quest-children' }, children.map(child => (child.children && child.children.length) ? renderBranch(child, depth + 1) : renderLeaf(child)))
                : null,
            ),
          )
        }

        if (!projectPath) {
          return h('div', { className: 'pm-placeholder' }, h('strong', null, t('error.load')))
        }

        if (phase === 'loading' && !doc) {
          return h('div', { className: 'pm-loading' }, h('span', { className: 'pm-spinner' }), h('span', null, t('summary.reading')))
        }

        if (!doc) {
          return h('div', { className: 'pm-placeholder' },
            h('strong', null, t('error.load')),
            h('code', null, error || ''),
            h('button', { type: 'button', className: 'pm-btn', onClick: () => setReloadKey(key => key + 1) }, t('action.retry')),
          )
        }

        if (!doc.exists || doc.tooLarge || !doc.items.length) {
          const title = !doc.exists ? t('empty.title') : t('error.tooLarge')
          const body = !doc.exists ? t('empty.body', { path: doc.relativePath }) : doc.displayPath
          return h('div', { className: 'pm-placeholder' },
            h('strong', null, title),
            h('span', null, body),
            h('button', { type: 'button', className: 'pm-btn', onClick: () => setReloadKey(key => key + 1) }, t('action.retry')),
          )
        }

        const openItems = doc.items.filter(item => !isFinished(item))
        const doneItems = doc.items.filter(item => isFinished(item))

        /** 小卡片：只有序号、标题、状态与进度，点整张卡切换追踪，不能展开。 */
        function renderCard(item) {
          const isTracked = tracked.includes(item.line)
          const done = isFinished(item)
          const leaves = Number(item.leaves || 0)
          const doneLeaves = Number(item.doneLeaves || 0)
          return h('button', {
            type: 'button',
            key: item.line,
            className: 'pm-quest-gridcard',
            'data-state': done ? 'done' : 'open',
            'data-tracked': isTracked ? 'true' : 'false',
            'data-line': item.line,
            title: isTracked ? t('track.untrack') : t('track.pick'),
            'aria-pressed': isTracked ? 'true' : 'false',
            onClick: () => toggleTrack(item.line),
          },
            h('div', { className: 'pm-quest-gridcard-head' },
              item.seq ? h('span', { className: 'pm-quest-seq' }, String(item.seq)) : null,
              h('span', { className: 'pm-quest-gridcard-state', 'data-state': done ? 'done' : 'open' }, done ? t('state.done') : t('state.open')),
              isTracked ? h('span', { className: 'pm-quest-gridcard-dot', 'aria-hidden': true }) : null,
            ),
            h('div', { className: 'pm-quest-gridcard-title' }, renderInline(item.label)),
            leaves > 1
              ? h('div', { className: 'pm-quest-gridcard-meta' }, doneLeaves + '/' + leaves)
              : null,
          )
        }

        /** 一行行的渲染（任务跟踪也用这个，永远不切成卡片）。 */
        function renderListItem(item) {
          return (item.children && item.children.length) ? renderBranch(item) : renderSolo(item)
        }

        function renderRequirement(item) {
          if (layout === 'grid') return renderCard(item)
          return renderListItem(item)
        }

        const doneHead = h('button', {
          type: 'button',
          className: 'pm-quest-group-head',
          'aria-expanded': showDone,
          onClick: () => setShowDone(value => !value),
        },
          h('svg', {
            width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
            strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', className: 'pm-quest-caret', 'aria-hidden': true,
          }, h('path', { d: 'M9 5l7 7-7 7' })),
          h('span', null, t('group.done')),
          h('span', { className: 'pm-quest-group-count' }, String(doneItems.length)),
          h('span', { className: 'pm-quest-group-count' }, showDone ? t('group.hideDone') : t('group.showDone', { count: doneItems.length })),
        )

        const left = doc.items.filter(item => !isFinished(item)).length
        const trackedItems = doc.items.filter(item => tracked.includes(item.line))

        // 页内弹窗：输入标题或确认删除。Electron 不支持 window.prompt。
        const dialog = ask
          ? h('div', {
              className: 'pm-quest-overlay',
              onClick: event => { if (event.target === event.currentTarget) settleAsk(null) },
              onKeyDown: event => { if (event.key === 'Escape') settleAsk(null) },
            },
            h('div', { className: 'pm-quest-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': ask.title },
              h('div', { className: 'pm-quest-dialog-title' }, ask.title),
              ask.kind === 'text'
                ? h('div', { className: 'pm-quest-dialog-body' },
                    h('div', { className: 'pm-quest-dialog-label' }, ask.label),
                    h('input', {
                      className: 'pm-quest-input',
                      type: 'text',
                      value: ask.value || '',
                      autoFocus: true,
                      maxLength: 200,
                      onChange: event => setAsk(current => current ? { ...current, value: event.target.value } : current),
                      onKeyDown: event => { if (event.key === 'Enter') settleAsk(event.target.value) },
                    }),
                  )
                : h('div', { className: 'pm-quest-dialog-body' }, ask.label),
              h('div', { className: 'pm-quest-dialog-foot' },
                h('button', { type: 'button', className: 'pm-quest-btn', onClick: () => settleAsk(null) }, t('action.cancel')),
                h('button', {
                  type: 'button',
                  className: 'pm-quest-btn primary',
                  onClick: () => settleAsk(ask.kind === 'text' ? ask.value : true),
                }, ask.kind === 'text' ? t('action.confirm') : t('action.remove')),
              ),
            ),
          )
          : null

        /** 纯图标：三条横线 = 列表，四格 = 卡片。 */
        function layoutIcon(kind) {
          const common = {
            width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
            strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
          }
          if (kind === 'list') return h('svg', common, h('path', { d: 'M4 6h16M4 12h16M4 18h16' }))
          return h('svg', common,
            h('rect', { x: 3.5, y: 3.5, width: 7, height: 7, rx: 1.2 }),
            h('rect', { x: 13.5, y: 3.5, width: 7, height: 7, rx: 1.2 }),
            h('rect', { x: 3.5, y: 13.5, width: 7, height: 7, rx: 1.2 }),
            h('rect', { x: 13.5, y: 13.5, width: 7, height: 7, rx: 1.2 }),
          )
        }

        // 右侧控制区：图标切换 + 卡片宽度滑块，整体靠右。
        // 滑块放左边并常驻占位：否则切列表时它消失，右边的按钮组会左右跳。
        const widthSlider = h('div', {
          className: 'pm-quest-slider',
          title: t('size.label'),
          'data-hidden': layout === 'grid' ? 'false' : 'true',
        },
        h('input', {
          type: 'range',
          min: CARD_MIN_WIDTH,
          max: CARD_MAX_WIDTH,
          step: 10,
          value: cardWidth,
          'aria-label': t('size.label'),
          tabIndex: layout === 'grid' ? 0 : -1,
          onChange: event => changeCardWidth(event && event.target ? event.target.value : CARD_DEFAULT_WIDTH),
        }),
        h('span', { className: 'pm-quest-slider-value' }, cardWidth + 'px'),
        )

        const controls = h('div', { className: 'pm-quest-controls' },
          widthSlider,
          h('div', { className: 'pm-quest-layout', role: 'group', 'aria-label': t('layout.label') },
            h('button', {
              type: 'button',
              className: 'pm-quest-layout-btn',
              'data-on': layout === 'list' ? 'true' : 'false',
              'aria-pressed': layout === 'list' ? 'true' : 'false',
              title: t('layout.list'),
              'aria-label': t('layout.list'),
              onClick: () => changeLayout('list'),
            }, layoutIcon('list')),
            h('button', {
              type: 'button',
              className: 'pm-quest-layout-btn',
              'data-on': layout === 'grid' ? 'true' : 'false',
              'aria-pressed': layout === 'grid' ? 'true' : 'false',
              title: t('layout.grid'),
              'aria-label': t('layout.grid'),
              onClick: () => changeLayout('grid'),
            }, layoutIcon('grid')),
          ),
        )

        const tabs = h('div', { className: 'pm-quest-tabs', role: 'tablist' },
          h('button', {
            type: 'button',
            role: 'tab',
            className: 'pm-quest-tab',
            'data-view': 'all',
            'aria-selected': view === 'all' ? 'true' : 'false',
            onClick: () => setView('all'),
          },
            h('span', null, t('view.all')),
            h('span', { className: 'pm-quest-tab-count' }, String(left)),
          ),
          h('button', {
            type: 'button',
            role: 'tab',
            className: 'pm-quest-tab',
            'data-view': 'track',
            'aria-selected': view === 'track' ? 'true' : 'false',
            onClick: () => setView('track'),
          },
            h('span', null, t('view.track')),
            trackedItems.length
              ? h('span', { className: 'pm-quest-tab-count' }, trackedItems.map(item => t('track.left', { count: openInBranch(item) || 0 })).join(' · '))
              : null,
            h('span', { className: 'pm-quest-tab-count' }, String(trackedItems.length)),
          ),
          view === 'all' ? controls : null,
        )

        // 大需求可能上百条，平铺会被撑成一墙标签：默认只留一行，点开才是可搜索的列表。
        const allBranches = doc.items.filter(item => openInBranch(item) !== null)
        const needle = pickQuery.trim().toLowerCase()
        const options = needle ? allBranches.filter(item => String(item.label).toLowerCase().includes(needle)) : allBranches

        const picker = h('div', { className: 'pm-quest-pickbar' },
          h('div', { className: 'pm-quest-pickhead' },
          h('button', {
            type: 'button',
            className: 'pm-quest-pickopen',
            'aria-expanded': picking ? 'true' : 'false',
            onClick: () => setPicking(value => !value),
          }, picking ? t('track.close') : t('track.open')),
          h('span', { className: 'pm-quest-picknote' },
            t('track.selected', { count: trackedItems.length }) + ' · ' + t('track.all', { count: allBranches.length }),
          ),
          ),
          picking
            ? h('div', { className: 'pm-quest-panel' },
                h('div', { className: 'pm-quest-panel-search' },
                  h('input', {
                    type: 'search',
                    value: pickQuery,
                    placeholder: t('track.search'),
                    'aria-label': t('track.search'),
                    onChange: event => setPickQuery(event && event.target ? String(event.target.value) : ''),
                  }),
                ),
                options.length
                  ? options.map(item => h('button', {
                      type: 'button',
                      key: item.line,
                      className: 'pm-quest-option',
                      'data-on': tracked.includes(item.line) ? 'true' : 'false',
                      'data-line': item.line,
                      title: tracked.includes(item.line) ? t('track.untrack') : t('track.pick'),
                      onClick: () => toggleTrack(item.line),
                    },
                      h('span', { className: 'pm-quest-option-tick' }, tracked.includes(item.line) ? '✓' : ''),
                      h('span', { className: 'pm-quest-option-label' }, renderInline(item.label)),
                      h('span', { className: 'pm-quest-option-num' }, String(doc.pending[item.line] || 0)),
                    ))
                  : h('div', { className: 'pm-quest-panel-empty' }, t('track.none')),
              )
            : null,
        )

        if (view === 'track') {
          return h('div', { className: 'pm-quest-list', 'data-quest': doc.relativePath, 'data-view': 'track' },
            h('div', { className: 'pm-quest-headbar' },
              tabs,
              h('div', { className: 'pm-quest-summary' },
                notice ? h('span', { className: 'pm-quest-banner', role: 'alert' }, notice) : null,
              ),
            ),
            doc.items.filter(item => openInBranch(item) !== null).length
              ? picker
              : h('div', { className: 'pm-placeholder' }, h('span', null, t('track.empty'))),
            trackedItems.length
              // 任务跟踪只支持一行行显示，不跟随卡片布局。
              ? h('div', { className: 'pm-quest-group-body', 'data-layout': 'list' }, trackedItems.map(renderListItem))
              : h('div', { className: 'pm-placeholder' }, h('span', null, t('track.empty'))),
            dialog,
          )
        }

        return h('div', { className: 'pm-quest-list', 'data-quest': doc.relativePath, 'data-view': 'all' },
          h('div', { className: 'pm-quest-headbar' },
            tabs,
            h('div', { className: 'pm-quest-summary' },
              h('span', { className: 'pm-quest-chip', 'data-kind': 'open' }, t('summary.open', { count: counts.open })),
              counts.running > 0 ? h('span', { className: 'pm-quest-chip', 'data-kind': 'running' }, t('summary.running', { count: counts.running })) : null,
              h('span', { className: 'pm-quest-chip', 'data-kind': 'awaiting' }, t('summary.awaiting', { count: counts.awaiting })),
              h('span', { className: 'pm-quest-chip', 'data-kind': 'done' }, t('summary.done', { count: counts.done })),
              doc.keepOpen ? h('span', null, t('summary.pending')) : null,
              notice ? h('span', { className: 'pm-quest-banner', role: 'alert' }, notice) : null,
              h('button', {
                type: 'button',
                className: 'pm-quest-add',
                title: t('action.addReq'),
                'aria-label': t('action.addReq'),
                onClick: () => addRequirement(),
              }, '+ ' + t('action.addReq')),
            ),
            doc.legacyPath
              ? h('div', { className: 'pm-quest-legacy', role: 'status' },
                  h('span', { className: 'pm-quest-legacy-note' }, t('legacy.note', { path: doc.legacyPath })),
                  h('code', {
                    className: 'pm-quest-legacy-cmd',
                    title: t('legacy.copy'),
                    onClick: () => { copyMigrateCommand() },
                  }, migrateCommand()),
                )
              : null,
          ),
          h('div', { className: 'pm-quest-group' },
            h('div', { className: 'pm-quest-group-head', role: 'presentation' },
              h('span', null, t('group.open')),
              h('span', { className: 'pm-quest-group-count' }, String(openItems.length)),
            ),
            openItems.length
              ? h('div', { className: 'pm-quest-group-body', 'data-layout': layout, style: { '--pm-card-min': cardWidth + 'px' } }, openItems.map(renderRequirement))
              : null,
          ),
          doneItems.length
            ? h('div', { className: 'pm-quest-group' },
                doneHead,
                showDone ? h('div', { className: 'pm-quest-group-body', 'data-layout': layout, style: { '--pm-card-min': cardWidth + 'px' } }, doneItems.map(renderRequirement)) : null,
              )
            : null,
          dialog,
        )
      }

      function QuestSectionLocalized(props) {
        return h(QuestSection, { ...props, t })
      }

      return { QuestSection: QuestSectionLocalized, styles: CSS }
    }

    return { createQuestUi, NS }
  },
})
