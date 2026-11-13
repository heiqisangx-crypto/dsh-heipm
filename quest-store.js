// Quest store: SQLite-backed task list storage (node:sqlite, zero deps).
import { DatabaseSync } from 'node:sqlite'

export const QUEST_DB_RELATIVE = '.dsh/dsh-heipm/quest.db'

const STATES = ['open', 'running', 'awaiting', 'done']

const SCHEMA = `
-- 需求没有自己的 state：完成与否由叶子派生，库里只放事实。
CREATE TABLE IF NOT EXISTS requirement (
  id         TEXT PRIMARY KEY,
  seq        INTEGER NOT NULL,
  title      TEXT NOT NULL,
  sort       INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS item (
  id             TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES requirement(id) ON DELETE CASCADE,
  parent_id      TEXT NULL,
  title          TEXT NOT NULL,
  state          TEXT NOT NULL DEFAULT 'open',
  evidence       TEXT NULL,
  sort           INTEGER NOT NULL,
  line_no        INTEGER,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_item_req   ON item(requirement_id, sort);
CREATE INDEX IF NOT EXISTS idx_item_state ON item(state);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`

function now() {
  return new Date().toISOString()
}

export function openQuestDb(file) {
  const db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = DELETE')
  db.exec('PRAGMA busy_timeout = 5000')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(SCHEMA)
  return db
}

export function inTransaction(db, work) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const out = work()
    db.exec('COMMIT')
    return out
  } catch (error) {
    try { db.exec('ROLLBACK') } catch {}
    throw error
  }
}

export function getRevision(db) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('revision')
  return row ? Number(row.value) : 0
}

export function bumpRevision(db) {
  const next = getRevision(db) + 1
  db.prepare('INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run('revision', String(next))
  return next
}

/** 有子节点的节点是中间节点：状态纯派生，不存库。 */
export function hasChildren(db, itemId) {
  const row = db.prepare('SELECT 1 AS hit FROM item WHERE parent_id = ? LIMIT 1').get(itemId)
  return Boolean(row)
}

/** 全部后代的叶子节点。 */
function leavesOf(db, itemId) {
  return db.prepare(`
    WITH RECURSIVE sub(id) AS (
      SELECT id FROM item WHERE id = ?
      UNION ALL
      SELECT i.id FROM item i JOIN sub s ON i.parent_id = s.id
    )
    SELECT i.* FROM item i WHERE i.id IN (SELECT id FROM sub)
      AND NOT EXISTS (SELECT 1 FROM item c WHERE c.parent_id = i.id)
  `).all(itemId)
}

/** 叶子全 done 才算完成；中间节点与需求都用这一条。 */
export function nodeComplete(db, itemId) {
  const leaves = leavesOf(db, itemId)
  return leaves.length > 0 && leaves.every(leaf => leaf.state === 'done')
}

/** 派生一个节点当前该显示的状态。 */
export function deriveState(db, itemId) {
  if (!hasChildren(db, itemId)) {
    const row = db.prepare('SELECT state FROM item WHERE id = ?').get(itemId)
    return row ? row.state : null
  }
  const leaves = leavesOf(db, itemId)
  if (leaves.length && leaves.every(leaf => leaf.state === 'done')) return 'done'
  if (leaves.some(leaf => leaf.state === 'running')) return 'running'
  if (leaves.some(leaf => leaf.state === 'awaiting')) return 'awaiting'
  return 'open'
}

/** 需求状态：无 item 记为空，叶子全完成记 done，否则按叶子派生。 */
function rollupRequirementState(db, requirementId) {
  const leaves = db.prepare(`
    SELECT i.state FROM item i WHERE i.requirement_id = ?
      AND NOT EXISTS (SELECT 1 FROM item c WHERE c.parent_id = i.id)
  `).all(requirementId)
  if (!leaves.length) return 'empty'
  if (leaves.every(entry => entry.state === 'done')) return 'done'
  if (leaves.some(entry => entry.state === 'running')) return 'running'
  if (leaves.some(entry => entry.state === 'awaiting')) return 'awaiting'
  return 'open'
}

export function refreshRequirementState(db, requirementId) {
  return rollupRequirementState(db, requirementId)
}

export function readTree(db) {
  const requirements = db.prepare('SELECT * FROM requirement ORDER BY sort, seq').all()
  const items = db.prepare('SELECT * FROM item ORDER BY requirement_id, sort, id').all()
  const byReq = new Map()
  for (const item of items) {
    if (!byReq.has(item.requirement_id)) byReq.set(item.requirement_id, [])
    byReq.get(item.requirement_id).push(item)
  }
  // counts 只数叶子：任何层级的中间节点都不重复计入。
  const counts = { total: 0, open: 0, running: 0, awaiting: 0, done: 0 }
  const leafRows = db.prepare(`
    SELECT i.state AS state, COUNT(*) AS count FROM item i
    WHERE NOT EXISTS (SELECT 1 FROM item c WHERE c.parent_id = i.id)
    GROUP BY i.state
  `).all()
  for (const row of leafRows) {
    counts[row.state] = (counts[row.state] || 0) + Number(row.count)
    counts.total += Number(row.count)
  }

  /** 按 parent_id 递归建树；每一层都带叶子进度。 */
  const build = (requirementId, parentId) => {
    const rows = (byReq.get(requirementId) || []).filter(entry => (entry.parent_id || null) === parentId)
    return rows.map(item => {
      const leaves = leavesOf(db, item.id)
      const done = leaves.filter(leaf => leaf.state === 'done').length
      return {
        id: item.id,
        title: item.title,
        state: deriveState(db, item.id),
        evidence: item.evidence,
        sort: item.sort,
        leaves: leaves.length,
        doneLeaves: done,
        nested: leaves.length > 1,
        children: build(requirementId, item.id),
      }
    })
  }

  const tree = requirements.map(req => ({
    id: req.id,
    seq: req.seq,
    title: req.title,
    state: rollupRequirementState(db, req.id),
    items: build(req.id, null),
  }))
  return { revision: getRevision(db), requirements: tree, counts }
}

function nextRequirement(db) {
  const row = db.prepare('SELECT COALESCE(MAX(seq), 0) AS seq, COALESCE(MAX(sort), 0) AS sort FROM requirement').get()
  return { seq: Number(row.seq) + 1, sort: Number(row.sort) + 1 }
}

export function addRequirement(db, title) {
  const text = String(title || '').trim()
  if (!text) throw new Error('Requirement title is required')
  return inTransaction(db, () => {
    const { seq, sort } = nextRequirement(db)
    const id = `r${seq}`
    db.prepare('INSERT INTO requirement(id, seq, title, sort, created_at) VALUES(?, ?, ?, ?, ?)')
      .run(id, seq, text, sort, now())
    bumpRevision(db)
    return { id, seq, title: text, state: 'empty', items: [] }
  })
}

/**
 * 新增子任务。传 parentId 就挂在某个子任务下面，形成多层结构；
 * id 仍按 requirement 内递增，保证全局唯一。
 */
export function addItem(db, requirementId, title, evidence, parentId) {
  const text = String(title || '').trim()
  if (!text) throw new Error('Item title is required')
  return inTransaction(db, () => {
    const req = db.prepare('SELECT id FROM requirement WHERE id = ?').get(requirementId)
    if (!req) throw new Error('Unknown requirement: ' + requirementId)
    let parent = null
    if (parentId) {
      parent = db.prepare('SELECT * FROM item WHERE id = ?').get(parentId)
      if (!parent) throw new Error('Unknown parent: ' + parentId)
      if (parent.requirement_id !== requirementId) throw new Error('Parent belongs to another requirement')
    }
    const row = db.prepare('SELECT COALESCE(MAX(sort), 0) AS sort FROM item WHERE requirement_id = ?').get(requirementId)
    const sort = Number(row.sort) + 1
    const id = `${requirementId}-i${sort}`
    const stamp = now()
    db.prepare('INSERT INTO item(id, requirement_id, parent_id, title, state, evidence, sort, line_no, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)')
      .run(id, requirementId, parent ? parent.id : null, text, 'open', evidence ? String(evidence) : null, sort, stamp, stamp)
    refreshRequirementState(db, requirementId)
    bumpRevision(db)
    return { id, requirementId, parentId: parent ? parent.id : null, title: text, state: 'open', evidence: evidence ? String(evidence) : null, sort }
  })
}

export function setItemState(db, itemId, state) {
  if (!STATES.includes(state)) throw new Error('Unknown task state: ' + state)
  return inTransaction(db, () => {
    const item = db.prepare('SELECT * FROM item WHERE id = ?').get(itemId)
    if (!item) throw new Error('Unknown item: ' + itemId)
    // 中间节点的状态由叶子派生：不允许手填，避免与事实打架。
    if (hasChildren(db, itemId)) throw new Error('A task with subtasks cannot be toggled here')
    db.prepare('UPDATE item SET state = ?, updated_at = ? WHERE id = ?').run(state, now(), itemId)
    refreshRequirementState(db, item.requirement_id)
    bumpRevision(db)
    return { id: itemId, state }
  })
}

export function setItemEvidence(db, itemId, evidence) {
  return inTransaction(db, () => {
    const item = db.prepare('SELECT * FROM item WHERE id = ?').get(itemId)
    if (!item) throw new Error('Unknown item: ' + itemId)
    db.prepare('UPDATE item SET evidence = ?, updated_at = ? WHERE id = ?')
      .run(evidence ? String(evidence) : null, now(), itemId)
    bumpRevision(db)
    return { id: itemId, evidence: evidence ? String(evidence) : null }
  })
}

/** 改标题：需求与子任务都能改，先找 item 再找 requirement。 */
export function renameNode(db, id, title) {
  const text = String(title || '').trim()
  if (!text) throw new Error('Title is required')
  return inTransaction(db, () => {
    const item = db.prepare('SELECT requirement_id FROM item WHERE id = ?').get(id)
    if (item) {
      db.prepare('UPDATE item SET title = ?, updated_at = ? WHERE id = ?').run(text, now(), id)
      bumpRevision(db)
      return { renamed: 'item', id, title: text }
    }
    const req = db.prepare('SELECT id FROM requirement WHERE id = ?').get(id)
    if (req) {
      db.prepare('UPDATE requirement SET title = ? WHERE id = ?').run(text, id)
      bumpRevision(db)
      return { renamed: 'requirement', id, title: text }
    }
    throw new Error('Unknown node: ' + id)
  })
}

export function removeNode(db, id) {
  return inTransaction(db, () => {
    const item = db.prepare('SELECT requirement_id FROM item WHERE id = ?').get(id)
    if (item) {
      db.prepare('DELETE FROM item WHERE id = ?').run(id)
      refreshRequirementState(db, item.requirement_id)
      bumpRevision(db)
      return { removed: 'item', id }
    }
    const req = db.prepare('SELECT id FROM requirement WHERE id = ?').get(id)
    if (req) {
      db.prepare('DELETE FROM item WHERE requirement_id = ?').run(id)
      db.prepare('DELETE FROM requirement WHERE id = ?').run(id)
      bumpRevision(db)
      return { removed: 'requirement', id }
    }
    throw new Error('Unknown node: ' + id)
  })
}

/** 迁移：从解析结果的 requirements 数组一次性导入。 */
export function importRequirements(db, requirements) {
  return inTransaction(db, () => {
    db.exec('DELETE FROM item')
    db.exec('DELETE FROM requirement')
    const stamp = now()
    let itemCount = 0
    requirements.forEach((req, index) => {
      const seq = Number(req.seq) || index + 1
      const id = String(req.id || `r${seq}`)
      db.prepare('INSERT INTO requirement(id, seq, title, sort, created_at) VALUES(?, ?, ?, ?, ?)')
        .run(id, seq, String(req.title || ''), index + 1, stamp)
      const children = Array.isArray(req.items) ? req.items : []
      children.forEach((child, order) => {
        const itemId = String(child.id || `${id}-i${order + 1}`)
        const state = STATES.includes(child.state) ? child.state : 'open'
        db.prepare('INSERT INTO item(id, requirement_id, parent_id, title, state, evidence, sort, line_no, created_at, updated_at) VALUES(?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)')
          .run(itemId, id, String(child.title || ''), state, child.evidence ?? null, order + 1, child.line ?? null, stamp, stamp)
        itemCount += 1
      })
      refreshRequirementState(db, id)
    })
    bumpRevision(db)
    return { requirements: requirements.length, items: itemCount }
  })
}
