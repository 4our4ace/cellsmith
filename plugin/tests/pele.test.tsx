import { expect, test } from 'claude-code/testing'

import { pelePalette, warmPele } from '../hooks/mermaid'
import { CANVAS, PRESETS } from '../hooks/presets'
import { width } from '../hooks/render'
import { resolveStyle } from '../hooks/theme'
import { loadPele } from '../hooks/vendor/pele.js'
import { drawPele } from '../hooks/vendor/pelext.js'

const mount = (text: string, columns = 120) => ({
  plugin: 'cellsmith',
  component: 'AssistantMessage' as const,
  props: { text, isFirstOfReply: true },
  viewport: { columns, rows: 40 },
  surface: 'terminal' as const,
})

const fence = (source: string) => '```mermaid\n' + source + '\n```'

const PIE = 'pie title Where time goes\n  "Layout" : 45\n  "Edges" : 30\n  "Text" : 25'
const FLOW = 'flowchart TD\n  A[Start] --> B{Working?}\n  B -->|yes| C[Ship]\n  B -->|no| D[Debug]'
const WIDE = 'flowchart LR\n  a[User prompt] --> b[Claude Code] --> c[cellsmith] --> d[Pele layout] --> e[Cell grid] --> f[Any terminal]'
const mocha = pelePalette(PRESETS['catppuccin-mocha'], CANVAS['catppuccin-mocha'])

test('the engine draws every diagram type it bundles', () => {
  const { render } = loadPele()
  const sources = [
    FLOW,
    'sequenceDiagram\n  A->>B: go\n  B-->>A: ok',
    'stateDiagram-v2\n  [*] --> Idle\n  Idle --> [*]',
    'classDiagram\n  class Grid {\n    +width: int\n  }',
    'erDiagram\n  USER ||--o{ SESSION : opens',
    PIE,
    'gantt\n  dateFormat YYYY-MM-DD\n  section Build\n  Parser :a1, 2026-10-18, 2d',
    'xychart-beta\n  x-axis [a, b]\n  bar [1, 2]',
    'timeline\n  0.1 : fork\n  0.2 : Pele',
    'mindmap\n  root((cellsmith))\n    Layout\n    Drawing',
    'quadrantChart\n  x-axis Slow --> Fast\n  y-axis Plain --> Pretty\n  pele: [0.9, 0.8]',
    'gitGraph\n  commit\n  branch pele\n  commit',
    'sankey-beta\nPrompt,Model,10\nModel,Text,6',
  ]
  for (const source of sources) {
    const art = drawPele(render, source, mocha, 120)
    expect(art?.rows.length ?? 0).toBeGreaterThan(0)
  }
})

test('a pie chart, which the classic engine cannot draw, draws as colored blocks with its labels', async $ => {
  const ui = await $.ui.mount(mount(fence(PIE)))
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts.some(t => t.includes('Where time goes'))).toBe(true)
  expect(texts.some(t => t.includes('45%'))).toBe(true)
  expect(texts.some(t => /█/.test(t))).toBe(true)
  await ui.unmount()
})

test('each flowchart node gets its own color from the theme', async $ => {
  const ui = await $.ui.mount(mount(fence(FLOW)))
  const colors = await Promise.all([/^Start$/, /^Ship$/, /^Debug$/].map(async re => (await ui.find({ type: 'Text', text: re }))?.props.color))
  expect(colors.every(c => c !== undefined)).toBe(true)
  expect(new Set(colors).size).toBe(3)
  await ui.unmount()
})

test('rect nodes draw square corners, round nodes rounded ones, and arrows are never emoji', async $ => {
  const ui = await $.ui.mount(mount(fence('graph LR\n  A --> B(Round)\n  B --> A')))
  const all = (await ui.findAll({ type: 'Text' })).map(t => t.text).join('\n')
  expect(all).toContain('┌')
  expect(all).toContain('╭')
  expect(all).not.toMatch(/[▶◀]/)
  await ui.unmount()
})

test('a diagram still streaming shows as code until its fence closes', async $ => {
  const ui = await $.ui.mount(mount('```mermaid\ngraph TD\n  A --> B'))
  const all = (await ui.findAll({ type: 'Text' })).map(t => t.text).join('\n')
  expect(all).toContain('A --> B')
  expect(all).not.toMatch(/[╭┌]/)
  await ui.unmount()
})

test('a diagram neither engine can parse stays as its source', async $ => {
  const ui = await $.ui.mount(mount(fence('not a diagram at all')))
  expect(await ui.find({ type: 'Text', text: /not a diagram at all/ })).toBeDefined()
  await ui.unmount()
})

test('mermaidAscii draws through the classic engine with plain characters', { options: { mermaidAscii: true } }, async $ => {
  const ui = await $.ui.mount(mount(fence('graph LR\n  A[One] --> B[Two]')))
  const all = (await ui.findAll({ type: 'Text' })).map(t => t.text).join('\n')
  expect(all).toContain('One')
  expect(all).not.toMatch(/[╭┌]/)
  expect(all).toMatch(/[+|-]/)
  await ui.unmount()
})

test('the mono theme draws diagrams without colors', { options: { theme: 'mono' } }, async $ => {
  const ui = await $.ui.mount(mount(fence(FLOW)))
  const diagram = (await ui.findAll({ type: 'Text' })).filter(t => /[╭╰│─]/.test(t.text))
  expect(diagram.length).toBeGreaterThan(0)
  expect(diagram.every(t => t.props.color === undefined && t.props.backgroundColor === undefined)).toBe(true)
  await ui.unmount()
})

test('a wide left-to-right chain turns top-down to fit a narrow terminal', async $ => {
  const ui = await $.ui.mount(mount(fence(WIDE), 60))
  const rows = (await ui.findAll({ type: 'Text' })).filter(t => /[┌└]/.test(t.text)).map(t => t.text)
  expect(rows.length).toBeGreaterThan(2)
  expect(rows.every(r => width(r.trimEnd()) <= 58)).toBe(true)
  expect(await ui.find({ type: 'Text', text: /Any terminal/ })).toBeDefined()
  await ui.unmount()
})

test('the session-start warm-up draws each diagram type it warms, then stops', () => {
  const style = resolveStyle({})
  const drawn = []
  for (let step = 0, art = warmPele(style, 0); art !== undefined; art = warmPele(style, ++step)) drawn.push(art)
  expect(drawn.length).toBe(5)
  expect(drawn.every(art => art !== null && art.rows.length > 0)).toBe(true)
})
