// Host checks for the workspace context menu's "open folder" action: the
// workspace lookup, the per-platform launcher, and the refusal paths.
import { EventEmitter } from 'node:events'
import path from 'node:path'

const { __test } = await import('../index.js')
const { openWorkspaceFolder, folderCommand, workspaceEntry } = __test

let failed = 0
function equal(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) console.log('ok  ', name)
  else {
    failed += 1
    console.error(`FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

const folder = path.resolve('D:/dsh-Workspace/dsh-ai-creator')
const ctx = {
  get: name => (name === 'workspaceRegistry'
    ? { list: () => [{ workspaceId: 'p1', title: 'dsh-ai-creator', path: folder }] }
    : null),
}

equal('win32 opens the folder with Explorer', folderCommand('win32', 'C:\\a'), { command: 'explorer.exe', args: ['C:\\a'] })
equal('darwin opens the folder with open', folderCommand('darwin', '/a'), { command: 'open', args: ['/a'] })
equal('linux opens the folder with xdg-open', folderCommand('linux', '/a'), { command: 'xdg-open', args: ['/a'] })
equal('workspace lookup resolves by id', workspaceEntry(ctx, 'p1').path, folder)
equal('workspace lookup ignores unknown ids', workspaceEntry(ctx, 'nope'), null)

const calls = []
const fakeSpawn = (command, args) => {
  calls.push({ command, args })
  const child = new EventEmitter()
  child.unref = () => {}
  queueMicrotask(() => child.emit('spawn'))
  return child
}
const statDirectory = async () => ({ isDirectory: () => true })
const statMissing = async () => { throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' }) }

const opened = await openWorkspaceFolder(ctx, 'p1', { spawn: fakeSpawn, stat: statDirectory })
equal('open resolves the workspace root', opened, { path: folder })
equal('open launches one detached process', calls.length, 1)
equal('open targets the workspace root', calls[0].args, [folder])

let missing = null
try {
  await openWorkspaceFolder(ctx, 'p1', { spawn: fakeSpawn, stat: statMissing })
} catch (error) {
  missing = error
}
equal('a deleted folder is refused with 404', missing && missing.statusCode, 404)
equal('a deleted folder never launches a process', calls.length, 1)

let unknown = null
try {
  await openWorkspaceFolder(ctx, 'nope', { spawn: fakeSpawn, stat: statDirectory })
} catch (error) {
  unknown = error
}
equal('an unknown workspace is refused with 404', unknown && unknown.statusCode, 404)

let launcherFailed = null
try {
  await openWorkspaceFolder(ctx, 'p1', {
    stat: statDirectory,
    spawn: () => {
      const child = new EventEmitter()
      child.unref = () => {}
      queueMicrotask(() => child.emit('error', new Error('ENOENT')))
      return child
    },
  })
} catch (error) {
  launcherFailed = error
}
equal('a missing launcher surfaces a 500', launcherFailed && launcherFailed.statusCode, 500)

if (failed) {
  console.error(`${failed} check(s) failed`)
  process.exit(1)
}
console.log('open-folder: all checks passed')
