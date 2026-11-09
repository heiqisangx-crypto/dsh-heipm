// procedures-stats.mjs 的行为测试：拿合成的会话日志跑真实脚本，只断言公开输出。
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, utimesSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zstdCompressSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'templates', 'tools', 'procedures-stats.mjs');

let failed = 0;
let passed = 0;
function ok(name, condition, detail = '') {
  if (condition) { passed++; console.log('ok   ' + name); }
  else { failed++; console.log('FAIL ' + name + (detail ? '  ← ' + detail : '')); }
}

const CARD_A = '# 工具-wsl2访问不到\n\n> **触发**：局域网连不上\n> **锚点**：wsl2 / portproxy\n> **验证**：能 ping 通\n\n## 首选\n\n netsh ...\n';
const CARD_B = '# 工具-asar解不开\n\n> **触发**：解包报错\n> **锚点**：asar / extract-file\n> **验证**：能列出文件\n\n## 首选\n\n npx asar list\n';

function event(type, time, data) { return JSON.stringify({ type, time, data }); }

function sessionLines(verdict) {
  const lines = [];
  lines.push(event('session', 0, { id: 'session-fixture', cwd: 'D:/fixture-workspace' }));
  lines.push(event('turn/start', 1000, { turn: 1 }));
  lines.push(JSON.stringify({ type: 'user/message', time: 1001, data: { source: { kind: 'user' }, content: [{ type: 'text', text: 'wsl2 局域网访问不到' }] } }));
  lines.push(event('tool/call', 1002, { name: 'run_code', arguments: 'grep 工具-wsl2访问不到.md' }));
  lines.push(event('tool/result', 1003, { message: { content: [{ type: 'text', text: '工具-wsl2访问不到.md:3: 锚点' }] } }));
  lines.push(event('assistant/message', 1004, { message: { content: [{ type: 'text', text: '先看看这张卡' }] } }));
  lines.push(event('turn/end', 1005, { reason: { kind: 'completed' } }));

  lines.push(event('turn/start', 2000, { turn: 2 }));
  lines.push(JSON.stringify({ type: 'user/message', time: 2001, data: { source: { kind: 'user' }, content: [{ type: 'text', text: 'asar 解不开，怎么办' }] } }));
  lines.push(event('tool/call', 2002, { name: 'run_code', arguments: 'read 工具-asar解不开.md' }));
  lines.push(event('tool/result', 2003, { message: { content: [{ type: 'text', text: CARD_B }] } }));
  lines.push(event('assistant/message', 2004, { message: { content: [{ type: 'text', text: '已修复' }] } }));
  lines.push(event('turn/end', 2005, { reason: { kind: 'completed' } }));

  lines.push(event('turn/start', 3000, { turn: 3 }));
  lines.push(JSON.stringify({ type: 'user/message', time: 3001, data: { source: { kind: 'user' }, content: [{ type: 'text', text: verdict }] } }));
  lines.push(event('assistant/message', 3002, { message: { content: [{ type: 'text', text: '收到' }] } }));
  lines.push(event('turn/end', 3003, { reason: { kind: 'completed' } }));
  return lines;
}

function writeSession(root, lines) {
  const dir = join(root, '--fixture-workspace--', 'session-fixture');
  mkdirSync(dir, { recursive: true });
  const half = Math.ceil(lines.length / 2);
  const first = zstdCompressSync(Buffer.from(lines.slice(0, half).join('\n') + '\n', 'utf8'));
  const second = zstdCompressSync(Buffer.from(lines.slice(half).join('\n') + '\n', 'utf8'));
  writeFileSync(join(dir, 'session.v4.jsonl.zstd'), Buffer.concat([first, second]));
}

function makeFixture(verdict = '可以了') {
  const root = mkdtempSync(join(tmpdir(), 'proc-stats-'));
  const proc = join(root, 'procedures');
  mkdirSync(proc, { recursive: true });
  writeFileSync(join(proc, '工具-wsl2访问不到.md'), CARD_A);
  writeFileSync(join(proc, '工具-asar解不开.md'), CARD_B);
  const sessions = join(root, 'sessions');
  writeSession(sessions, sessionLines(verdict));
  return { root, proc, sessions };
}

function run(fixture, ...extra) {
  const out = execFileSync(process.execPath, [SCRIPT, '--procedures', fixture.proc, '--sessions', fixture.sessions, '--json', ...extra], {
    encoding: 'utf8',
    env: { ...process.env, DSH_HOME: '', DSH_SESSIONS: '' },
  });
  return JSON.parse(out);
}

const fixture = makeFixture();
const report = run(fixture);
const byName = Object.fromEntries(report.cards.map(card => [card.card, card]));

ok('scans the fixture session', report.scanned === 1 && report.turns >= 3, JSON.stringify({ scanned: report.scanned, turns: report.turns }));
ok('retrieval hit counts the grep-only turn', byName['工具-wsl2访问不到'].eligible === 1 && byName['工具-wsl2访问不到'].matched === 1, JSON.stringify(byName['工具-wsl2访问不到']));
ok('a filename-only hit is not an open', byName['工具-wsl2访问不到'].opened === 0, JSON.stringify(byName['工具-wsl2访问不到']));
ok('a full read counts as opened', byName['工具-asar解不开'].opened === 1, JSON.stringify(byName['工具-asar解不开']));
ok('a positive next message is a success', byName['工具-asar解不开'].success === 1, JSON.stringify(byName['工具-asar解不开']));
ok('efficiency is the whole turn step count', byName['工具-asar解不开'].avgSteps === 1, JSON.stringify(byName['工具-asar解不开']));
ok('one step scores 100', byName['工具-asar解不开'].avgScore === 100, JSON.stringify(byName['工具-asar解不开']));
ok('no card creation means no baseline', byName['工具-asar解不开'].baselineSteps === null, JSON.stringify(byName['工具-asar解不开']));
ok('aggregate rates follow the funnel', report.totals.retrievalRate === 100 && report.totals.openRate === 50 && report.totals.successRate === 100, JSON.stringify(report.totals));
ok('fresh cards are not stale', byName['工具-asar解不开'].stale === false, String(byName['工具-asar解不开'].freshnessDays));

const negative = makeFixture('还是不行');
const negativeReport = run(negative);
const negativeCard = negativeReport.cards.find(card => card.card === '工具-asar解不开');
ok('a negative next message is a failure', negativeCard.success === 0 && negativeCard.failures.length === 1, JSON.stringify(negativeCard));
ok('failure carries the user wording', /还是不行/.test(negativeCard.failures[0]?.reason || ''), JSON.stringify(negativeCard.failures));

const mdReport = execFileSync(process.execPath, [SCRIPT, '--procedures', fixture.proc, '--sessions', fixture.sessions, '--md'], { encoding: 'utf8', env: { ...process.env, DSH_HOME: '', DSH_SESSIONS: '' } });
ok('markdown mode renders a table', mdReport.includes('| 卡 |') && mdReport.includes('**汇总**'), mdReport.slice(0, 120));

const old = new Date(Date.now() - 200 * 86400000);
utimesSync(join(fixture.proc, '工具-asar解不开.md'), old, old);
const staleReport = run(fixture);
const staleCard = staleReport.cards.find(card => card.card === '工具-asar解不开');
ok('old cards are flagged stale', staleCard.stale === true && staleCard.freshnessDays >= 199, JSON.stringify({ stale: staleCard.stale, days: staleCard.freshnessDays }));

const eventsFile = join(fixture.proc, '_stats', 'events.jsonl');
function record(...args) {
  try {
    const out = execFileSync(process.execPath, [SCRIPT, '--procedures', fixture.proc, '--record', ...args], { encoding: 'utf8', stdio: 'pipe' });
    return { status: 0, out };
  } catch (error) { return { status: error.status, out: String(error.stderr || '') }; }
}

const first = record('--card', '工具-asar解不开', '--result', 'success', '--steps', '2', '--perfect', '--project', 'demo');
ok('record appends an event', first.status === 0 && existsSync(eventsFile), first.out);
const saved = JSON.parse(readFileSync(eventsFile, 'utf8').trim().split('\n')[0]);
ok('the event keeps its fields', saved.card === '工具-asar解不开' && saved.result === 'success' && saved.steps === 2 && saved.perfect === true && saved.project === 'demo', JSON.stringify(saved));
const withEvent = run(fixture);
const eventCard = withEvent.cards.find(card => card.card === '工具-asar解不开');
ok('events override the heuristic outcome', eventCard.outcomeSource === 'events' && eventCard.success === 1 && eventCard.fail === 0, JSON.stringify(eventCard));
ok('credit is success plus perfect', eventCard.credit === 3, String(eventCard.credit));

const failRun = record('--card', '工具-asar解不开', '--result', 'fail', '--reason', '缺前提');
ok('a failure is accepted with a reason', failRun.status === 0);
const afterFail = run(fixture).cards.find(card => card.card === '工具-asar解不开');
ok('a failure costs one point', afterFail.credit === 2 && afterFail.fail === 1, JSON.stringify({ credit: afterFail.credit, fail: afterFail.fail }));
const noReason = record('--card', '工具-asar解不开', '--result', 'fail');
ok('a failure without a reason is refused', noReason.status === 2, String(noReason.status));
const unknownCard = record('--card', '不存在的卡', '--result', 'success');
ok('an unknown card is refused', unknownCard.status === 2, String(unknownCard.status));
appendFileSync(eventsFile, 'not json\n');
ok('bad event lines are ignored', run(fixture).cards.find(card => card.card === '工具-asar解不开').credit === 2);

const baseFixture = makeFixture('可以了');
writeFileSync(join(baseFixture.proc, '工具-asar解不开.md'), '# 工具-asar解不开\n\n> **触发**：解包报错\n> **锚点**：asar / extract-file\n> **首发步数**：9\n\n## 首选\n\n npx asar list\n');
const headerRun = run(baseFixture).cards.find(card => card.card === '工具-asar解不开');
ok('the card header supplies the baseline', headerRun.baselineSteps === 9 && headerRun.baselineSource === 'card', JSON.stringify(headerRun));

const baselineWrite = execFileSync(process.execPath, [SCRIPT, '--procedures', baseFixture.proc, '--baseline', '--card', '工具-asar解不开', '--steps', '12'], { encoding: 'utf8', stdio: 'pipe' });
ok('a baseline event can be recorded', /已记录基线/.test(baselineWrite), baselineWrite);
const afterBaseline = run(baseFixture).cards.find(card => card.card === '工具-asar解不开');
ok('the baseline event beats the header', afterBaseline.baselineSteps === 12 && afterBaseline.baselineSource === 'event', JSON.stringify({ steps: afterBaseline.baselineSteps, source: afterBaseline.baselineSource }));

execFileSync(process.execPath, [SCRIPT, '--procedures', baseFixture.proc, '--record', '--card', '工具-asar解不开', '--result', 'success', '--steps', '8'], { encoding: 'utf8', stdio: 'pipe' });
const credited = run(baseFixture).cards.find(card => card.card === '工具-asar解不开');
ok('a faster success earns the bonus', credited.credit === 3 && credited.events === 1, JSON.stringify({ credit: credited.credit, events: credited.events }));

let noBaseline = 0;
try { execFileSync(process.execPath, [SCRIPT, '--procedures', baseFixture.proc, '--baseline', '--card', '工具-asar解不开'], { encoding: 'utf8', stdio: 'pipe' }); } catch (error) { noBaseline = error.status; }
ok('a baseline without steps is refused', noBaseline === 2, String(noBaseline));

const empty = mkdtempSync(join(tmpdir(), 'proc-stats-empty-'));
mkdirSync(join(empty, 'procedures'));
let emptyExit = 0;
try {
  execFileSync(process.execPath, [SCRIPT, '--procedures', join(empty, 'procedures'), '--sessions', fixture.sessions, '--json'], { encoding: 'utf8', stdio: 'pipe' });
} catch (error) { emptyExit = error.status; }
ok('a card dir without anchors is refused', emptyExit === 2, String(emptyExit));

for (const dir of [fixture.root, negative.root, baseFixture.root, empty]) { try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } }

console.log('');
if (failed) { console.log('stats: ' + failed + ' failed / ' + passed + ' passed'); process.exit(1); }
console.log('stats: all checks passed (' + passed + ')');
