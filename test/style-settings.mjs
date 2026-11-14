// 样式设置页测试：主题值归一化、CSS 变量落地、宿主存储往返、设置页注册。
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const { __test: host } = await import('../index.js')

const SOURCE = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8')
// 入口内联的样式表是唯一来源，测试直接从源码里取。
const STYLES = JSON.parse(/const MARKDOWN_CSS = ("(?:[^"\\]|\\.)*")/.exec(SOURCE)[1])

let factory = null
const sandbox = { console, setTimeout, clearTimeout, setInterval, clearInterval }
sandbox.window = sandbox
sandbox.window.__ModuleLoader__ = { load: config => { factory = config.factory } }
vm.createContext(sandbox)
vm.runInContext(SOURCE, sandbox, { filename: 'client.js' })

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
  throw new Error('unexpected require: ' + id)
})
const t = mod && mod.__test
if (!t) throw new Error('module did not expose __test')

let failed = 0
function ok(name) {
  console.log('ok   ' + name)
}
function equal(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) return ok(name)
  failed += 1
  console.log('FAIL ' + name + '\n  actual:   ' + JSON.stringify(actual) + '\n  expected: ' + JSON.stringify(expected))
}
function truthy(name, value) {
  if (value) return ok(name)
  failed += 1
  console.log('FAIL ' + name)
}

/* ---- 归一化 ---- */
equal('empty input falls back to defaults', t.normalizeTheme(), t.THEME_DEFAULTS)
equal('a valid hex is kept, lower-cased', t.normalizeTheme({ accent: '#FF9F43' }).accent, '#ff9f43')
equal('a non-hex colour becomes "follow theme"', t.normalizeTheme({ accent: 'red' }).accent, '')
equal('a 3-digit hex is refused', t.normalizeTheme({ ink: '#fff' }).ink, '')
equal('radius is clamped to 0..24', t.normalizeTheme({ radius: 99 }).radius, 24)
equal('a negative radius is clamped to 0', t.normalizeTheme({ radius: -5 }).radius, 0)
equal('a fractional radius is rounded', t.normalizeTheme({ radius: 7.6 }).radius, 8)
equal('a non-numeric radius falls back to 10', t.normalizeTheme({ radius: 'wide' }).radius, 10)
equal('unknown keys are dropped', Object.keys(t.normalizeTheme({ accent: '#112233', evil: 'x' })).sort(), [...t.THEME_COLOR_KEYS, 'radius'].sort())

/* ---- CSS 文本 ---- */
const empty = t.themeCssText(t.THEME_DEFAULTS)
const emptyVars = empty.slice(0, empty.indexOf('}'))
truthy('defaults only set the radius variable', emptyVars === ':root{--hm-radius:10px;')
truthy('defaults never override a colour', !emptyVars.includes('--hm-accent:'))
truthy('static page styles ship in the same sheet', empty.includes('.pm-style-row'))
const themed = t.themeCssText({ accent: '#FF9F43', panel: '#101010', radius: 4 })
truthy('a chosen accent becomes a variable', themed.includes('--hm-accent:#ff9f43;'))
truthy('a chosen panel becomes a variable', themed.includes('--hm-panel:#101010;'))
truthy('the radius follows the input', themed.includes('--hm-radius:4px;'))
truthy('cleared colours are omitted', !themed.slice(0, themed.indexOf('}')).includes('--hm-card:'))

/* ---- 各组件 CSS 接变量 ---- */
truthy('markdown table head uses the card colour', STYLES.includes('--hm-table-head: var(--hm-card, #262a31);'))
truthy('markdown table hover uses the accent', STYLES.includes('--hm-table-hover: var(--hm-accent, #ff9f43);'))
truthy('markdown table radius uses the shared radius', STYLES.includes('border-radius: var(--hm-radius, 10px);'))
truthy('process shelf drawer uses the panel colour', SOURCE.includes('background:var(--hm-panel, #1b1f26)'))
truthy('process shelf icons use the accent', SOURCE.includes('color:var(--hm-accent, #ff9f43)'))
truthy('workspace menu accent follows the theme', SOURCE.includes('--pm-ctx-accent: var(--hm-accent, #d9730d);'))
truthy('the selected-row text colour derives from the accent', SOURCE.includes('--pm-accent-strong: color-mix(in srgb, var(--hm-accent, #d9730d) 78%, #000);'))
truthy('every colour row explains its scope', SOURCE.includes("'style.accentHint': '影响：选中行、按钮、hover、表格悬停、过程图标'"))
truthy('the page renders a live preview of the scope', SOURCE.includes("'style.preview': '这些颜色作用范围的实时预览'") && SOURCE.includes("className: 'pm-style-preview'"))
truthy('the preview shows the five surfaces', (SOURCE.match(/chip\(/g) || []).length === 5)
truthy('the settings page reads host tokens, not heipm colours', SOURCE.includes('.pm-style-label{color:var(--dsw-alias-label-primary,#eceef2)') && !SOURCE.includes('.pm-style-label{color:var(--hm-ink'))
truthy('preview chips colour a dot instead of their text', SOURCE.includes('.pm-style-dot{border-radius:4px'))
truthy('main panel accent follows the theme', SOURCE.includes('--pm-accent: var(--hm-accent, #d9730d);'))

/* ---- 设置页注册 ---- */
truthy('the settings page registers into settings.section', SOURCE.includes("ctx.slots.inject('settings.section'"))
truthy('the section has a stable id', SOURCE.includes("id: 'heipm-style'"))
truthy('the section is labelled from the locale', SOURCE.includes("label: () => t('style.nav')"))
truthy('both dictionaries carry the label', SOURCE.includes("'style.nav': 'heipm 样式'") && SOURCE.includes("'style.nav': 'heipm style'"))
truthy('the page is mounted from apply', /ctx\.slots\.inject\('settings\.section'/.test(SOURCE))

/* ---- 宿主存储 ---- */
const dir = await mkdtemp(path.join(tmpdir(), 'heipm-theme-'))
const file = path.join(dir, 'theme.json')
try {
  equal('a missing file reads as defaults', await host.readTheme(file), host.THEME_DEFAULTS)
  const written = await host.writeTheme({ accent: '#AABBCC', radius: 30 }, file)
  equal('writing clamps and normalises', written, { ...host.THEME_DEFAULTS, accent: '#aabbcc', radius: 24 })
  const back = await host.readTheme(file)
  equal('reading returns what was written', back.accent, '#aabbcc')
  truthy('the file is valid JSON on disk', JSON.parse(await readFile(file, 'utf8')).accent === '#aabbcc')

  await writeFile(file, '{not json', 'utf8')
  equal('a broken file reads as defaults', await host.readTheme(file), host.THEME_DEFAULTS)

  await writeFile(file, JSON.stringify({ accent: 'javascript:alert(1)', radius: -3 }), 'utf8')
  equal('a dangerous value is refused on read', await host.readTheme(file), { ...host.THEME_DEFAULTS, radius: 0 })
} finally {
  await rm(dir, { recursive: true, force: true })
}

console.log(failed ? `style settings: ${failed} failed` : 'style settings: all checks passed')
process.exit(failed ? 1 : 0)
