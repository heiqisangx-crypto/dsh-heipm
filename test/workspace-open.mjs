// Behavioural check for the workspace menu's new "open folder" entry: a real
// right-click through the installed listener, then a click on the first item,
// which must POST the workspace id to the plugin route.
import fs from 'node:fs'
import vm from 'node:vm'

const SOURCE = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8')

class Node {
  constructor(tag) {
    this.tagName = String(tag || '').toUpperCase()
    this.children = []
    this.listeners = {}
    this.parentNode = null
    this.style = {}
    this.attrs = {}
    this.className = ''
    this.textContent = ''
    this._html = ''
    this._rect = { width: 180, height: 120, left: 0, top: 0 }
  }
  appendChild(node) {
    node.parentNode = this
    this.children.push(node)
    return node
  }
  removeChild(node) {
    const index = this.children.indexOf(node)
    if (index >= 0) this.children.splice(index, 1)
    node.parentNode = null
    return node
  }
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this)
  }
  setAttribute(name, value) {
    this.attrs[name] = String(value)
  }
  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null
  }
  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(handler)
  }
  removeEventListener(type, handler) {
    const list = this.listeners[type]
    if (!list) return
    const index = list.indexOf(handler)
    if (index >= 0) list.splice(index, 1)
  }
  dispatch(type, event) {
    for (const handler of this.listeners[type] || []) handler(event)
  }
  set innerHTML(value) {
    this._html = String(value)
  }
  get innerHTML() {
    return this._html
  }
  getBoundingClientRect() {
    return this._rect
  }
  contains(node) {
    let current = node
    while (current) {
      if (current === this) return true
      current = current.parentNode
    }
    return false
  }
  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this
  }
  matches(selector) {
    if (selector === '.pm-ctx-item') return String(this.className).split(' ').includes('pm-ctx-item')
    if (selector === '.pm-ctx') return String(this.className).split(' ').includes('pm-ctx')
    if (selector === '.pm-ctx-overlay') return String(this.className).split(' ').includes('pm-ctx-overlay')
    if (selector.startsWith('style[')) return this.tagName === 'STYLE'
    if (selector === '[data-row-key^="workspace:"]') {
      return String(this.getAttribute('data-row-key') || '').startsWith('workspace:')
    }
    return false
  }
  querySelectorAll(selector) {
    const found = []
    const walk = node => {
      for (const child of node.children) {
        if (child.matches(selector)) found.push(child)
        walk(child)
      }
    }
    walk(this)
    return found
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null
  }
  closest(selector) {
    let current = this
    while (current) {
      if (typeof current.matches === 'function' && current.matches(selector)) return current
      current = current.parentNode
    }
    return null
  }
}

const documentNode = new Node('#document')
documentNode.baseURI = 'http://127.0.0.1:6363/'
documentNode.head = documentNode.appendChild(new Node('head'))
documentNode.body = documentNode.appendChild(new Node('body'))
documentNode.activeElement = null
documentNode.createElement = tag => {
  const node = new Node(tag)
  node.ownerDocument = documentNode
  return node
}

const fetchCalls = []
let fetchStatus = 200
const fetchStub = async (url, options) => {
  fetchCalls.push({ url: String(url), options })
  return {
    ok: fetchStatus === 200,
    status: fetchStatus,
    json: async () => (fetchStatus === 200 ? { ok: true } : { ok: false, error: 'nope' }),
  }
}

const windowStub = {
  innerWidth: 1280,
  innerHeight: 800,
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  CustomEvent: class {
    constructor(type) {
      this.type = type
    }
  },
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
}

const sandbox = {
  console,
  document: documentNode,
  window: windowStub,
  fetch: fetchStub,
  URL,
  setTimeout,
  clearTimeout,
}
sandbox.window.document = documentNode
let factory = null
sandbox.window.__ModuleLoader__ = { load: config => { factory = config.factory } }
vm.createContext(sandbox)
vm.runInContext(SOURCE, sandbox, { filename: 'client.js' })

const React = {
  Component: class {},
  createElement: () => null,
  useEffect: () => {},
  useMemo: fn => fn(),
  useRef: value => ({ current: value }),
  useState: value => [value, () => {}],
}
const mod = factory(id => {
  if (id === 'react') return React
  throw new Error('unexpected require: ' + id)
})
const install = mod.__test.installWorkspaceContextMenu
const t = key => key

let failed = 0
function equal(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) console.log('ok  ', name)
  else {
    failed += 1
    console.error('FAIL ' + name + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual))
  }
}

const workspaces = {
  list: {
    getSnapshot: () => ({ items: [{ workspaceId: 'p1', title: 'dsh-ai-creator' }] }),
  },
}

const dispose = install(workspaces, t)

const row = new Node('div')
row.setAttribute('data-row-key', 'workspace:p1')
row.textContent = 'dsh-ai-creator'
documentNode.body.appendChild(row)

const rightClick = () => ({
  defaultPrevented: false,
  target: row,
  clientX: 40,
  clientY: 60,
  preventDefault() { this.defaultPrevented = true },
  stopPropagation() {},
})
documentNode.dispatch('contextmenu', rightClick())

const menu = documentNode.body.children.find(node => String(node.className) === 'pm-ctx')
equal('right-click opens a menu', Boolean(menu), true)
const items = menu ? menu.children.filter(node => String(node.className).startsWith('pm-ctx-item')) : []
equal('the menu lists three actions', items.length, 3)
equal('open folder is the first action', items[0] && items[0].children[1].textContent, 'ctx.open')
equal('rename is still second', items[1] && items[1].children[1].textContent, 'ctx.rename')
equal('delete is still last', items[2] && items[2].children[1].textContent, 'ctx.delete')
equal('opening the menu focuses the menu itself', documentNode.activeElement === menu, true)
equal('no action looks selected before the pointer moves', documentNode.activeElement === items[0], false)

documentNode.dispatch('keydown', {
  key: 'ArrowDown',
  preventDefault() {},
  stopPropagation() {},
})
equal('an arrow key moves focus to the first action', documentNode.activeElement === items[0], true)

items[0].dispatch('click', { preventDefault() {}, stopPropagation() {} })
await new Promise(resolve => setTimeout(resolve, 20))

equal('clicking posts one request', fetchCalls.length, 1)
const body = fetchCalls[0] ? JSON.parse(fetchCalls[0].options.body) : null
equal('the request opens the clicked workspace', body, { action: 'open-folder', workspaceId: 'p1' })
equal('the menu closes after the click', documentNode.body.children.find(node => String(node.className) === 'pm-ctx') || null, null)

fetchStatus = 500
documentNode.dispatch('contextmenu', rightClick())
const failedMenu = documentNode.body.children.find(node => String(node.className) === 'pm-ctx')
failedMenu.children.filter(node => String(node.className).startsWith('pm-ctx-item'))[0]
  .dispatch('click', { preventDefault() {}, stopPropagation() {} })
await new Promise(resolve => setTimeout(resolve, 20))
const toast = documentNode.body.children.find(node => String(node.className) === 'pm-ctx-toast')
equal('a failed launch shows an error toast', toast && toast.textContent, 'ctx.error.open')

dispose()

if (failed) {
  console.error(failed + ' check(s) failed')
  process.exit(1)
}
console.log('workspace-open: all checks passed')
