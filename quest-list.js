import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const name = 'heipm-quest-list'
export const inject = ['skills', 'systemPrompt']

const SECTION_NAME = 'heipm:quest-list'
const SECTION_ORDER = 8990
const PROMPT_TEXT = readFileSync(new URL('./quest-list-prompt.md', import.meta.url), 'utf8').trim()

const SKILL_DIR = new URL('./quest-list/', import.meta.url)
const SKILL_PATH = fileURLToPath(SKILL_DIR).replace(/[\\/]$/, '')
const SKILL_DOC = readFileSync(new URL('./SKILL.md', SKILL_DIR), 'utf8')

function parseSkillDocument(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!match) return { meta: {}, content: text.trim() }
  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const entry = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line.trim())
    if (!entry) continue
    meta[entry[1]] = entry[2].replace(/^["']|["']$/g, '').trim()
  }
  return { meta, content: text.slice(match[0].length).trim() }
}

const PARSED = parseSkillDocument(SKILL_DOC)

export function apply(ctx) {
  const disposeSkill = ctx.skills.register({
    name: PARSED.meta.name,
    description: PARSED.meta.description,
    whenToUse: PARSED.meta.whenToUse,
    content: PARSED.content,
    source: 'runtime',
    resourceBase: { kind: 'directory', path: SKILL_PATH },
  })
  globalThis.__heipmQuestList = { count: (globalThis.__heipmQuestList?.count || 0) + 1 }
  if (typeof ctx.effect === 'function') {
    ctx.effect(() => () => {
      const current = globalThis.__heipmQuestList
      if (current && typeof current === 'object') current.count = Math.max(0, current.count - 1)
      if (typeof disposeSkill === 'function') disposeSkill()
    }, 'heipm-quest-list: skill registration')
  }
  ctx.systemPrompt.section({
    name: SECTION_NAME,
    order: SECTION_ORDER,
    text: PROMPT_TEXT,
    interpolate: false,
  })
}
