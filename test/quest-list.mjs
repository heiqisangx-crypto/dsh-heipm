import assert from 'node:assert/strict'
import { apply, inject, name } from '../quest-list.js'

const registered = []
const sections = []
const ctx = {
  skills: { register: skill => { registered.push(skill); return () => {} } },
  systemPrompt: { section: section => { sections.push(section); return () => {} } },
}

apply(ctx)

assert.equal(name, 'heipm-quest-list')
assert.deepEqual(inject, ['skills', 'systemPrompt'])
assert.equal(registered.length, 1)
const skill = registered[0]
assert.equal(skill.name, 'quest-list')
assert.ok(skill.description.includes('任务清单'), skill.description)
assert.ok(skill.whenToUse, 'missing whenToUse')
assert.equal(skill.source, 'runtime')
assert.equal(skill.resourceBase.kind, 'directory')
assert.ok(skill.resourceBase.path.endsWith('quest-list'))
assert.ok(!skill.content.startsWith('---'), 'front matter must be stripped from the body')
for (const phrase of ['# quest-list', '触发', '## 格式', '[O]', '[√]']) {
  assert.ok(skill.content.includes(phrase), `missing phrase: ${phrase}`)
}
assert.ok(skill.content.includes('.dsh/dsh-heipm/任务清单.md'), 'body must name the new task-list path')
assert.ok(skill.description.includes('.dsh/dsh-heipm/任务清单.md'), 'description must name the new task-list path')

assert.equal(sections.length, 1)
const section = sections[0]
assert.equal(section.name, 'heipm:quest-list')
assert.equal(section.order, 8990)
assert.equal(section.interpolate, false)
assert.ok(section.text.startsWith('# 任务清单'), section.text.slice(0, 20))
assert.ok(section.text.includes('确定为新需求'), 'missing the new-requirement gate')
assert.ok(section.text.includes('skill `quest-list`'), 'missing skill pointer')
assert.ok(section.text.includes('`.dsh/dsh-heipm/任务清单.md`'), 'missing task-list location')
assert.ok(section.text.includes('按需读取'), 'missing the on-demand reading rule')

globalThis.__heipmQuestList = undefined
const flagged = {
  ...ctx,
  effect: (fn) => {
    const dispose = fn()
    return typeof dispose === 'function' ? dispose : () => {}
  },
}
apply(flagged)
assert.equal(globalThis.__heipmQuestList.count, 1, 'apply must raise the sub-plugin flag')
apply(flagged)
assert.equal(globalThis.__heipmQuestList.count, 2, 'a second apply raises the count again')

console.log('ok   quest-list sub-plugin registers one runtime skill and one prompt section')
