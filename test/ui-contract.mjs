// Contract checks for the client's fragile host selectors and the UI kill switch.
// These assertions are the canary: when DSH changes the workspace row markup,
// this test should be the first thing that fails.
import assert from 'node:assert/strict'
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
function ok(name) {
  console.log(`ok   ${name}`)
}
function equal(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) return ok(name)
  failed += 1
  console.error(`FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

equal('workspace rows are addressed by data-row-key', t.HOST_CONTRACT.workspaceRow, '[data-row-key^="workspace:"]')
equal('workspace title selector stays scoped to projectText',
  t.HOST_CONTRACT.workspaceTitle.includes('projectText') && t.HOST_CONTRACT.workspaceTitle.includes('title'), true)

let seen = ''
const row = { getAttribute: () => 'workspace:p1' }
const target = { closest: selector => { seen = selector; return row } }
const resolvedId = t.workspaceRowId(target)
equal('row lookup goes through the host contract', resolvedId, 'p1')
equal('row lookup passes the contract selector to closest', seen, t.HOST_CONTRACT.workspaceRow)

equal('kill switch is off when storage is absent', t.uiFeatureDisabled('workspace-menu'), false)

const storage = {
  value: null,
  getItem() { return this.value },
  setItem() {},
  removeItem() {},
}
sandbox.window.localStorage = storage

storage.value = JSON.stringify(['workspace-menu'])
equal('kill switch disables a listed feature', t.uiFeatureDisabled('workspace-menu'), true)
storage.value = JSON.stringify(['other-feature'])
equal('kill switch leaves unlisted features alone', t.uiFeatureDisabled('workspace-menu'), false)
storage.value = '{not json'
equal('kill switch ignores malformed storage', t.uiFeatureDisabled('workspace-menu'), false)
storage.value = '{}'
equal('kill switch ignores non-array storage', t.uiFeatureDisabled('workspace-menu'), false)

sandbox.window.localStorage = { getItem() { throw new Error('denied') }, setItem() {}, removeItem() {} }
equal('kill switch survives storage failures', t.uiFeatureDisabled('workspace-menu'), false)

process.exit(failed ? 1 : 0)
