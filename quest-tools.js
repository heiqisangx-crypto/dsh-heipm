// Agent-facing quest tools. Registered only while the quest-list sub-plugin runs.
import {
  readTree, addRequirement, addItem, setItemState, setItemEvidence, removeNode,
} from './quest-store.js'

const STATE_VALUES = ['open', 'running', 'awaiting', 'done']

const READ_SCHEMA = {
  type: 'object',
  properties: {
    projectPath: {
      type: 'string',
      description: 'Absolute path of the project whose task list to read; defaults to the current session working directory.',
    },
  },
  additionalProperties: false,
}

const WRITE_SCHEMA = {
  type: 'object',
  properties: {
    op: {
      type: 'string',
      enum: ['add_req', 'add_item', 'set_state', 'set_evidence', 'remove'],
      description: 'Which write to perform.',
    },
    projectPath: {
      type: 'string',
      description: 'Absolute path of the project; defaults to the current session working directory.',
    },
    requirementId: {
      type: 'string',
      description: 'Target requirement id, required by add_item. Use quest_read to find it.',
    },
    itemId: {
      type: 'string',
      description: 'Target task id, required by set_state, set_evidence and remove.',
    },
    parentId: {
      type: 'string',
      description: 'Parent task id for add_item. Omit to add a top-level task; nest as deep as needed.',
    },
    title: {
      type: 'string',
      description: 'Plain title text. Never include the sequence number or a state marker.',
    },
    state: {
      type: 'string',
      enum: STATE_VALUES,
      description: 'Target state for set_state.',
    },
    evidence: {
      type: 'string',
      description: 'Evidence for set_evidence: command and output, file:line, or a test count.',
    },
  },
  required: ['op'],
  additionalProperties: false,
}

const READ_OUTPUT = {
  type: 'object',
  properties: {
    requirements: { type: 'array', items: { type: 'object' } },
    counts: { type: 'object' },
    revision: { type: 'number' },
  },
}

const WRITE_OUTPUT = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    result: { type: 'object' },
  },
}

function textResult(value) {
  return { type: 'text', text: JSON.stringify(value, null, 2) }
}

function describeTree(tree) {
  // 子任务可能有多层：递归带上 children，空数组不输出保持体积。
  const toItem = item => {
    const out = {
      id: item.id,
      title: item.title,
      state: item.state,
      evidence: item.evidence,
      progress: item.nested ? `${item.doneLeaves}/${item.leaves}` : null,
    }
    if (item.children && item.children.length) out.children = item.children.map(toItem)
    return out
  }
  return {
    revision: tree.revision,
    counts: tree.counts,
    requirements: tree.requirements.map(req => ({
      id: req.id,
      seq: req.seq,
      title: req.title,
      state: req.state,
      items: req.items.map(toItem),
    })),
  }
}

export function readQuestTool(getDb) {
  return {
    name: 'quest_read',
    description: 'Read the project task list: requirements, their tasks, states, evidence and counts. '
      + 'Use it before writing so you have the ids.',
    parameters: READ_SCHEMA,
    output: { schema: READ_OUTPUT, render: (args, value) => [textResult(value)] },
    async execute(args, exec) {
      const db = await getDb(args.projectPath, exec)
      return describeTree(readTree(db))
    },
  }
}

export function writeQuestTool(getDb) {
  return {
    name: 'quest_write',
    description: 'Write to the project task list. '
      + 'add_req adds a requirement, add_item adds a task under one, set_state changes a task state, '
      + 'set_evidence records the proof for a task, remove deletes a node. '
      + 'Tasks with subtasks derive their state from the leaves and cannot be set directly.',
    parameters: WRITE_SCHEMA,
    output: { schema: WRITE_OUTPUT, render: (args, value) => [textResult(value)] },
    async execute(args, exec) {
      const op = String(args.op || '')
      const db = await getDb(args.projectPath, exec)
      if (op === 'add_req') {
        if (!args.title) throw new Error('add_req needs a title')
        return { ok: true, result: addRequirement(db, args.title) }
      }
      if (op === 'add_item') {
        if (!args.requirementId) throw new Error('add_item needs a requirementId')
        if (!args.title) throw new Error('add_item needs a title')
        return { ok: true, result: addItem(db, args.requirementId, args.title, args.evidence, args.parentId) }
      }
      if (op === 'set_state') {
        if (!args.itemId) throw new Error('set_state needs an itemId')
        if (!STATE_VALUES.includes(args.state)) throw new Error('set_state needs a valid state')
        return { ok: true, result: setItemState(db, args.itemId, args.state) }
      }
      if (op === 'set_evidence') {
        if (!args.itemId) throw new Error('set_evidence needs an itemId')
        return { ok: true, result: setItemEvidence(db, args.itemId, args.evidence) }
      }
      if (op === 'remove') {
        if (!args.itemId) throw new Error('remove needs an itemId')
        return { ok: true, result: removeNode(db, args.itemId) }
      }
      throw new Error('Unknown op: ' + op)
    },
  }
}

/**
 * 注册两个工具，返回取消函数；没拿到 tools 服务时返回 null。
 * 不能返回空函数：调用方会把它当成"已注册"，轮询补注册就永远不跑了。
 */
export function registerQuestTools(ctx, getDb) {
  if (!ctx || !ctx.tools || typeof ctx.tools.register !== 'function') return null
  const offs = []
  try {
    offs.push(ctx.tools.register(readQuestTool(getDb)))
    offs.push(ctx.tools.register(writeQuestTool(getDb)))
  } catch (error) {
    for (const off of offs) { try { off() } catch {} }
    ctx.logger?.warn?.('dsh-heipm: quest tools registration failed: ' + (error && error.message))
    return null
  }
  return () => { for (const off of offs) { try { off() } catch {} } }
}
