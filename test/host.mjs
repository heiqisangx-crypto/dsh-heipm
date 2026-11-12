// Host data-layer test: template scaffolding is idempotent, and the card
// inventory classifies index/template/inbox files while shipping their content.
import { mkdtemp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const { __test } = await import('../index.js')

const fs = {
  resolve: async value => value,
  stat: async value => {
    try {
      const info = await stat(value)
      return { type: info.isDirectory() ? 'directory' : 'file', size: info.size, version: `${info.size}:${info.mtimeMs}` }
    } catch {
      return null
    }
  },
  lstat: async value => {
    try {
      return await stat(value)
    } catch {
      return null
    }
  },
  readText: value => readFile(value, 'utf8'),
  listDir: async value => (await readdir(value, { withFileTypes: true })).map(entry => ({
    name: entry.name,
    type: entry.isDirectory() ? 'directory' : 'file',
  })),
  writeText: async (value, content, options) => {
    if (options && options.kind === 'createIfAbsent') await writeFile(value, content, { flag: 'wx' })
    else await writeFile(value, content)
  },
}

const workspace = await mkdtemp(path.join(tmpdir(), 'pm-procedures-'))
let proceduresMarker = null
const ctx = {
  get: name => {
    if (name === 'fs') return fs
    if (name === 'workspaceRegistry') return { list: () => [{ id: 'tmp', title: 'tmp', path: workspace }] }
    if (name === 'heipmProcedures') return proceduresMarker
    return undefined
  },
}

let failed = 0
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`ok   ${name}`)
    return
  }
  failed += 1
  console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`)
}

try {
  const before = await __test.collect(ctx, null)
  const scope = before.projects[0]
  check('procedures start disabled', before.proceduresEnabled === false)
  check('inventory has three templates', scope.inventory.procedures.templates.length === 3)
  check('templates start missing', scope.inventory.procedures.missing.length === 3,
    JSON.stringify(scope.inventory.procedures.missing))
  check('inventory does not ship tools', scope.inventory.procedures.tools === undefined)
  check('no procedures yet', scope.inventory.procedures.items.length === 0)
  check('inventory no longer ships docs', scope.inventory.docs === undefined)

  const first = await __test.scaffold(ctx, { projectPath: workspace, files: ['card-template.md', 'CLASSIFY.md'] })
  check('scaffold creates two files', first.created.length === 2, JSON.stringify(first))
  check('templates land under .dsh/dsh-heipm/procedures',
    (await readdir(path.join(workspace, '.dsh', 'dsh-heipm', 'procedures'))).includes('card-template.md'))
  check('project root is not polluted',
    !(await readdir(workspace)).includes('procedures'))

  const second = await __test.scaffold(ctx, { projectPath: workspace })
  check('second run fills the remaining template', second.created.length === 1,
    JSON.stringify(second.created.map(entry => entry.name)))
  check('existing files are skipped', second.skipped.length === 2, JSON.stringify(second.skipped))
  let toolsCopied = true
  try {
    toolsCopied = (await readdir(path.join(workspace, '.dsh', 'dsh-heipm', 'procedures', 'tools'))).length > 0
  } catch {
    toolsCopied = false
  }
  check('tools are not copied into the project', toolsCopied === false)

  let toolRejected = false
  try {
    await __test.scaffold(ctx, { projectPath: workspace, files: ['procedures-audit.mjs'] })
  } catch (error) {
    toolRejected = error && error.statusCode === 400
  }
  check('tools are not scaffoldable', toolRejected)

  await writeFile(path.join(workspace, '.dsh', 'dsh-heipm', 'procedures', '工具-示例.md'), '# 示例\n\n正文 **粗体**\n', 'utf8')
  proceduresMarker = { section: 'heipm:procedures' }
  const after = await __test.collect(ctx, null)
  check('procedures follow the marker service', after.proceduresEnabled === true)
  const procedures = after.projects[0].inventory.procedures
  const byName = Object.fromEntries(procedures.items.map(item => [item.name, item]))
  check('card role', byName['工具-示例.md'] && byName['工具-示例.md'].role === 'card')
  check('index role', byName['INDEX.template.md'] && byName['INDEX.template.md'].role === 'index')
  check('template role', byName['card-template.md'] && byName['card-template.md'].role === 'template')
  check('classify role', byName['CLASSIFY.md'] && byName['CLASSIFY.md'].role === 'classify')
  check('card content is shipped', byName['工具-示例.md'].content.includes('粗体'))
  check('nothing missing after scaffold', procedures.missing.length === 0,
    JSON.stringify(procedures.missing))

  await mkdir(path.join(workspace, 'procedures'), { recursive: true })
  await writeFile(path.join(workspace, 'procedures', '工具-老卡.md'), '# 老卡\n', 'utf8')
  await writeFile(path.join(workspace, 'procedures', 'INDEX.template.md'), '# 老索引\n', 'utf8')
  const legacyView = await __test.collect(ctx, null)
  const legacyProcedures = legacyView.projects[0].inventory.procedures
  const legacyByName = Object.fromEntries(legacyProcedures.items.map(item => [item.name, item]))
  check('legacy card is listed', Boolean(legacyByName['工具-老卡.md']))
  check('legacy card reports its real path',
    legacyByName['工具-老卡.md'].displayPath.includes('/procedures/工具-老卡.md'),
    legacyByName['工具-老卡.md'].displayPath)
  check('legacy card is not renamed into the plugin dir',
    !legacyByName['工具-老卡.md'].displayPath.includes('/dsh-heipm/procedures/'),
    legacyByName['工具-老卡.md'].displayPath)
  check('legacy root files are reported', legacyProcedures.legacy.some(entry => entry.name === '工具-老卡.md'))

  const migrated = await __test.migrateProcedures(ctx, { projectPath: workspace })
  check('migration moves the legacy card', migrated.moved.some(entry => entry.name === '工具-老卡.md'),
    JSON.stringify(migrated))
  check('migration does not overwrite an existing name',
    migrated.conflicts.some(entry => entry.name === 'INDEX.template.md'), JSON.stringify(migrated.conflicts))
  check('migrated card lands under .dsh/dsh-heipm/procedures',
    (await readdir(path.join(workspace, '.dsh', 'dsh-heipm', 'procedures'))).includes('工具-老卡.md'))
  check('migration removes the legacy copy',
    !(await readdir(path.join(workspace, 'procedures'))).includes('工具-老卡.md'))
  check('conflicting legacy file stays put',
    (await readdir(path.join(workspace, 'procedures'))).includes('INDEX.template.md'))
  check('migrated content is preserved',
    (await readFile(path.join(workspace, '.dsh', 'dsh-heipm', 'procedures', '工具-老卡.md'), 'utf8')).includes('老卡'))

  let rejected = false
  try {
    await __test.scaffold(ctx, { projectPath: path.join(workspace, '..', 'nope'), files: ['card-template.md'] })
  } catch (error) {
    rejected = error && error.statusCode === 400
  }
  check('unknown project is rejected', rejected)

  const questFile = path.join(workspace, '.dsh', 'dsh-heipm', '任务清单.md')
  await mkdir(path.dirname(questFile), { recursive: true })
  await writeFile(questFile, [
    '[ ] 一、登录页',
    '\t[√] 生成接口',
    '\t[ ] 前端组件',
    '[√] 二、初始化：建立目录结构',
    '<!-- 维护规则 -->',
    '[ ] 三、空壳',
    '\t[O] 只差验收',
    '',
  ].join('\n'))

  globalThis.__heipmQuestList = undefined
  check('quest entry hides without the sub-plugin', (await __test.collect(ctx, null)).questEnabled === false)
  globalThis.__heipmQuestList = { count: 1 }
  check('quest entry shows with the sub-plugin', (await __test.collect(ctx, null)).questEnabled === true)
  globalThis.__heipmQuestList = undefined

  const quest = await __test.readQuestList(ctx, { projectPath: workspace })
  check('quest list is read', quest.exists === true, JSON.stringify(quest))
  check('quest list keeps three top-level items', quest.items.length === 3, JSON.stringify(quest.items.map(item => item.label)))
  check('quest list nests subtasks', quest.items[0].children.length === 2, JSON.stringify(quest.items[0].children.length))
  check('quest list reports the file line', quest.items[1].line === 4, JSON.stringify(quest.items[1].line))
  check('quest list counts every state', quest.counts.total === 6 && quest.counts.done === 2 && quest.counts.awaiting === 1 && quest.counts.open === 3,
    JSON.stringify(quest.counts))
  check('quest list strips markers from labels', quest.items[0].label === '一、登录页', JSON.stringify(quest.items[0].label))

  const firstVersion = quest.version
  const toggled = await __test.setQuestState(ctx, { projectPath: workspace, line: 3, state: 'awaiting', version: firstVersion })
  check('quest toggle writes the marker', (await readFile(questFile, 'utf8')).includes('\t[O] 前端组件'))
  check('quest toggle keeps the rest of the file', (await readFile(questFile, 'utf8')).split('\n').length === 8)
  check('quest toggle answers the fresh tree', toggled.counts.awaiting === 2, JSON.stringify(toggled.counts))
  check('quest toggle bumps the version', toggled.version !== firstVersion)

  let stale = false
  try {
    await __test.setQuestState(ctx, { projectPath: workspace, line: 3, state: 'done', version: firstVersion })
  } catch (error) {
    stale = error && error.statusCode === 409
  }
  check('quest toggle rejects a stale version', stale)

  let parentRejected = false
  try {
    await __test.setQuestState(ctx, { projectPath: workspace, line: 1, state: 'done', version: toggled.version })
  } catch (error) {
    parentRejected = error && error.statusCode === 400
  }
  check('quest toggle refuses a parent item', parentRejected)

  let plainLineRejected = false
  try {
    await __test.setQuestState(ctx, { projectPath: workspace, line: 5, state: 'done', version: toggled.version })
  } catch (error) {
    plainLineRejected = error && error.statusCode === 400
  }
  check('quest toggle refuses a non-task line', plainLineRejected)

  let badStateRejected = false
  try {
    await __test.setQuestState(ctx, { projectPath: workspace, line: 3, state: 'later', version: toggled.version })
  } catch (error) {
    badStateRejected = error && error.statusCode === 400
  }
  check('quest toggle refuses an unknown state', badStateRejected)

  const missing = await __test.readQuestList(ctx, { projectPath: workspace })
  await rm(questFile, { force: true })
  const absent = await __test.readQuestList(ctx, { projectPath: workspace })
  check('quest list reports a missing file', absent.exists === false && absent.items.length === 0, JSON.stringify(missing.exists))

  // 子任务全完成但大块需求没勾：读取时就补齐，避免其他 agent 读到未完成。
  await writeFile(questFile, ['[ ] 一、登录页', '\t[√] 生成接口', '\t[√] 前端组件', ''].join('\n'), 'utf8')
  const repaired = await __test.readQuestList(ctx, { projectPath: workspace })
  const repairedText = await readFile(questFile, 'utf8')
  check('quest read ticks a requirement whose subtasks are all done',
    repairedText.startsWith('[√] 一、登录页'), JSON.stringify(repairedText))
  check('quest read reports the repaired requirement as done', repaired.items[0].state === 'done', JSON.stringify(repaired.items[0]))
  const stable = await __test.readQuestList(ctx, { projectPath: workspace })
  check('quest read leaves a consistent file alone', stable.version === repaired.version, JSON.stringify([stable.version, repaired.version]))

  await writeFile(questFile, ['[√] 二、收尾', '\t[√] 写文档', '\t[ ] 补测试', ''].join('\n'), 'utf8')
  await __test.readQuestList(ctx, { projectPath: workspace })
  const reopenedText = await readFile(questFile, 'utf8')
  check('quest read reopens a requirement when a subtask is open again',
    reopenedText.startsWith('[O] 二、收尾'), JSON.stringify(reopenedText))

  await writeFile(questFile, ['[ ] 三、登录页', '\t[√] 生成接口', '\t[ ] 前端组件', ''].join('\n'), 'utf8')
  const beforeLast = await __test.readQuestList(ctx, { projectPath: workspace })
  const afterLast = await __test.setQuestState(ctx, { projectPath: workspace, line: 3, state: 'done', version: beforeLast.version })
  const lastDoneText = await readFile(questFile, 'utf8')
  check('quest toggle ticks the parent when its last subtask is done',
    lastDoneText.includes('[√] 三、登录页'), JSON.stringify(lastDoneText))
  await __test.setQuestState(ctx, { projectPath: workspace, line: 3, state: 'open', version: afterLast.version })
  const reopenedByToggle = await readFile(questFile, 'utf8')
  check('quest toggle reopens the parent when a subtask is reopened',
    reopenedByToggle.includes('[O] 三、登录页'), JSON.stringify(reopenedByToggle))

  const headed = __test.parseQuestMarkdown([
    '# 总览',
    '',
    '一、登录页',
    '[ ] 生成接口',
    '[√] 前端组件',
    '',
    '二、收尾',
    '[√] 写文档',
    '	[√] 子步骤',
    '',
    '三、空章节',
    '',
  ].join('\n'))
  check('headings become requirements', headed.items.length === 2, JSON.stringify(headed.items.map(item => item.label)))
  check('heading keeps its subtasks', headed.items[0].children.length === 2, JSON.stringify(headed.items[0].children.length))
  check('empty heading is dropped', !headed.items.some(item => item.label.includes('空章节')))
  check('heading is marked as heading', headed.items[0].kind === 'heading', headed.items[0].kind)
  check('counts skip headings', headed.counts.total === 4 && headed.counts.done === 3 && headed.counts.open === 1,
    JSON.stringify(headed.counts))
  check('task window is flat', __test.parseQuestMarkdown('[ ] 甲\n[ ] 乙\n').items.length === 2)

  const numbered = __test.parseQuestMarkdown([
    '三十六、分块改名',
    '[√] 子步骤甲',
    '[√] 三十七、子需求：单独一节',
    '[√] 它自己的子步骤',
    '[ ] 三十八、另一个子需求',
  ].join('\n'))
  check('numbered top-level line is its own requirement', numbered.items.length === 3,
    JSON.stringify(numbered.items.map(item => item.label)))
  check('numbered requirement is not nested in the previous one',
    numbered.items[0].children.length === 1, JSON.stringify(numbered.items[0].children.length))
  check('numbered requirement keeps its own subtask',
    numbered.items[1].children.length === 1, JSON.stringify(numbered.items[1].children.length))
  const freshTemplates = (await __test.collect(ctx, null)).projects[0].inventory.procedures.templates
  check('scaffolded templates report in sync', freshTemplates.every(entry => entry.inSync === true),
    JSON.stringify(freshTemplates.map(entry => [entry.name, entry.inSync])))

  const proceduresRoot = path.join(workspace, '.dsh', 'dsh-heipm', 'procedures')
  const cardPath = path.join(proceduresRoot, 'card-template.md')
  const cardSource = await readFile(cardPath, 'utf8')
  await writeFile(cardPath, cardSource.replace(/\n/g, '\r\n'), 'utf8')
  const crlfTemplates = (await __test.collect(ctx, null)).projects[0].inventory.procedures.templates
  check('line endings are ignored when comparing',
    crlfTemplates.every(entry => entry.inSync === true),
    JSON.stringify(crlfTemplates.map(entry => [entry.name, entry.inSync])))

  const classifyPath = path.join(proceduresRoot, 'CLASSIFY.md')
  await writeFile(classifyPath, (await readFile(classifyPath, 'utf8')) + '\nextra line\n', 'utf8')
  const driftMap = Object.fromEntries(
    (await __test.collect(ctx, null)).projects[0].inventory.procedures.templates
      .map(entry => [entry.name, entry.inSync]))
  check('a local edit is reported out of date', driftMap['CLASSIFY.md'] === false, JSON.stringify(driftMap))
  check('untouched templates stay in sync', driftMap['card-template.md'] === true, JSON.stringify(driftMap))

  const synced = await __test.syncTemplates(ctx, { projectPath: workspace, files: ['CLASSIFY.md'] })
  check('sync updates the drifted template', synced.updated.length === 1, JSON.stringify(synced))
  check('sync restores the plugin content',
    (await readFile(classifyPath, 'utf8')) === await readFile(new URL('../templates/CLASSIFY.md', import.meta.url), 'utf8'))
  check('sync reports the template as in sync afterwards',
    (await __test.collect(ctx, null)).projects[0].inventory.procedures.templates
      .find(entry => entry.name === 'CLASSIFY.md').inSync === true)
  check('sync is a no-op when already current',
    (await __test.syncTemplates(ctx, { projectPath: workspace, files: ['CLASSIFY.md'] })).updated.length === 0)

  let unknownSync = false
  try {
    await __test.syncTemplates(ctx, { projectPath: workspace, files: ['nope.md'] })
  } catch (error) {
    unknownSync = error && error.statusCode === 400
  }
  check('sync rejects an unknown template', unknownSync)

  let emptySync = false
  try {
    await __test.syncTemplates(ctx, { projectPath: workspace, files: [] })
  } catch (error) {
    emptySync = error && error.statusCode === 400
  }
  check('sync requires at least one template name', emptySync)

  let foreignSync = false
  try {
    await __test.syncTemplates(ctx, { projectPath: path.join(workspace, '..', 'nope'), files: ['CLASSIFY.md'] })
  } catch (error) {
    foreignSync = error && error.statusCode === 400
  }
  check('sync rejects an unknown project', foreignSync)

  const partialProcedures = await __test.refreshScope(ctx, { projectPath: workspace, part: 'procedures' })
  check('refresh can target one module',
    Boolean(partialProcedures.inventory && partialProcedures.inventory.procedures)
      && partialProcedures.inventory.skills === undefined)
  const partialConstraints = await __test.refreshScope(ctx, { projectPath: workspace, part: 'constraints' })
  check('constraint refresh skips the inventory',
    Array.isArray(partialConstraints.directories) && partialConstraints.inventory === undefined)
  const fullRefresh = await __test.refreshScope(ctx, { projectPath: workspace })
  check('full refresh returns constraints and inventory',
    fullRefresh.directories.length > 0 && Boolean(fullRefresh.inventory.procedures))
  const globalRefresh = await __test.refreshScope(ctx, { globalId: 'dsh' })
  check('refresh reads a global scope', globalRefresh.scopeKind === 'global' && globalRefresh.id === 'dsh')

  const stampBefore = (await __test.stampScope(ctx, { projectPath: workspace })).stamps
  check('stamp covers every module',
    ['globals', 'constraints', 'skills', 'procedures', 'quest'].every(key => typeof stampBefore[key] === 'string'),
    JSON.stringify(stampBefore))
  await writeFile(path.join(proceduresRoot, '工具-示例.md'), '# 示例\n\n正文改长了\n', 'utf8')
  const stampAfterCard = (await __test.stampScope(ctx, { projectPath: workspace })).stamps
  check('editing a card changes only the procedures stamp',
    stampAfterCard.procedures !== stampBefore.procedures
      && stampAfterCard.constraints === stampBefore.constraints
      && stampAfterCard.quest === stampBefore.quest)
  await writeFile(path.join(workspace, '.dsh', 'dsh-heipm', '任务清单.md'), '[ ] 一、测试\n\t[ ] 子任务\n', 'utf8')
  const stampAfterQuest = (await __test.stampScope(ctx, { projectPath: workspace })).stamps
  check('editing the task list changes the quest stamp', stampAfterQuest.quest !== stampAfterCard.quest)
} finally {
  await rm(workspace, { recursive: true, force: true }).catch(() => {})
}

process.exit(failed ? 1 : 0)
