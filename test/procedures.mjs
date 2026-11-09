import assert from 'node:assert/strict'
import path from 'node:path'
import { rmSync } from 'node:fs'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { apply, inject, name } from '../procedures/index.js'
import { registerCommands } from '../procedures/tools.js'

const sections = []
const registered = []
const provided = []
const ctx = {
  provide: (name, value) => { provided.push({ name, value }); return () => {} },
  systemPrompt: { section: section => { sections.push(section); return () => {} } },
  commands: { register: definition => { registered.push(definition); return () => {} } },
}

apply(ctx)

assert.equal(name, 'heipm-procedures')
assert.deepEqual(inject, ['systemPrompt', 'commands'])
assert.deepEqual(provided.map(entry => entry.name), ['heipmProcedures'])
assert.equal(provided[0].value.section, 'heipm:procedures')
assert.equal(sections.length, 1)
const section = sections[0]
assert.equal(section.name, 'heipm:procedures')
assert.equal(section.order, 9000)
assert.equal(section.interpolate, false)
assert.equal(section.complete, undefined)
for (const phrase of ['冷启动（每个任务都做）', '定向搜', '锚点', '_inbox.md', '一张卡写四条', 'procedures-tools']) {
  assert.ok(section.text.includes(phrase), `missing phrase: ${phrase}`)
}
assert.ok(!section.text.includes('任务清单'), 'task list belongs to the quest-list sub-plugin, not here')

assert.deepEqual(registered.map(entry => entry.name), ['proc-audit', 'proc-review', 'proc-scan', 'proc-stats', 'proc-probe'])

const tempRoot = await mkdtemp(path.join(tmpdir(), 'dsh-heipm-procedures-'))
const tempProject = path.join(tempRoot, 'project')
const tempCards = path.join(tempProject, '.dsh', 'dsh-heipm', 'procedures')
await mkdir(tempCards, { recursive: true })
await writeFile(path.join(tempCards, '工具-样例.md'), '# 工具-样例\n\n> **锚点**：sample-anchor\n')
const cardCtx = {
  get: name => (name === 'workspaceRegistry'
    ? { list: () => [{ id: 'w-temp', path: tempProject, sessionIds: ['sess-x'] }] }
    : undefined),
}
process.on('exit', () => {
  try { rmSync(tempRoot, { recursive: true, force: true }) } catch {}
})

async function runCommand(name, ctx, agentId, rawInput = '') {
  const captured = []
  await registerCommands({ register: definition => { captured.push(definition); return () => {} } }, ctx)
  const command = captured.find(entry => entry.name === name)
  return command.handler({ rawInput, attachments: [], agent: { id: agentId } })
}

for (const entry of registered) {
  if (entry.name === 'proc-stats') continue
  assert.ok(entry.description.length > 0, `missing description: ${entry.name}`)
  assert.ok(entry.input && entry.input.hint, `missing input hint: ${entry.name}`)
  const result = await runCommand(entry.name, cardCtx, 'sess-x')
  assert.equal(result.kind, 'success', `${entry.name} must succeed`)
  assert.ok(!result.text.includes('复制到输入框'), `${entry.name} must not ask the user to copy anything`)
  assert.ok(!result.text.includes(`${path.sep}templates${path.sep}tools${path.sep}`),
    `${entry.name} must not print the script command: ${result.text.slice(0, 80)}`)
  assert.ok(!result.text.includes('.dsh/procedures-tools'), `stale project-local path: ${entry.name}`)
  assert.ok(result.text.length > 20, `${entry.name} must return the script output: ${result.text.slice(0, 80)}`)
}

assert.ok((await runCommand('proc-audit', cardCtx, 'sess-x')).text.includes('卡库体检'),
  'proc-audit must return the audit report')
assert.ok((await runCommand('proc-review', cardCtx, 'sess-x')).text.includes('卡库评审'),
  'proc-review must return the review report')
assert.ok((await runCommand('proc-scan', cardCtx, 'sess-x')).text.includes('个会话'),
  'proc-scan defaults to list and must return the workspace table')
assert.ok((await runCommand('proc-probe', cardCtx, 'sess-x')).text.includes('探针启动'),
  'proc-probe must return the probe log')

const statsSessions = path.join(tempRoot, 'sessions')
await mkdir(statsSessions, { recursive: true })
const statsRun = await runCommand('proc-stats', cardCtx, 'sess-x', '--sessions ' + statsSessions)
assert.equal(statsRun.kind, 'success', 'proc-stats must succeed on an empty session root')
assert.ok(statsRun.text.includes('卡库使用指标'), `proc-stats must return the metrics report: ${statsRun.text.slice(0, 80)}`)
assert.ok(statsRun.text.includes('**汇总**'), `proc-stats must render markdown by default: ${statsRun.text.slice(0, 120)}`)

const auditWithArgs = await runCommand('proc-audit', cardCtx, 'sess-x', '--max-bytes 4096')
assert.equal(auditWithArgs.kind, 'success', 'extra arguments must be forwarded')

const missingDir = await runCommand('proc-audit', { get: () => ({
  list: () => [{ id: 'w1', path: path.join(path.sep, 'definitely-missing-project'), sessionIds: ['sess-x'] }],
}) }, 'sess-x')
assert.equal(missingDir.kind, 'error', 'a missing card dir must surface as an error, not a silent success')
assert.ok(missingDir.text.includes('找不到卡库目录'), `unexpected error text: ${missingDir.text.slice(0, 120)}`)

const registry = {
  get: name => (name === 'workspaceRegistry'
    ? { list: () => [{ id: 'w1', path: path.join(path.sep, 'work', 'alpha'), sessionIds: ['sess-a'] }] }
    : undefined),
}
const projectScoped = await runCommand('proc-review', registry, 'sess-a')
assert.equal(projectScoped.kind, 'error', 'an unregistered project dir must be reported, not guessed')
const fallbackCwd = process.cwd()
process.chdir(tempProject)
const fallbackScoped = await runCommand('proc-review', registry, 'sess-other')
process.chdir(fallbackCwd)
assert.equal(fallbackScoped.kind, 'success', 'an unrelated session must fall back to the current directory card dir')
assert.ok(fallbackScoped.text.includes('卡库评审'), 'the fallback run must still produce a report')

console.log('ok   procedures sub-plugin registers one fixed section and five commands')
