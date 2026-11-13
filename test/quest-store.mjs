// Quest store test: schema, CRUD, rollup state, revision, migration round-trip.
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import {
  openQuestDb, readTree, addRequirement, addItem,
  setItemState, setItemEvidence, removeNode, importRequirements, getRevision,
} from '../quest-store.js'

const dir = await mkdtemp(path.join(tmpdir(), 'quest-store-'))
const db = openQuestDb(path.join(dir, 'quest.db'))
let passed = 0
const ok = (name, fn) => { fn(); passed += 1 }

ok('an empty store reads as an empty tree', () => {
  const tree = readTree(db)
  assert.equal(tree.requirements.length, 0)
  assert.equal(tree.counts.total, 0)
  assert.equal(getRevision(db), 0)
})

let req
ok('adding a requirement assigns seq 1 and a stable id', () => {
  req = addRequirement(db, '项目初始化')
  assert.equal(req.id, 'r1')
  assert.equal(req.seq, 1)
  assert.equal(req.title, '项目初始化')
  assert.equal(req.state, 'empty')
})

let item
ok('adding an item derives its id from the requirement', () => {
  item = addItem(db, 'r1', '建任务清单', 'cmd.ts:1')
  assert.equal(item.id, 'r1-i1')
  assert.equal(item.state, 'open')
  assert.equal(item.evidence, 'cmd.ts:1')
})

ok('a second requirement gets seq 2', () => {
  const second = addRequirement(db, '面板')
  assert.equal(second.seq, 2)
})

ok('the requirement rolls up to running', () => {
  setItemState(db, item.id, 'running')
  const tree = readTree(db)
  assert.equal(tree.requirements[0].state, 'running')
  assert.equal(tree.counts.running, 1)
})

ok('all items done rolls the requirement to done', () => {
  setItemState(db, item.id, 'done')
  const tree = readTree(db)
  assert.equal(tree.requirements[0].state, 'done')
  assert.equal(tree.counts.done, 1)
})

ok('an unknown state is rejected', () => {
  assert.throws(() => setItemState(db, item.id, 'bogus'), /Unknown task state/)
})

ok('evidence can be replaced', () => {
  setItemEvidence(db, item.id, 'npm test -> 324')
  const tree = readTree(db)
  assert.equal(tree.requirements[0].items[0].evidence, 'npm test -> 324')
})

ok('every write bumps the revision', () => {
  const before = getRevision(db)
  setItemState(db, item.id, 'open')
  assert.equal(getRevision(db), before + 1)
})

ok('removing an item keeps the requirement', () => {
  addItem(db, 'r1', '临时')
  const tree = readTree(db)
  const temp = tree.requirements[0].items.find(entry => entry.title === '临时')
  removeNode(db, temp.id)
  assert.equal(readTree(db).requirements[0].items.length, 1)
})

ok('removing a requirement removes its items', () => {
  removeNode(db, 'r1')
  const tree = readTree(db)
  assert.equal(tree.requirements.length, 1)
  assert.equal(tree.requirements[0].id, 'r2')
  assert.equal(tree.counts.total, 0)
})

ok('migration imports a parsed tree verbatim', () => {
  const result = importRequirements(db, [
    { id: 'r1', seq: 1, title: '项目初始化', items: [
      { id: 'r1-i1', title: '建清单', state: 'done', evidence: 'x' },
      { id: 'r1-i2', title: '建概况', state: 'open' },
    ] },
    { id: 'r2', seq: 2, title: '面板', items: [
      { id: 'r2-i1', title: '三栏', state: 'awaiting' },
    ] },
  ])
  assert.equal(result.requirements, 2)
  assert.equal(result.items, 3)
  const tree = readTree(db)
  assert.equal(tree.counts.total, 3)
  assert.equal(tree.counts.done, 1)
  assert.equal(tree.counts.awaiting, 1)
  assert.equal(tree.requirements[0].state, 'open')
})

ok('reopening the same file keeps the data', () => {
  db.close()
  const again = openQuestDb(path.join(dir, 'quest.db'))
  const tree = readTree(again)
  assert.equal(tree.counts.total, 3)
  again.close()
})

// —— 嵌套任务：中间节点状态纯派生，叶子才是事实 ——
const db2 = openQuestDb(path.join(dir, 'nested.db'))
let mid, leafA, leafB
ok('a nested requirement starts empty', () => {
  addRequirement(db2, '嵌套需求')
  assert.equal(readTree(db2).requirements[0].state, 'empty')
})

ok('subtasks nest one level down', () => {
  mid = addItem(db2, 'r1', '父任务')
  leafA = addItem(db2, 'r1', '子任务A')
  leafB = addItem(db2, 'r1', '子任务B')
  db2.prepare('UPDATE item SET parent_id = ? WHERE id = ?').run(mid.id, leafA.id)
  db2.prepare('UPDATE item SET parent_id = ? WHERE id = ?').run(mid.id, leafB.id)
  const node = readTree(db2).requirements[0].items.find(entry => entry.id === mid.id)
  assert.equal(node.leaves, 2)
})

ok('an intermediate node cannot be toggled', () => {
  assert.throws(() => setItemState(db2, mid.id, 'done'), /subtasks cannot be toggled/)
})

ok('a mid node reports partial progress', () => {
  setItemState(db2, leafA.id, 'done')
  const node = readTree(db2).requirements[0].items.find(entry => entry.id === mid.id)
  assert.equal(node.state, 'open')
  assert.equal(node.doneLeaves, 1)
})

ok('a mid node completes only when every leaf is done', () => {
  setItemState(db2, leafB.id, 'done')
  const node = readTree(db2).requirements[0].items.find(entry => entry.id === mid.id)
  assert.equal(node.state, 'done')
  assert.equal(node.doneLeaves, 2)
})

ok('reopening one leaf reopens the whole chain', () => {
  setItemState(db2, leafB.id, 'open')
  const tree = readTree(db2)
  assert.equal(tree.requirements[0].items.find(entry => entry.id === mid.id).state, 'open')
  assert.equal(tree.requirements[0].state, 'open')
})

ok('counts skip intermediate nodes', () => {
  const tree = readTree(db2)
  assert.equal(tree.counts.total, 2)
  assert.equal(tree.counts.done, 1)
  assert.equal(tree.counts.open, 1)
})

db2.close()

await rm(dir, { recursive: true, force: true })
console.log(`quest-store: ${passed} ok`)
