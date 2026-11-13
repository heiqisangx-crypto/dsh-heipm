// Legacy Markdown parser, kept only for one-shot migration.
// Nothing in the running plugin reads Markdown task lists any more.

const TASK_HEAD = /^([^\S\r\n]*)(?:[-*+]|\d+[.)])[ \t]+/
const MARKED = /^\[(?: |x|X|o|O|~|\u221a)\]\s*(.*)$/
const HEADING_MD = /^\s*(#{1,6})\s+(\S.*)$/
const HEADING_CN = /^\s*([一二三四五六七八九十百]+)、\s*(\S.*)$/
const NUMBERED = /^[一二三四五六七八九十百]+、/

function sanitizeLabel(value) {
  return String(value || '')
    .replace(/\[|\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function readMarker(line) {
  const lead = (/^[^\S\r\n]*/.exec(line) || [''])[0]
  const rest = line.slice(lead.length)
  const bulleted = TASK_HEAD.test(rest) ? rest.slice(TASK_HEAD.exec(rest)[0].length) : rest
  const marker = MARKED.exec(bulleted)
  if (!marker) return null
  return { label: marker[1], symbol: bulleted.charAt(1) }
}

function readTaskLine(line) {
  const head = TASK_HEAD.exec(line)
  const lead = (/^[^\S\r\n]*/.exec(line) || [''])[0]
  const rest = line.slice(lead.length)
  const marker = MARKED.exec(rest)
  if (!marker) return null
  const bulleted = head ? head[0].length > lead.length : false
  return {
    label: marker[1],
    symbol: rest.charAt(1),
    indent: bulleted ? lead.replace(/\t/g, '    ').length + 2 : lead.replace(/\t/g, '    ').length,
  }
}

function stateOfMarker(symbol) {
  if (symbol === '~') return 'running'
  if (symbol === '√') return 'done'
  if (symbol === 'x' || symbol === 'X') return 'open'
  if (symbol === 'o' || symbol === 'O') return 'awaiting'
  return 'open'
}

function readHeading(line) {
  const md = HEADING_MD.exec(line)
  if (md) return { level: md[1].length, label: sanitizeLabel(md[2]) }
  const cn = HEADING_CN.exec(line)
  if (cn) return { level: 1, label: sanitizeLabel(line.trim()) }
  return null
}

function countTaskListItems(items) {
  const counts = { total: 0, done: 0, awaiting: 0, open: 0, running: 0 }
  for (const item of items) counts[item.state] = (counts[item.state] || 0) + 1
  counts.total = items.length
  return counts
}

function collectQuestItems(nodes, out = []) {
  for (const node of nodes) {
    out.push(node)
    if (node.children && node.children.length) collectQuestItems(node.children, out)
  }
  return out
}

/** 没有子条目的标题只是章节名，不该占一个大块需求。 */
function dropEmptyHeadings(nodes) {
  return nodes
    .map(node => (node.kind === 'heading' ? { ...node, children: dropEmptyHeadings(node.children) } : node))
    .filter(node => node.kind !== 'heading' || node.children.length > 0)
}

/**
 * 解析旧格式：标题行（# / 一、）建需求，带 [ ] / [O] / [√] / [~] 的行按缩进挂成子任务；
 * 缩进为 0 且以中文序号开头的行自己就是一个需求。只在迁移脚本里调用。
 */
export function parseQuestMarkdown(content) {
  const lines = String(content || '').split(/\r?\n/)
  const root = []
  const headings = []
  let current = null
  let stack = []
  for (let index = 0; index < lines.length; index += 1) {
    const heading = readHeading(lines[index])
    if (heading) {
      while (headings.length && headings[headings.length - 1].level >= heading.level) headings.pop()
      const parent = headings.length ? headings[headings.length - 1] : null
      const node = {
        line: index + 1,
        kind: 'heading',
        level: heading.level,
        indent: 0,
        label: heading.label,
        state: 'open',
        symbol: '',
        parent: parent ? parent.line : null,
        children: [],
      }
      if (parent) parent.children.push(node)
      else root.push(node)
      headings.push(node)
      current = node
      stack = []
      continue
    }
    const task = readTaskLine(lines[index])
    if (!task) continue
    const label = sanitizeLabel(task.label)
    if (!label) continue
    const node = {
      line: index + 1,
      kind: 'task',
      indent: task.indent,
      label,
      state: stateOfMarker(task.symbol),
      symbol: task.symbol,
      parent: null,
      children: [],
    }
    while (stack.length && stack[stack.length - 1].indent >= node.indent) stack.pop()
    const numbered = node.indent === 0 && NUMBERED.test(label)
    const parent = numbered ? null : (stack.length ? stack[stack.length - 1] : current)
    node.parent = parent ? parent.line : null
    if (parent) parent.children.push(node)
    else root.push(node)
    if (numbered) {
      node.kind = 'requirement'
      current = node
      headings.length = 0
      stack = []
    } else {
      stack.push(node)
    }
  }
  const items = dropEmptyHeadings(root)
  const flat = collectQuestItems(items).filter(node => node.kind !== 'heading')
  return { items, counts: countTaskListItems(flat) }
}
