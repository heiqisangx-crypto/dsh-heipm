import { readFileSync } from 'node:fs'
import { registerCommands } from './procedures-tools.js'

export const name = 'heipm-procedures'
export const inject = ['systemPrompt', 'commands']

const SECTION_NAME = 'heipm:procedures'
const SECTION_ORDER = 9000
const PROCEDURE_TEXT = readFileSync(new URL('./procedures-prompt.md', import.meta.url), 'utf8').trim()

const SERVICE_NAME = 'heipmProcedures'

export function apply(ctx) {
  ctx.provide(SERVICE_NAME, { section: SECTION_NAME })
  ctx.systemPrompt.section({
    name: SECTION_NAME,
    order: SECTION_ORDER,
    text: PROCEDURE_TEXT,
    interpolate: false,
  })
  registerCommands(ctx.commands, ctx)
}
