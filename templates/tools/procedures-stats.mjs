#!/usr/bin/env node
// procedures-stats.mjs —— 卡库使用指标：新鲜度 / 检索命中率 / 打开率 / 成功率 / 效率。
//
// 默认只读：不改卡、不删卡。只有 --record 会往 _stats/events.jsonl 追加一行结果。
//
// 用法：
//   node procedures-stats.mjs
//   node procedures-stats.mjs --procedures <目录>
//   node procedures-stats.mjs --sessions <会话根> --workspace all
//   node procedures-stats.mjs --days 60 --min-steps 3 --penalty 5
//   node procedures-stats.mjs --record --card <卡名> --result success|fail|worse --steps 7 [--perfect] [--reason ...]
//   node procedures-stats.mjs --md
//   node procedures-stats.mjs --json
//
// 口径：
//   可命中回合 = 用户发言里出现该卡「锚点」里的一个辨识词（跨卡高频词自动忽略）
//   检索命中   = 该回合的工具结果里出现卡文件名（grep 列到也算，证明被搜到）
//   打开       = 工具结果里出现卡的 H1 标题（整篇被读进上下文）
//   成功       = 打开后到回合结束没有再出现失败标记，且回合以 completed 结束
//   积分       = 成功 +2、比基线步数少 +1、perfect +1、失败 -1、变差 -2（来自 _stats/events.jsonl）
//   效率       = 旧口径：该回合的总工具调用数；<= min-steps 记 100，每多一步扣 penalty
//   新鲜度     = 今天距「文件修改时间 / 卡内最晚日期」中较晚者
//   基线       = 首次写入该卡那个回合的工具调用数（找不到则 unknown）
import { zstdDecompressSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, basename, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
if (has('--help') || has('-h')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('import ')[0].trim());
  process.exit(0);
}

const JSON_OUT = has('--json');
const MD_OUT = has('--md');
const STALE_DAYS = Number(arg('--days', 60));
const MIN_STEPS = Number(arg('--min-steps', 3));
const PENALTY = Number(arg('--penalty', 5));
const LIMIT = Number(arg('--limit', 0));
const WORKSPACE = arg('--workspace', 'all');
const ANCHORS_ONLY = has('--anchors-only');
const RECORD = has('--record');
const BASELINE = has('--baseline');
const PROC_CANDIDATES = [resolve('.dsh/dsh-heipm/procedures'), resolve('procedures')];
const hasCards = (dir) => {
  try {
    return existsSync(dir) && readdirSync(dir).filter(name => name.endsWith('.md'))
      .some(name => readFileSync(join(dir, name), 'utf8').includes('**锚点**'));
  } catch { return false; }
};
const DEFAULT_PROC = PROC_CANDIDATES.find(hasCards) || PROC_CANDIDATES[0];
const PROC = resolve(arg('--procedures', DEFAULT_PROC));
const CREDIT = { success: 2, faster: 1, perfect: 1, fail: -1, worse: -2 };
const EVENTS_FILE = resolve(arg('--events', join(PROC, '_stats', 'events.jsonl')));
const META = new Set(['README.md', 'INDEX.md', 'INDEX.template.md', 'card-template.md', 'CLASSIFY.md', '_inbox.md', '_layers.md']);

const HARD_FAIL_RE = /(?:ENOENT|EACCES|EPERM|ERR_[A-Z_]+|Permission denied|exit code: [1-9]|command not found|Cannot find module|is not a function|AssertionError|Traceback)/;
const COMPLETE_RE = /(?:完成|搞定|已修复|修复完成|通过|全绿|EXIT=0|all checks passed|都已就绪)/i;
const GIVE_UP_RE = /(?:未解决|没有解决|无法解决|仍未解决|放弃这个方案|还是不行)/;
const NEXT_NEGATIVE_RE = /(?:还是不行|还是报错|又报错|又不行|没解决|未解决|不对|不行|没生效|没反应|仍然|又有问题|失败了|白做了)/;
const NEXT_POSITIVE_RE = /(?:可以了|好的|没问题|成功了|搞定|谢谢|继续)/;

if (!existsSync(PROC)) {
  console.error('找不到卡库目录：' + PROC);
  console.error('用 --procedures <目录> 指定，或先 cd 到含 .dsh/dsh-heipm/procedures 的工作区。');
  process.exit(2);
}
for (const [name, value, min] of [['--days', STALE_DAYS, 1], ['--min-steps', MIN_STEPS, 0], ['--penalty', PENALTY, 0]]) {
  if (!Number.isFinite(value) || value < min) { console.error('参数 ' + name + ' 需要 >= ' + min + ' 的数字'); process.exit(2); }
}

// 卡：标题、锚点、日期、体积
function loadCards(dir) {
  const names = readdirSync(dir).filter(f => f.endsWith('.md') && !META.has(f)).sort();
  return names.map(name => {
    const full = join(dir, name);
    const stat = statSync(full);
    const text = readFileSync(full, 'utf8');
    const title = (text.match(/^#\s+(.+)$/m) || [])[1]?.trim() || basename(name, '.md');
    const anchorLine = (text.match(/^>\s*\*\*锚点\*\*[:：]\s*(.+)$/m) || [])[1] || '';
    const baselineLine = (text.match(/^>\s*\*\*(?:首发|基线)步数\*\*[:：]\s*(\d+)/m) || [])[1];
    const dates = [...text.matchAll(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/g)]
      .map(m => Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return {
      name,
      stem: basename(name, '.md'),
      title,
      anchors: splitTokens(anchorLine),
      headerBaseline: baselineLine === undefined ? null : Number(baselineLine),
      titleTokens: splitTokens(title.replace(/^[^-－]+[-－]/, '')),
      bytes: stat.size,
      mtime: stat.mtimeMs,
      latest: Math.max(stat.mtimeMs, ...dates, 0),
    };
  });
}

function splitTokens(text) {
  return [...new Set(String(text)
    .replace(/[\u0060*]/g, ' ')
    .split(/\s+\/\s+|\s*[、，;；]\s*/)
    .map(s => s.trim().replace(/[。.]$/, ''))
    .filter(s => s.length >= 2)
    .filter(s => !/^[0-9.]+$/.test(s))
    .map(s => s.toLowerCase()))];
}

const GENERIC = new Set(['read', 'write', 'edit', 'files', 'file', 'exports', 'disabled', 'restart', 'logs', 'theme', 'token', 'width', 'height', 'loading', 'index', 'error', 'failed', 'test', 'api', 'app', '只读']);
const REGEX_ESCAPE = /[.*+?^${}()|[\]\\]/g;
function matchToken(text, token) {
  if (!token) return false;
  if (/^[\x20-\x7e]+$/.test(token)) {
    try {
      const pattern = new RegExp('(^|[^a-z0-9])' + token.replace(REGEX_ESCAPE, m => '\\' + m) + '([^a-z0-9]|$)', 'i');
      return pattern.test(text);
    } catch { return text.toLowerCase().includes(token); }
  }
  return text.includes(token);
}

function usableToken(token) {
  if (GENERIC.has(token)) return false;
  if (/^[\x20-\x7e]+$/.test(token) && token.length < 4 && !/[0-9]/.test(token)) return false;
  return true;
}

// 跨卡高频词没有辨识度（比如 files / disabled），按卡库内出现比例剔除。
function discriminative(cards, maxShare = 0.2) {
  const df = new Map();
  for (const card of cards) for (const token of new Set(card.anchors)) if (usableToken(token)) df.set(token, (df.get(token) || 0) + 1);
  const limit = Math.max(1, Math.ceil(cards.length * maxShare));
  return new Map([...df].map(([token, n]) => [token, n <= limit]));
}

function findSessionsRoot() {
  const candidates = [];
  if (arg('--sessions')) {
    const given = resolve(arg('--sessions'));
    candidates.push(existsSync(join(given, 'sessions')) ? join(given, 'sessions') : given);
  }
  if (process.env.DSH_HOME) candidates.push(join(process.env.DSH_HOME, 'sessions'));
  if (process.env.DSH_SESSIONS) candidates.push(process.env.DSH_SESSIONS);
  let dir = resolve('.');
  for (let i = 0; i < 6; i++) { candidates.push(join(dir, '.dsh', 'sessions')); dir = dirname(dir); }
  candidates.push(join(homedir(), '.dsh', 'sessions'));
  for (const candidate of candidates) {
    if (!candidate || !existsSync(candidate)) continue;
    try { if (statSync(candidate).isDirectory()) return candidate; } catch { /* ignore */ }
  }
  return null;
}

function listSessionFiles(root) {
  const files = [];
  let workspaces = [];
  try { workspaces = readdirSync(root); } catch { return files; }
  for (const ws of workspaces) {
    if (WORKSPACE !== 'all' && ws !== WORKSPACE) continue;
    const wsDir = join(root, ws);
    try { if (!statSync(wsDir).isDirectory()) continue; } catch { continue; }
    for (const sid of readdirSync(wsDir)) {
      const dir = join(wsDir, sid);
      try { if (!statSync(dir).isDirectory()) continue; } catch { continue; }
      for (const name of readdirSync(dir)) {
        if (!name.startsWith('session') || !name.includes('.jsonl')) continue;
        const file = join(dir, name);
        try { files.push({ file, size: statSync(file).size, workspace: ws, session: sid }); } catch { /* ignore */ }
      }
    }
  }
  return files.sort((a, b) => a.size - b.size);
}

// 多帧 zstd：一个文件里多个 frame 串联，按 magic 切开逐段解压。
function decode(file) {
  const buf = readFileSync(file);
  const pos = [];
  for (let i = 0; i + 4 <= buf.length; i++) {
    if (buf[i] === 0x28 && buf[i + 1] === 0xb5 && buf[i + 2] === 0x2f && buf[i + 3] === 0xfd) pos.push(i);
  }
  if (!pos.length) return buf.toString('utf8');
  pos.push(buf.length);
  let text = '';
  for (let i = 0; i < pos.length - 1; i++) {
    try { text += zstdDecompressSync(buf.subarray(pos[i], pos[i + 1])).toString('utf8'); } catch { /* skip broken frame */ }
  }
  return text;
}

function parseEvents(text) {
  const events = [];
  for (const line of text.split('\n')) {
    if (!line || line[0] !== '{') continue;
    try { events.push(JSON.parse(line)); } catch { /* skip */ }
  }
  return events;
}

function textOf(message) {
  if (!message) return '';
  if (typeof message === 'string') return message;
  const parts = [];
  const walk = (value) => {
    if (!value) return;
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (typeof value === 'string') { parts.push(value); return; }
    if (typeof value !== 'object') return;
    if (typeof value.text === 'string') parts.push(value.text);
    if (value.content) walk(value.content);
    if (value.message) walk(value.message);
  };
  walk(message.content || message);
  return parts.join('\n');
}

function isInjected(text) {
  return /^<system-reminder>/.test(text) || /^Current runtime context\./.test(text) || /^Time sampled while preparing/.test(text);
}

// 事件 → 回合（一次遍历，事件本来就按时间排好）
function buildTurns(events) {
  const turns = [];
  let current = null;
  for (const event of events) {
    const type = event.type;
    if (type === 'turn/start') {
      current = { turn: event.data?.turn ?? turns.length + 1, start: event.time || 0, end: null, endReason: null, calls: [], results: [], userTexts: [], assistantTexts: [] };
      turns.push(current);
    } else if (!current) {
      continue;
    } else if (type === 'turn/end') {
      current.end = event.time || 0;
      current.endReason = event.data?.reason?.kind || null;
      current = null;
    } else if (type === 'tool/call') {
      const name = event.data?.name || event.name || '';
      let args = event.data?.arguments ?? event.arguments ?? '';
      if (typeof args !== 'string') { try { args = JSON.stringify(args); } catch { args = ''; } }
      current.calls.push({ name, args, time: event.time || 0, callId: event.data?.callId || '' });
    } else if (type === 'tool/result') {
      current.results.push({ text: textOf(event.data?.message), time: event.time || 0, callId: event.data?.message?.toolCallId || event.data?.callId || '' });
    } else if (type === 'user/message') {
      if (event.data?.source?.kind !== 'user') continue;
      const text = textOf(event.data);
      if (isInjected(text)) continue;
      current.userTexts.push(text);
    } else if (type === 'assistant/message') {
      current.assistantTexts.push(textOf(event.data?.message || event.data));
    }
  }
  for (const turn of turns) if (turn.end === null) turn.end = turn.calls.at(-1)?.time || turn.start;
  return turns;
}

function freshDays(ms, now) {
  return Math.max(0, Math.floor((now - ms) / 86400000));
}

function loadEvents(file) {
  const events = [];
  if (!existsSync(file)) return events;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const text = line.trim();
    if (!text) continue;
    try {
      const event = JSON.parse(text);
      if (!event || typeof event.card !== 'string') continue;
      if (event.kind === 'baseline' || ['success', 'fail', 'worse'].includes(event.result)) events.push(event);
    } catch { /* 坏行直接跳过，不影响其余记录 */ }
  }
  return events;
}

function creditOf(events, baselineSteps) {
  let total = 0;
  for (const event of events) {
    if (event.result === 'success') {
      total += CREDIT.success;
      if (Number.isFinite(event.steps) && Number.isFinite(baselineSteps) && event.steps < baselineSteps) total += CREDIT.faster;
      if (event.perfect === true) total += CREDIT.perfect;
    } else if (event.result === 'fail') total += CREDIT.fail;
    else if (event.result === 'worse') total += CREDIT.worse;
  }
  return total;
}

const now = Date.now();
const cards = loadCards(PROC);
if (!cards.some(card => card.anchors.length)) {
  console.error('卡库里没有带「锚点」的卡：' + PROC);
  console.error('用 --procedures <目录> 指向真正的卡库（通常是 <项目>/.dsh/dsh-heipm/procedures）。');
  process.exit(2);
}
if (BASELINE) {
  const stem = String(arg('--card', '')).replace(/\.md$/, '').trim();
  const stepsRaw = arg('--steps', '');
  const steps = stepsRaw === '' || stepsRaw === undefined ? NaN : Number(stepsRaw);
  if (!stem || !cards.some(card => card.stem === stem)) {
    console.error('找不到这张卡：' + (stem || '(空)') + '\n用 --card <卡名> 指定卡库里已有的卡。');
    process.exit(2);
  }
  if (!Number.isFinite(steps) || steps < 0) {
    console.error('--baseline 需要 --steps <非负数字>（从开工到解决的工具调用数）。');
    process.exit(2);
  }
  const baselineEvent = {
    kind: 'baseline',
    date: new Date().toISOString().slice(0, 10),
    card: stem,
    project: String(arg('--project', basename(resolve('.')))),
    session: String(arg('--session', '')),
    steps: Number(steps),
    note: String(arg('--note', '')),
  };
  mkdirSync(dirname(EVENTS_FILE), { recursive: true });
  appendFileSync(EVENTS_FILE, JSON.stringify(baselineEvent) + '\n');
  console.log('已记录基线 ' + stem + ' → ' + steps + ' 步 → ' + EVENTS_FILE);
  process.exit(0);
}

if (RECORD) {
  const stem = String(arg('--card', '')).replace(/\.md$/, '').trim();
  const result = String(arg('--result', '')).trim();
  const reason = String(arg('--reason', '')).trim();
  const stepsRaw = arg('--steps', '');
  const steps = stepsRaw === '' || stepsRaw === undefined ? null : Number(stepsRaw);
  if (!stem || !cards.some(card => card.stem === stem)) {
    console.error('找不到这张卡：' + (stem || '(空)') + '\n用 --card <卡名> 指定卡库里已有的卡。');
    process.exit(2);
  }
  if (!['success', 'fail', 'worse'].includes(result)) {
    console.error('--result 只能是 success / fail / worse。');
    process.exit(2);
  }
  if (result !== 'success' && !reason) {
    console.error('失败或被搞大时必须写 --reason（缺什么 / 为什么没成）。');
    process.exit(2);
  }
  if (steps !== null && (!Number.isFinite(steps) || steps < 0)) {
    console.error('--steps 需要是非负数字。');
    process.exit(2);
  }
  const event = {
    date: new Date().toISOString().slice(0, 10),
    card: stem,
    project: String(arg('--project', basename(resolve('.')))),
    session: String(arg('--session', '')),
    result,
    steps,
    perfect: has('--perfect'),
    reason,
    note: String(arg('--note', '')),
  };
  mkdirSync(dirname(EVENTS_FILE), { recursive: true });
  appendFileSync(EVENTS_FILE, JSON.stringify(event) + '\n');
  console.log('已记录 ' + stem + ' → ' + result + (steps === null ? '' : ' / ' + steps + ' 步') + ' → ' + EVENTS_FILE);
  process.exit(0);
}

const usable = discriminative(cards);
const sessionsRoot = findSessionsRoot();
if (!sessionsRoot) console.error('找不到会话根：用 --sessions <路径> 或设置 DSH_HOME；新鲜度仍可单独算。');

for (const card of cards) {
  Object.assign(card, {
    eligible: 0, matched: 0, opened: 0, success: 0, fail: 0, unknown: 0,
    stepsAfter: [], scores: [], projects: new Set(), lastUsed: 0,
    baseline: null, misses: [], failures: [],
  });
}

let scanned = 0, turnsSeen = 0, callsSeen = 0, failedFiles = 0;
const creation = new Map();

if (sessionsRoot) {
  const files = listSessionFiles(sessionsRoot).slice(0, LIMIT || undefined);
  for (const entry of files) {
    let events;
    try { events = parseEvents(decode(entry.file)); } catch { failedFiles++; continue; }
    scanned++;
    const meta = events.find(e => e.type === 'session');
    const project = meta?.cwd || entry.workspace;
    const turns = buildTurns(events);

    for (let turnIndex = 0; turnIndex < turns.length; turnIndex++) {
      const turn = turns[turnIndex];
      turnsSeen++;
      callsSeen += turn.calls.length;

      for (const call of turn.calls) {
        if (!call.args.includes('.md')) continue;
        for (const card of cards) {
          if (!call.args.includes(card.stem + '.md')) continue;
          if (!/(tools\.(write|edit)|writeFile)/.test(call.args)) continue;
          const known = creation.get(card.stem);
          if (!known || (turn.start || Infinity) < known.time) creation.set(card.stem, { steps: turn.calls.length, time: turn.start, project });
        }
      }

      const userText = turn.userTexts.join('\n');
      if (!userText) continue;

      const nextText = turns[turnIndex + 1]?.userTexts[0] || '';
      const lastText = turn.assistantTexts.at(-1) || '';
      const gaveUp = GIVE_UP_RE.test(lastText);
      const verdict = NEXT_NEGATIVE_RE.test(nextText) ? 'fail'
        : NEXT_POSITIVE_RE.test(nextText) ? 'success'
        : gaveUp ? 'fail'
        : COMPLETE_RE.test(lastText) ? 'success'
        : 'unknown';

      const seen = new Set();
      for (const card of cards) {
        if (seen.has(card.stem)) continue;
        const anchorToken = card.anchors.find(token => usable.get(token) && matchToken(userText, token));
        const titleToken = ANCHORS_ONLY ? null : card.titleTokens.find(token => matchToken(userText, token));
        if (!anchorToken && !titleToken) continue;
        seen.add(card.stem);
        card.eligible++;

        const matched = turn.results.some(r => r.text.includes(card.stem));
        if (!matched) {
          if (card.misses.length < 40 && !card.misses.some(m => m.session === entry.session)) card.misses.push({ date: new Date(turn.start || now).toISOString().slice(0, 10), project, session: entry.session, token: anchorToken || titleToken, text: userText.replace(/\s+/g, ' ').slice(0, 90) });
          continue;
        }
        card.matched++;
        card.projects.add(project);

        const openedAt = turn.results.find(r => r.text.includes('# ' + card.title))?.time;
        if (!openedAt) continue;
        card.opened++;
        card.lastUsed = Math.max(card.lastUsed, openedAt);

        if (verdict === 'unknown') { card.unknown++; continue; }
        if (verdict === 'fail') {
          card.fail++;
          const reason = NEXT_NEGATIVE_RE.test(nextText)
            ? '下一轮用户说：' + nextText.replace(/\s+/g, ' ').slice(0, 60)
            : '答复承认没解决';
          if (card.failures.length < 20) card.failures.push({ date: new Date(openedAt).toISOString().slice(0, 10), project, session: entry.session, reason });
          continue;
        }
        card.success++;
        const steps = turn.calls.length;
        card.stepsAfter.push(steps);
        card.scores.push(Math.max(0, 100 - PENALTY * Math.max(0, steps - MIN_STEPS)));
      }
    }
  }
}

for (const card of cards) {
  const created = creation.get(card.stem);
  if (card.headerBaseline !== null) card.baseline = { steps: card.headerBaseline, source: 'card' };
  else if (created) card.baseline = { steps: created.steps, source: 'inferred' };
  else card.baseline = null;
  card.freshness = freshDays(card.latest, now);
  card.stale = card.freshness >= STALE_DAYS;
  card.openRate = card.matched ? card.opened / card.matched : null;
  card.successRate = card.opened ? card.success / card.opened : null;
  card.avgSteps = card.stepsAfter.length ? card.stepsAfter.reduce((a, b) => a + b, 0) / card.stepsAfter.length : null;
  card.avgScore = card.scores.length ? card.scores.reduce((a, b) => a + b, 0) / card.scores.length : null;
  card.baselineDelta = card.baseline && card.avgSteps !== null ? card.avgSteps - card.baseline.steps : null;
  card.projects = [...card.projects];
}

const eventLog = loadEvents(EVENTS_FILE);
for (const card of cards) {
  const baselineEvent = eventLog.filter(event => event.card === card.stem && event.kind === 'baseline').at(-1);
  if (baselineEvent && Number.isFinite(Number(baselineEvent.steps))) card.baseline = { steps: Number(baselineEvent.steps), source: 'event' };
  const list = eventLog.filter(event => event.card === card.stem && event.result);
  card.eventList = list;
  card.credit = null;
  if (!list.length) { card.baselineDelta = card.baseline && card.avgSteps !== null ? card.avgSteps - card.baseline.steps : null; continue; }
  card.outcomeSource = 'events';
  card.credit = creditOf(list, card.baseline ? card.baseline.steps : null);
  card.success = list.filter(event => event.result === 'success').length;
  card.fail = list.filter(event => event.result === 'fail').length;
  card.worse = list.filter(event => event.result === 'worse').length;
  card.unknown = 0;
  const judged = card.success + card.fail + card.worse;
  card.successRate = judged ? card.success / judged : null;
  const steps = list.filter(event => event.result === 'success' && Number.isFinite(event.steps)).map(event => event.steps);
  card.stepsAfter = steps;
  card.avgSteps = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : null;
  card.lastUsed = Math.max(card.lastUsed, ...list.map(event => Date.parse(event.date) || 0));
  card.baselineDelta = card.baseline && card.avgSteps !== null ? card.avgSteps - card.baseline.steps : null;
}

const totals = {
  cards: cards.length,
  eligible: cards.reduce((s, c) => s + c.eligible, 0),
  matched: cards.reduce((s, c) => s + c.matched, 0),
  opened: cards.reduce((s, c) => s + c.opened, 0),
  success: cards.reduce((s, c) => s + c.success, 0),
  fail: cards.reduce((s, c) => s + c.fail, 0),
  worse: cards.reduce((s, c) => s + (c.worse || 0), 0),
  unknown: cards.reduce((s, c) => s + c.unknown, 0),
};
const rate = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
const summary = {
  at: new Date(now).toISOString(),
  procedures: PROC,
  sessionsRoot,
  workspace: WORKSPACE,
  scanned, turns: turnsSeen, calls: callsSeen, failedFiles,
  thresholds: { staleDays: STALE_DAYS, minSteps: MIN_STEPS, penalty: PENALTY },
  totals: { ...totals, retrievalRate: rate(totals.matched, totals.eligible), openRate: rate(totals.opened, totals.matched), successRate: rate(totals.success, totals.opened) },
  cards: cards.map(c => ({
    card: c.stem, title: c.title, freshnessDays: c.freshness, stale: c.stale,
    eligible: c.eligible, matched: c.matched, opened: c.opened, success: c.success, fail: c.fail, worse: c.worse || 0,
    credit: c.credit, outcomeSource: c.outcomeSource || 'heuristic', events: c.eventList ? c.eventList.length : 0,
    unknown: c.unknown,
    openRate: c.openRate === null ? null : Math.round(c.openRate * 1000) / 10,
    successRate: c.successRate === null ? null : Math.round(c.successRate * 1000) / 10,
    avgSteps: c.avgSteps === null ? null : Math.round(c.avgSteps * 10) / 10,
    avgScore: c.avgScore === null ? null : Math.round(c.avgScore),
    baselineSteps: c.baseline?.steps ?? null,
    baselineSource: c.baseline?.source ?? null,
    baselineDelta: c.baselineDelta,
    projects: c.projects,
    lastUsed: c.lastUsed ? new Date(c.lastUsed).toISOString().slice(0, 10) : null,
    misses: c.misses, failures: c.failures,
  })),
};

if (JSON_OUT) {
  console.log(JSON.stringify(summary, null, 1));
  process.exit(0);
}

if (MD_OUT) {
  renderMarkdown();
  process.exit(0);
}

function mdCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim();
}

function renderMarkdown() {
  const BT = String.fromCharCode(96);
  const title = new Date(now).toLocaleString('zh-CN');
  const rows = [...cards].filter(c => c.eligible || c.opened)
    .sort((a, b) => (b.opened - a.opened) || (b.eligible - a.eligible) || a.name.localeCompare(b.name));
  const lines = [];
  lines.push('**卡库使用指标** · ' + title);
  lines.push('');
  lines.push('- 卡库：' + BT + PROC + BT);
  lines.push('- 会话：' + scanned + ' 个会话 / ' + turnsSeen + ' 个回合 / ' + callsSeen + ' 次调用' + (failedFiles ? ' / ' + failedFiles + ' 个解压失败' : ''));
  lines.push('- 阈值：' + STALE_DAYS + ' 天过期 ｜ 积分 成功 +' + CREDIT.success + ' / 更快 +' + CREDIT.faster + ' / 完美 +' + CREDIT.perfect + ' / 失败 ' + CREDIT.fail + ' / 变差 ' + CREDIT.worse);
  lines.push('');
  lines.push('**汇总** 检索命中 **' + (summary.totals.retrievalRate ?? '-') + '%** ｜ 打开 **' + (summary.totals.openRate ?? '-') + '%** ｜ 成功 **' + (summary.totals.successRate ?? '-') + '%**');
  lines.push('');
  lines.push('可命中 ' + totals.eligible + ' → 找到 ' + totals.matched + ' → 打开 ' + totals.opened + ' ｜ 成功 ' + totals.success + ' / 失败 ' + totals.fail + ' / 变差 ' + totals.worse + ' / 未知 ' + totals.unknown);
  lines.push('');

  if (rows.length) {
    lines.push('| 卡 | 新鲜 | 可命中 | 找到 | 打开 | 成功 | 失败 | 未知 | 均步 | 积分 | 基线 |');
    lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
    for (const c of rows) {
      const fresh = c.freshness + 'd' + (c.stale ? ' ⚠️' : '');
      const credit = c.credit === null ? '—' : (c.credit > 0 ? '+' + c.credit : String(c.credit));
      const baseline = c.baseline ? c.baseline.steps + ' 步' + (c.baseline.source === 'inferred' ? '' : '*') : '—';
      const steps = c.avgSteps === null ? '—' : c.avgSteps.toFixed(1);
      lines.push('| ' + mdCell(c.stem) + ' | ' + fresh + ' | ' + c.eligible + ' | ' + c.matched + ' | ' + c.opened + ' | ' + c.success + ' | ' + c.fail + ' | ' + c.unknown + ' | ' + steps + ' | ' + credit + ' | ' + baseline + ' |');
    }
  } else {
    lines.push('_没有可命中的回合：用户发言里没出现任何卡的锚点，或这批会话不在 --workspace 范围里。_');
  }

  const missed = cards.filter(c => c.misses.length).sort((a, b) => b.misses.length - a.misses.length).slice(0, 8);
  if (missed.length) {
    lines.push('');
    lines.push('**漏卡（该用没搜到）**');
    for (const c of missed) {
      const m = c.misses[0];
      lines.push('- **' + mdCell(c.stem) + '** ×' + c.misses.length + ' — ' + m.date + ' ' + BT + mdCell(m.token) + BT + ' 「' + mdCell(m.text) + '」');
    }
  }

  const failed = cards.filter(c => c.failures.length).sort((a, b) => b.failures.length - a.failures.length).slice(0, 8);
  if (failed.length) {
    lines.push('');
    lines.push('**用了但没成**');
    for (const c of failed) lines.push('- **' + mdCell(c.stem) + '** ×' + c.failures.length + ' — ' + c.failures[0].date + ' ' + mdCell(c.failures[0].reason).slice(0, 80));
  }

  const stale = cards.filter(c => c.stale).sort((a, b) => b.freshness - a.freshness);
  if (stale.length) {
    lines.push('');
    lines.push('**该复核（≥ ' + STALE_DAYS + ' 天）** ' + stale.length + ' 张');
    for (const c of stale.slice(0, 10)) lines.push('- **' + mdCell(c.stem) + '** — ' + c.freshness + ' 天');
  }

  lines.push('');
  lines.push('> 成功优先读 ' + BT + '_stats/events.jsonl' + BT + '，没有记录才退回「下一轮用户发言」的启发式；积分 = 成功 +2 / 更快 +1 / 完美 +1 / 失败 -1 / 变差 -2。只读，不改卡。');
  console.log(lines.join('\n'));
}

// ── 文本输出 ────────────────────────────────────────────────────────────────
const pad = (s, n) => {
  s = String(s);
  let width = 0;
  for (const ch of s) width += /[\u4e00-\u9fff]/.test(ch) ? 2 : 1;
  return s + ' '.repeat(Math.max(0, n - width));
};
console.log('卡库使用指标 · ' + new Date(now).toLocaleString('zh-CN'));
console.log('卡库 ' + PROC);
console.log('会话根 ' + (sessionsRoot || '未找到') + ' ｜ 扫 ' + scanned + ' 个会话 / ' + turnsSeen + ' 个回合 / ' + callsSeen + ' 次工具调用' + (failedFiles ? ' / ' + failedFiles + ' 个解压失败' : ''));
console.log('阈值 ' + STALE_DAYS + ' 天过期 ｜ 积分 成功 +' + CREDIT.success + ' / 更快 +' + CREDIT.faster + ' / 完美 +' + CREDIT.perfect + ' / 失败 ' + CREDIT.fail + ' / 变差 ' + CREDIT.worse);
console.log('');
console.log('汇总 检索命中 ' + (summary.totals.retrievalRate ?? '-') + '% ｜ 打开 ' + (summary.totals.openRate ?? '-') + '% ｜ 成功 ' + (summary.totals.successRate ?? '-') + '%  （可命中 ' + totals.eligible + ' / 找到 ' + totals.matched + ' / 打开 ' + totals.opened + ' / 成功 ' + totals.success + ' / 失败 ' + totals.fail + ' / 变差 ' + totals.worse + ' / 未知 ' + totals.unknown + '）');
console.log('');
console.log(pad('卡', 30) + pad('新鲜', 7) + pad('可命中', 8) + pad('找到', 6) + pad('打开', 6) + pad('成功', 6) + pad('失败', 6) + pad('未知', 6) + pad('均步', 7) + pad('积分', 6) + '基线');
const rows = [...cards].filter(c => c.eligible || c.opened).sort((a, b) => (b.opened - a.opened) || (b.eligible - a.eligible) || a.name.localeCompare(b.name));
for (const c of rows) {
  const fresh = c.freshness + 'd' + (c.stale ? '!' : '');
  const credit = c.credit === null ? '-' : (c.credit > 0 ? '+' + c.credit : String(c.credit));
  const steps = c.avgSteps === null ? '-' : c.avgSteps.toFixed(1);
  const baseline = c.baseline ? c.baseline.steps + ' 步' + (c.baseline.source === 'inferred' ? '' : '*') + (c.baselineDelta === null ? '' : '（' + (c.baselineDelta > 0 ? '+' : '') + c.baselineDelta.toFixed(1) + '）') : 'unknown';
  console.log(pad(c.stem.length > 28 ? c.stem.slice(0, 27) + '…' : c.stem, 30) + pad(fresh, 7) + pad(c.eligible, 8) + pad(c.matched, 6) + pad(c.opened, 6) + pad(c.success, 6) + pad(c.fail, 6) + pad(c.unknown, 6) + pad(steps, 7) + pad(credit, 6) + baseline);
}
if (!rows.length) console.log('  （没有可命中的回合：用户发言里没出现任何卡的锚点，或这批会话不在 --workspace 范围里）');

const missed = cards.filter(c => c.misses.length).sort((a, b) => b.misses.length - a.misses.length).slice(0, 8);
if (missed.length) {
  console.log('');
  console.log('漏卡（该用没搜到）：');
  for (const c of missed) {
    const m = c.misses[0];
    console.log('  · ' + c.stem + ' ×' + c.misses.length + ' —— ' + m.date + ' ' + m.token + ' 「' + m.text + '」');
  }
}

const failed = cards.filter(c => c.failures.length).sort((a, b) => b.failures.length - a.failures.length).slice(0, 8);
if (failed.length) {
  console.log('');
  console.log('用了但没成（打开后仍失败 / 未完成）：');
  for (const c of failed) console.log('  · ' + c.stem + ' ×' + c.failures.length + ' —— ' + c.failures[0].date + ' ' + c.failures[0].reason);
}

const stale = cards.filter(c => c.stale).sort((a, b) => b.freshness - a.freshness);
if (stale.length) {
  console.log('');
  console.log('该复核（新鲜度 >= ' + STALE_DAYS + ' 天）：' + stale.length + ' 张');
  for (const c of stale.slice(0, 10)) console.log('  · ' + c.stem + ' —— ' + c.freshness + ' 天');
}

console.log('');
console.log('口径说明：');
console.log('  · 成功：优先读 _stats/events.jsonl（收尾记录）；没有记录才退回「下一轮用户发言 + 本轮答复完成措辞」的启发式，并标「未知」不算进成功率。');
console.log('  · 积分：成功 +2、比基线步数少 +1、标记 perfect +1、失败 -1、变差 -2；基线是首次写入该卡那一轮的总步数。');
console.log('  · 跨卡高频锚点（出现在超过 25% 的卡里）视为无辨识度，不触发可命中。');
console.log('  · 默认只读；只有 --record 会往 _stats/events.jsonl 追加一行，不改卡。输出里的会话片段可能含绝对路径，贴出去前自行脱敏。');
