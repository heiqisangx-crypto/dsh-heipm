// One-shot migration: legacy 任务清单.md -> quest.db, with a verbatim comparison.
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { __test } from '../index.js'

const { parseQuestMarkdown } = __test
import { openQuestDb, readTree, importRequirements } from '../quest-store.js'

const projectPath = process.argv[2]
if (!projectPath) {
  console.error('usage: node scripts/migrate-quest.mjs <projectPath>')
  process.exit(1)
}
const legacy = path.join(projectPath, '.dsh', 'dsh-heipm', '任务清单.md')
const dbFile = path.join(projectPath, '.dsh', 'dsh-heipm', 'quest.db')

if (!existsSync(legacy)) { console.error('legacy file missing: ' + legacy); process.exit(1) }

const content = readFileSync(legacy, 'utf8')
const parsed = parseQuestMarkdown(content)

/** 旧树 -> 库要的形状；标题去掉行首序号。 */
function toStore(items) {
  return items.map((req, index) => ({
    id: 'r' + (index + 1),
    seq: index + 1,
    title: String(req.label || '').replace(/^[一二三四五六七八九十百]+、\s*/, '').trim(),
    items: (req.children || []).map((child, order) => ({
      id: 'r' + (index + 1) + '-i' + (order + 1),
      title: String(child.label || '').trim(),
      state: child.state || 'open',
      line: child.line,
    })),
  }))
}

const wanted = toStore(parsed.items)
const totalItems = wanted.reduce((n, r) => n + r.items.length, 0)
console.log('parsed requirements=' + wanted.length + ' items=' + totalItems)

// 保护：解析不出任何需求，或者有需求却一个子任务都没有，说明格式没认出来。
// 这时绝不能往下走 —— 导入的会是空壳，旧文件却可能被当成迁移源删掉。
if (wanted.length === 0) {
  console.error('ABORT: no requirement parsed from ' + legacy)
  process.exit(3)
}
if (totalItems === 0) {
  console.error('ABORT: parsed ' + wanted.length + ' requirements but 0 subtasks; check the file uses real tab indentation')
  process.exit(3)
}
console.log('parsed counts=' + JSON.stringify(parsed.counts))

// 宿主进程可能正开着这个库（Windows 下删不掉），所以不删文件：
// importRequirements 自己会先清表再写，效果等同于重建。
const db = openQuestDb(dbFile)
const result = importRequirements(db, wanted)
console.log('imported=' + JSON.stringify(result))

// 逐条核对：标题、状态、数量必须完全相等。
const tree = readTree(db)
let mismatches = 0
for (let i = 0; i < wanted.length; i += 1) {
  const want = wanted[i]
  const got = tree.requirements[i]
  if (!got) { console.log('MISSING req ' + want.id); mismatches += 1; continue }
  if (got.title !== want.title) { console.log('TITLE ' + want.id + ': ' + JSON.stringify([want.title, got.title])); mismatches += 1 }
  if (got.items.length !== want.items.length) { console.log('COUNT ' + want.id + ': ' + want.items.length + ' vs ' + got.items.length); mismatches += 1 }
  for (let j = 0; j < want.items.length; j += 1) {
    const w = want.items[j]
    const g = got.items[j]
    if (!g) { console.log('MISSING item ' + w.id); mismatches += 1; continue }
    if (g.title !== w.title) { console.log('ITEM TITLE ' + w.id + ': ' + JSON.stringify([w.title, g.title])); mismatches += 1 }
    if (g.state !== w.state) { console.log('ITEM STATE ' + w.id + ': ' + JSON.stringify([w.state, g.state])); mismatches += 1 }
  }
}
console.log('mismatches=' + mismatches)
console.log('store counts=' + JSON.stringify(tree.counts))
console.log('store revision=' + tree.revision)

// 需求状态是派生的，不与旧 md 的父行标记比较。
const storeReqStates = tree.requirements.reduce((acc, r) => { acc[r.state] = (acc[r.state] || 0) + 1; return acc }, {})
console.log('derived requirement states=' + JSON.stringify(storeReqStates))
db.close()
process.exit(mismatches === 0 ? 0 : 2)
