// Unit checks for the workspace context menu's pure pieces: row-key parsing,
// title normalisation, viewport clamping and friendly error mapping. The DOM
// wiring itself is exercised on the real page.
import fs from 'node:fs'
import vm from 'node:vm'

const SOURCE = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8')

let factory = null
const sandbox = { console }
sandbox.window = sandbox
sandbox.window.__ModuleLoader__ = { load: config => { factory = config.factory } }
vm.createContext(sandbox)
vm.runInContext(SOURCE, sandbox, { filename: 'client.js' })
if (!factory) throw new Error('module did not call __ModuleLoader__.load')

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

const React = {
  Component,
  createElement: () => null,
  useEffect: () => {},
  useMemo: fn => fn(),
  useRef: value => ({ current: value }),
  useState: value => [value, () => {}],
}

const mod = factory(id => {
  if (id === 'react') return React
  throw new Error(`unexpected require: ${id}`)
})
const t = mod && mod.__test
if (!t) throw new Error('module did not expose __test')

let failed = 0
function fail(name, expected, actual) {
  failed += 1
  console.error(`FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}
function ok(name) {
  console.log(`ok   ${name}`)
}
function equal(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) ok(name)
  else fail(name, expected, actual)
}

equal('workspace row key yields the workspace id', t.workspaceKeyId('workspace:abc-123'), 'abc-123')
equal('session row key is ignored', t.workspaceKeyId('session:abc'), null)
equal('ungrouped workspace row is ignored', t.workspaceKeyId('workspace:'), null)
equal('missing attribute is ignored', t.workspaceKeyId(null), null)

const row = { getAttribute: () => 'workspace:p1' }
const target = { closest: selector => (selector === '[data-row-key^="workspace:"]' ? row : null) }
equal('row lookup resolves through the closest row element', t.workspaceRowId(target), 'p1')
equal('row lookup ignores elements without a row ancestor', t.workspaceRowId({ closest: () => null }), null)

equal('title whitespace is collapsed', t.normalizeWorkspaceTitle('  my   project \n'), 'my project')
equal('missing title becomes an empty string', t.normalizeWorkspaceTitle(undefined), '')

equal('menu opens at the pointer when it fits',
  t.clampMenuPosition(120, 90, 180, 120, 1280, 800), { left: 120, top: 90 })
equal('menu flips inside the viewport near the bottom-right',
  t.clampMenuPosition(1270, 790, 180, 120, 1280, 800), { left: 1092, top: 672 })
equal('menu keeps an 8px margin at the top-left',
  t.clampMenuPosition(-40, -20, 180, 120, 1280, 800), { left: 8, top: 8 })
equal('menu stays on screen even when bigger than the viewport',
  t.clampMenuPosition(500, 500, 300, 300, 200, 200), { left: 8, top: 8 })

const workspaces = {
  list: {
    getSnapshot: () => ({ items: [{ workspaceId: 'p1', title: 'demo' }] }),
  },
}
equal('workspace title comes from the client snapshot', t.workspaceTitleOf(workspaces, 'p1'), 'demo')
equal('unknown workspace has no title', t.workspaceTitleOf(workspaces, 'p9'), '')
equal('missing service has no title', t.workspaceTitleOf(null, 'p1'), '')

const localize = key => key
equal('duplicate name is friendly',
  t.workspaceErrorText(new Error("workspace rename failed: workspace/name-conflict: Workspace name 'x' is already in use"), localize, 'ctx.error.rename'),
  'ctx.error.conflict')
equal('blank name is friendly',
  t.workspaceErrorText(new Error('workspace rename failed: gateway/bad-request: Workspace rename requires a non-blank title'), localize, 'ctx.error.rename'),
  'ctx.error.blank')
equal('unknown failure uses the fallback',
  t.workspaceErrorText(new Error('socket closed'), localize, 'ctx.error.rename'),
  'ctx.error.rename')

process.exit(failed ? 1 : 0)
