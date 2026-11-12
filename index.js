import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'

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
const QUEST_RELATIVE = '.dsh/dsh-heipm/任务清单.md'
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
  collectQuestItems,
  applyQuestState,
  parseQuestMarkdown,
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

async function questVersion(fs, filePath) {
  try {
    const info = await fs.stat(await fs.resolve(filePath))
    return info && info.type === 'file' ? String(info.version) : '-'
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
  stamps.quest = await questVersion(fs, questListPath(base))
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
  return path.join(path.resolve(projectPath), ...QUEST_RELATIVE.split('/'))
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
    relativePath: QUEST_RELATIVE,
    exists: false,
    tooLarge: false,
    version: null,
    size: 0,
    error: null,
    items: [],
    counts: { total: 0, done: 0, awaiting: 0, open: 0 },
  }
  try {
    const target = await fs.resolve(filePath)
    const info = await fs.stat(target)
    if (!info) return base
    if (info.type !== 'file') return { ...base, error: 'Not a regular file' }
    const size = Number(info.size || 0)
    if (size > MAX_FILE_BYTES) return { ...base, exists: true, size, version: String(info.version), tooLarge: true }
    let content = await fs.readText(target)
    let version = String(info.version)
    let finalSize = size
    // 子任务全完成但大块需求没勾时，读一次就顺手补齐，保证文件与面板一致。
    const repaired = syncRequirementStates(content)
    if (repaired !== content) {
      try {
        await fs.writeText(target, repaired, { kind: 'replaceIfVersion', version }, undefined, writePolicy(ctx, filePath))
        const after = await fs.stat(target)
        if (after) {
          version = String(after.version)
          finalSize = Number(after.size || 0)
        }
        content = repaired
      } catch {
        // 只读或并发改动时保持原样，下次读取再补。
      }
    }
    const parsed = parseQuestMarkdown(content)
    return {
      ...base,
      exists: true,
      size: finalSize,
      version,
      items: parsed.items,
      counts: parsed.counts,
    }
  } catch (error) {
    const missing = /ENOENT|NOT_FOUND|no such file/i.test(messageOf(error))
    return missing ? base : { ...base, error: messageOf(error) }
  }
}

/** 写完读回：让页面立刻拿到新版本号与重算后的状态。 */
async function setQuestState(ctx, payload) {
  const fs = ctx.get('fs')
  if (!fs) throw new Error('Filesystem service is unavailable')
  const line = Number(payload.line)
  const state = String(payload.state || '')
  if (!Number.isInteger(line) || line < 1) {
    const error = new Error('Missing task line')
    error.statusCode = 400
    throw error
  }
  if (!['open', 'awaiting', 'done'].includes(state)) {
    const error = new Error('Unknown task state')
    error.statusCode = 400
    throw error
  }
  const projectPath = knownProjectPath(ctx, payload.projectPath)
  const filePath = questListPath(projectPath)
  const target = await fs.resolve(filePath)
  const info = await fs.stat(target)
  if (!info || info.type !== 'file') {
    const error = new Error('任务清单.md does not exist in this project')
    error.statusCode = 400
    throw error
  }
  const expected = typeof payload.version === 'string' && payload.version ? payload.version : null
  if (!expected || String(info.version) !== expected) {
    const error = new Error('The task list changed on disk since it was loaded')
    error.statusCode = 409
    error.code = 'stale'
    throw error
  }
  const content = await fs.readText(target)
  const currentLine = content.split(/\r?\n/)[line - 1] || ''
  const marker = readMarker(currentLine)
  if (!marker) {
    const error = new Error('That line is not a task item')
    error.statusCode = 400
    throw error
  }
  if (isParentItem(parseQuestMarkdown(content).items, line)) {
    const error = new Error('A task with subtasks cannot be toggled here')
    error.statusCode = 400
    throw error
  }
  const next = syncRequirementStates(applyQuestState(content, line, state))
  if (next !== content) {
    await fs.writeText(target, next, { kind: 'replaceIfVersion', version: expected }, undefined, writePolicy(ctx, filePath))
  }
  return readQuestList(ctx, payload)
}

const TASK_HEAD = /^([^\S\r\n]*)(?:[-*+]|\d+[.)])[ \t]+/
const MARKED = /^\[(?: |x|X|o|O|\u221a)\]\s*(.*)$/

function readMarker(line) {
  const lead = (/^[^\S\r\n]*/.exec(line) || [''])[0]
  const rest = line.slice(lead.length)
  const bulleted = TASK_HEAD.test(rest) ? rest.slice(TASK_HEAD.exec(rest)[0].length) : rest
  const marker = MARKED.exec(bulleted)
  if (!marker) return null
  return { label: marker[1], symbol: bulleted.charAt(1) }
}

/** 任务清单是 tab 缩进的裸列表（`[ ] 标题`），兼容带 `- `/`1. ` 前缀的写法。 */
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
  if (symbol === '√') return 'done'
  if (symbol === 'x' || symbol === 'X') return 'open'
  if (symbol === 'o' || symbol === 'O') return 'awaiting'
  return 'open'
}

function symbolOfState(state) {
  if (state === 'done') return '√'
  if (state === 'awaiting') return 'O'
  return ' '
}

function sanitizeLabel(value) {
  return String(value || '')
    .replace(/[\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function countTaskListItems(items) {
  const counts = { total: 0, done: 0, awaiting: 0, open: 0 }
  for (const item of items) counts[item.state] += 1
  counts.total = items.length
  return counts
}

function isParentItem(items, line) {
  const target = items.find(entry => entry.line === line)
  return Boolean(target && target.children && target.children.length)
}

function collectQuestItems(nodes, out = []) {
  for (const node of nodes) {
    out.push(node)
    if (node.children && node.children.length) collectQuestItems(node.children, out)
  }
  return out
}

const HEADING_MD = /^\s*(#{1,6})\s+(\S.*)$/
const HEADING_CN = /^\s*([一二三四五六七八九十百]+)、\s*(\S.*)$/
const NUMBERED = /^[一二三四五六七八九十百]+、/

/** 标题行本身就是大块需求，带 marker 的那些行才是挂在它下面的子任务。 */
function readHeading(line) {
  const md = HEADING_MD.exec(line)
  if (md) return { level: md[1].length, label: sanitizeLabel(md[2]) }
  const cn = HEADING_CN.exec(line)
  if (cn) return { level: 1, label: sanitizeLabel(line.trim()) }
  return null
}

/**
 * 解析任务清单：标题行（# 或 一、）建一个大块需求节点，
 * 其下带 [ ] / [O] / [√] 的行按缩进挂成子任务；带标记的顶层行自己就是一个大块需求。
 */
function parseQuestMarkdown(content) {
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

/** 没有子条目的标题只是章节名，不该占一个大块需求。 */
function dropEmptyHeadings(nodes) {
  return nodes
    .map(node => (node.kind === 'heading' ? { ...node, children: dropEmptyHeadings(node.children) } : node))
    .filter(node => node.kind !== 'heading' || node.children.length > 0)
}

function applyQuestState(content, line, state) {
  const lines = String(content || '').split(/\r?\n/)
  const index = line - 1
  if (index < 0 || index >= lines.length) return content
  const marker = readMarker(lines[index])
  if (!marker) return content
  const symbol = symbolOfState(state)
  lines[index] = lines[index].replace(/\[[ xXoO√]\]/, `[${symbol}]`)
  return lines.join('\n')
}

/** 子任务全完成 = 大块需求完成；只看叶子，避免中间节点状态绕进来。 */
function allLeavesDone(node) {
  const children = node.children || []
  if (!children.length) return node.state === 'done'
  return children.every(child => allLeavesDone(child))
}

function anyLeafDone(node) {
  const children = node.children || []
  if (!children.length) return node.state === 'done'
  return children.some(child => anyLeafDone(child))
}

/**
 * 让大块需求标记跟子任务保持一致：子任务全完成补 [√]，子任务被重新打开则撤销 [√]。
 * 标题行（# / 一、）没有标记，原样跳过。
 */
function syncRequirementStates(content) {
  const lines = String(content || '').split(/\r?\n/)
  const requirements = collectQuestItems(parseQuestMarkdown(content).items)
    .filter(node => node.kind !== 'heading' && node.children.length)
  let changed = false
  for (const node of requirements) {
    const index = node.line - 1
    const marker = readMarker(lines[index])
    if (!marker) continue
    const done = allLeavesDone(node)
    let desired
    if (done) desired = '√'
    else if (marker.symbol === '√') desired = anyLeafDone(node) ? 'O' : ' '
    else continue
    if (marker.symbol === desired) continue
    lines[index] = lines[index].replace(/\[[ xXoO√]\]/, `[${desired}]`)
    changed = true
  }
  return changed ? lines.join('\n') : content
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
