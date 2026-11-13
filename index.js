import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import {
  QUEST_DB_RELATIVE, openQuestDb, readTree, setItemState, setItemEvidence,
  addRequirement, addItem, removeNode, renameNode, getRevision,
} from './quest-store.js'
import { registerQuestTools } from './quest-tools.js'

const ROUTE = '/dsh-heipm/api'
/* 主题存在用户目录而不是某个项目里：插件只有一个外观，跟着人走。 */
const THEME_FILE = path.join(os.homedir(), '.dsh', 'dsh-heipm', 'theme.json')
const THEME_COLOR_KEYS = ['accent', 'panel', 'card', 'ink', 'dim', 'line']
/* 空字符串 = 不覆盖，CSS 回落到宿主主题令牌。 */
const THEME_DEFAULTS = { accent: '', panel: '', card: '', ink: '', dim: '', line: '', radius: 10 }
const MAX_BODY_BYTES = 1_000_000
const MAX_FILE_BYTES = 512 * 1024
const MAX_LISTING_ENTRIES = 400

const BASE_CANDIDATES = ['AGENTS.md', 'CLAUDE.md']
const LOCAL_CANDIDATES = ['AGENTS.local.md', 'CLAUDE.local.md']
const CANDIDATES = [...BASE_CANDIDATES, ...LOCAL_CANDIDATES]
const PRIMARY_CANDIDATES = ['AGENTS.md', 'AGENTS.local.md']

const SKILL_ROOTS = ['.dsh/skills', 'skills', '.agents/skills']
const PROCEDURE_ROOTS = ['procedures']

// Built-in scaffolds shipped with the plugin: copied into a project only when
// the target file is absent. All destinations stay under .dsh/dsh-heipm so the
// project root stays clean. The tools are neither copied nor listed in the UI:
// they take --dir / --workspace arguments, so the plugin's single shipped copy
// in templates/tools serves every project.
const TEMPLATE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates')
const PROCEDURE_DIR = '.dsh/dsh-heipm/procedures'
const QUEST_DB = QUEST_DB_RELATIVE
/* 旧 Markdown 只在迁移时读一次，之后不再写。 */
const QUEST_LEGACY_RELATIVE = '.dsh/dsh-heipm/任务清单.md'
const PROCEDURE_TEMPLATES = [
  { name: 'INDEX.template.md', dest: `${PROCEDURE_DIR}/INDEX.template.md`, role: 'index', label: '索引' },
  { name: 'card-template.md', dest: `${PROCEDURE_DIR}/card-template.md`, role: 'template', label: '卡片模板' },
  { name: 'CLASSIFY.md', dest: `${PROCEDURE_DIR}/CLASSIFY.md`, role: 'classify', label: '分类判据' },
]

function scaffoldCatalog() {
  return PROCEDURE_TEMPLATES.map(meta => ({
    name: meta.dest.slice(meta.dest.lastIndexOf('/') + 1),
    source: [meta.name],
    dest: meta.dest,
  }))
}

export const inject = ['webServer']

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: ROUTE,
    handler: (req, res) => handle(ctx, req, res),
  }), 'dsh-heipm: HTTP route')
  mountQuestTools(ctx)
}

/**
 * Agent 工具只在「任务清单」子插件运行时挂上：没开子插件的人不该看到它。
 * tools 服务必须用 ctx.inject 取子作用域，主 ctx 上没有这个服务。
 */
function mountQuestTools(ctx) {
  const getDb = projectPath => {
    const base = projectPath
      ? knownProjectPath(ctx, projectPath)
      : (ctx.get('workspaceRegistry')?.list?.()[0]?.path || process.cwd())
    return questDb(ctx, base)
  }
  ctx.inject(['tools'], toolsCtx => {
    let dispose = null
    const sync = () => {
      const flag = globalThis.__heipmQuestList
      const wanted = Number(flag && flag.count ? flag.count : 0) > 0
      if (wanted && !dispose) {
        // 返回 null 说明本轮还拿不到 tools 服务，留给下一次轮询。
        const off = registerQuestTools(toolsCtx, getDb)
        if (typeof off === 'function') {
          dispose = off
          ctx.logger?.info?.('dsh-heipm: quest tools mounted')
        }
      } else if (!wanted && dispose) {
        dispose(); dispose = null
      }
    }
    sync()
    // 子插件晚于主插件 apply 时，这里补一次。
    const timer = setInterval(sync, 1500)
    toolsCtx.effect(() => () => {
      clearInterval(timer)
      if (dispose) dispose()
      dispose = null
    }, 'dsh-heipm: quest tools')
  })
}

/**
 * Internal seams for offline verification. Not part of the plugin contract:
 * they take a ctx-like object so a test can supply a stub filesystem.
 */
export const __test = {
  openWorkspaceFolder,
  folderCommand,
  workspaceEntry,
  collect,
  save,
  remove,
  scaffold,
  syncTemplates,
  handle,
  migrateProcedures,
  refreshScope,
  stampScope,
  listProcedureInventory,
  markdownState,
  patchDisablesMarkdown,
  readQuestList,
  setQuestState,
  createQuestNode,
  removeQuestNode,
  renameQuestNode,
  detectLegacyQuest,
  questListPath,
  normalizeTheme,
  readTheme,
  writeTheme,
  THEME_DEFAULTS,
  THEME_COLOR_KEYS,
}

async function handle(ctx, req, res) {
  if (reject(ctx, req)) {
    send(res, 403, { ok: false, error: 'Forbidden' })
    return
  }
  if (req.method !== 'POST') {
    send(res, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  let payload
  try {
    payload = await readJson(req)
  } catch (error) {
    send(res, 400, { ok: false, error: messageOf(error) })
    return
  }

  try {
    if (payload.action === 'list') {
      const collected = await collect(ctx, payload.sessionId)
      send(res, 200, { ok: true, ...collected })
      return
    }
    if (payload.action === 'save') {
      const saved = await save(ctx, payload)
      send(res, 200, { ok: true, ...saved })
      return
    }
    if (payload.action === 'delete') {
      const deleted = await remove(ctx, payload)
      send(res, 200, { ok: true, ...deleted })
      return
    }
    if (payload.action === 'scaffold') {
      const created = await scaffold(ctx, payload)
      send(res, 200, { ok: true, ...created })
      return
    }
    if (payload.action === 'sync-templates') {
      const synced = await syncTemplates(ctx, payload)
      send(res, 200, { ok: true, ...synced })
      return
    }
    if (payload.action === 'migrate') {
      const migrated = await migrateProcedures(ctx, payload)
      send(res, 200, { ok: true, ...migrated })
      return
    }
    if (payload.action === 'open-folder') {
      const opened = await openWorkspaceFolder(ctx, payload.workspaceId)
      send(res, 200, { ok: true, ...opened })
      return
    }
    if (payload.action === 'theme.get') {
      send(res, 200, { ok: true, theme: await readTheme() })
      return
    }
    if (payload.action === 'theme.set') {
      send(res, 200, { ok: true, theme: await writeTheme(payload.theme) })
      return
    }
    if (payload.action === 'markdown') {
      send(res, 200, { ok: true, ...(await markdownState(ctx)) })
      return
    }
    if (payload.action === 'quest') {
      send(res, 200, { ok: true, ...(await readQuestList(ctx, payload)) })
      return
    }
    if (payload.action === 'quest-state') {
      send(res, 200, { ok: true, ...(await setQuestState(ctx, payload)) })
      return
    }
    if (payload.action === 'quest-create') {
      send(res, 200, { ok: true, ...(await createQuestNode(ctx, payload)) })
      return
    }
    if (payload.action === 'quest-remove') {
      send(res, 200, { ok: true, ...(await removeQuestNode(ctx, payload)) })
      return
    }
    if (payload.action === 'quest-rename') {
      send(res, 200, { ok: true, ...(await renameQuestNode(ctx, payload)) })
      return
    }
    if (payload.action === 'refresh') {
      send(res, 200, { ok: true, ...(await refreshScope(ctx, payload)) })
      return
    }
    if (payload.action === 'stamp') {
      send(res, 200, { ok: true, ...(await stampScope(ctx, payload)) })
      return
    }
    send(res, 400, { ok: false, error: 'Unknown action' })
  } catch (error) {
    const status = error && error.statusCode ? error.statusCode : 500
    send(res, status, { ok: false, error: messageOf(error), code: error && error.code })
  }
}

/**
 * 主题值只收 `#rrggbb`；空串表示「跟随宿主主题」，圆角夹在 0–24。
 */
function normalizeTheme(input) {
  const source = input && typeof input === 'object' ? input : {}
  const theme = {}
  for (const key of THEME_COLOR_KEYS) {
    const value = typeof source[key] === 'string' ? source[key].trim() : ''
    theme[key] = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : ''
  }
  const radius = Number(source.radius)
  theme.radius = Number.isFinite(radius) ? Math.min(24, Math.max(0, Math.round(radius))) : THEME_DEFAULTS.radius
  return theme
}

/** 读不到或坏文件一律回默认，绝不让外观把插件拖挂。 */
async function readTheme(file = THEME_FILE) {
  try {
    const raw = await readFile(file, 'utf8')
    return normalizeTheme(JSON.parse(raw))
  } catch {
    return { ...THEME_DEFAULTS }
  }
}

async function writeTheme(input, file = THEME_FILE) {
  const theme = normalizeTheme(input)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(theme, null, 2) + '\n', 'utf8')
  return theme
}

/**
 * 会话 Markdown 美化的开关状态：子插件在跑（服务在）+ 磁盘上的 profile 补丁没把它关掉。
 * 浏览器端拿它决定是否保留样式，所以两处任一为「关」就按关处理。
 */
async function markdownState(ctx) {
  let live = false
  try {
    live = Boolean(ctx.get('heipmMarkdown'))
  } catch {
    live = false
  }
  const disabledByPatch = await markdownDisabledByPatch()
  return { enabled: live && !disabledByPatch, live, disabledByPatch }
}

/** 只看本进程所在 profile 的补丁：开关写在哪个 profile，就从哪个 profile 读。 */
async function markdownDisabledByPatch() {
  const profileDir = process.env.DSH_PROFILE_DIR
  const target = profileDir
    ? path.join(profileDir, 'cordis.patch.yml')
    : (() => {
        const { dshHome } = homes()
        const name = process.env.DSH_PROFILE || 'desktop'
        return path.join(dshHome, 'profiles', name, 'cordis.patch.yml')
      })()
  try {
    return patchDisablesMarkdown(await readFile(target, 'utf8'))
  } catch {
    return false
  }
}

/** 只认本条目自己的 disabled 行，别被别的插件带偏。 */
function patchDisablesMarkdown(text) {
  const lines = text.split(/\r?\n/)
  let inEntry = false
  for (const line of lines) {
    const head = /^-\s+id:\s*(.+?)\s*$/.exec(line)
    if (head) {
      inEntry = head[1].replace(/^['"]|['"]$/g, '') === 'dsh-heipm-markdown' ||
        head[1].replace(/^['"]|['"]$/g, '') === 'dsh-heipm/markdown'
      continue
    }
    if (!inEntry) continue
    if (/^\s+disabled:\s*true\s*$/.test(line)) return true
    if (/^\s+disabled:\s*false\s*$/.test(line)) return false
  }
  return false
}

function reject(ctx, req) {
  const headers = req.headers || {}
  const host = String(headers.host || '')
  if (!host) return true

  const site = String(headers['sec-fetch-site'] || '').toLowerCase()
  if (site === 'cross-site') return true

  const origin = headers.origin
  if (typeof origin === 'string' && origin && origin !== 'null') {
    try {
      if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) return true
    } catch {
      return true
    }
  }

  const connection = ctx.get('connection')
  if (connection && typeof connection.requestRejection === 'function') {
    try {
      const result = connection.requestRejection(req)
      if (result) return true
    } catch {
      return true
    }
    return false
  }

  try {
    return !isLoopback(new URL(`http://${host}`).hostname)
  } catch {
    return true
  }
}

function isLoopback(hostname) {
  const value = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '')
  if (value === 'localhost' || value.endsWith('.localhost')) return true
  if (value === '::1') return true
  const parts = value.split('.')
  return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part))
    && Number(parts[0]) === 127 && parts.every(part => Number(part) <= 255)
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Request body is too large')
      error.statusCode = 413
      throw error
    }
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text.trim()) return {}
  return JSON.parse(text)
}

function send(res, status, body) {
  const data = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Length', Buffer.byteLength(data))
  res.end(data)
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error)
}

function homes() {
  return {
    dshHome: process.env.DSH_HOME || path.join(os.homedir(), '.dsh'),
    agentsHome: process.env.DSH_AGENTS_HOME || path.join(os.homedir(), '.agents'),
  }
}

function shortPath(value) {
  const home = os.homedir()
  if (value === home) return '~'
  if (value.startsWith(home + path.sep)) return `~${value.slice(home.length).replaceAll('\\', '/')}`
  return value.replaceAll('\\', '/')
}

function pathKey(value) {
  const resolved = path.resolve(value)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

function relativeDisplay(root, value) {
  const relative = path.relative(root, value)
  if (!relative) return '.'
  return relative.replaceAll('\\', '/')
}

function workspaceEntry(ctx, workspaceId) {
  const id = String(workspaceId == null ? '' : workspaceId)
  if (!id) return null
  const found = registryWorkspaces(ctx).find(item => item && String(item.workspaceId ?? item.id ?? '') === id)
  return found || null
}

/** 打开项目根目录的宿主命令：每个平台只用系统自带的那一个。 */
function folderCommand(platform, target) {
  if (platform === 'win32') return { command: 'explorer.exe', args: [target] }
  if (platform === 'darwin') return { command: 'open', args: [target] }
  return { command: 'xdg-open', args: [target] }
}

/** 用系统文件管理器打开工作区根目录；目录不存在时拒绝，而不是打开一个空窗口。 */
async function openWorkspaceFolder(ctx, workspaceId, internals = {}) {
  const workspace = workspaceEntry(ctx, workspaceId)
  if (!workspace || typeof workspace.path !== 'string' || !workspace.path) {
    throw Object.assign(new Error('Unknown workspace'), { statusCode: 404 })
  }
  const target = path.resolve(workspace.path)
  const probe = internals.stat || stat
  const info = await probe(target).catch(() => null)
  if (!info || !info.isDirectory()) {
    throw Object.assign(new Error('Workspace folder not found'), { statusCode: 404 })
  }
  const spawnProcess = internals.spawn || spawn
  const { command, args } = folderCommand(process.platform, target)
  await new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, { detached: true, stdio: 'ignore' })
    child.once('error', reject)
    child.once('spawn', () => {
      child.unref()
      resolve()
    })
  }).catch(() => {
    throw Object.assign(new Error('Could not open the folder'), { statusCode: 500 })
  })
  return { path: target }
}

function registryWorkspaces(ctx) {
  const registry = ctx.get('workspaceRegistry')
  if (!registry || typeof registry.list !== 'function') return []
  try {
    const workspaces = registry.list()
    return Array.isArray(workspaces) ? workspaces : []
  } catch {
    return []
  }
}

async function collect(ctx, requestedSessionId) {
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')

  const sessionFilter = requestedSessionId ? String(requestedSessionId) : null
  const { dshHome, agentsHome } = homes()
  const dshFile = path.join(dshHome, 'AGENTS.md')
  const sharedFile = path.join(agentsHome, 'AGENTS.md')

  const globals = [
    await globalScope(fs, 'dsh', 'DSH 全局', dshFile),
    await globalScope(fs, 'shared', '共享全局', sharedFile),
  ]

  const projects = []
  const seen = new Set()

  for (const workspace of registryWorkspaces(ctx)) {
    if (!workspace || typeof workspace.path !== 'string') continue
    if (sessionFilter && !Array.from(workspace.sessionIds || [], String).includes(sessionFilter)) continue
    const workspacePath = path.resolve(workspace.path)
    if (seen.has(pathKey(workspacePath))) continue
    seen.add(pathKey(workspacePath))

    const root = await findProjectRoot(fs, workspacePath)
    const directories = await readDirectoryChain(fs, root, workspacePath)
    projects.push({
      id: String(workspace.id || workspacePath),
      title: String(workspace.title || path.basename(workspacePath) || workspacePath),
      path: workspacePath,
      displayPath: shortPath(workspacePath),
      root,
      rootDisplayPath: shortPath(root),
      directories,
      inventory: await inventory(ctx, workspacePath),
    })
  }

  return {
    dshHome: shortPath(dshHome),
    agentsHome: shortPath(agentsHome),
    candidates: CANDIDATES,
    generatedAt: new Date().toISOString(),
    proceduresEnabled: Boolean(ctx.get('heipmProcedures')),
    questEnabled: questListEnabled(),
    globals,
    projects,
  }
}

/** 子插件「任务清单技能」是否在跑：在跑才下发任务清单入口。 */
function questListEnabled() {
  const flag = globalThis.__heipmQuestList
  if (!flag) return false
  if (typeof flag === 'object') return Number(flag.count || 0) > 0
  return Boolean(flag)
}

async function globalScope(fs, id, label, filePath) {
  const file = await readInstructionFile(fs, filePath, path.basename(filePath), path.basename(filePath))
  return {
    id,
    label,
    path: filePath,
    displayPath: shortPath(filePath),
    files: [file],
  }
}

async function readCandidates(fs, directory, root) {
  const files = []
  for (const name of CANDIDATES) {
    const filePath = path.join(directory, name)
    files.push(await readInstructionFile(
      fs,
      filePath,
      name,
      relativeDisplay(root, filePath),
      PRIMARY_CANDIDATES.includes(name),
    ))
  }
  return files
}

async function readInstructionFile(fs, filePath, name, relativePath, primary = true) {
  const base = {
    name,
    path: filePath,
    relativePath,
    displayPath: shortPath(filePath),
    primary,
    exists: false,
    size: 0,
    version: null,
    content: null,
    tooLarge: false,
    error: null,
  }
  try {
    const target = await fs.resolve(filePath)
    const info = await fs.stat(target)
    if (!info) return base
    if (info.type !== 'file') {
      return { ...base, error: 'Not a regular file' }
    }
    const size = Number(info.size || 0)
    if (size > MAX_FILE_BYTES) {
      return { ...base, exists: true, size, version: String(info.version), tooLarge: true }
    }
    const content = await fs.readText(target)
    return {
      ...base,
      exists: true,
      size,
      version: String(info.version),
      content,
    }
  } catch (error) {
    return { ...base, error: messageOf(error) }
  }
}

async function findProjectRoot(fs, start) {
  let current = path.resolve(start)
  for (let depth = 0; depth < 100; depth += 1) {
    try {
      const marker = await fs.lstat(path.join(current, '.git'))
      if (marker) return current
    } catch {
      // A missing or unreadable marker does not prove this directory is the root.
    }
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return path.resolve(start)
}

function chainDirectories(root, start) {
  const resolvedRoot = path.resolve(root)
  const resolvedStart = path.resolve(start)
  const relative = path.relative(resolvedRoot, resolvedStart)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return [resolvedStart]
  const directories = [resolvedRoot]
  let current = resolvedRoot
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part)
    directories.push(current)
  }
  return directories
}

async function inventory(ctx, projectPath) {
  // Inventory always reads from the workspace directory itself, never a guessed parent.
  const base = path.resolve(projectPath)

  return {
    skills: await listSkillInventory(ctx, base),
    procedures: await listProcedureInventory(ctx, base),
  }
}

async function readDirectoryChain(fs, root, start) {
  const directories = []
  for (const directory of chainDirectories(root, start)) {
    directories.push({
      path: directory,
      relativePath: relativeDisplay(root, directory),
      files: await readCandidates(fs, directory, root),
    })
  }
  return directories
}

function globalTable() {
  const { dshHome, agentsHome } = homes()
  return {
    dsh: { label: 'DSH 全局', filePath: path.join(dshHome, 'AGENTS.md') },
    shared: { label: '共享全局', filePath: path.join(agentsHome, 'AGENTS.md') },
  }
}

function digestOf(parts) {
  const hash = createHash('sha1')
  for (const part of parts) hash.update(String(part) + '\n')
  return hash.digest('hex').slice(0, 16)
}

async function fileToken(fs, filePath) {
  try {
    const info = await fs.stat(await fs.resolve(filePath))
    if (!info) return '-'
    return `${info.type}:${info.size}:${info.version}`
  } catch {
    return '-'
  }
}

/** 任务清单的"版本"就是库的修订号：发一条空写的代价太高，直接读 meta。 */
async function questVersion(ctx, projectPath) {
  try {
    return String(getRevision(questDb(ctx, projectPath)))
  } catch {
    return '-'
  }
}

/** 只重读一个作用域：globalId 读全局 AGENTS.md，projectPath 按 part 只读对应模块。 */
async function refreshScope(ctx, payload = {}) {
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')

  if (payload.globalId) {
    const id = String(payload.globalId)
    const entry = globalTable()[id]
    if (!entry) {
      const error = new Error('Unknown scope')
      error.statusCode = 404
      throw error
    }
    const scope = await globalScope(fs, id, entry.label, entry.filePath)
    return { scopeKind: 'global', id: scope.id, files: scope.files }
  }

  const base = path.resolve(knownProjectPath(ctx, payload.projectPath))
  const part = ['constraints', 'skills', 'procedures'].includes(payload.part) ? payload.part : 'all'
  if (part === 'skills' || part === 'procedures') {
    return {
      scopeKind: 'project',
      projectPath: base,
      inventory: part === 'skills'
        ? { skills: await listSkillInventory(ctx, base) }
        : { procedures: await listProcedureInventory(ctx, base) },
    }
  }

  const root = await findProjectRoot(fs, base)
  const directories = await readDirectoryChain(fs, root, base)
  if (part === 'constraints') return { scopeKind: 'project', projectPath: base, directories }
  return { scopeKind: 'project', projectPath: base, directories, inventory: await inventory(ctx, base) }
}

/** 便宜的变更指纹：只 stat，不读内容，供页面按 3 秒节奏比对。 */
async function stampScope(ctx, payload = {}) {
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')

  const table = globalTable()
  const stamps = {
    globals: digestOf([
      await fileToken(fs, table.dsh.filePath),
      await fileToken(fs, table.shared.filePath),
    ]),
  }
  if (!payload.projectPath) return { stamps }

  const base = path.resolve(knownProjectPath(ctx, payload.projectPath))
  const root = await findProjectRoot(fs, base)

  const constraintParts = []
  for (const directory of chainDirectories(root, base)) {
    for (const name of CANDIDATES) constraintParts.push(`${name}=${await fileToken(fs, path.join(directory, name))}`)
  }
  stamps.constraints = digestOf(constraintParts)

  const skillParts = []
  for (const relative of SKILL_ROOTS) {
    const skillRoot = path.join(base, ...relative.split('/'))
    const entries = await listDirSafe(ctx, skillRoot)
    skillParts.push(`${relative}#${entries ? entries.map(entry => `${entry.name}:${entry.type}`).sort().join(',') : '-'}`)
    if (!entries) continue
    for (const entry of entries) {
      if (entry.type !== 'directory') continue
      skillParts.push(`${entry.name}=${await fileToken(fs, path.join(skillRoot, entry.name, 'SKILL.md'))}`)
    }
  }
  stamps.skills = digestOf(skillParts)

  const procedureParts = []
  for (const relative of [...PROCEDURE_ROOTS, PROCEDURE_DIR]) {
    const procedureRoot = path.join(base, ...relative.split('/'))
    const entries = await listDirSafe(ctx, procedureRoot)
    const markdown = entries ? entries.filter(entry => String(entry.name).endsWith('.md')) : []
    procedureParts.push(`${relative}#${markdown.map(entry => entry.name).sort().join(',')}`)
    for (const entry of markdown) procedureParts.push(`${entry.name}=${await fileToken(fs, path.join(procedureRoot, entry.name))}`)
  }
  stamps.procedures = digestOf(procedureParts)
  stamps.quest = await questVersion(ctx, base)
  return { stamps }
}

async function listDirSafe(ctx, directory) {
  const fs = ctx.get('fs')
  try {
    const target = await fs.resolve(directory)
    const info = await fs.stat(target)
    if (!info || info.type !== 'directory') return null
    const entries = await fs.listDir(target)
    return Array.isArray(entries) ? entries : []
  } catch {
    return null
  }
}

async function listSkillInventory(ctx, projectPath) {
  const fs = ctx.get('fs')
  const found = []
  const seen = new Set()
  for (const relative of SKILL_ROOTS) {
    const root = path.join(projectPath, ...relative.split('/'))
    const entries = await listDirSafe(ctx, root)
    if (!entries) continue
    for (const entry of entries.slice(0, MAX_LISTING_ENTRIES)) {
      const name = String(entry && entry.name ? entry.name : '')
      if (!name) continue
      const isDirectory = entry.type === 'directory'
      const manifestPath = path.join(root, name, 'SKILL.md')
      const manifest = isDirectory ? await readInstructionFile(fs, manifestPath, 'SKILL.md', relativeDisplay(projectPath, manifestPath)) : null
      if (!isDirectory) continue
      const key = pathKey(manifestPath)
      if (seen.has(key)) continue
      seen.add(key)
      found.push({
        id: key,
        name,
        path: manifestPath,
        displayPath: shortPath(manifestPath),
        root: relative,
        exists: Boolean(manifest && manifest.exists),
        description: manifest && manifest.content ? firstFrontMatterDescription(manifest.content) : null,
        size: manifest ? manifest.size : 0,
      })
    }
  }
  found.sort((left, right) => left.name.localeCompare(right.name))
  return { roots: SKILL_ROOTS, items: found }
}

function firstFrontMatterDescription(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(content))
  if (!match) return null
  const line = match[1].split(/\r?\n/).find(entry => /^description\s*:/.test(entry.trim()))
  if (!line) return null
  return line.slice(line.indexOf(':') + 1).trim().replace(/^["']|["']$/g, '') || null
}

function procedureRole(name) {
  const value = String(name || '')
  const meta = PROCEDURE_TEMPLATES.find(entry => {
    const target = entry.dest.slice(entry.dest.lastIndexOf('/') + 1)
    return target.toLowerCase() === value.toLowerCase()
  })
  if (meta) return meta.role
  return value.startsWith('_') ? 'meta' : 'card'
}

async function listProcedureInventory(ctx, projectPath) {
  const fs = ctx.get('fs')
  const found = []
  const seen = new Set()
  const perRoot = new Map()
  for (const relative of [...PROCEDURE_ROOTS, PROCEDURE_DIR]) {
    const root = path.join(projectPath, ...relative.split('/'))
    const entries = await listDirSafe(ctx, root)
    if (!entries) continue
    const names = new Set()
    perRoot.set(relative, names)
    for (const entry of entries.slice(0, MAX_LISTING_ENTRIES)) {
      const name = String(entry && entry.name ? entry.name : '')
      if (!name.endsWith('.md')) continue
      names.add(name.toLowerCase())
      if (seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      const filePath = path.join(root, name)
      const file = await readInstructionFile(fs, filePath, name, relativeDisplay(projectPath, filePath))
      const role = procedureRole(name)
      found.push({
        id: pathKey(filePath),
        name,
        slug: name.replace(/\.md$/, ''),
        role,
        kind: role === 'card' ? 'card' : 'meta',
        path: filePath,
        displayPath: shortPath(filePath),
        root: relative,
        size: file.exists ? file.size : 0,
        exists: file.exists,
        version: file.version,
        content: file.exists && !file.tooLarge ? file.content : null,
        tooLarge: Boolean(file.tooLarge),
        error: file.error,
      })
    }
  }
  found.sort((left, right) => {
    const leftMeta = left.kind === 'meta' ? 0 : 1
    const rightMeta = right.kind === 'meta' ? 0 : 1
    return leftMeta - rightMeta || left.name.localeCompare(right.name)
  })

  const root = path.join(projectPath, ...PROCEDURE_DIR.split('/'))
  const ownNames = perRoot.get(PROCEDURE_DIR) || new Set()
  const templates = []
  for (const meta of PROCEDURE_TEMPLATES) {
    const target = path.join(projectPath, ...meta.dest.split('/'))
    const name = path.basename(target)
    const exists = ownNames.has(name.toLowerCase())
    const builtIn = await readBuiltInFile(meta.name)
    const local = exists
      ? await readInstructionFile(fs, target, name, relativeDisplay(projectPath, target), false)
      : null
    templates.push({
      name,
      role: meta.role,
      label: meta.label,
      path: target,
      displayPath: shortPath(target),
      exists,
      builtIn: builtIn !== null,
      inSync: exists && builtIn !== null && local && !local.tooLarge && typeof local.content === 'string'
        ? normalizeTemplate(local.content) === normalizeTemplate(builtIn)
        : null,
    })
  }

  return {
    roots: PROCEDURE_ROOTS,
    dir: root,
    dirDisplay: shortPath(root),
    items: found,
    templates,
    missing: templates.filter(entry => !entry.exists).map(entry => entry.name),
    legacy: await listLegacyProcedures(ctx, projectPath),
  }
}

function normalizeTemplate(text) {
  return String(text).replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n+$/, '')
}

async function readBuiltInFile(...parts) {
  try {
    return await readFile(path.join(TEMPLATE_DIR, ...parts), 'utf8')
  } catch {
    return null
  }
}

async function buildAllowed(ctx) {
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')
  const { dshHome, agentsHome } = homes()
  const map = new Map()

  const allow = (filePath) => {
    map.set(pathKey(filePath), path.resolve(filePath))
  }

  allow(path.join(dshHome, 'AGENTS.md'))
  allow(path.join(agentsHome, 'AGENTS.md'))

  for (const workspace of registryWorkspaces(ctx)) {
    if (!workspace || typeof workspace.path !== 'string') continue
    const workspacePath = path.resolve(workspace.path)
    const root = await findProjectRoot(fs, workspacePath)
    for (const directory of chainDirectories(root, workspacePath)) {
      for (const name of CANDIDATES) allow(path.join(directory, name))
    }
  }

  return map
}

function writePolicy(ctx, filePath) {
  const service = ctx.get('sandboxPolicy')
  if (service && typeof service.resolve === 'function') {
    try {
      return service.resolve({ mode: 'danger-full-access' })
    } catch {
      // Fall through to the explicit policy below.
    }
  }
  return { mode: 'danger-full-access', workspaceRoot: path.dirname(filePath) }
}

async function remove(ctx, payload) {
  if (typeof payload.path !== 'string' || !payload.path.trim()) {
    const error = new Error('Missing file path')
    error.statusCode = 400
    throw error
  }

  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')
  const allowed = await buildAllowed(ctx)
  const filePath = allowed.get(pathKey(payload.path))
  if (!filePath) {
    const error = new Error('This path is not an editable constraint file')
    error.statusCode = 400
    throw error
  }

  const target = await fs.resolve(filePath)
  const current = await fs.stat(target)
  if (!current) return { path: filePath, deleted: false, absent: true }
  if (current.type !== 'file') {
    const error = new Error('This path is not a regular file')
    error.statusCode = 400
    throw error
  }
  const expected = typeof payload.version === 'string' && payload.version ? payload.version : null
  if (!expected || String(current.version) !== expected) {
    const error = new Error('The file changed on disk since it was loaded')
    error.statusCode = 409
    error.code = 'stale'
    throw error
  }

  const hostPath = typeof fs.processPath === 'function' ? fs.processPath(target) : filePath
  await unlink(hostPath || filePath)
  return { path: filePath, deleted: true }
}

async function scaffold(ctx, payload) {
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')
  const projectPath = knownProjectPath(ctx, payload.projectPath)
  const catalog = scaffoldCatalog()
  const requested = Array.isArray(payload.files) && payload.files.length
    ? payload.files
    : catalog.map(entry => entry.name)

  const created = []
  const skipped = []

  for (const raw of requested) {
    const entry = catalog.find(item => item.name === raw)
    if (!entry) {
      const error = new Error(`Unknown template: ${String(raw)}`)
      error.statusCode = 400
      throw error
    }
    const filePath = path.join(projectPath, ...entry.dest.split('/'))
    await mkdir(path.dirname(filePath), { recursive: true })
    const target = await fs.resolve(filePath)
    const current = await fs.stat(target)
    if (current) {
      skipped.push(entry.name)
      continue
    }
    const content = await readBuiltInFile(...entry.source)
    if (content === null) {
      const error = new Error(`Built-in template is missing: ${entry.name}`)
      error.statusCode = 500
      throw error
    }
    await fs.writeText(target, content, { kind: 'createIfAbsent' }, undefined, writePolicy(ctx, filePath))
    created.push({ name: entry.name, path: filePath })
  }

  return { dir: projectPath, created, skipped }
}

async function syncTemplates(ctx, payload) {
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')
  const projectPath = knownProjectPath(ctx, payload.projectPath)
  const requested = Array.isArray(payload.files) ? payload.files : []
  if (!requested.length) {
    const error = new Error('Missing template names')
    error.statusCode = 400
    throw error
  }
  const catalog = scaffoldCatalog()

  const updated = []
  const skipped = []

  for (const raw of requested) {
    const entry = catalog.find(item => item.name === raw)
    if (!entry) {
      const error = new Error(`Unknown template: ${String(raw)}`)
      error.statusCode = 400
      throw error
    }
    const filePath = path.join(projectPath, ...entry.dest.split('/'))
    const target = await fs.resolve(filePath)
    const current = await fs.stat(target)
    if (!current || current.type !== 'file') {
      skipped.push(entry.name)
      continue
    }
    const content = await readBuiltInFile(...entry.source)
    if (content === null) {
      const error = new Error(`Built-in template is missing: ${entry.name}`)
      error.statusCode = 500
      throw error
    }
    const local = await fs.readText(target)
    if (normalizeTemplate(local) === normalizeTemplate(content)) {
      skipped.push(entry.name)
      continue
    }
    await fs.writeText(target, content, {
      kind: 'replaceIfVersion',
      version: String(current.version),
    }, undefined, writePolicy(ctx, filePath))
    updated.push({ name: entry.name, path: filePath })
  }

  return { dir: projectPath, updated, skipped }
}

function knownProjectPath(ctx, value) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error('Missing project path')
    error.statusCode = 400
    throw error
  }
  const resolved = path.resolve(value)
  const known = registryWorkspaces(ctx).some(workspace =>
    workspace && typeof workspace.path === 'string' && pathKey(workspace.path) === pathKey(resolved))
  if (!known) {
    const error = new Error('This project is not registered in this window')
    error.statusCode = 400
    throw error
  }
  return resolved
}

async function save(ctx, payload) {
  if (typeof payload.path !== 'string' || !payload.path.trim()) {
    const error = new Error('Missing file path')
    error.statusCode = 400
    throw error
  }
  if (typeof payload.content !== 'string') {
    const error = new Error('Missing file content')
    error.statusCode = 400
    throw error
  }
  if (Buffer.byteLength(payload.content, 'utf8') > MAX_FILE_BYTES) {
    const error = new Error('File content is too large')
    error.statusCode = 413
    throw error
  }

  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')
  const allowed = await buildAllowed(ctx)
  const filePath = allowed.get(pathKey(payload.path))
  if (!filePath) {
    const error = new Error('This path is not an editable constraint file')
    error.statusCode = 400
    throw error
  }

  await mkdir(path.dirname(filePath), { recursive: true })
  const target = await fs.resolve(filePath)
  const current = await fs.stat(target)
  const expected = typeof payload.version === 'string' && payload.version ? payload.version : null

  if (current && !expected) {
    const error = new Error('The file already exists and was not loaded from this page')
    error.statusCode = 409
    error.code = 'stale'
    throw error
  }
  if (expected && (!current || String(current.version) !== expected)) {
    const error = new Error('The file changed on disk since it was loaded')
    error.statusCode = 409
    error.code = 'stale'
    throw error
  }

  const policy = writePolicy(ctx, filePath)
  if (current) {
    await fs.writeText(target, payload.content, { kind: 'replaceIfVersion', version: expected }, undefined, policy)
  } else {
    await fs.writeText(target, payload.content, { kind: 'createIfAbsent' }, undefined, policy)
  }

  const next = await fs.stat(target)
  return {
    path: filePath,
    version: next ? String(next.version) : null,
    size: next ? Number(next.size || 0) : Buffer.byteLength(payload.content, 'utf8'),
  }
}

function questListPath(projectPath) {
  return path.join(path.resolve(projectPath), ...QUEST_DB.split('/'))
}

function questLegacyPath(projectPath) {
  return path.join(path.resolve(projectPath), ...QUEST_LEGACY_RELATIVE.split('/'))
}

/** 每个项目的库句柄按路径缓存，避免每次请求重开。 */
const questDbs = new Map()

function questDb(ctx, projectPath) {
  const file = questListPath(projectPath)
  const cached = questDbs.get(file)
  if (cached) {
    try { cached.prepare('SELECT 1').get(); return cached } catch { questDbs.delete(file) }
  }
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')
  const opened = openQuestDb(file)
  questDbs.set(file, opened)
  return opened
}

export function closeQuestDbs() {
  for (const db of questDbs.values()) { try { db.close() } catch {} }
  questDbs.clear()
}

/**
 * 旧 Markdown 不再在运行时解析：迁移交给 scripts/migrate-quest.mjs。
 * 这里只报告"还有旧文件没迁"，让面板能提示用户，而不是静默吞掉。
 */
async function detectLegacyQuest(ctx, projectPath) {
  const fs = ctx.get('fs')
  if (!fs) return null
  try {
    const target = await fs.resolve(questLegacyPath(projectPath))
    const info = await fs.stat(target)
    return info && info.type === 'file' ? questLegacyPath(projectPath) : null
  } catch {
    return null
  }
}

/** 把库里的树摊回面板认识的形状（大块需求 + 子任务，line 用库里的自增序号占位）。 */
function toPanelTree(tree) {
  // line 只是面板的稳定 key，不参与任何写入；用全局计数器保证多层嵌套也唯一。
  let cursor = 0
  const toPanel = node => {
    cursor += 1
    return {
      id: node.id,
      label: node.title,
      title: node.title,
      state: node.state,
      evidence: node.evidence,
      leaves: node.leaves,
      doneLeaves: node.doneLeaves,
      line: cursor,
      children: (node.children || []).map(toPanel),
    }
  }
  const items = tree.requirements.map(req => {
    cursor += 1
    return {
      id: req.id,
      seq: req.seq,
      label: req.title,
      title: req.title,
      state: req.state,
      line: cursor,
      children: req.items.map(toPanel),
    }
  })
  return { items, counts: tree.counts }
}

/**
 * 任务清单读写：只认项目下的 `.dsh/dsh-heipm/任务清单.md`，读取返回解析后的树，写入只改一行状态标记。
 */
async function readQuestList(ctx, payload) {
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')
  const projectPath = knownProjectPath(ctx, payload.projectPath)
  const filePath = questListPath(projectPath)
  const base = {
    projectPath,
    path: filePath,
    displayPath: shortPath(filePath),
    relativePath: QUEST_DB,
    exists: false,
    version: null,
    size: 0,
    error: null,
    items: [],
    counts: { total: 0, done: 0, awaiting: 0, open: 0, running: 0 },
  }
  try {
    const db = questDb(ctx, projectPath)
    let tree = readTree(db)
    // 空库 + 还留着旧 Markdown：提示先跑迁移脚本，不在运行时偷偷解析。
    let legacy = null
    if (!tree.requirements.length) legacy = await detectLegacyQuest(ctx, projectPath)
    let size = 0
    try {
      const target = await fs.resolve(filePath)
      const info = await fs.stat(target)
      if (info && info.type === 'file') size = Number(info.size || 0)
    } catch {}
    const panel = toPanelTree(tree)
    return {
      ...base,
      exists: true,
      size,
      version: String(tree.revision),
      items: panel.items,
      counts: panel.counts,
      legacyPath: legacy,
    }
  } catch (error) {
    return { ...base, error: messageOf(error) }
  }
}

/** 写完读回：让页面立刻拿到新版本号与重算后的状态。 */
/** 面板新增：kind=req 建需求，kind=item 在某需求下建子任务。 */
async function createQuestNode(ctx, payload) {
  const kind = String(payload.kind || '')
  const title = String(payload.title || '').trim()
  if (!title) {
    const error = new Error('Missing title')
    error.statusCode = 400
    throw error
  }
  const projectPath = knownProjectPath(ctx, payload.projectPath)
  const db = questDb(ctx, projectPath)
  try {
    if (kind === 'req') addRequirement(db, title)
    else if (kind === 'item') {
      const parentId = String(payload.parentId || '').trim()
      if (parentId) {
        // 挂在子任务下面：先在库里找出它属于哪个需求。
        const parent = db.prepare('SELECT requirement_id FROM item WHERE id = ?').get(parentId)
        if (!parent) throw new Error('Unknown parent: ' + parentId)
        addItem(db, parent.requirement_id, title, undefined, parentId)
      } else {
        addItem(db, String(payload.requirementId || ''), title)
      }
    }
    else {
      const error = new Error('Unknown node kind')
      error.statusCode = 400
      throw error
    }
  } catch (error) {
    if (!error.statusCode) error.statusCode = 400
    throw error
  }
  return readQuestList(ctx, payload)
}

/** 面板改名：需求与子任务都支持。 */
async function renameQuestNode(ctx, payload) {
  const id = String(payload.id || '').trim()
  const title = String(payload.title || '').trim()
  if (!id || !title) {
    const error = new Error('Missing node id or title')
    error.statusCode = 400
    throw error
  }
  const projectPath = knownProjectPath(ctx, payload.projectPath)
  const db = questDb(ctx, projectPath)
  try {
    renameNode(db, id, title)
  } catch (error) {
    error.statusCode = 400
    throw error
  }
  return readQuestList(ctx, payload)
}

/** 面板删除：需求连同子任务一起删，子任务只删自己。 */
async function removeQuestNode(ctx, payload) {
  const id = String(payload.id || '').trim()
  if (!id) {
    const error = new Error('Missing node id')
    error.statusCode = 400
    throw error
  }
  const projectPath = knownProjectPath(ctx, payload.projectPath)
  const db = questDb(ctx, projectPath)
  try {
    removeNode(db, id)
  } catch (error) {
    error.statusCode = 400
    throw error
  }
  return readQuestList(ctx, payload)
}

async function setQuestState(ctx, payload) {
  const state = String(payload.state || '')
  const itemId = typeof payload.itemId === 'string' ? payload.itemId.trim() : ''
  const stateList = ['open', 'running', 'awaiting', 'done']
  if (!stateList.includes(state)) {
    const error = new Error('Unknown task state')
    error.statusCode = 400
    throw error
  }
  if (!itemId) {
    const error = new Error('Missing task id')
    error.statusCode = 400
    throw error
  }
  const projectPath = knownProjectPath(ctx, payload.projectPath)
  const db = questDb(ctx, projectPath)
  const expected = typeof payload.version === 'string' && payload.version !== '' ? Number(payload.version) : NaN
  if (Number.isFinite(expected) && getRevision(db) !== expected) {
    const error = new Error('The task list changed since it was loaded')
    error.statusCode = 409
    error.code = 'stale'
    throw error
  }
  try {
    setItemState(db, itemId, state)
  } catch (error) {
    error.statusCode = 400
    throw error
  }
  return readQuestList(ctx, payload)
}


function legacyRoot(projectPath, relative) {
  return path.join(projectPath, ...String(relative).split('/'))
}

async function listLegacyProcedures(ctx, projectPath) {
  const entries = []
  for (const relative of PROCEDURE_ROOTS) {
    const root = legacyRoot(projectPath, relative)
    const files = await listDirSafe(ctx, root)
    if (!files) continue
    for (const entry of files.slice(0, MAX_LISTING_ENTRIES)) {
      const name = String(entry && entry.name ? entry.name : '')
      if (!name.endsWith('.md')) continue
      entries.push({ name, root: relative, path: path.join(root, name), displayPath: shortPath(path.join(root, name)) })
    }
  }
  return entries
}

async function migrateProcedures(ctx, payload) {
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')
  const projectPath = knownProjectPath(ctx, payload.projectPath)
  const targetDir = path.join(projectPath, ...PROCEDURE_DIR.split('/'))
  const legacy = await listLegacyProcedures(ctx, projectPath)
  if (!legacy.length) return { dir: targetDir, moved: [], skipped: [], conflicts: [] }

  const policy = writePolicy(ctx, path.join(targetDir, 'placeholder.md'))
  const moved = []
  const skipped = []
  const conflicts = []
  for (const entry of legacy) {
    const destination = path.join(targetDir, entry.name)
    const sourceTarget = await fs.resolve(entry.path)
    const sourceInfo = await fs.stat(sourceTarget)
    if (!sourceInfo || sourceInfo.type !== 'file') {
      skipped.push({ name: entry.name, reason: 'not-a-file' })
      continue
    }
    const existing = await fs.stat(await fs.resolve(destination))
    if (existing) {
      conflicts.push({ name: entry.name, from: entry.displayPath, to: shortPath(destination) })
      continue
    }
    let content
    try {
      content = await fs.readText(sourceTarget)
    } catch (error) {
      skipped.push({ name: entry.name, reason: messageOf(error) })
      continue
    }
    await mkdir(path.dirname(destination), { recursive: true })
    await fs.writeText(await fs.resolve(destination), content, { kind: 'createIfAbsent' }, undefined, policy)
    const hostPath = typeof fs.processPath === 'function' ? fs.processPath(sourceTarget) : entry.path
    try {
      await unlink(hostPath || entry.path)
    } catch (error) {
      skipped.push({ name: entry.name, reason: messageOf(error) })
      continue
    }
    moved.push({ name: entry.name, from: entry.displayPath, to: shortPath(destination) })
  }

  return { dir: targetDir, dirDisplay: shortPath(targetDir), moved, skipped, conflicts }
}
