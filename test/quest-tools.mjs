// Quest tool test: definition shape, execute paths, and the register/dispose contract.
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { openQuestDb, readTree } from '../quest-store.js'
import { readQuestTool, writeQuestTool, registerQuestTools } from '../quest-tools.js'

const dir = await mkdtemp(path.join(tmpdir(), 'quest-tools-'))
const db = openQuestDb(path.join(dir, 'quest.db'))
const getDb = () => db
let passed = 0
// 这里的用例几乎都是 async：必须 await，否则断言在 db 关掉之后才跑。
const ok = async (name, fn) => { await fn(); passed += 1 }

const read = readQuestTool(getDb)
const write = writeQuestTool(getDb)

await ok('the read tool is named quest_read', () => {
  assert.equal(read.name, 'quest_read')
  assert.equal(typeof read.execute, 'function')
  assert.equal(read.parameters.type, 'object')
})

await ok('the write tool is named quest_write and lists every op', () => {
  assert.equal(write.name, 'quest_write')
  const ops = write.parameters.properties.op.enum
  assert.deepEqual(ops, ['add_req', 'add_item', 'set_state', 'set_evidence', 'remove'])
})

await ok('the execution context reaches getDb', async () => {
  const seen = []
  const tool = readQuestTool((projectPath, exec) => { seen.push([projectPath, exec]); return db })
  await tool.execute({}, { agent: 'session-1' })
  assert.deepEqual(seen, [[undefined, { agent: 'session-1' }]])
})

await ok('adding a requirement returns its id', async () => {
  const out = await write.execute({ op: 'add_req', title: '登录页' })
  assert.equal(out.ok, true)
  assert.equal(out.result.id, 'r1')
  assert.equal(out.result.seq, 1)
})

await ok('adding an item returns its id', async () => {
  const out = await write.execute({ op: 'add_item', requirementId: 'r1', title: '生成接口' })
  assert.equal(out.ok, true)
  assert.equal(out.result.id, 'r1-i1')
})

await ok('reading lists the requirement and its task', async () => {
  const out = await read.execute({})
  assert.equal(out.requirements.length, 1)
  assert.equal(out.requirements[0].title, '登录页')
  assert.equal(out.requirements[0].items[0].title, '生成接口')
})

await ok('setting a state returns the new state', async () => {
  const out = await write.execute({ op: 'set_state', itemId: 'r1-i1', state: 'running' })
  assert.equal(out.ok, true)
  assert.equal(out.result.state, 'running')
})

await ok('evidence is stored and read back', async () => {
  await write.execute({ op: 'set_evidence', itemId: 'r1-i1', evidence: 'npm test -> 20 ok' })
  const out = await read.execute({})
  assert.equal(out.requirements[0].items[0].evidence, 'npm test -> 20 ok')
})

await ok('remove deletes a node', async () => {
  const out = await write.execute({ op: 'remove', itemId: 'r1-i1' })
  assert.equal(out.ok, true)
  assert.equal(readTree(db).counts.total, 0)
})

await ok('an unknown op is refused', async () => {
  await assert.rejects(() => write.execute({ op: 'bogus' }), /Unknown op/)
})

await ok('add_item without a requirement id is refused', async () => {
  await assert.rejects(() => write.execute({ op: 'add_item', title: 'x' }), /requirementId/)
})

await ok('set_state without a valid state is refused', async () => {
  await assert.rejects(() => write.execute({ op: 'set_state', itemId: 'r1-i1', state: 'nope' }), /valid state/)
})

await ok('registering without a tools service returns null, not a no-op', () => {
  // 返回空函数会被调用方当成"已注册"，轮询补注册就永远不跑了。
  assert.equal(registerQuestTools({}, getDb), null)
  assert.equal(registerQuestTools(null, getDb), null)
})

await ok('a later retry registers once the tools service appears', () => {
  const mounted = []
  const ctx = { tools: { register: (def) => { mounted.push(def.name); return () => {} } }, logger: { warn: () => {} } }
  assert.equal(mounted.length, 0)
  const dispose = registerQuestTools(ctx, getDb)
  assert.equal(typeof dispose, 'function')
  assert.deepEqual(mounted, ['quest_read', 'quest_write'])
  dispose()
})

await ok('registering mounts both tools and dispose unmounts them', () => {
  const mounted = []
  const offs = []
  const ctx = {
    tools: { register: (def) => { mounted.push(def.name); const off = () => {}; offs.push(off); return off } },
    logger: { warn: () => {} },
  }
  const dispose = registerQuestTools(ctx, getDb)
  assert.deepEqual(mounted, ['quest_read', 'quest_write'])
  dispose()
  assert.equal(offs.length, 0 + 2)
})

await ok('add_item nests under a parent task', async () => {
  const req = await write.execute({ op: 'add_req', title: '嵌套示例' })
  const parent = await write.execute({ op: 'add_item', requirementId: req.result.id, title: '父步骤' })
  const child = await write.execute({ op: 'add_item', requirementId: req.result.id, title: '子步骤', parentId: parent.result.id })
  assert.equal(child.result.parentId, parent.result.id)
  const tree = await read.execute({})
  const found = tree.requirements.find(r => r.id === req.result.id)
  assert.equal(found.items.length, 1, 'the child must not appear at the top level')
  assert.equal(found.items[0].children[0].title, '子步骤')
  await assert.rejects(() => write.execute({ op: 'set_state', itemId: parent.result.id, state: 'done' }), /subtasks/)
})

db.close()
await rm(dir, { recursive: true, force: true })
console.log(`quest-tools: ${passed} ok`)