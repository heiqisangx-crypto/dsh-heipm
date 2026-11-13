// Process shelf: 过程行归类、分组与选择器契约。
// 归类是纯函数，这里只测行为；DOM 部分靠「只认语义属性」的断言兜底。
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const SOURCE = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const DOC = fs.readFileSync(new URL('../docs/HOST_CONTRACT.md', import.meta.url), 'utf8')

let factory = null
const sandbox = { console }
sandbox.window = sandbox
sandbox.window.__ModuleLoader__ = { load: config => { factory = config.factory } }
vm.createContext(sandbox)
vm.runInContext(SOURCE, sandbox, { filename: 'client.js' })

const mod = factory(id => {
  if (id === 'react') {
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
    return {
      Component,
      createElement: () => null,
      useEffect: () => {},
      useMemo: fn => fn(),
      useRef: value => ({ current: value }),
      useState: value => [value, () => {}],
    }
  }
  throw new Error(`unexpected require: ${id}`)
})
const t = mod.__test

let failed = 0
function ok(name) {
  console.log(`ok   ${name}`)
}
function equal(name, actual, expected) {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a === b) return ok(name)
  failed += 1
  console.error(`FAIL ${name}\n  actual:   ${a}\n  expected: ${b}`)
}
function truthy(name, value) {
  try {
    assert.ok(value)
    ok(name)
  } catch {
    failed += 1
    console.error(`FAIL ${name}`)
  }
}

const row = (kind, part, extra) => ({ kind, part: part || '', hasThinking: false, hasTool: false, hasProse: false, ...extra })

equal('tool-call is process', t.classifyFlowRow(row('tool-call')), 'process')
equal('turn-process summary is hidden but gets no icon', t.classifyFlowRow(row('turn-process')), 'skip')
equal('a skipped summary row does not split its group', t.planProcessGroups(['process', 'skip', 'process', 'prose']), [[0, 2]])
equal('reasoning half is process', t.classifyFlowRow(row('assistant-step', 'reasoning')), 'process')
equal('response half is prose', t.classifyFlowRow(row('assistant-step', 'response')), 'prose')
equal('unsplit step with only thinking is process', t.classifyFlowRow(row('assistant-step', '', { hasThinking: true })), 'process')
equal('unsplit step with prose stays visible', t.classifyFlowRow(row('assistant-step', '', { hasThinking: true, hasProse: true })), 'prose')
equal('unsplit step with tool is process', t.classifyFlowRow(row('assistant-step', '', { hasTool: true })), 'process')
equal('user row is prose', t.classifyFlowRow(row('user')), 'prose')
equal('notice row is prose', t.classifyFlowRow(row('turn-error')), 'prose')
equal('unknown kind is prose', t.classifyFlowRow(row('whatever')), 'prose')
equal('missing row is prose', t.classifyFlowRow(null), 'prose')

equal('consecutive process rows form one group', t.planProcessGroups(['process', 'process']), [[0, 1]])
equal('a prose row splits the group', t.planProcessGroups(['process', 'prose', 'process']), [[0], [2]])
equal('process rows after prose group again', t.planProcessGroups(['prose', 'process', 'process', 'prose']), [[1, 2]])
equal('no process rows means no group', t.planProcessGroups(['prose', 'prose']), [])
equal('empty input is safe', t.planProcessGroups([]), [])

equal('follow prefers a running step over a later finished one', t.pickFollowIndex(['process', 'prose', 'process'], [true, false, false]), 0)
equal('follow stays on the last step when everything finished', t.pickFollowIndex(['process', 'process'], [false, false]), 1)
equal('follow ignores prose rows', t.pickFollowIndex(['prose', 'process', 'prose'], [true, false, false]), 1)
equal('follow skips a running row that is not a step', t.pickFollowIndex(['process', 'prose'], [false, true]), 0)
equal('follow has no target without a step', t.pickFollowIndex(['prose'], [true]), -1)

truthy('hidden rows are display:none', t.PROCESS_SHELF_CSS.includes('.hm-proc-row{display:none!important}'))
truthy('shelf is its own pill container', t.PROCESS_SHELF_CSS.includes('.hm-proc-shelf'))
truthy('step buttons carry an expanded state', t.PROCESS_SHELF_CSS.includes('.hm-proc-step[aria-expanded="true"]'))
truthy('the detail panel is a floating window', t.PROCESS_SHELF_CSS.includes('.hm-proc-drawer{') && t.PROCESS_SHELF_CSS.includes('position:fixed') && !t.PROCESS_SHELF_CSS.includes('height:100vh'))
truthy('the window header is the drag handle', t.PROCESS_SHELF_CSS.includes('cursor:move'))
truthy('the window has a resize grip', t.PROCESS_SHELF_CSS.includes('.hm-proc-drawer-grip{') && t.PROCESS_SHELF_CSS.includes('cursor:nwse-resize'))
truthy('the window keeps its size across reloads', SOURCE.includes("heipm:proc-drawer:geo:v1"))
truthy('the window is placed every time it opens', SOURCE.includes('placeDrawer(drawer, doc)'))
truthy('dragging writes the geometry back', SOURCE.includes('saveDrawerGeo(drawer.__hmGeo)'))
truthy('the header buttons do not start a drag', SOURCE.includes("event.target.closest('button')"))
truthy('the drawer can be hidden', t.PROCESS_SHELF_CSS.includes('.hm-proc-drawer[hidden]{display:none}'))
truthy('the drawer stays opaque (theme var with a solid fallback)', t.PROCESS_SHELF_CSS.includes('background:var(--hm-panel, #1b1f26)'))
truthy('step icons are big enough to hit', t.PROCESS_SHELF_CSS.includes('.hm-proc-step{') && t.PROCESS_SHELF_CSS.includes('height:32px') && t.PROCESS_SHELF_CSS.includes('width:19px'))
truthy('the follow toggle sits in the header', t.PROCESS_SHELF_CSS.includes('.hm-proc-drawer-follow[') && SOURCE.includes("follow.className = 'hm-proc-drawer-follow'"))
truthy('the follow state is remembered', SOURCE.includes('heipm:proc-drawer:follow:v1'))
truthy('the window follows the step being generated', SOURCE.includes('if (PROC_DRAWER_FOLLOW) adoptFollowStep(doc)'))
truthy('clicking another step turns following off', SOURCE.includes('setDrawerFollow(doc, false)'))
truthy('clicking the running step keeps following', SOURCE.includes('isRunningStep(row) && row === currentStepRow(doc)'))
truthy('the pin toggle sits in the header', t.PROCESS_SHELF_CSS.includes('.hm-proc-drawer-pin[') && SOURCE.includes("pin.className = 'hm-proc-drawer-pin'"))
truthy('the pin state is remembered', SOURCE.includes('heipm:proc-drawer:pin:v1'))
truthy('pinning keeps the window through outside clicks', SOURCE.includes('if (PROC_DRAWER_PINNED) return'))
truthy('Escape still closes a pinned window', SOURCE.includes("closeProcessDrawer(doc, 'escape')"))
truthy('the follow button has a leading icon', SOURCE.includes('appendButtonIcon(follow, doc, FOLLOW_ICON)'))
truthy('the pin button has a leading icon', SOURCE.includes('appendButtonIcon(pin, doc, PIN_ICON)'))
truthy('the label is kept when the button text changes', SOURCE.includes("querySelector('.hm-proc-drawer-label')"))
truthy('button icons are sized like the text', t.PROCESS_SHELF_CSS.includes('.hm-proc-drawer-follow svg'))

truthy('rows are recognised by semantic kind', t.HOST_CONTRACT.flowRow.includes('data-chat-flow-kind'))
truthy('thinking row is recognised without hashed class', t.HOST_CONTRACT.rowThinking === '[data-variant="think"]')
truthy('disclosure row is the expand control', t.HOST_CONTRACT.rowDisclosure === '[data-disclosure-row]')
truthy('tool rows are recognised by data-tool/data-sample', t.HOST_CONTRACT.rowTool.includes('[data-tool]') && t.HOST_CONTRACT.rowTool.includes('[data-sample]'))
truthy('flow column is addressed by its slot', t.HOST_CONTRACT.chatFlow === '[data-slot="conversation.chat.flow"]')

truthy('the shelf is started by the markdown effect', SOURCE.includes('stopShelf = createProcessShelf()'))
truthy('the shelf has a kill switch', SOURCE.includes("uiFeatureDisabled('process-shelf')"))
truthy('killing the shelf removes its containers', SOURCE.includes('for (const shelf of doc.querySelectorAll(\'[\' + PROC_SHELF_ATTR + \']\')) shelf.remove()'))
truthy('unhiding rows is part of the teardown', SOURCE.includes("doc.querySelectorAll('.' + PROC_ROW_CLASS)"))

truthy('the open drawer refills when the step keeps running', SOURCE.includes('new MutationObserver(() => scheduleDrawerRefresh())'))
truthy('streamed text changes reach the drawer', SOURCE.includes('characterData: true'))
truthy('the open row stays expanded as the update source', SOURCE.includes('startDrawerLive(doc, drawer, row, id)'))
truthy('closing the drawer stops following the step', SOURCE.includes("stopDrawerLive(reason !== 'dispose')"))
truthy('a remounted row is found again by its flow key', SOURCE.includes('processRowByKey(doc, live.key)'))
truthy('refills keep the drawer scroll position', SOURCE.includes('body.scrollTop = atBottom ? body.scrollHeight : before'))

truthy('docs list the flow row selector', DOC.includes('[data-chat-flow-key]'))
truthy('docs list the process shelf', DOC.includes('hm-proc-shelf'))

const noop = t.createProcessShelf()
truthy('the shelf fail-closes without a document', typeof noop === 'function' && noop() === undefined)

process.exit(failed ? 1 : 0)
