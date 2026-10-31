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
      'state.awaiting': 'Awaiting',
      'state.done': 'Done',
      'action.expand': 'Show subtasks',
      'action.collapse': 'Hide subtasks',
      'action.toggle': 'Cycle: open -> awaiting -> done -> open',
      'action.retry': 'Try again',
      'error.load': 'Could not read the task list.',
      'error.staleAlert': 'The task list changed on disk; reloading.',
      'error.tooLarge': 'This task list is too large to show here.',
      'empty.title': 'No task list yet',
      'empty.body': 'This project has no {path}. Ask for a new requirement to create it, then refresh.',
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
      'state.awaiting': '待验收',
      'state.done': '已完成',
      'action.expand': '展开子任务',
      'action.collapse': '收起子任务',
      'action.toggle': '点击切换：未完成 → 待验收 → 已完成 → 未完成',
      'action.retry': '重试',
      'error.load': '读取任务清单失败。',
      'error.staleAlert': '任务清单在磁盘上已被修改，正在重新加载。',
      'error.tooLarge': '任务清单太大，无法在这里显示。',
      'empty.title': '还没有任务清单',
      'empty.body': '这个项目下没有 {path}。提出「新需求」后会生成，再刷新即可看到。',
    }

    const CSS = `      .pm-quest-list { display: flex; flex-direction: column; gap: 10px; padding: 16px 20px 32px; overflow: auto; min-height: 0; }
      .pm-quest-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .pm-quest-chip {
        display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px; border-radius: 999px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); white-space: nowrap;
      }
      .pm-quest-chip::before { content: ''; width: 7px; height: 7px; border-radius: 999px; background: var(--dsw-alias-border-l1); }
      .pm-quest-chip[data-kind="open"]::before { background: var(--dsw-alias-label-secondary); }
      .pm-quest-chip[data-kind="awaiting"]::before { background: var(--pm-accent); }
      .pm-quest-chip[data-kind="done"]::before { background: #2ea043; }
      .pm-quest-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
      .pm-quest-card[data-state="done"] { opacity: .8; }
      .pm-quest-row { display: flex; align-items: flex-start; gap: 8px; padding: 5px 12px; border-radius: 8px; }
      .pm-quest-row:hover { background: var(--pm-accent-softer); }
      .pm-quest-row.is-parent { padding: 8px 12px; }
      .pm-quest-toggle {
        flex: 0 0 auto; display: grid; place-items: center; width: 22px; height: 22px; margin-top: 1px;
        border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer;
      }
      .pm-quest-toggle:hover { color: var(--pm-accent-strong); background: var(--pm-accent-soft); }
      .pm-quest-toggle:focus-visible { outline: 2px solid var(--pm-accent-ring); outline-offset: 1px; }
      .pm-quest-caret { display: inline-block; transition: transform .15s ease; }
      .pm-quest-toggle[aria-expanded="true"] .pm-quest-caret { transform: rotate(90deg); }
      .pm-quest-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
      .pm-quest-head { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
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
      .pm-quest-solo { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
      .pm-quest-solo .pm-quest-head { padding: 10px 12px; cursor: default; }
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
      .pm-quest-box:disabled { cursor: progress; opacity: .6; }
      .pm-quest-label {
        flex: 0 0 auto; margin-top: 2px; padding: 1px 8px; border-radius: 999px; font-size: 11px; line-height: 1.6; white-space: nowrap;
        border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary);
      }
      .pm-quest-label[data-state="done"] { color: #2ea043; border-color: color-mix(in srgb, #2ea043 55%, transparent); }
      .pm-quest-banner { font-size: 12px; color: var(--dsw-alias-state-error-primary); }`

    const NEXT_STATE = { open: 'awaiting', awaiting: 'done', done: 'open' }

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
      const parts = String(text || '').split(new RegExp('(\\*\\*[^*]+\\*\\*|`[^`]+`)', 'g'))
      return parts.map((part, index) => {
        if (!part) return null
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return h('strong', { key: index }, part.slice(2, -2))
        if (part.length > 2 && part.charAt(0) === ` && part.charAt(part.length - 1) === `) return h('code', { key: index, className: 'pm-quest-code' }, part.slice(1, -1))
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
        },
        pending: countPending(items),
      }
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
        const alive = useRef(true)
        const projectPath = project && project.path ? project.path : null

        useEffect(() => {
          alive.current = true
          return () => { alive.current = false }
        }, [])

        useEffect(() => {
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
        }, [counts.total, counts.done, counts.awaiting, counts.open, onCounts])

        function toggleBranch(line) {
          setExpanded(current => ({ ...current, [line]: !current[line] }))
        }

        function cycle(item) {
          if (!doc || doc.keepOpen) return
          const nextState = NEXT_STATE[item.state] || 'awaiting'
          setBusy(current => ({ ...current, [item.line]: true }))
          setNotice(null)
          api({ action: 'quest-state', projectPath, line: item.line, state: nextState, version: doc.version })
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
          return h('div', { key: item.line, className: 'pm-quest-row leaf', 'data-state': item.state, 'data-line': item.line },
            h('button', {
              type: 'button',
              className: 'pm-quest-box',
              'data-state': item.state,
              role: 'checkbox',
              'aria-checked': item.state === 'done' ? 'true' : item.state === 'awaiting' ? 'mixed' : 'false',
              title: t('action.toggle'),
              'aria-label': item.label + ' · ' + t('state.' + item.state),
              disabled,
              onClick: () => cycle(item),
            }, label),
            h('span', { className: 'pm-quest-text', onClick: () => cycle(item) }, renderInline(item.label)),
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
                h('span', { className: 'pm-quest-head-text' }, renderInline(item.label)),
                h('span', { className: 'pm-quest-label', 'data-state': done ? 'done' : 'open' }, done ? t('state.done') : t('state.open')),
              ),
            ),
          )
        }

        function renderBranch(item, depth = 0) {
          const children = item.children || []
          const isOpen = Boolean(expanded[item.line])
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
              title: isOpen ? t('action.collapse') : t('action.expand'),
              'aria-label': isOpen ? t('action.collapse') : t('action.expand'),
              onClick: () => toggleBranch(item.line),
            }, caret),
            h('div', { className: 'pm-quest-body' },
              h('button', { type: 'button', className: 'pm-quest-head', onClick: () => toggleBranch(item.line) },
                h('span', { className: 'pm-quest-head-text' }, renderInline(item.label)),
                h('span', { className: 'pm-quest-label', 'data-state': isDone ? 'done' : 'open' }, isDone ? t('state.done') : t('state.open')),
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

        function renderRequirement(item) {
          return (item.children && item.children.length) ? renderBranch(item) : renderSolo(item)
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

        return h('div', { className: 'pm-quest-list', 'data-quest': doc.relativePath },
          h('div', { className: 'pm-quest-summary' },
            h('span', { className: 'pm-quest-chip', 'data-kind': 'open' }, t('summary.open', { count: counts.open })),
            h('span', { className: 'pm-quest-chip', 'data-kind': 'awaiting' }, t('summary.awaiting', { count: counts.awaiting })),
            h('span', { className: 'pm-quest-chip', 'data-kind': 'done' }, t('summary.done', { count: counts.done })),
            doc.keepOpen ? h('span', null, t('summary.pending')) : null,
            notice ? h('span', { className: 'pm-quest-banner', role: 'alert' }, notice) : null,
          ),
          h('div', { className: 'pm-quest-group' },
            h('div', { className: 'pm-quest-group-head', role: 'presentation' },
              h('span', null, t('group.open')),
              h('span', { className: 'pm-quest-group-count' }, String(openItems.length)),
            ),
            openItems.length
              ? h('div', { className: 'pm-quest-group-body' }, openItems.map(renderRequirement))
              : null,
          ),
          doneItems.length
            ? h('div', { className: 'pm-quest-group' },
                doneHead,
                showDone ? h('div', { className: 'pm-quest-group-body' }, doneItems.map(renderRequirement)) : null,
              )
            : null,
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
