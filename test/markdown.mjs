// Sub-plugin test: the entry inlines the stylesheet, installs one marked tag and decorates tables.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { name } from '../markdown/index.js'
import STYLES from '../markdown/styles.js'

const ENTRY_SOURCE = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const MARKDOWN_CSS = /const MARKDOWN_CSS = ("(?:[^"\\]|\\.)*")/.exec(ENTRY_SOURCE)[1]
const PATCH = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
const PKG = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const ICON = readFileSync(new URL('../markdown/icon.svg', import.meta.url), 'utf8')

assert.equal(name, 'heipm-markdown')
assert.match(PATCH, /- id: dsh-heipm-markdown\n\s+name: 'dsh-heipm\/markdown'\n\s+disabled: true/,
  'markdown sub-plugin must be listed and disabled by default')
assert.equal(PKG.exports['./markdown'], './markdown/index.js')
assert.equal(PKG.exports['./markdown/icon'], './markdown/icon.svg', 'plugin metadata only accepts real image files')
assert.ok(!PKG.files.some(file => file.endsWith('.css')), 'the host only serves .js, so no .css may be shipped')
assert.ok(!PKG.files.some(file => file.includes('client.markdown')), 'no markdown chunk is left behind')
assert.ok(ICON.trimStart().startsWith('<svg'), 'the icon must be a real SVG file')

assert.ok(ENTRY_SOURCE.includes("require.async('./client.procedures.js')"), 'the procedures chunk stays lazy')
assert.ok(!ENTRY_SOURCE.includes('client.markdown.js'), 'the markdown styling must live in the entry, not a chunk')
const INLINE_CSS = JSON.parse(MARKDOWN_CSS)
for (const rule of ['[class*="_tableScroll"]', '[class*="_tableFill"]', 'hm-table-toggle', 'cv-table-collapsed']) {
  assert.ok(INLINE_CSS.includes(rule), 'the entry must carry the table stylesheet: ' + rule)
}
assert.ok(!ENTRY_SOURCE.includes(':checked ~'), 'expansion is driven by a class, not a hidden checkbox')
assert.ok(ENTRY_SOURCE.includes("name.indexOf('_tableScroll') === 0"), 'the host wrapper is recognised by its hashed class prefix')
assert.ok(!ENTRY_SOURCE.includes('toggle.style.display'), 'the toggle is never hidden by a height check')
assert.ok(ENTRY_SOURCE.includes("parent.tagName === 'TABLE'"), 'a table that is its own wrapper must be skipped')
assert.ok(ENTRY_SOURCE.includes('ctx.effect(startMarkdownStyling'), 'apply must start the styling')
assert.equal(STYLES, JSON.parse(MARKDOWN_CSS), 'styles.js and the inlined copy must stay identical')
assert.ok(JSON.parse(MARKDOWN_CSS).includes('[class*="_tableScroll"] > table'), 'the inlined stylesheet ships the table rules')

function makeTree() {
  const descendants = node => node.children.flatMap(child => [child, ...descendants(child)])
  const hasMark = child => Object.prototype.hasOwnProperty.call(child.attributes, 'data-hm-table-toggle')
  const makeNode = (tagName, doc) => {
    const node = {
      tagName,
      nodeType: 1,
      className: '',
      attributes: {},
      dataset: {},
      style: {},
      scrollHeight: 900,
      clientHeight: 400,
      children: [],
      parentNode: null,
      parentElement: null,
      isConnected: true,
      get previousElementSibling() {
        const siblings = node.parentNode ? node.parentNode.children : []
        const at = siblings.indexOf(node)
        return at > 0 ? siblings[at - 1] : null
      },
      get nextElementSibling() {
        const siblings = node.parentNode ? node.parentNode.children : []
        const at = siblings.indexOf(node)
        return at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : null
      },
      ownerDocument: doc,
      textContent: '',
      getAttribute: key => (Object.prototype.hasOwnProperty.call(node.attributes, key) ? node.attributes[key] : null),
      setAttribute: (key, value) => { node.attributes[key] = String(value) },
      hasAttribute: key => Object.prototype.hasOwnProperty.call(node.attributes, key),
      listeners: {},
      addEventListener: (type, handler) => { (node.listeners[type] = node.listeners[type] || []).push(handler) },
      dispatch: type => { for (const handler of node.listeners[type] || []) handler({ preventDefault: () => {} }) },
      remove: () => {
        if (!node.parentNode) return
        node.parentNode.children = node.parentNode.children.filter(child => child !== node)
      },
      insertBefore: (child, ref) => {
        const at = node.children.indexOf(ref)
        node.children.splice(at < 0 ? node.children.length : at, 0, child)
        child.parentNode = node
        child.parentElement = node
        return child
      },
      appendChild: child => node.insertBefore(child, null),
      querySelectorAll: selector => {
        const want = selector.trim()
        if (want === 'table') return descendants(node).filter(child => child.tagName === 'table')
        const mark = want.slice(1, -1)
        return descendants(node).filter(child => Object.prototype.hasOwnProperty.call(child.attributes, mark))
      },
      querySelector: selector => node.querySelectorAll(selector)[0] || null,
    }
    node.classList = {
      add: value => {
        if (!node.className.split(/\s+/).includes(value)) node.className = (node.className + ' ' + value).trim()
      },
      contains: value => node.className.split(/\s+/).includes(value),
      toggle: (value, force) => {
        const on = force === undefined ? !node.classList.contains(value) : Boolean(force)
        if (on) node.classList.add(value)
        else node.className = node.className.split(/\s+/).filter(item => item && item !== value).join(' ')
        return on
      },
      remove: value => { node.className = node.className.split(/\s+/).filter(item => item && item !== value).join(' ') },
    }
    return node
  }
  const doc = { createElement: tag => makeNode(tag, doc) }
  const tree = { doc, head: makeNode('head', doc), body: makeNode('body', doc), descendants, hasMark }
  doc.head = tree.head
  doc.body = tree.body
  doc.documentElement = tree.body
  doc.querySelectorAll = selector => tree.body.querySelectorAll(selector)
  tree.addTable = (content, columns, shell) => {
    const wrapper = makeNode('div', doc)
    wrapper.className = shell || '_tableScroll_test_1'
    const table = makeNode('table', doc)
    const head = makeNode('thead', doc)
    const row = makeNode('tr', doc)
    for (let index = 0; index < (columns || 3); index += 1) row.appendChild(makeNode('th', doc))
    head.appendChild(row)
    table.appendChild(head)
    wrapper.appendChild(table)
    content.appendChild(wrapper)
    return wrapper
  }
  return tree
}


function makeNodeLike(tree, tag, className) {
  const node = tree.doc.createElement(tag)
  node.className = className
  return node
}

function loadEntry(tree, observers, switchState = { enabled: true }) {
  let registration = null
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this) }
    observe(target) { this.target = target; this.targets.push(target) }
    disconnect() { this.disconnected = true }
  }
  const fetch = async () => {
    if (switchState.broken) throw new Error('switch endpoint unavailable')
    return { ok: true, status: 200, json: async () => ({ ok: true, enabled: switchState.enabled }) }
  }
  tree.doc.baseURI = 'http://127.0.0.1:1/'
  const sandbox = { console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {}, queueMicrotask, MutationObserver: Observer, document: tree.doc, window: {}, fetch, URL }
  sandbox.window = sandbox
  sandbox.window.__ModuleLoader__ = { load: config => { registration = config } }
  vm.createContext(sandbox)
  vm.runInContext(ENTRY_SOURCE, sandbox, { filename: 'client.js' })
  assert.ok(registration && registration.id === 'dsh-heipm', 'the entry must register under the package id')
  class Component {}
  Component.prototype.isReactComponent = {}
  const React = {
    Component,
    createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children } }),
    useState: value => [(typeof value === 'function' ? value() : value), () => {}],
    useMemo: fn => fn(),
    useRef: value => ({ current: value || null }),
    useEffect: () => {},
    useCallback: fn => fn,
    Fragment: 'Fragment',
  }
  const require = spec => {
    if (spec === 'react') return React
    throw new Error('unexpected require: ' + spec)
  }
  require.async = async () => ({ createProceduresUi: () => null })
  return registration.factory(require)
}

const observers = []
const tree = makeTree()
const wrapper = tree.addTable(tree.body, 5)
const plugin = loadEntry(tree, observers)

const effects = []
const ctx = {
  locale: { register: () => () => {}, bind: () => key => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
  effect: callback => { effects.push(callback()) },
}
assert.ok(Array.isArray(plugin.inject) && plugin.inject.includes('slots'), 'the panel still needs slots')

const flush = () => new Promise(resolve => setTimeout(resolve, 0))
plugin.apply(ctx)
await flush()

const styleTag = tree.head.children.find(node => node.tagName === 'style' && node.getAttribute('data-plugin-css') === 'heipm:markdown')
assert.ok(styleTag, 'apply must append the markdown stylesheet')
assert.equal(styleTag.dataset.plugin, 'dsh-heipm/markdown', 'the tag must be claimed by the sub-plugin')
assert.ok(styleTag.textContent.includes("[class*='_tableScroll'] > table"), 'the tag must carry the table styles')
assert.ok(!styleTag.textContent.includes(':where('), 'the rules must not hide behind a scope selector no element carries')
assert.ok(styleTag.textContent.trimStart().startsWith('.'), 'the stylesheet starts with a real selector')

const toggles = tree.body.children.filter(tree.hasMark)
assert.equal(toggles.length, 1, 'one toggle button sits right before the table')
assert.equal(toggles[0].tagName, 'button')
assert.equal(toggles[0].getAttribute('aria-expanded'), 'false', 'the table starts collapsed')
assert.ok(wrapper.className.includes('cv-table-collapsed'), 'a freshly decorated table is collapsed')
assert.equal(tree.body.children.indexOf(toggles[0]) + 1, tree.body.children.indexOf(wrapper), 'the button must come right before the wrapper')
assert.ok(wrapper.className.includes('cv-table'), 'the entry stamps the wrapper so both host shells are covered')

toggles[0].dispatch('click')
assert.ok(!wrapper.className.includes('cv-table-collapsed'), 'clicking shows the whole table')
assert.equal(toggles[0].getAttribute('aria-expanded'), 'true', 'the button reports the expanded state')
toggles[0].dispatch('click')
assert.ok(wrapper.className.includes('cv-table-collapsed'), 'clicking again hides the table')

assert.ok(observers.length >= 1, 'apply must observe the document for streaming tables')
assert.ok(!ENTRY_SOURCE.includes("ctx.get('heipm-markdown')"), 'the entry must not poll a host service name the browser context cannot resolve')
assert.ok(!/setInterval\(\s*\(\)\s*=>\s*\{[^}]*revert/.test(ENTRY_SOURCE), 'teardown belongs to the effect disposer, not a timer')

const shippedCss = JSON.parse(MARKDOWN_CSS)
for (const rule of [
  '[class*="_tableScroll"] > table thead th',
  '[class*="_tableFill"] > table thead th',
  '[class*="_tableScroll"] > table tbody tr:nth-child(even)',
  '.cv-table-collapsed > table',
  '.hm-table-toggle',
]) {
  assert.ok(shippedCss.includes(rule), 'the shipped rules must outrank the host rules: ' + rule)
}
assert.ok(!/var\(--dsw-alias-bg-layer/.test(shippedCss), 'table colours must not depend on host tokens that may be missing')
assert.ok(!shippedCss.includes('linear-gradient(180deg'), 'collapsing must not fade anything out')
assert.ok(shippedCss.includes('.cv-table-collapsed > table'), 'collapsing hides the whole table')
assert.ok(!shippedCss.includes('440px'), 'no height clamp is left behind')
assert.ok(/\.hm-table-toggle \{[^}]*width: 100%/.test(shippedCss), 'the toggle takes a row of its own')
assert.ok(!shippedCss.includes('.md-table-wide'), 'the stylesheet must not depend on the wide-table literal class')
assert.ok(shippedCss.length > 2000, 'the stylesheet is shipped in full')

const styleTagRef = tree.head.children.find(node => node.tagName === 'style' && node.getAttribute('data-plugin-css') === 'heipm:markdown')
assert.ok(styleTagRef, 'stylesheet is still installed at startup')
styleTagRef.remove()
const headObserver = observers.find(observer => observer.targets.includes(tree.head))
assert.ok(headObserver, 'the entry must watch the head for a lost stylesheet')
headObserver.callback([{ addedNodes: [] }])
const restored = tree.head.children.find(node => node.tagName === 'style' && node.getAttribute('data-plugin-css') === 'heipm:markdown')
assert.ok(restored, 'losing the stylesheet tag must reinstall it')

const disposers = []
for (const effect of effects) if (typeof effect === 'function' && !disposers.includes(effect)) disposers.push(effect)
for (const entry_ of disposers) entry_()
assert.equal(tree.head.children.length, 0, 'disposing the effects must remove the stylesheet')
assert.ok(observers.every(observer => observer.disconnected), 'disposing must stop every observer')
assert.equal(tree.body.children.filter(tree.hasMark).length, 0, 'disposing must remove the toggles from the page')
assert.ok(!wrapper.className.includes('cv-table-collapsed'), 'disposing must drop the collapsed state')
assert.ok(!wrapper.className.includes('cv-table'), 'disposing must unstamp the wrapper found through its table')
assert.ok(observers[0].disconnected, 'the disposer must stop the observer')

console.log('ok   markdown styling lives in the entry and installs one live stylesheet')
console.log('ok   tables get an expand/collapse toggle in front of the wrapper')

/* 关闭状态：一问一答得到 enabled:false 时，样式与按钮都不该出现（不必重启 DSH）。 */
const offTree = makeTree()
offTree.addTable(offTree.body, 5)
const offPlugin = loadEntry(offTree, [], { enabled: false })
offPlugin.apply({
  locale: { register: () => () => {}, bind: () => key => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
  effect: callback => { callback() },
})
await flush()
assert.equal(offTree.head.children.filter(node => node.getAttribute('data-plugin-css') === 'heipm:markdown').length, 0, 'a disabled sub-plugin must not install the stylesheet')
assert.equal(offTree.body.children.filter(offTree.hasMark).length, 0, 'a disabled sub-plugin must not add toggles')
assert.ok(ENTRY_SOURCE.includes('setInterval(tick, 2000)'), 'the entry must re-check the switch so disabling takes effect without a restart')
assert.ok(ENTRY_SOURCE.includes("api({ action: 'markdown' })"), 'the switch is read from the host route')

console.log('ok   the switch is honoured without a restart')

/* 宿主侧读补丁：只认 dsh-heipm-markdown 自己的 disabled 行。 */
const { __test } = await import('../index.js')
assert.equal(__test.patchDisablesMarkdown('- id: dsh-heipm-markdown\n  disabled: true\n'), true, 'an explicit disable is read from the profile patch')
assert.equal(__test.patchDisablesMarkdown('- id: dsh-heipm-markdown\n  disabled: false\n'), false, 'an explicit enable wins')
assert.equal(__test.patchDisablesMarkdown('- id: dsh-heipm-procedures\n  disabled: true\n'), false, 'other sub-plugins must not switch the styles off')
assert.equal(__test.patchDisablesMarkdown('- id: dsh-heipm-markdown\n'), false, 'a missing disabled line keeps it on')
const liveState = await __test.markdownState({ get: () => undefined })
assert.equal(liveState.enabled, false, 'without the service the sub-plugin counts as off')

console.log('ok   the host reports the switch from the service and the profile patch')

/* 同一段正文里的多张表必须各有一颗按钮；没被裁掉的表不显示按钮。 */
const multiTree = makeTree()
const firstTable = multiTree.addTable(multiTree.body, 3)
const secondTable = multiTree.addTable(multiTree.body, 3)
const multiPlugin = loadEntry(multiTree, [], { enabled: true })
multiPlugin.apply({
  locale: { register: () => () => {}, bind: () => key => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
  effect: callback => { callback() },
})
await flush()
const multiToggles = multiTree.body.children.filter(multiTree.hasMark)
assert.equal(multiToggles.length, 2, 'every table in one message gets its own toggle')
assert.equal(multiToggles[0].nextElementSibling, firstTable, 'the first toggle hugs the first table')
assert.equal(multiToggles[1].nextElementSibling, secondTable, 'the second toggle hugs the second table')

firstTable.scrollHeight = 400
firstTable.clientHeight = 400
const shortTree = makeTree()
const shortTable = shortTree.addTable(shortTree.body, 2)
shortTable.scrollHeight = 300
shortTable.clientHeight = 300
const shortPlugin = loadEntry(shortTree, [], { enabled: true })
shortPlugin.apply({
  locale: { register: () => () => {}, bind: () => key => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
  effect: callback => { callback() },
})
await flush()
const shortToggle = shortTree.body.children.find(shortTree.hasMark)
assert.ok(shortToggle, 'a short table still gets a toggle element')
assert.notEqual(shortToggle && shortToggle.style.display, 'none', 'a short table keeps its toggle too')

console.log('ok   toggles are per table and always usable')

/* 量不到高度（还没布局）时必须显示按钮，不能误藏。 */
const unmeasured = makeTree()
const unmeasuredTable = unmeasured.addTable(unmeasured.body, 4)
unmeasuredTable.scrollHeight = 0
unmeasuredTable.clientHeight = 0
const unmeasuredPlugin = loadEntry(unmeasured, [], { enabled: true })
unmeasuredPlugin.apply({
  locale: { register: () => () => {}, bind: () => key => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
  effect: callback => { callback() },
})
await flush()
const unmeasuredToggle = unmeasured.body.children.find(unmeasured.hasMark)
assert.ok(unmeasuredToggle, 'an unmeasured table still gets a toggle')
assert.notEqual(unmeasuredToggle.style.display, 'none', 'the toggle is never hidden by measurement')

console.log('ok   an unmeasured table keeps its toggle')

/* 旧宿主还没有开关接口（fetch 直接失败）时，样式与按钮必须照常出现，不能一起消失。 */
const brokenTree = makeTree()
const brokenTable = brokenTree.addTable(brokenTree.body, 4)
const brokenPlugin = loadEntry(brokenTree, [], { broken: true })
brokenPlugin.apply({
  locale: { register: () => () => {}, bind: () => key => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
  effect: callback => { callback() },
})
await flush()
assert.ok(brokenTree.head.children.some(node => node.getAttribute('data-plugin-css') === 'heipm:markdown'), 'an unavailable switch must not remove the stylesheet')
assert.ok(brokenTree.body.children.some(brokenTree.hasMark), 'an unavailable switch must not remove the toggles')
assert.equal(brokenTable.previousElementSibling.getAttribute('data-hm-table-toggle'), '', 'the toggle still hugs its table')

console.log('ok   an unavailable switch keeps the styles and toggles')

/* 内容容器里有表格也不能当外壳：否则按钮会挂到整段正文头上（知识卡预览那次）。 */
const containerTree = makeTree()
const container = makeNodeLike(containerTree, 'div', 'pm-md')
containerTree.body.appendChild(container)
containerTree.addTable(container, 2)
containerTree.addTable(container, 2)
const containerPlugin = loadEntry(containerTree, [], { enabled: true })
containerPlugin.apply({
  locale: { register: () => () => {}, bind: () => key => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
  effect: callback => { callback() },
})
await flush()
assert.equal(containerTree.body.children.filter(containerTree.hasMark).length, 0, 'a content container with two tables is not a table shell')
assert.ok(!container.className.includes('cv-table'), 'the container must not be stamped as a table shell')

/* 知识卡预览自带的 .pm-table 外壳要能拿到按钮。 */
const pmTree = makeTree()
const pmWrapper = pmTree.addTable(pmTree.body, 3, 'pm-table')
const pmPlugin = loadEntry(pmTree, [], { enabled: true })
pmPlugin.apply({
  locale: { register: () => () => {}, bind: () => key => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
  effect: callback => { callback() },
})
await flush()
const pmToggle = pmTree.body.children.find(pmTree.hasMark)
assert.ok(pmToggle, 'the preview shell gets its own toggle')
assert.equal(pmToggle.nextElementSibling, pmWrapper, 'the toggle hugs the preview shell')

console.log('ok   only real table shells get toggles')

/* React 用新外壳替换旧外壳后，旧按钮会孤零零留在容器里：同容器再次装饰时必须把它摘掉。 */
const orphanTree = makeTree()
const orphanContainer = makeNodeLike(orphanTree, 'div', 'pm-md')
orphanTree.body.appendChild(orphanContainer)
const orphanButton = makeNodeLike(orphanTree, 'button', 'hm-table-toggle')
orphanButton.setAttribute('data-hm-table-toggle', '')
orphanButton.setAttribute('aria-expanded', 'true')
orphanContainer.appendChild(orphanButton)
orphanContainer.appendChild(makeNodeLike(orphanTree, 'p', ''))
const freshShell = makeNodeLike(orphanTree, 'div', 'pm-table')
freshShell.appendChild(makeNodeLike(orphanTree, 'table', ''))
orphanContainer.appendChild(freshShell)
const orphanObservers = []
const orphanPlugin = loadEntry(orphanTree, orphanObservers, { enabled: true })
orphanPlugin.apply({
  locale: { register: () => () => {}, bind: () => key => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
  effect: callback => { callback() },
})
await flush()
const tableWatch = orphanObservers.find(observer => observer.targets.includes(orphanTree.body))
assert.ok(tableWatch, 'the entry watches the body for new tables')
tableWatch.callback([{ addedNodes: [freshShell] }])
await flush()
const allToggles = orphanContainer.children.filter(orphanTree.hasMark)
assert.equal(allToggles.length, 1, 'the orphan toggle is removed once the same container is decorated again')
assert.equal(allToggles[0].nextElementSibling, freshShell, 'the surviving toggle hugs the fresh shell')

console.log('ok   orphan toggles are cleaned up in their container')
