// Smoke test for dsh-heipm client: renders the page with fixture data
// through a tiny React shim, asserting that global scopes never dereference null.
import fs from 'node:fs'
import vm from 'node:vm'

const SOURCE = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const PROCEDURES_SOURCE = fs.readFileSync(new URL('../client.procedures.js', import.meta.url), 'utf8')
const QUEST_SOURCE = fs.readFileSync(new URL('../client.quest.js', import.meta.url), 'utf8')
const QUEST_TREE = {
  items: [{
    line: 1, kind: 'heading', level: 1, indent: 0, label: '一、登录页', state: 'open', symbol: '', parent: null,
    children: [
      { line: 2, kind: 'task', indent: 4, label: '设计验证码接口', state: 'open', symbol: ' ', parent: 1, children: [] },
      { line: 3, kind: 'task', indent: 4, label: '前端验证码组件', state: 'awaiting', symbol: 'O', parent: 1, children: [] },
    ],
  }, {
    line: 4, kind: 'heading', level: 1, indent: 0, label: '二、初始化', state: 'open', symbol: '', parent: null,
    children: [
      { line: 5, kind: 'task', indent: 4, label: '写文档', state: 'done', symbol: 'x', parent: 4, children: [] },
    ],
  }],
  counts: { total: 3, done: 1, awaiting: 1, open: 1 },
}
const QUEST_RUNNING = {
  items: [{
    line: 1, kind: 'heading', level: 1, indent: 0, label: '一、执行中', state: 'open', symbol: '', parent: null,
    children: [
      { line: 2, kind: 'task', indent: 4, label: '正在跑的活', state: 'running', symbol: '~', parent: 1, children: [] },
    ],
  }],
  counts: { total: 1, done: 0, awaiting: 0, open: 0, running: 1 },
}
const QUEST_ALL_DONE = {
  items: [{
    line: 1, kind: 'heading', level: 1, indent: 0, label: '一、全部完成', state: 'open', symbol: '', parent: null,
    children: [
      { line: 2, kind: 'task', indent: 4, label: '做完的事', state: 'done', symbol: 'x', parent: 1, children: [] },
    ],
  }],
  counts: { total: 1, done: 1, awaiting: 0, open: 0 },
}
const QUEST_FIXTURES = {
  quest: payload => {
    const path = String(payload.projectPath || '')
    const allDone = path.endsWith('quest-done')
    const tree = path.endsWith('quest-running') ? QUEST_RUNNING : allDone ? QUEST_ALL_DONE : QUEST_TREE
    return {
      projectPath: payload.projectPath,
      relativePath: '.dsh/dsh-heipm/任务清单.md',
      displayPath: payload.projectPath + '/.dsh/dsh-heipm/任务清单.md',
      exists: true,
      tooLarge: false,
      version: 'v1',
      items: tree.items,
      counts: tree.counts,
    }
  },
}

class Component {
  constructor(props) {
    this.props = props || {}
    this.state = {}
  }
  setState(next) {
    this.state = { ...this.state, ...(typeof next === 'function' ? next(this.state) : next) }
  }
}
Component.prototype.isReactComponent = {}

function createElement(type, props, ...children) {
  const merged = { ...(props || {}) }
  if (children.length === 1) merged.children = children[0]
  else if (children.length > 1) merged.children = children
  return { type, props: merged }
}

/* Hooks are stored per (component type, instance order in the pass). That keeps
   two ResizeHandles apart while letting a second render see what setState wrote. */
let hookFrame = null
let hookCursor = 0
let instanceCounters = new Map()
const hookStore = new Map()
let pendingEffects = []
let dirty = false

function hookSlots() {
  const byInstance = hookStore.get(hookFrame.type) || new Map()
  hookStore.set(hookFrame.type, byInstance)
  if (!byInstance.has(hookFrame.index)) byInstance.set(hookFrame.index, [])
  return byInstance.get(hookFrame.index)
}

function useState(initial) {
  const slots = hookSlots()
  const index = hookCursor
  hookCursor += 1
  if (!(index in slots)) slots[index] = { value: typeof initial === 'function' ? initial() : initial }
  const slot = slots[index]
  return [slot.value, next => {
    slot.value = typeof next === 'function' ? next(slot.value) : next
    dirty = true
  }]
}

function useEffect(effect) {
  pendingEffects.push(effect)
  return undefined
}

const React = {
  Component,
  createElement,
  useState,
  useMemo: fn => fn(),
  useRef: initial => ({ ref: initial === undefined ? null : initial, get current() { return this.ref }, set current(value) { this.ref = value } }),
  useEffect,
  useLayoutEffect: useEffect,
  useCallback: fn => fn,
  Fragment: 'Fragment',
}

function render(node, out) {
  if (node === null || node === undefined || node === false || node === true) return
  if (Array.isArray(node)) {
    for (const child of node) render(child, out)
    return
  }
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node))
    return
  }
  const { type, props } = node
  if (typeof type === 'function') {
    if (type.prototype && type.prototype.isReactComponent) {
      const instance = new type(props)
      instance.props = props
      render(instance.render(), out)
      return
    }
    const index = instanceCounters.get(type) || 0
    instanceCounters.set(type, index + 1)
    const outer = hookFrame
    const cursor = hookCursor
    hookFrame = { type, index }
    hookCursor = 0
    try {
      render(type({ ...props, children: props.children }), out)
    } finally {
      hookFrame = outer
      hookCursor = cursor
    }
    return
  }
  if (type === 'style' || type === 'script') return
  if (props && typeof props.title === 'string') out.push(props.title)
  render(props ? props.children : null, out)
}

/* Effects run after the pass; a setState marks the pass dirty, so the driver
   keeps re-rendering until the tree stops changing (the async quest load). */
async function renderStable(node, maxPasses = 12) {
  let out = []
  for (let pass = 0; pass < maxPasses; pass += 1) {
    instanceCounters = new Map()
    hookCursor = 0
    pendingEffects = []
    dirty = false
    out = []
    render(node, out)
    const effects = pendingEffects
    pendingEffects = []
    for (const effect of effects) {
      try {
        effect()
      } catch {}
    }
    await new Promise(resolve => setTimeout(resolve, 0))
    if (!dirty) break
  }
  return out
}

// Fixtures are injected by rewriting the page's two useState initialisers.
const SOURCE_WITH_FIXTURES = SOURCE
  .replace('const [data, setData] = useState(null)', 'const [data, setData] = useState(__PM_DATA__)')
  .replace("const [section, setSection] = useState('constraints')", "const [section, setSection] = useState(__PM_SECTION__ || 'constraints')")

if (SOURCE_WITH_FIXTURES === SOURCE) throw new Error('fixture injection did not apply')

async function loadPanel(data, section, storage) {
  let factory = null
  const stored = storage || {}

  const sandbox = { console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {}, AbortController, URL, __PM_DATA__: data, __PM_SECTION__: section, __PM_QUEST__: QUEST_FIXTURES }
  sandbox.window = sandbox
  const head = []
  sandbox.document = {
    baseURI: 'http://127.0.0.1/',
    documentElement: { getAttribute: () => null, style: {} },
    head: {
      querySelector: selector => head.find(tag => tag.matches(selector)) || null,
      appendChild: tag => head.push(tag),
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: {
      style: { setProperty() {}, removeProperty() {} },
      classList: { add() {}, remove() {} },
      setAttribute() {},
      removeAttribute() {},
      append() {},
      appendChild() {},
    },
    createElement: tagName => ({
      tagName,
      attrs: {},
      textContent: '',
      setAttribute(name, value) { this.attrs[name] = value },
      matches(selector) {
        const found = /^style\[data-plugin-css="(.+)"\]$/.exec(selector)
        return Boolean(found) && this.tagName === 'style' && this.attrs['data-plugin-css'] === found[1]
      },
      remove() {},
    }),
  }
  sandbox.window.__ModuleLoader__ = { load: config => { factory = config.factory } }
  sandbox.window.localStorage = {
    getItem: key => (Object.prototype.hasOwnProperty.call(stored, key) ? stored[key] : null),
    setItem: () => {},
  }
  sandbox.fetch = async (_url, init) => {
    const payload = JSON.parse(init.body)
    const fixture = sandbox.__PM_QUEST__ && sandbox.__PM_QUEST__[payload.action]
    if (!fixture) return { ok: false, status: 500, json: async () => ({ ok: false, error: 'no fixture' }) }
    return { ok: true, status: 200, json: async () => ({ ok: true, ...fixture(payload) }) }
  }
  sandbox.window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })
  sandbox.window.addEventListener = () => {}
  sandbox.window.removeEventListener = () => {}
  sandbox.requestAnimationFrame = () => 0
  sandbox.cancelAnimationFrame = () => {}
  vm.createContext(sandbox)
  vm.runInContext(SOURCE_WITH_FIXTURES, sandbox, { filename: 'client-fixture.js' })

  let panel = null
  const locale = { register: () => () => {}, bind: () => key => key, subscribe: () => () => {} }
  const ctx = {
    locale,
    get: () => undefined,
    slots: {
      inject: (_name, callback) => callback(),
      register: (spec, component) => { if (spec && spec.name === 'main') panel = component },
    },
    effect: fn => fn(),
  }
  const requireFor = id => {
    if (id === 'react') return React
    throw new Error(`unexpected require: ${id}`)
  }
  let proceduresModule = null
  let questModule = null
  requireFor.async = async spec => {
    if (spec === './client.quest.js') {
      if (!questModule) {
        let chunkFactory = null
        const previous = sandbox.window.__ModuleLoader__
        sandbox.window.__ModuleLoader__ = { load: config => { chunkFactory = config.factory } }
        try {
          vm.runInContext(QUEST_SOURCE, sandbox, { filename: 'client.quest.js' })
        } finally {
          sandbox.window.__ModuleLoader__ = previous
        }
        if (!chunkFactory) throw new Error('quest chunk did not call __ModuleLoader__.load')
        questModule = chunkFactory(requireFor)
      }
      return questModule
    }
    if (spec !== './client.procedures.js') throw new Error(`unexpected async require: ${spec}`)
    if (!proceduresModule) {
      let chunkFactory = null
      const previous = sandbox.window.__ModuleLoader__
      sandbox.window.__ModuleLoader__ = { load: config => { chunkFactory = config.factory } }
      try {
        vm.runInContext(PROCEDURES_SOURCE, sandbox, { filename: 'client.procedures.js' })
      } finally {
        sandbox.window.__ModuleLoader__ = previous
      }
      if (!chunkFactory) throw new Error('procedures chunk did not call __ModuleLoader__.load')
      proceduresModule = chunkFactory(requireFor)
    }
    return proceduresModule
  }
  if (!factory) throw new Error('module did not call __ModuleLoader__.load')
  factory(requireFor).apply(ctx)
  await new Promise(resolve => setTimeout(resolve, 0))
  if (!panel) throw new Error('main panel was not registered')
  panel.sandbox = sandbox
  panel.styles = head
  panel.__DBG__ = { sandbox, questModule }
  return panel
}

const globals = [
  { id: 'dsh', label: 'DSH 全局', path: 'C:/Users/x/.dsh/AGENTS.md', displayPath: '~/.dsh/AGENTS.md', files: [] },
  { id: 'shared', label: '共享全局', path: 'C:/Users/x/.agents/AGENTS.md', displayPath: '~/.agents/AGENTS.md', files: [] },
]
const templates = [
  { name: 'INDEX.template.md', role: 'index', exists: false, builtIn: true, displayPath: 'D:/demo/.dsh/dsh-heipm/procedures/INDEX.template.md' },
  { name: 'card-template.md', role: 'template', exists: false, builtIn: true, displayPath: 'D:/demo/.dsh/dsh-heipm/procedures/card-template.md' },
  { name: 'CLASSIFY.md', role: 'classify', exists: false, builtIn: true, displayPath: 'D:/demo/.dsh/dsh-heipm/procedures/CLASSIFY.md' },
]
const questProject = {
  id: 'p5',
  title: 'demo-quest',
  path: 'D:/demo-quest',
  displayPath: 'D:/demo-quest',
  directories: [],
  inventory: { skills: { roots: ['.dsh/skills'], items: [] }, procedures: { roots: [], dir: '', items: [], templates: [], missing: [] } },
}
const questDoneProject = { ...questProject, id: 'p6', title: 'demo-quest-done', path: 'D:/demo-quest-done', displayPath: 'D:/demo-quest-done' }
const questRunningProject = { ...questProject, id: 'p7', title: 'demo-quest-running', path: 'D:/demo-quest-running', displayPath: 'D:/demo-quest-running' }
const project = {
  id: 'p1',
  title: 'demo',
  path: 'D:/demo',
  displayPath: 'D:/demo',
  directories: [],
  inventory: {
    skills: { roots: ['.dsh/skills'], items: [] },
    procedures: {
      roots: ['procedures'],
      dir: 'D:/demo/.dsh/dsh-heipm/procedures',
      items: [],
      templates,
      missing: ['INDEX.template.md', 'card-template.md', 'CLASSIFY.md'],
    },
  },
}

const projectWithProcedures = {
  ...project,
  id: 'p2',
  title: 'demo-procedures',
  inventory: {
    ...project.inventory,
    procedures: {
      roots: ['procedures'],
      dir: 'D:/demo/.dsh/dsh-heipm/procedures',
      items: [{
        id: 'c1',
        name: '工具-演示.md',
        slug: '工具-演示',
        role: 'card',
        kind: 'card',
        path: 'D:/demo/procedures/工具-演示.md',
        displayPath: 'D:/demo/procedures/工具-演示.md',
        size: 42,
        exists: true,
        tooLarge: false,
        content: '# 标题\n\n正文 **粗体** 与 `代码`\n\n> 引用行\n\n- 项目一\n- 项目二\n\n```bash\nnpm test\n```\n\n| a | b |\n| --- | --- |\n| 1 | 2 |',
      }, {
        id: 'c2',
        name: '脚本-批量改代码误删逻辑.md',
        slug: '脚本-批量改代码误删逻辑',
        role: 'card',
        kind: 'card',
        path: 'D:/demo/procedures/脚本-批量改代码误删逻辑.md',
        displayPath: 'D:/demo/procedures/脚本-批量改代码误删逻辑.md',
        size: 1536,
        exists: true,
        tooLarge: false,
        content: '# 脚本 卡',
      }, {
        id: 'c3',
        name: '无分类卡.md',
        slug: '无分类卡',
        role: 'card',
        kind: 'card',
        path: 'D:/demo/procedures/无分类卡.md',
        displayPath: 'D:/demo/procedures/无分类卡.md',
        size: 2048,
        exists: true,
        tooLarge: false,
        content: '# 无分类',
      }],
      templates: templates.map(entry => ({ ...entry, exists: true })),
      missing: [],
    },
  },
}

const projectWithLegacy = {
  ...project,
  id: 'p4',
  title: 'legacy-procedures',
  inventory: {
    ...project.inventory,
    procedures: {
      roots: ['procedures'],
      dir: 'D:/demo/.dsh/dsh-heipm/procedures',
      items: [{
        id: 'n1',
        name: '新卡-演示.md',
        slug: '新卡-演示',
        role: 'card',
        kind: 'card',
        path: 'D:/demo/.dsh/dsh-heipm/procedures/新卡-演示.md',
        displayPath: 'D:/demo/.dsh/dsh-heipm/procedures/新卡-演示.md',
        size: 42,
        exists: true,
        tooLarge: false,
        content: '# 新卡',
      }, {
        id: 'o1',
        name: '工具-老卡.md',
        slug: '工具-老卡',
        role: 'card',
        kind: 'card',
        path: 'D:/demo/procedures/工具-老卡.md',
        displayPath: 'D:/demo/procedures/工具-老卡.md',
        size: 42,
        exists: true,
        tooLarge: false,
        content: '# 老卡',
      }, {
        id: 'o2',
        name: '_inbox.md',
        slug: '_inbox',
        role: 'meta',
        kind: 'meta',
        path: 'D:/demo/procedures/_inbox.md',
        displayPath: 'D:/demo/procedures/_inbox.md',
        size: 12,
        exists: true,
        tooLarge: false,
        content: '# inbox',
      }],
      templates,
      missing: ['INDEX.template.md', 'card-template.md', 'CLASSIFY.md'],
      legacy: [
        { name: '工具-老卡.md', root: 'procedures', path: 'D:/demo/procedures/工具-老卡.md', displayPath: 'D:/demo/procedures/工具-老卡.md' },
        { name: '_inbox.md', root: 'procedures', path: 'D:/demo/procedures/_inbox.md', displayPath: 'D:/demo/procedures/_inbox.md' },
      ],
    },
  },
}

const projectWithAgentsDoc = {
  ...project,
  id: 'p3',
  title: 'legacy-host',
  directories: [{
    path: 'D:/demo',
    relativePath: '.',
    files: [{
      name: 'AGENTS.md',
      relativePath: 'AGENTS.md',
      path: 'D:/demo/AGENTS.md',
      displayPath: 'D:/demo/AGENTS.md',
      exists: true,
      content: '# AGENTS.md\n',
      size: 12,
      version: '12:1',
    }],
  }],
}

const cases = [
  ['global+skills', { projects: [], globals }, 'skills', 'global.scoped.title'],
  ['global+procedures', { projects: [], globals }, 'procedures', 'global.scoped.title'],
  ['project+skills', { projects: [project], globals: [] }, 'skills', 'empty.skills.title'],
  ['project+procedures', { projects: [project], globals: [] }, 'procedures', 'empty.procedures.title'],
  ['project+procedures+disabled', { projects: [project], globals: [], proceduresEnabled: false }, 'procedures',
    'section.constraints.title', 'section.procedures.title'],
  ['project+procedures+setup', { projects: [project], globals: [], proceduresEnabled: true }, 'procedures', 'procedures.templates.title'],
  ['project+procedures+setup-dir', { projects: [project], globals: [], proceduresEnabled: true }, 'procedures', '.dsh/dsh-heipm/procedures'],
  ['project+procedures+setup-create-all', { projects: [project], globals: [], proceduresEnabled: true }, 'procedures',
    'procedures.templates.createAll'],
  ['project+procedures+rows', { projects: [projectWithProcedures], globals: [] }, 'procedures', '42 B'],
  ['project+procedures+legacy', { projects: [projectWithLegacy], globals: [], proceduresEnabled: true }, 'procedures',
    'procedures.legacy.migrate'],
  ['project+procedures+legacy-names', { projects: [projectWithLegacy], globals: [], proceduresEnabled: true }, 'procedures',
    '_inbox.md'],
  ['project+procedures+groups', { projects: [projectWithProcedures], globals: [] }, 'procedures', 'procedures.group.other'],
  ['project+procedures+collapsed', { projects: [projectWithProcedures], globals: [] }, 'procedures', '2.0 KB', '42 B',
    { 'dsh-heipm:proceduresCollapsed:v1': JSON.stringify(['工具']) }],
  ['project+procedures+preview', { projects: [projectWithProcedures], globals: [] }, 'procedures', '粗体'],
  ['project+procedures+preview-list', { projects: [projectWithProcedures], globals: [] }, 'procedures', '项目二'],
  ['project+procedures+preview-code', { projects: [projectWithProcedures], globals: [] }, 'procedures', 'npm test'],
  ['project+resizer-sections', { projects: [project], globals: [] }, 'procedures', 'col.sections · 208px'],
  ['project+constraints+editor', { projects: [projectWithAgentsDoc], globals: [] }, 'constraints', 'AGENTS.md', 'col.files'],
  ['project+resizer-preview', { projects: [projectWithProcedures], globals: [] }, 'procedures', 'col.preview · 42%'],
  ['project+quest+hidden', { projects: [project], globals: [], questEnabled: false }, 'quest', 'section.constraints.title', 'section.quest.title'],
  ['project+quest+entry', { projects: [project], globals: [], questEnabled: true }, 'constraints', 'section.quest.title'],
  ['project+quest+tree', { projects: [questProject], globals: [], questEnabled: true }, 'quest', '前端验证码组件', null, null, null, false],
  ['project+quest+groups', { projects: [questProject], globals: [], questEnabled: true }, 'quest', 'group.done', '二、初始化'],
  ['project+quest+empty-open', { projects: [questDoneProject], globals: [], questEnabled: true }, 'quest', 'group.done', 'group.open · 0'],
  ['project+quest+running', { projects: [questRunningProject], globals: [], questEnabled: true }, 'quest', '正在跑的活', null, null, null, false],
  ['project+quest+running-chip', { projects: [questRunningProject], globals: [], questEnabled: true }, 'quest', 'summary.running', 'summary.running · 0'],
  ['project+procedures+legacy-budget', { projects: [projectWithLegacy], globals: [], proceduresEnabled: true }, 'procedures',
    'procedures.legacy.title', null, null, { word: '工具-老卡', max: 3 }],
  ['project+no-header', { projects: [project], globals: [] }, 'constraints', 'group.projects', 'page.title'],
  ['project+group-count', { projects: [project, projectWithProcedures], globals }, 'constraints', 'group.projects 2', 'count.projects'],
  ['project+groups-collapsed', { projects: [project], globals }, 'constraints', 'group.projects', 'D:/demo',
    { 'dsh-heipm:listGroupsCollapsed:v1': JSON.stringify(['projects']) }],
  ['project+groups-collapsed-globals', { projects: [project], globals }, 'constraints', 'group.global', 'D:/demo',
    { 'dsh-heipm:listGroupsCollapsed:v1': JSON.stringify(['projects']) }],
]

let failed = 0
for (const [name, data, section, expected, absent, storage, budget, asyncChunk] of cases) {
  try {
    const panel = await loadPanel(data, section, storage)
    void asyncChunk
    const out = await renderStable(panel({}))
    const text = out.join(' ')
    if (!text.includes(expected)) {
      failed += 1
      console.error(`FAIL ${name}: rendered without "${expected}"`)
      if (process.env.SMOKE_TRACE) console.error('TRACE ' + name + ' :: ' + text.slice(-400))
    } else if (absent && text.includes(absent)) {
      failed += 1
      console.error(`FAIL ${name}: rendered forbidden "${absent}"`)
    } else if (budget && (text.match(new RegExp(budget.word, 'g')) || []).length > budget.max) {
      failed += 1
      console.error(`FAIL ${name}: "${budget.word}" appears more than ${budget.max} times (leaked into the card list)`)
    } else if (name === 'project+quest+running') {
      const sheet = panel.styles.find(tag => tag.attrs['data-plugin-css'] === 'heipm:quest')
      if (!sheet || !sheet.textContent.includes('pm-quest-spin') || !sheet.textContent.includes('@keyframes pm-quest-spin')) {
        failed += 1
        console.error('FAIL project+quest+running: the spinning icon is missing from the quest stylesheet')
      } else {
        console.log(`ok   ${name}`)
      }
    } else if (name === 'project+quest+tree') {
      const sheet = panel.styles.find(tag => tag.attrs['data-plugin-css'] === 'heipm:quest')
      const missing = []
      if (!sheet || !sheet.textContent.includes('pm-quest-box')) missing.push('the quest stylesheet is not installed in head')
      // 卡片视图：网格容器 + 卡片本体 + 切换按钮都得在样式表里。
      for (const token of ['pm-quest-gridcard', 'data-layout="grid"', 'pm-quest-layout-btn']) {
        if (!sheet || !sheet.textContent.includes(token)) missing.push('the quest stylesheet is missing ' + token)
      }
      // 卡片宽度走 CSS 变量，具体像素由滑块内联给出。
      if (!sheet || !sheet.textContent.includes('var(--pm-card-min')) missing.push('the card width variable is missing')
      for (const token of ['CARD_MIN_WIDTH', 'CARD_MAX_WIDTH', 'clampCardWidth', 'function readCardWidth', 'function writeCardWidth', "'dsh-heipm:quest:cardwidth:'", "type: 'range'"]) {
        if (!QUEST_SOURCE.includes(token)) missing.push('the card width slider is incomplete: ' + token)
      }
      // 排列方式用图标，不再用文字按钮；顶部整块要能吸顶。
      if (!QUEST_SOURCE.includes('function layoutIcon')) missing.push('the layout switch does not use icons')
      if (!sheet || !sheet.textContent.includes('pm-quest-slider')) missing.push('the slider styles are missing')
      if (!sheet || !sheet.textContent.includes('position: sticky')) missing.push('the header bar is not sticky')
      if (!QUEST_SOURCE.includes('pm-quest-headbar')) missing.push('the header bar wrapper is missing')
      // 滑块必须在按钮组左边，否则切布局时右边的按钮会左右跳。
      if (!(QUEST_SOURCE.indexOf('widthSlider,') > 0 && QUEST_SOURCE.indexOf('widthSlider,') < QUEST_SOURCE.indexOf("className: 'pm-quest-layout'"))) {
        missing.push('the width slider is not placed before the layout switch')
      }
      if (!QUEST_SOURCE.includes("'data-hidden': layout === 'grid' ? 'false' : 'true'")) {
        missing.push('the slider does not keep its slot in list mode')
      }
      // 旧 Markdown 未迁移时必须给出提示与命令，而不是静默显示空清单。
      for (const token of ['pm-quest-legacy', 'migrateCommand', 'legacy.note', "doc.legacyPath"]) {
        if (!QUEST_SOURCE.includes(token)) missing.push('the legacy migration hint is missing: ' + token)
      }
      // 源码契约：追踪视图必须强制列表，不能跟着布局切成卡片。
      if (!QUEST_SOURCE.includes("'data-layout': 'list' }, trackedItems.map(renderListItem)")) {
        missing.push('the tracking view does not force the list layout')
      }
      // 布局选择要落地到本地存储。
      for (const token of ["'dsh-heipm:quest:layout:'", 'function readLayout', 'function writeLayout']) {
        if (!QUEST_SOURCE.includes(token)) missing.push('the layout choice is not persisted: ' + token)
      }
      if (missing.length) {
        failed += 1
        console.error('FAIL project+quest+tree: ' + missing.join('; '))
      } else {
        console.log(`ok   ${name}`)
      }
    } else {
      console.log(`ok   ${name}`)
    }
  } catch (error) {
    failed += 1
    console.error(`FAIL ${name}: threw ${error && error.stack ? error.stack.split('\n')[0] : error}`)
  }
}

process.exit(failed ? 1 : 0)
