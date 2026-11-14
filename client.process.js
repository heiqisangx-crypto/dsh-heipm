// 过程收纳分块：图标条 + 抽屉 + 跟随/固定。入口模块级预加载。
window.__ModuleLoader__.load({
  id: 'dsh-heipm',
  chunk: 'client.process.js',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** deps: { HOST_CONTRACT, uiFeatureDisabled } */
    function createProcessShelfModule(deps) {
      const { HOST_CONTRACT, uiFeatureDisabled } = deps
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

      return { createProcessShelf, classifyFlowRow, planProcessGroups, pickFollowIndex, PROCESS_SHELF_CSS }
    }

    return { createProcessShelfModule }
  },
})
