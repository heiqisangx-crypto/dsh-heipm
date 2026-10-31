// Route-level check: the workspace route dispatches "open-folder" and refuses
// an unknown workspace with 404 instead of launching anything.
const { __test } = await import('../index.js')
const { handle } = __test

let failed = 0
function equal(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) console.log('ok  ', name)
  else {
    failed += 1
    console.error('FAIL ' + name + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual))
  }
}

function request(payload, headers = { host: '127.0.0.1:6363' }) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  return {
    method: 'POST',
    headers,
    async *[Symbol.asyncIterator]() {
      yield body
    },
  }
}

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value
    },
    end(chunk) {
      this.body = String(chunk)
    },
  }
}

const ctx = {
  get: name => (name === 'workspaceRegistry' ? { list: () => [] } : null),
}

const res = response()
await handle(ctx, request({ action: 'open-folder', workspaceId: 'missing' }), res)

equal('an unknown workspace answers 404', res.statusCode, 404)
equal('the refusal is JSON', JSON.parse(res.body), { ok: false, error: 'Unknown workspace' })

const blank = response()
await handle(ctx, request({ action: 'open-folder' }), blank)
equal('a blank workspace id answers 404', blank.statusCode, 404)

const crossSite = response()
await handle(ctx, request({ action: 'open-folder', workspaceId: 'x' }, { host: '127.0.0.1:6363', 'sec-fetch-site': 'cross-site' }), crossSite)
equal('a cross-site call is refused before routing', crossSite.statusCode, 403)

if (failed) {
  console.error(failed + ' check(s) failed')
  process.exit(1)
}
console.log('open-folder-route: all checks passed')