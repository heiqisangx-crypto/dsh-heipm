window.__ModuleLoader__.load({
  id: 'dsh-heipm',
  chunk: 'client.procedures.js',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useMemo, useState } = React

    const CSS = `      .pm-setup-block { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 10px 12px; border-radius: 10px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); }
      .pm-setup-dir { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px;
        padding: 1px 5px; border-radius: 4px; background: var(--dsw-alias-bg-layer-2); color: var(--pm-accent-strong); }
      .pm-proc-setup {
        display: grid; align-items: start; gap: 8px; padding: 0 0 10px;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
      }
      .pm-proc-setup > .pm-banner { grid-column: 1 / -1; order: 9; }
      .pm-proc-setup > .pm-setup-block.meta { order: 2; }
      .pm-proc-setup > .pm-setup-block.legacy { order: 3; }
      .pm-chip-wrap { display: flex; flex-wrap: wrap; gap: 4px; max-height: 76px; overflow-y: auto; }
      .pm-chip-wrap .pm-chip { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .pm-dot { width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; background: var(--dsw-alias-border-l1); }
      .pm-dot.on { background: var(--pm-accent); }
      .pm-proc-split {
        flex: 1 1 auto; min-height: 0; display: flex; margin-top: 12px;
        border-top: 1px solid var(--dsw-alias-border-l1);
      }
      .pm-proc-list-wrap { flex: 1 1 auto; min-width: 0; overflow: auto; padding: 16px 24px 24px; }
      .pm-proc-groups { display: flex; flex-direction: column; gap: 8px; }
      .pm-proc-group {
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; overflow: hidden;
        background: var(--dsw-alias-bg-layer-1);
      }
      .pm-proc-group-head {
        display: flex; align-items: center; gap: 7px; width: 100%; padding: 6px 10px;
        border: 0; background: var(--dsw-alias-bg-layer-2); color: inherit;
        font: inherit; font-size: 12px; font-weight: 600; text-align: left; cursor: pointer;
      }
      .pm-proc-group-head:hover { background: var(--pm-accent-soft); }
      .pm-proc-group-head:focus-visible { outline: 2px solid var(--pm-accent-ring); outline-offset: -2px; }
      .pm-proc-group-caret {
        flex: 0 0 auto; width: 9px; font-size: 9px; line-height: 1; color: var(--dsw-alias-label-secondary);
      }
      .pm-proc-group-name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .pm-proc-group-count { flex: 0 0 auto; font-size: 11px; font-weight: 500; color: var(--dsw-alias-label-secondary); }
      .pm-proc-row {
        display: flex; align-items: center; gap: 10px; width: 100%; min-height: 28px;
        padding: 4px 10px 4px 26px; border: 0; border-top: 1px solid var(--dsw-alias-border-l1);
        background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer;
      }
      .pm-proc-row:hover { background: var(--pm-accent-soft); }
      .pm-proc-row:active { background: var(--pm-accent); }
      .pm-proc-row:active .pm-proc-row-title,
      .pm-proc-row:active .pm-proc-row-size { color: var(--pm-accent-ink); }
      .pm-proc-row:focus-visible { outline: 2px solid var(--pm-accent-ring); outline-offset: -2px; }
      .pm-proc-row.active { background: var(--pm-accent-soft); box-shadow: inset 2px 0 0 var(--pm-accent); }
      .pm-proc-row.active .pm-proc-row-title { color: var(--pm-accent-strong); }
      .pm-proc-row-title {
        flex: 1 1 auto; min-width: 0; font-size: 12.5px; line-height: 1.4;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .pm-proc-row-size { flex: 0 0 auto; font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .pm-proc-preview {
        flex: 0 0 var(--pm-preview-width, 42%); min-width: 280px; display: flex; flex-direction: column; min-height: 0;
        border-left: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
      }
      .pm-preview-scroll { flex: 1 1 auto; overflow: auto; padding: 16px 20px 28px; }
      .pm-preview-head {
        display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; padding-bottom: 10px;
        border-bottom: 1px solid var(--dsw-alias-border-l1);
      }
      .pm-preview-title { font-size: 14px; font-weight: 600; word-break: break-word; }
      .pm-preview-path { font-size: 11px; color: var(--dsw-alias-label-secondary); word-break: break-all; }
      .pm-preview-empty {
        margin: auto; padding: 32px 20px; text-align: center;
        font-size: 12.5px; color: var(--dsw-alias-label-secondary);
      }
      .pm-md { font-size: 12.5px; line-height: 1.7; color: var(--dsw-alias-label-primary); }
      .pm-md h1, .pm-md h2, .pm-md h3, .pm-md h4 { margin: 16px 0 8px; line-height: 1.35; }
      .pm-md h1 { font-size: 17px; }
      .pm-md h2 { font-size: 15px; }
      .pm-md h3 { font-size: 13.5px; }
      .pm-md h4 { font-size: 12.5px; }
      .pm-md > :first-child { margin-top: 0; }
      .pm-md p { margin: 8px 0; }
      .pm-md ul, .pm-md ol { margin: 8px 0; padding-left: 22px; }
      .pm-md li { margin: 3px 0; }
      .pm-md code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.5px;
        padding: 1px 4px; border-radius: 4px; background: var(--dsw-alias-bg-layer-2);
      }
      .pm-md pre {
        margin: 10px 0; padding: 10px 12px; overflow: auto; border-radius: 8px;
        background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1);
      }
      .pm-md pre code { padding: 0; background: transparent; font-size: 11.5px; line-height: 1.55; }
      .pm-md blockquote {
        margin: 10px 0; padding: 2px 0 2px 12px;
        border-left: 3px solid var(--pm-accent); color: var(--dsw-alias-label-secondary);
      }
      .pm-md a { color: var(--pm-accent-strong); text-decoration: none; }
      .pm-md a:hover { text-decoration: underline; }
      .pm-md hr { border: 0; border-top: 1px solid var(--dsw-alias-border-l1); margin: 14px 0; }
      .pm-md table { border-collapse: collapse; margin: 10px 0; width: 100%; display: block; overflow: auto; }
      .pm-md th, .pm-md td { border: 1px solid var(--dsw-alias-border-l1); padding: 5px 8px; text-align: left; vertical-align: top; }
      .pm-md th { background: var(--dsw-alias-bg-layer-2); font-weight: 600; }
      @media (max-width: 1180px) {
        .pm-proc-split { flex-direction: column; overflow: auto; }
        .pm-proc-list-wrap { overflow: visible; }
        .pm-proc-preview {
          flex: 1 1 auto; width: auto; min-width: 0; max-height: 46vh;
          border-left: 0; border-top: 1px solid var(--dsw-alias-border-l1);
        }
        .pm-proc-split > .pm-resizer { display: none; }
      }`

    function injectStyles() {
      if (typeof document === 'undefined' || !document.head || typeof document.createElement !== 'function') return
      if (document.querySelector('style[data-dsh-heipm-procedures]')) return
      const style = document.createElement('style')
      style.setAttribute('data-dsh-heipm-procedures', '')
      if (style.dataset) style.dataset.plugin = 'dsh-heipm'
      style.textContent = CSS
      document.head.appendChild(style)
    }

    injectStyles()


    const NS = 'dsh-heipm/procedures'

    const EN = {
      'col.preview': 'Preview',
      'empty.procedures.title': 'No procedures yet',
      'empty.procedures.body': 'Create procedures/ in this project to collect cards. Record one line in procedures/_inbox.md the moment a pitfall costs a retry.',
      'doc.exists': 'present',
      'doc.missing': 'missing',
      'card.meta': 'Index / support file',
      'procedures.templates.title': 'Index & templates',
      'procedures.templates.desc': 'Files are created at ',
      'procedures.templates.descTail': ' — not in the project root. A missing file is copied from the templates bundled with this plugin.',
      'procedures.templates.ok': 'all present',
      'procedures.templates.creating': 'Creating…',
      'procedures.templates.create': 'Create',
      'procedures.templates.createAll': 'Create missing files',
      'procedures.templates.created': 'Created',
      'procedures.templates.failed': 'Could not create',
      'procedures.legacy.title': 'Legacy procedures/',
      'procedures.legacy.desc': 'Files still sit in ',
      'procedures.legacy.source': 'procedures/',
      'procedures.legacy.descTail': ' at the project root. They stay readable, but migrating moves them into the plugin folder.',
      'procedures.legacy.migrate': 'Migrate into .dsh/dsh-heipm/procedures',
      'procedures.legacy.migrating': 'Migrating…',
      'procedures.legacy.moved': 'Migrated',
      'procedures.legacy.conflicts': 'kept in place (name already exists)',
      'procedures.legacy.failed': 'Migration failed',
      'doc.skipped': 'skipped',
      'procedures.group.other': 'Uncategorized',
      'procedures.group.count': 'cards',
      'procedures.preview.empty': 'Select a card to preview it here.',
      'procedures.preview.tooLarge': 'This file is too large to preview.',
      'procedures.preview.error': 'The file could not be read.',
    }

    const ZH = {
      'col.preview': '预览',
      'empty.procedures.title': '还没有经验流程',
      'empty.procedures.body': '在本项目创建 procedures/ 以收集卡片。每当一次踩坑多花了重试，就立刻在 procedures/_inbox.md 记一行。',
      'doc.exists': '已存在',
      'doc.missing': '缺失',
      'card.meta': '索引 / 附属文件',
      'procedures.templates.title': '索引与模板',
      'procedures.templates.desc': '文件创建在 ',
      'procedures.templates.descTail': '，不会写到项目根目录；缺失的从插件内置模板复制。',
      'procedures.templates.ok': '齐全',
      'procedures.templates.creating': '创建中…',
      'procedures.templates.create': '创建',
      'procedures.templates.createAll': '创建缺失文件',
      'procedures.templates.created': '已创建',
      'procedures.templates.failed': '创建失败',
      'procedures.legacy.title': '老目录 procedures/',
      'procedures.legacy.desc': '这些卡片仍在项目根目录的 ',
      'procedures.legacy.source': 'procedures/',
      'procedures.legacy.descTail': ' 下。它们照常可读，迁移会把它们搬到插件目录里。',
      'procedures.legacy.migrate': '迁移到 .dsh/dsh-heipm/procedures',
      'procedures.legacy.migrating': '迁移中…',
      'procedures.legacy.moved': '已迁移',
      'procedures.legacy.conflicts': '同名未覆盖，仍留在原处',
      'procedures.legacy.failed': '迁移失败',
      'doc.skipped': '跳过',
      'procedures.group.other': '未分类',
      'procedures.group.count': '张',
      'procedures.preview.empty': '选择一张卡片，在这里查看内容。',
      'procedures.preview.tooLarge': '文件过大，无法预览。',
      'procedures.preview.error': '文件读取失败。',
    }

    function createProceduresUi(deps) {
      const { Badge, api, ResizeHandle, formatBytes, loadStoredWidth, saveStoredWidth, previewSpec, locale, registerLocale } = deps
      registerLocale(locale.register(NS, { en: EN, zh: ZH }))
      const t = locale.bind(NS)

    /* ----- markdown preview (read-only, small subset) ----- */

    function renderInline(text, keyPrefix) {
      const source = String(text == null ? '' : text)
      const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
      const nodes = []
      let last = 0
      let index = 0
      let match
      while ((match = pattern.exec(source)) !== null) {
        if (match.index > last) nodes.push(source.slice(last, match.index))
        const token = match[0]
        const key = `${keyPrefix}-i${index}`
        if (token.startsWith('**')) nodes.push(h('strong', { key }, token.slice(2, -2)))
        else if (token.startsWith('`')) nodes.push(h('code', { key }, token.slice(1, -1)))
        else {
          const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
          nodes.push(h('a', { key, href: link[2], target: '_blank', rel: 'noreferrer' }, link[1]))
        }
        last = match.index + token.length
        index += 1
      }
      if (last < source.length) nodes.push(source.slice(last))
      return nodes.length ? nodes : ''
    }

    function splitTableRow(line) {
      return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim())
    }

    function isBlockStart(line) {
      return /^(#{1,4}\s|```|>|\||\s*[-*+]\s|\s*\d+[.)]\s|----|\*\*\*)/.test(line)
    }

    function parseMarkdown(source) {
      const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n')
      const blocks = []
      let index = 0
      let key = 0
      const nextKey = () => `md-${key++}`

      while (index < lines.length) {
        const line = lines[index]
        if (!line.trim()) { index += 1; continue }

        if (/^```/.test(line.trim())) {
          const body = []
          index += 1
          while (index < lines.length && !/^```\s*$/.test(lines[index].trim())) {
            body.push(lines[index])
            index += 1
          }
          if (index < lines.length) index += 1
          blocks.push(h('pre', { key: nextKey() }, h('code', null, body.join('\n'))))
          continue
        }

        if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
          blocks.push(h('hr', { key: nextKey() }))
          index += 1
          continue
        }

        const heading = /^(#{1,4})\s+(.*?)\s*#*\s*$/.exec(line)
        if (heading) {
          blocks.push(h(`h${heading[1].length}`, { key: nextKey() }, renderInline(heading[2], nextKey())))
          index += 1
          continue
        }

        if (/^\s*>/.test(line)) {
          const parts = []
          while (index < lines.length && /^\s*>/.test(lines[index])) {
            parts.push(lines[index].replace(/^\s*>\s?/, ''))
            index += 1
          }
          blocks.push(h('blockquote', { key: nextKey() },
            parts.map((part, partIndex) => h('p', { key: `q${partIndex}` }, renderInline(part, `q${partIndex}`)))))
          continue
        }

        if (/^\s*\|.*\|\s*$/.test(line) && index + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1])) {
          const head = splitTableRow(line)
          index += 2
          const rows = []
          while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
            rows.push(splitTableRow(lines[index]))
            index += 1
          }
          const headCells = head.map((cell, cellIndex) =>
            h('th', { key: `h${cellIndex}` }, renderInline(cell, `h${cellIndex}`)))
          const bodyRows = rows.map((row, rowIndex) =>
            h('tr', { key: `r${rowIndex}` }, row.map((cell, cellIndex) =>
              h('td', { key: `c${cellIndex}` }, renderInline(cell, `r${rowIndex}-${cellIndex}`)))))
          blocks.push(h('div', { key: nextKey(), className: 'pm-table' },
            h('table', null,
              h('thead', null, h('tr', null, headCells)),
              h('tbody', null, bodyRows),
            ),
          ))
          continue
        }

        if (/^\s*[-*+]\s+/.test(line)) {
          const items = []
          while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
            items.push(h('li', { key: nextKey() }, renderInline(lines[index].replace(/^\s*[-*+]\s+/, ''), nextKey())))
            index += 1
          }
          blocks.push(h('ul', { key: nextKey() }, items))
          continue
        }

        if (/^\s*\d+[.)]\s+/.test(line)) {
          const items = []
          while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
            items.push(h('li', { key: nextKey() }, renderInline(lines[index].replace(/^\s*\d+[.)]\s+/, ''), nextKey())))
            index += 1
          }
          blocks.push(h('ol', { key: nextKey() }, items))
          continue
        }

        const paragraph = []
        while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
          paragraph.push(lines[index].trim())
          index += 1
        }
        if (!paragraph.length) { index += 1; continue }
        blocks.push(h('p', { key: nextKey() }, renderInline(paragraph.join(' '), nextKey())))
      }

      return blocks
    }

    function MarkdownView({ content }) {
      const blocks = useMemo(() => parseMarkdown(content), [content])
      return h('div', { className: 'pm-md' }, blocks)
    }

    /* ----- section: knowledge procedures ----- */

    function ProceduresSetup({ t, project, onReload }) {
      const inventory = project && project.inventory ? project.inventory : null
      const procedures = inventory && inventory.procedures ? inventory.procedures : { items: [], templates: [] }
      const items = Array.isArray(procedures.items) ? procedures.items : []
      const templates = Array.isArray(procedures.templates) ? procedures.templates : []
      const legacy = Array.isArray(procedures.legacy) ? procedures.legacy : []
      const legacyKeys = new Set(legacy.map(entry => entry.path))
      const extras = items.filter(item => item.role === 'meta' && !legacyKeys.has(item.path))
      const missing = templates.filter(entry => !entry.exists)
      const [busy, setBusy] = useState(null)
      const [notice, setNotice] = useState(null)
      const procedureDir = templates.length ? dirOf(templates[0].displayPath) : 'procedures'

      useEffect(() => {
        if (!notice) return undefined
        const timer = setTimeout(() => setNotice(null), 3600)
        return () => clearTimeout(timer)
      }, [notice])

      async function createFiles(files, key) {
        if (busy || !project || !project.path || !files.length) return
        setBusy(key)
        setNotice(null)
        try {
          const result = await api({ action: 'scaffold', projectPath: project.path, files })
          const count = result && Array.isArray(result.created) ? result.created.length : 0
          const skipped = result && Array.isArray(result.skipped) ? result.skipped.length : 0
          setNotice({ kind: 'success', text: `${t('procedures.templates.created')} ${count}${skipped ? ` · ${t('doc.skipped')} ${skipped}` : ''}` })
          if (onReload) onReload()
        } catch (error) {
          const message = error && error.message ? error.message : ''
          setNotice({ kind: 'error', text: `${t('procedures.templates.failed')}: ${message}`.trim() })
        } finally {
          setBusy(null)
        }
      }

      async function migrateLegacy() {
        if (busy || !project || !project.path) return
        setBusy('legacy:migrate')
        setNotice(null)
        try {
          const result = await api({ action: 'migrate', projectPath: project.path })
          const moved = result && Array.isArray(result.moved) ? result.moved.length : 0
          const conflicts = result && Array.isArray(result.conflicts) ? result.conflicts.length : 0
          setNotice({
            kind: moved ? 'success' : 'error',
            text: `${t('procedures.legacy.moved')} ${moved}${conflicts ? ` · ${t('procedures.legacy.conflicts')} ${conflicts}` : ''}`,
          })
          if (onReload) onReload()
        } catch (error) {
          const message = error && error.message ? error.message : ''
          setNotice({ kind: 'error', text: `${t('procedures.legacy.failed')}: ${message}`.trim() })
        } finally {
          setBusy(null)
        }
      }

      function dirOf(value) {
        const text = String(value || '')
        const cut = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'))
        return cut > 0 ? text.slice(0, cut) : text
      }

      function row(item, key, exists) {
        return h('li', { key },
          h('div', { className: 'pm-row static' },
            h('span', { className: `pm-dot${exists ? ' on' : ''}` }),
            h('span', { className: 'pm-row-main' },
              h('span', { className: 'pm-row-title' }, item.label ? `${item.label} · ${item.name}` : item.name),
              h('span', { className: 'pm-row-path', title: item.displayPath }, item.displayPath),
            ),
            exists
              ? h(Badge, { on: true }, t('doc.exists'))
              : h('button', {
                  type: 'button',
                  className: 'pm-btn sm',
                  disabled: busy !== null,
                  onClick: () => createFiles([item.name], `${key}:${item.name}`),
                }, busy === `${key}:${item.name}` ? t('procedures.templates.creating') : t('procedures.templates.create')),
          ),
        )
      }

      return h('div', { className: 'pm-proc-setup' },
        h('div', { className: 'pm-setup-block' },
          h('div', { className: 'pm-card-title' },
            t('procedures.templates.title'),
            h(Badge, { on: missing.length === 0 }, missing.length ? `${missing.length} ${t('doc.missing')}` : t('procedures.templates.ok')),
          ),
          h('div', { className: 'pm-card-body' }, t('procedures.templates.desc'), h('code', { className: 'pm-setup-dir' }, procedureDir), t('procedures.templates.descTail')),
          h('ul', { className: 'pm-list' }, templates.map(entry => row({ name: entry.name, label: entry.label, displayPath: entry.displayPath }, 'tpl', entry.exists))),
          missing.length
            ? h('button', {
                type: 'button',
                className: 'pm-btn sm',
                disabled: busy !== null,
                onClick: () => createFiles(missing.map(entry => entry.name), 'tpl:all'),
              }, busy === 'tpl:all' ? t('procedures.templates.creating') : t('procedures.templates.createAll'))
            : null,
        ), legacy.length
            ? h('div', { className: 'pm-setup-block legacy' },
                h('div', { className: 'pm-card-title' },
                  t('procedures.legacy.title'),
                  h(Badge, { on: false }, `${legacy.length} ${t('procedures.group.count')}`),
                ),
                h('div', { className: 'pm-card-body' }, t('procedures.legacy.desc'), h('code', { className: 'pm-setup-dir' }, t('procedures.legacy.source')), t('procedures.legacy.descTail')),
                h('div', { className: 'pm-chip-wrap', title: legacy.map(entry => entry.displayPath).join('\n') },
                  legacy.slice(0, 40).map(entry => h('span', { key: entry.path, className: 'pm-chip', title: entry.displayPath }, entry.name)),
                  legacy.length > 40 ? h('span', { className: 'pm-chip' }, `+${legacy.length - 40}`) : null,
                ),
                h('button', {
                  type: 'button',
                  className: 'pm-btn sm',
                  disabled: busy !== null,
                  onClick: () => migrateLegacy(),
                }, busy === 'legacy:migrate' ? t('procedures.legacy.migrating') : t('procedures.legacy.migrate')),
              )
            : null,
        extras.length ? h('div', { className: 'pm-setup-block meta' },
          h('div', { className: 'pm-card-title' }, t('card.meta'), h(Badge, { on: false }, `${extras.length} ${t('procedures.group.count')}`)),
          h('div', { className: 'pm-chip-wrap', title: extras.map(entry => entry.displayPath).join('\n') },
            extras.map(entry => h('span', { key: entry.path, className: 'pm-chip', title: entry.displayPath }, entry.name)),
          ),
        ) : null,
        notice ? h('div', { className: `pm-banner ${notice.kind}` }, notice.text) : null,
      )
    }

    const PROCEDURES_COLLAPSED_KEY = 'dsh-heipm:proceduresCollapsed:v1'

    function loadCollapsedGroups() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(PROCEDURES_COLLAPSED_KEY) || '[]')
        if (Array.isArray(parsed)) return parsed.filter(value => typeof value === 'string')
      } catch {}
      return []
    }

    function saveCollapsedGroups(names) {
      try {
        window.localStorage.setItem(PROCEDURES_COLLAPSED_KEY, JSON.stringify(names))
      } catch {}
    }

    function splitProcedureSlug(slug) {
      const text = String(slug || '')
      const match = /^([^-－]+)[-－](.+)$/.exec(text)
      if (!match) return { group: '', label: text }
      const group = match[1].trim()
      if (!group) return { group: '', label: text }
      return { group, label: match[2].trim() || text }
    }

    function groupProcedures(items) {
      const groups = new Map()
      for (const item of items) {
        const { group, label } = splitProcedureSlug(item.slug || item.name)
        if (!groups.has(group)) groups.set(group, { group, procedures: [] })
        groups.get(group).procedures.push({ item, label })
      }
      return [...groups.values()].sort((a, b) => {
        if (!a.group) return b.group ? 1 : 0
        if (!b.group) return -1
        return a.group.localeCompare(b.group)
      })
    }

    function ProceduresSection({ t, project, onReload }) {
      const inventory = project && project.inventory ? project.inventory : null
      const procedures = inventory && inventory.procedures ? inventory.procedures : { roots: [], items: [], templates: [], missing: [] }
      const items = Array.isArray(procedures.items) ? procedures.items : []
      const legacyPaths = new Set((Array.isArray(procedures.legacy) ? procedures.legacy : []).map(entry => entry.path))
      const visible = legacyPaths.size ? items.filter(item => !legacyPaths.has(item.path)) : items
      const list = visible.filter(item => item.role === 'card' || (!item.role && item.kind === 'card'))
      const [selected, setSelected] = useState(() => (list[0] ? list[0].path : null))
      const [collapsed, setCollapsed] = useState(() => loadCollapsedGroups())
      const [previewWidth, setPreviewWidth] = useState(() => loadStoredWidth(previewSpec.key, previewSpec.default, previewSpec.min, previewSpec.max))
      const active = list.find(item => item.path === selected) || null
      const groups = groupProcedures(list)
      const collapsedSet = new Set(collapsed)

      function toggleGroup(group) {
        setCollapsed(current => {
          const next = current.includes(group)
            ? current.filter(value => value !== group)
            : [...current, group]
          saveCollapsedGroups(next)
          return next
        })
      }

      useEffect(() => {
        if (active || !list.length) return
        setSelected(list[0].path)
      }, [active, list.length])

      function preview() {
        if (!active) return h('div', { className: 'pm-preview-empty' }, t('procedures.preview.empty'))
        return h('div', { className: 'pm-preview-scroll' },
          h('div', { className: 'pm-preview-head' },
            h('div', { className: 'pm-preview-title' }, active.slug),
            h('div', { className: 'pm-preview-path' }, active.displayPath),
          ),
          active.tooLarge
            ? h('div', { className: 'pm-preview-empty' }, t('procedures.preview.tooLarge'))
            : typeof active.content !== 'string'
              ? h('div', { className: 'pm-preview-empty' }, t('procedures.preview.error'))
              : h(MarkdownView, { content: active.content }),
        )
      }

      return h('div', { className: 'pm-section-body' },
        h(ProceduresSetup, { t, project, onReload }),
        h('div', { className: 'pm-proc-split', style: { '--pm-preview-width': `${previewWidth}%` } },
          h('div', { className: 'pm-proc-list-wrap' },
            list.length
              ? h('div', { className: 'pm-proc-groups' }, groups.map(group => {
                  const open = !collapsedSet.has(group.group)
                  const name = group.group || t('procedures.group.other')
                  return h('div', { key: group.group || '__other__', className: 'pm-proc-group' },
                    h('button', {
                      type: 'button',
                      className: 'pm-proc-group-head',
                      'aria-expanded': open,
                      onClick: () => toggleGroup(group.group),
                    },
                      h('span', { className: 'pm-proc-group-caret', 'aria-hidden': 'true' }, open ? '▾' : '▸'),
                      h('span', { className: 'pm-proc-group-name' }, name),
                      h('span', { className: 'pm-proc-group-count' }, `${group.procedures.length} ${t('procedures.group.count')}`),
                    ),
                    open
                      ? h('div', { className: 'pm-proc-group-body' }, group.procedures.map(({ item, label }) => h('button', {
                          key: item.path,
                          type: 'button',
                          className: `pm-proc-row${active && active.path === item.path ? ' active' : ''}`,
                          title: item.displayPath,
                          onClick: () => setSelected(item.path),
                        },
                          h('span', { className: 'pm-proc-row-title' }, label || item.slug),
                          h('span', { className: 'pm-proc-row-size' }, formatBytes(item.size || 0)),
                        )))
                      : null,
                  )
                }))
              : h('div', { className: 'pm-preview-empty' },
                  h('strong', null, t('empty.procedures.title')),
                  h('div', null, t('empty.procedures.body')),
                ),
          ),
          h(ResizeHandle, {
            value: previewWidth,
            min: previewSpec.min,
            max: previewSpec.max,
            step: previewSpec.step,
            unit: '%',
            invert: true,
            label: t('col.preview'),
            onResize: width => {
              setPreviewWidth(current => {
                if (current === width) return current
                saveStoredWidth(previewSpec.key, width)
                return width
              })
            },
            onReset: () => {
              saveStoredWidth(previewSpec.key, previewSpec.default)
              setPreviewWidth(previewSpec.default)
            },
          }),
          h('div', { className: 'pm-proc-preview' }, preview()),
        ),
      )
    }

      function ProceduresSectionLocalized(props) {
        return h(ProceduresSection, { ...props, t })
      }

      return { ProceduresSection: ProceduresSectionLocalized }
    }

    return { createProceduresUi }
  },
})
