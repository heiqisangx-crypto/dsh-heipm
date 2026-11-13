import { writeFileSync, rmSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openQuestDb, readTree } from '../quest-store.js'

const projectPath = process.argv[2]
if (!projectPath) {
  console.error('usage: node scripts/finalize-quest.mjs <projectPath>')
  process.exit(1)
}

const root = path.resolve(projectPath)
const dir = path.join(root, '.dsh', 'dsh-heipm')
const dbFile = path.join(dir, 'quest.db')
const legacy = path.join(dir, '\u4EFB\u52A1\u6E05\u5355.md')
// 每个项目一份快照，否则跑第二个项目会覆盖掉第一个的取证。
const slug = path.basename(root).replace(/[^\w.-]+/g, '-')
const snapshot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'quest-import-' + slug + '.json')

if (!existsSync(dbFile)) {
  console.error('quest.db missing; run migrate-quest.mjs first: ' + dbFile)
  process.exit(1)
}

const db = openQuestDb(dbFile)
const tree = readTree(db)
db.close()

writeFileSync(snapshot, JSON.stringify(tree, null, 2))
console.log('snapshot reqs=' + tree.requirements.length + ' counts=' + JSON.stringify(tree.counts))

if (!tree.requirements.length) {
  console.error('ABORT: the store is empty, refusing to delete the legacy file')
  process.exit(2)
}

if (existsSync(legacy)) {
  rmSync(legacy)
  console.log('legacy removed: ' + legacy)
} else {
  console.log('legacy already gone')
}
console.log('done')
