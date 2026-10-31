import path from 'node:path'
import os from 'node:os'
import { readdirSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const TOOLS_DIR = fileURLToPath(new URL('../templates/tools/', import.meta.url)).replace(/[\\/]$/, '')
const toolPath = name => path.join(TOOLS_DIR, name)

const COMMAND_TIMEOUT_MS = 60_000
const PROBE_WINDOW_MS = 8_000

function projectOf(ctx, invocation) {
  const sessionId = invocation && invocation.agent ? String(invocation.agent.id) : ''
  try {
    const registry = ctx && typeof ctx.get === 'function' ? ctx.get('workspaceRegistry') : null
    if (!registry || typeof registry.list !== 'function') return null
    const workspaces = registry.list() || []
    const match = workspaces.find(workspace => sessionId
      && Array.from(workspace.sessionIds || [], String).includes(sessionId))
    return match && typeof match.path === 'string' ? match.path : null
  } catch {
    return null
  }
}

function cardsDir(ctx, invocation) {
  const project = projectOf(ctx, invocation)
  const base = project || process.cwd()
  return path.join(base, '.dsh', 'dsh-heipm', 'procedures')
}

function tokensOf(invocation) {
  const raw = invocation && typeof invocation.rawInput === 'string' ? invocation.rawInput : ''
  return raw.trim().split(/\s+/).filter(Boolean)
}

function runTool(script, args, timeoutMs = COMMAND_TIMEOUT_MS) {
  return new Promise(resolve => {
    execFile(
      process.execPath,
      [toolPath(script), ...args],
      { timeout: timeoutMs, windowsHide: true, maxBuffer: 8 * 1024 * 1024, killSignal: 'SIGKILL' },
      (error, stdout, stderr) => {
        const output = String(stdout || '').trim()
        const detail = String(stderr || '').trim()
        if (output) {
          const code = error && typeof error.code === 'number' && !(error.killed || error.signal) ? error.code : 0
          resolve({ ok: true, text: code === 0 || code === 1 ? output : `${output}\n\n[退出码 ${code}]` })
          return
        }
        if (detail) {
          resolve({ ok: false, text: detail })
          return
        }
        if (error && error.code === 'ENOENT') {
          resolve({ ok: false, text: `找不到脚本：${toolPath(script)}` })
          return
        }
        resolve({ ok: false, text: (error && error.message) || '脚本没有产生输出' })
      },
    )
  })
}

export const PROCEDURE_COMMANDS = [
  {
    name: 'proc-audit',
    title: '卡片库静态体检',
    description: '列出结构缺段、断链、体积超限、触发词单一、结论偏旧等问题（只读，不读会话日志）',
    input: { hint: '直接回车即可，也可以补充 --max-bytes / --stale-days 等参数' },
    args: (dir, tokens) => ['--dir', dir, ...tokens],
    script: 'procedures-audit.mjs',
  },
  {
    name: 'proc-review',
    title: '卡片使用情况评审',
    description: '按分层复核期统计卡最近有没有被读过（需要读会话日志）',
    input: { hint: '直接回车即可，也可以补充 --days 30 / --grace 0 / --include-results' },
    args: (dir, tokens) => ['--procedures', dir, ...tokens],
    script: 'procedures-review.mjs',
  },
  {
    name: 'proc-scan',
    title: '挖历史会话',
    description: '从已有会话日志里挖「碰壁 → 正确姿势」，用来攒第一批卡（会读到本机路径）',
    input: { hint: '缺省执行 list 列出工作区；也可写 calls <正则> / user <正则> / say <正则>' },
    script: 'scan-sessions.mjs',
    args: (dir, tokens) => (tokens.length ? tokens : ['list']),
  },
  {
    name: 'proc-probe',
    title: '验证触发',
    description: '盯一段时间的新会话，验证 agent 到底有没有主动去读知识卡（会读到本机路径）',
    input: { hint: '直接回车扫当前项目；也可写 <工作区 slug>' },
    script: 'procedures-probe.mjs',
    timeoutMs: PROBE_WINDOW_MS,
  },
]

function probeArgs(dir, tokens, invocation, ctx, sessionsRoot) {
  const args = ['--once', '--replay']
  const explicit = tokens.find(token => !token.startsWith('-'))
  const slug = explicit || slugOf(projectOf(ctx, invocation), sessionsRoot)
  if (slug) args.unshift('--workspace', slug)
  return args
}

function slugOf(projectPath, sessionsRoot) {
  if (typeof projectPath !== 'string' || !projectPath) return null
  const wanted = projectPath.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  let entries = []
  try {
    entries = readdirSync(sessionsRoot || path.join(os.homedir(), '.dsh', 'sessions'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
  } catch {
    return null
  }
  const match = entries.find(name => name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === wanted)
  return match || null
}

export async function registerCommands(commands, ctx) {
  const buildArgs = (entry, dir, tokens, invocation) => (entry.name === 'proc-probe'
    ? probeArgs(dir, tokens, invocation, ctx)
    : entry.args(dir, tokens, invocation))

  return PROCEDURE_COMMANDS.map(entry => commands.register({
    name: entry.name,
    description: `${entry.title} · ${entry.description}`,
    ...(entry.input ? { input: entry.input } : {}),
    handler: async invocation => {
      const dir = cardsDir(ctx, invocation)
      const tokens = tokensOf(invocation)
      const result = await runTool(entry.script, buildArgs(entry, dir, tokens, invocation), entry.timeoutMs)
      return { kind: result.ok ? 'success' : 'error', text: result.text }
    },
  }))
}
