import { expect, test } from 'claude-code/testing'

import { warmPele } from '../hooks/mermaid'
import { drawPele, pelePalette } from '../hooks/pele'
import { CANVAS, PRESETS } from '../hooks/presets'
import { width } from '../hooks/render'
import { resolveStyle } from '../hooks/theme'
import { loadPele } from '../hooks/vendor/pele.js'

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

test('a chain whose compact layout is still too wide is laid out top-down instead of falling back', () => {
  for (const columns of [70, 90, 100]) {
    const art = drawPele(loadPele().render, WIDE, mocha, columns)!
    expect(art.width).toBeLessThanOrEqual(columns)
    expect(art.art).toMatch(/User prompt[\s\S]*Any terminal/)
  }
})

test('a single-series bar chart keeps one highlight for the tallest bar', () => {
  const art = drawPele(loadPele().render, 'xychart-beta\n  x-axis [a, b, c]\n  y-axis 0 --> 10\n  bar [2, 9, 5]', mocha, 120)
  const fills = new Set(art!.rows.flat().filter(s => /^█+$/.test(s.text)).map(s => s.fg))
  expect([...fills].sort()).toEqual([PRESETS['catppuccin-mocha'].emphasis, PRESETS['catppuccin-mocha'].quote].sort())
})

test('tilted git commit labels lie flat and never print over each other', () => {
  const art = drawPele(loadPele().render, 'gitGraph\n  commit id: "fork"\n  branch pele\n  commit id: "engine"\n  commit id: "colors"\n  checkout main\n  merge pele', mocha, 120)!
  for (const label of ['fork', 'engine', 'colors']) expect(art.art).toMatch(new RegExp(`(^|\\s)${label}(\\s|$)`, 'm'))
})

test('nodes inside a subgraph keep their own boxes and labels', () => {
  const art = drawPele(loadPele().render, 'flowchart LR\n  subgraph Host[Claude Code]\n    R([Reply]) --> P[[cellsmith]]\n  end', mocha, 120)!
  expect(art.art).toMatch(/Reply.*►.*cellsmith/)
  expect(art.art).toContain('Claude Code')
})

test('round and slanted node shapes are traced with box lines, not braille', () => {
  const art = drawPele(loadPele().render, 'flowchart LR\n  A((Circle)) --> B{Decision} --> C{{Hexagon}}\n  C --> D(((Double)))', mocha, 120)!
  expect(art.art).not.toMatch(/[⠁-⣿]/)
  for (const label of ['Circle', 'Decision', 'Hexagon', 'Double']) expect(art.art).toContain(label)
})

test('a line chart draws flat steps on the rows of their values over dotted gridlines and ticked axes', () => {
  const art = drawPele(loadPele().render, 'xychart-beta\n  x-axis [30, 34, 38, 42]\n  y-axis "lead" -2 --> 12\n  line [11, 6, 1, -1]', mocha, 100)!
  const lines = art.art.split('\n')
  const at = (label: string) => lines.findIndex(l => new RegExp(`^\\s*${label}[┤╮┴]`).test(l))
  expect(art.art).not.toMatch(/[⠁-⣿]/)
  expect(art.art).toMatch(/┤·{10,}/)
  expect(art.art).toContain('┬')
  expect(at('10') - at('12')).toBe(2)
  expect(lines[at('12') + 1]).toMatch(/│ +─+╮/)
  expect(lines[at('2') + 1]).toMatch(/╰─+╮/)
})

test('a line over bars stays readable and bars stop at their axis', () => {
  const canvas = CANVAS['catppuccin-mocha']
  const art = drawPele(loadPele().render, 'xychart-beta\n  x-axis [g1, g2, g3]\n  y-axis 0 --> 100\n  bar [40, 62, 80]\n  line [35, 50, 66]', mocha, 100)!
  const crossing = art.rows.flat().filter(s => s.bg && /[─│╭╮╰╯]/.test(s.text))
  expect(crossing.length).toBeGreaterThan(0)
  expect(crossing.every(s => s.fg === canvas)).toBe(true)
  const axis = art.rows.find(r => r.some(s => s.text.includes('┴')))!
  expect(axis.every(s => !s.bg)).toBe(true)
})

test('gantt bars and section bands keep to their own row and leave the axis row bare', () => {
  const art = drawPele(loadPele().render, 'gantt\n  dateFormat YYYY-MM-DD\n  section Build\n  Parser :a1, 2020-01-01, 2d\n  section Ship\n  Release :crit, b1, after a1, 3d', mocha, 100)!
  const axis = art.rows.find(r => r.some(s => /──/.test(s.text)))!
  expect(axis.every(s => !s.bg && !/[█▀▄]/.test(s.text))).toBe(true)
  expect(art.rows.filter(r => r.some(s => s.bg === PRESETS['catppuccin-mocha'].codeFlag)).length).toBe(1)
})

test('a composite state keeps its border and header line, and end states draw as a ring with a dot', () => {
  const art = drawPele(loadPele().render, 'stateDiagram-v2\n  [*] --> Work\n  state Work {\n    [*] --> Step\n    Step --> [*]\n  }\n  Work --> [*]', mocha, 100)!
  expect(art.art).toMatch(/├─+┤/)
  expect(art.art).not.toMatch(/[▐▌▗▖▝▘]/)
  expect(art.art.match(/◉/g)?.length).toBe(2)
})

test('a point label spilling over a quadrant edge leaves the quadrant boxes their size', () => {
  const art = drawPele(loadPele().render, 'quadrantChart\n  x-axis Slow --> Fast\n  y-axis Plain --> Pretty\n  a-very-long-point-label: [0.55, 0.55]', mocha, 80)!
  const tops = art.art.split('\n').filter(l => l.includes('╮'))
  expect(tops.length).toBe(2)
  for (const top of tops) expect(top.trim()).toMatch(/^╭─+╮╭─+╮$/)
})

test('stacked timeline events stay separate boxes and the pie legend keeps even rows', () => {
  const timeline = drawPele(loadPele().render, 'timeline\n  Oct 18 : Fork : Engine', mocha, 100)!.art.split('\n')
  const fork = timeline.findIndex(l => l.includes('Fork')), engine = timeline.findIndex(l => l.includes('Engine'))
  expect(timeline.slice(fork + 1, engine).map(l => l.trim()[0])).toEqual(['▀', '▄'])
  const pie = drawPele(loadPele().render, 'pie\n  "Pele layout" : 52\n  "SVG to cells" : 18\n  "Text placement" : 12\n  "Colors" : 8\n  "Ink tree" : 10', mocha, 100)!.art.split('\n')
  const rows = ['Pele layout', 'SVG to cells', 'Text placement', 'Colors', 'Ink tree'].map(l => pie.findIndex(line => line.includes(l)))
  expect(rows.slice(1).map((r, i) => r - rows[i]!)).toEqual([1, 1, 1, 1])
})

test('git merge commits draw as a ring with a dot', () => {
  const art = drawPele(loadPele().render, 'gitGraph\n  commit\n  branch pele\n  commit\n  checkout main\n  merge pele', mocha, 100)!
  expect(art.art).toContain('◉')
})

test('the session-start warm-up draws each diagram type it warms, then stops', () => {
  const style = resolveStyle({})
  const drawn = []
  for (let step = 0, art = warmPele(style, 0); art !== undefined; art = warmPele(style, ++step)) drawn.push(art)
  expect(drawn.length).toBe(5)
  expect(drawn.every(art => art !== null && art.rows.length > 0)).toBe(true)
})

test('the art copy is plain text with the same rows as the drawing', () => {
  const art = drawPele(loadPele().render, FLOW, mocha, 120)!
  const lines = art.art.split('\n')
  expect(lines.length).toBe(art.rows.length)
  lines.forEach((line, i) => expect(line).toBe(art.rows[i]!.map(s => s.text).join('').trimEnd()))
})

test('edges run right up to filled nodes', () => {
  const art = drawPele(loadPele().render, 'mindmap\n  root\n    a\n      b\n        c', mocha, 100)!
  expect(art.art).toMatch(/─█a█─+█b█─/)
  expect(art.art).not.toMatch(/█ *╶|╴ *█/)
})

test('a rotated axis label reads across beside the chart, clear of its border', () => {
  const art = drawPele(loadPele().render, 'quadrantChart\n  x-axis Rarely --> Often\n  y-axis Easy to draw --> Hard to draw\n  pele: [0.9, 0.8]', mocha, 80)!
  expect(art.art).toMatch(/^Hard to +│/m)
  expect(art.art).toMatch(/^ *draw +│/m)
  expect(art.art).not.toMatch(/^[A-Za-z]│/m)
})

test('the mono theme fills each pie slice with its own shade', () => {
  const mono = pelePalette(PRESETS.mono, CANVAS.mono)
  const art = drawPele(loadPele().render, 'pie\n  "Layout" : 50\n  "Edges" : 30\n  "Text" : 20', mono, 100)!
  for (const shade of ['█', '▓', '▒']) expect(art.art).toContain(shade)
  expect(art.art).toMatch(/▓ Edges/)
  expect(art.rows.flat().every(s => s.fg === undefined && s.bg === undefined)).toBe(true)
})

test('a centered label keeps a space on both sides inside its box', () => {
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  User->>Claude: draw\n  Claude->>Pele: render', mocha, 40)!
  expect(art.art).toMatch(/│ User +│/)
  expect(art.art).not.toMatch(/│[A-Za-z]|[A-Za-z]│/)
})

test('sequence activations, notes and cancels, and state choices keep their glyphs', () => {
  const seq = drawPele(loadPele().render, 'sequenceDiagram\n  U->>+C: draw\n  Note right of C: busy\n  C-->>-U: art\n  U-xC: cancel', mocha, 60)!
  expect(seq.art).toContain('┃')
  expect(seq.art).toContain('busy')
  expect(seq.art).toContain('╳')
  const state = drawPele(loadPele().render, 'stateDiagram-v2\n  state pick <<choice>>\n  [*] --> pick\n  pick --> Shown: fits\n  pick --> Source: too wide', mocha, 100)!
  expect(state.art).toContain('◇')
})

test('a narrow sequence wraps labels at word breaks and keeps them off the lifelines', () => {
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  participant U as User\n  participant C as Claude\n  participant P as Pele\n  U->>C: draw a diagram\n  C->>P: render(text)\n  P-->>C: SVG\n  C-->>U: text art', mocha, 40)!
  expect(art.width).toBeLessThanOrEqual(40)
  expect(art.art).toContain('render(text)')
  expect(art.art).not.toMatch(/│[A-Za-z(]|[A-Za-z)]│/)
})

test('a sequence with no clean layout at its width is left to the fallback', () => {
  const source = 'sequenceDiagram\n  participant Alice\n  participant Bob\n  participant Carol\n  participant Dave\n  participant Erin\n  Alice->>Bob: hi\n  Bob->>Carol: hi\n  Carol->>Dave: hi\n  Dave->>Erin: hi\n  Erin-->>Alice: ok'
  expect(drawPele(loadPele().render, source, mocha, 50)).toBeNull()
  expect(drawPele(loadPele().render, source, mocha, 80)?.art).toMatch(/╮ +╭/)
})

test('a chart a few columns too wide is laid out again to fit', () => {
  const art = drawPele(loadPele().render, 'xychart-beta\n  title "Render time (ms)"\n  x-axis [flow, seq, class, state, er, pie]\n  y-axis "ms" 0 --> 120\n  bar [80, 60, 110, 90, 100, 40]', mocha, 60)
  expect(art?.width ?? 99).toBeLessThanOrEqual(60)
})

test('a connector stops at the edge of the box it leaves', () => {
  const art = drawPele(loadPele().render, 'timeline\n  title cellsmith so far\n  Oct 18 : Fork prismantis : Pele engine in\n  Oct 18 : 3x faster converter : Warm-up at start\n  Oct 19 : Traced node shapes : Git and subgraph fixes\n  Oct 19 : Step line charts : Lowered x axis', mocha, 70)!
  const periods = art.art.split('\n').filter(l => /Oct 1\d/.test(l))
  expect(periods.length).toBe(4)
  for (const line of periods) expect(line).toMatch(/█─●/)
})

test('a label on a thin ribbon keeps a space from the line and its node', () => {
  const art = drawPele(loadPele().render, 'sankey-beta\nSource,Big,95\nSource,Tiny,1\nSource,Small,4\nBig,Sink,95\nTiny,Sink,1', mocha, 100)!
  expect(art.art).toMatch(/■ Tiny 1 ─/)
  expect(art.art).toMatch(/─ Small 4 ■/)
})

test('a point label never sits on a quadrant border', () => {
  const art = drawPele(loadPele().render, 'quadrantChart\n  title Diagram engines\n  x-axis Slow --> Fast\n  y-axis Plain --> Pretty\n  Real SVG: [0.2, 0.85]\n  Pele: [0.8, 0.7]\n  beautiful-mermaid: [0.6, 0.55]', mocha, 100)!
  const row = art.art.split('\n').find(l => l.includes('beautiful-mermaid'))!
  expect(row.split('│').length - 1).toBe(4)
})

test('mono knocks the shade out around a label and draws tabs in reverse video', () => {
  const mono = pelePalette(PRESETS.mono, CANVAS.mono)
  const pie = drawPele(loadPele().render, 'pie\n  "Layout" : 40\n  "Edges" : 25\n  "Text" : 15\n  "Colors" : 10\n  "Ink" : 10', mono, 100)!
  expect(pie.art).not.toMatch(/[░▒▓]\d|%[░▒▓]/)
  const seq = drawPele(loadPele().render, 'sequenceDiagram\n  A->>B: go\n  loop each block\n    B->>A: draw\n  end', mono, 60)!
  expect(seq.rows.flat().some(s => s.inverse && s.text.includes('loop'))).toBe(true)
})

test('a message label steps off the lifelines it would cover', () => {
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  participant Alice\n  participant Bob\n  participant Carol\n  participant Dave\n  participant Erin\n  Alice->>Bob: hi\n  Erin-->>Alice: ok', mocha, 100)!
  const row = art.art.split('\n').find(l => /\bok\b/.test(l))!
  expect(row.split('│').length - 1).toBe(5)
  expect(row).toMatch(/ ok /)
})

test('a frame condition keeps a space from its tab and steps off the lifelines', () => {
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  autonumber\n  actor U as User\n  participant S as Server\n  U->>+S: request\n  S->>S: self call\n  Note left of U: thinking\n  Note right of S: busy\n  S-->>-U: response\n  opt maybe\n    U-xS: cancel\n  end\n  par one\n    U->>S: a\n  and two\n    S->>U: b\n  end', mocha, 100)!
  expect(art.art).toMatch(/█opt█ \[maybe\]/)
  expect(art.art).toMatch(/│ │ \[two\] +│ │/)
  const badges = art.rows.flat().filter(s => /^\d$/.test(s.text))
  expect(badges.length).toBe(6)
  expect(new Set(badges.map(s => s.bg)).size).toBe(1)
})

test('a frame condition that cannot step off a lifeline sits on a backdrop like its tab', () => {
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  participant C as Claude Code\n  participant P as Render mod\n  participant E as Pele\n  C->>P: render reply\n  loop each mermaid block\n    P->>E: layout(source)\n    E-->>P: SVG\n  end', mocha, 60)!
  const spans = art.rows.flat(), tab = spans.find(s => s.text.includes('loop'))!, condition = spans.find(s => s.text.includes('mermaid'))!
  expect(condition.bg).toBeDefined()
  expect(condition.bg).toBe(tab.bg)
  expect(art.art).toMatch(/█loop██\[each mermaid block\]█/)
})

test('a git tag draws as a one-row pill above its commit', () => {
  const art = drawPele(loadPele().render, 'gitGraph\n  commit id: "x" tag: "v1"\n  commit id: "y"', mocha, 60)!
  expect(art.art).toMatch(/█v1█/)
  expect(art.art).not.toMatch(/[⠁-⣿]/)
})

test('an actor keeps its whole figure at the bottom, and a two-line name stays on adjacent rows', () => {
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  actor U as Claude<br/>Code\n  participant P as Pele\n  U->>P: render', mocha, 60)!
  const firsts = art.art.split('\n').map(l => l.trim().split(/\s+/)[0])
  expect(firsts.slice(-5)).toEqual(['○', '┼', 'Λ', 'Claude', 'Code'])
  expect(firsts[firsts.indexOf('Claude') + 1]).toBe('Code')
})

test('a label that would spill past the left edge is drawn whole', () => {
  const art = drawPele(loadPele().render, 'gitGraph TB:\n  commit id: "a-rather-long-commit-id"\n  commit id: "b"', mocha, 40)!
  expect(art.art).toMatch(/^a-rather-long-commit-id +●/m)
})

test('a quadrant chart at 40 columns keeps every point and its two-line axis titles', () => {
  const source = 'quadrantChart\n  x-axis Rarely used --> Often used\n  y-axis Easy to draw --> Hard to draw\n  Flowchart: [0.9, 0.55]\n  Sequence: [0.75, 0.3]\n  Sankey: [0.15, 0.85]\n  Gantt: [0.45, 0.6]\n  Pie: [0.5, 0.25]'
  const art = drawPele(loadPele().render, source, mocha, 40)!
  for (const label of ['Flowchart', 'Sequence', 'Sankey', 'Gantt', 'Pie']) expect(art.art).toContain(label)
  expect(art.art.match(/●/g)?.length).toBe(5)
  const lines = art.art.split('\n'), hard = lines.findIndex(l => /^Hard to +│/.test(l))
  expect(lines[hard + 1]).toMatch(/^ *draw +│/)
})

test('a wrapped gantt section label keeps each line on its own row', () => {
  const art = drawPele(loadPele().render, 'gantt\n  dateFormat YYYY-MM-DD\n  section API long running background job\n  Parse :t1, 2026-10-05, 2d\n  Review :milestone, t2, 2026-10-08, 4d\n  Ship :milestone, t3, after t2, 3d\n  Draw :active, t4, after t3, 5d', mocha, 100)!
  const lines = art.art.split('\n'), at = (word: string) => lines.findIndex(l => l.includes(word))
  expect([at('API long'), at('running'), at('background job')].map(r => r - at('API long'))).toEqual([0, 1, 2])
})

test('a subgraph title Pele outlines with a halo is drawn once, not refused as two labels', () => {
  for (const columns of [40, 80]) {
    const art = drawPele(loadPele().render, 'flowchart TD\n  a[Start] --> b[Inside]\n  a --> c[Other]\n  b --> d[End]\n  c --> d\n  subgraph s1 [Group title]\n    d\n  end', mocha, columns)!
    expect(art.art.match(/Group title/g)?.length).toBe(1)
  }
})

test('label lines that Pele left-aligns in a box stay flush with each other', () => {
  const art = drawPele(loadPele().render, 'mindmap\n  root((worker v123))\n    v123 long running background job\n      ((GPU API worker cache))\n        [API auth]\n    (nave caf x)', mocha, 60)!
  const lines = art.art.split('\n'), start = (word: string) => lines.find(l => l.includes(word))!.indexOf(word)
  expect(start('v123 long')).toBe(start('background'))
})

test('a mindmap branch runs right up to its label', () => {
  const art = drawPele(loadPele().render, 'mindmap\n  cellsmith\n    Drawing\n    Layout', mocha, 80)!
  expect(art.art).toMatch(/Layout ─+\(/)
  expect(art.art).toMatch(/\)─+ Drawing/)
})

test('a colored block keeps whole rows where lifelines run through it', () => {
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  participant A\n  participant B\n  rect rgb(40,40,80)\n    A->>B: in rect\n  end', mocha, 100)!
  expect(art.art).toMatch(/█│█in rect/)
  expect(art.art).not.toMatch(/[▀▄]/)
})

test('the lines of a wrapped point label move together and leave the quadrants their size', () => {
  const lines = drawPele(loadPele().render, 'quadrantChart\n  a long label that Pele wraps over several lines: [0.62, 0.07]', mocha, 50)!.art.split('\n')
  for (const top of lines.filter(l => l.includes('╮'))) expect(top.trim()).toMatch(/^╭─+╮╭─+╮$/)
  const middle = (words: string) => { const line = lines.find(l => l.includes(words))!; return line.indexOf(words) + words.length / 2 }
  expect(Math.abs(middle('a long label that') - middle('Pele wraps over'))).toBeLessThanOrEqual(1)
  expect(Math.abs(middle('a long label that') - middle('several lines'))).toBeLessThanOrEqual(1)
})

test('a label with no room beside a border sits on a backdrop instead of touching it', () => {
  const art = drawPele(loadPele().render, 'quadrantChart\n  Draw diagram: [0.15, 0.6]', mocha, 30)!
  expect(art.art).not.toMatch(/│Draw|diagram│/)
  expect(art.rows.flat().find(s => s.text === 'Draw')!.bg).toBeDefined()
})

test('a message label that cannot step off a lifeline sits on a backdrop', () => {
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  participant A as Alice\n  participant B as Bob\n  participant C as Carol\n  A->>C: send the whole report now\n  C-->>A: ok', mocha, 50)!
  const row = art.rows.find(r => r.map(s => s.text).join('').includes('send the whole report now'))!
  expect(row.map(s => s.text).join('').split('│').length - 1).toBe(2)
  expect(row.find(s => s.text === 'send')!.bg).toBeDefined()
})

test('a node keeps a space from the subgraph border around it', () => {
  const art = drawPele(loadPele().render, 'flowchart LR\n  A[Start] --> B([Cache])\n  B --> C([Parse step])\n  subgraph S [Work]\n    B\n    C\n  end', mocha, 50)!
  expect(art.art).toMatch(/Parse step/)
  expect(art.art).not.toMatch(/[)╮╯]│/)
})

test('an arrowhead sits on the border of the node it points at', () => {
  const art = drawPele(loadPele().render, 'flowchart TD\n  A((Parse layout)) --> B((Render))', mocha, 60)!
  expect(art.art).toMatch(/▁▼▁/)
  expect(art.art).not.toMatch(/▼\n *│/)
})

test('a wrapped gantt section label gets rows of its own instead of running into the next section', () => {
  const two = drawPele(loadPele().render, 'gantt\n  dateFormat YYYY-MM-DD\n  section Parse the incoming source\n  Read :a1, 2020-01-01, 2d\n  section Draw\n  Paint :a2, after a1, 3d', mocha, 80)!
  expect(two.art.split('\n').find(l => /^\s*Draw\b/.test(l))).not.toMatch(/incoming|source/)
  const three = drawPele(loadPele().render, 'gantt\n  dateFormat YYYY-MM-DD\n  section retry long running background job\n  OK :t1, 2020-01-01, 3d\n  Ship :t2, after t1, 3d\n  section Draw\n  Paint :t3, after t2, 2d', mocha, 80)!
  const lines = three.art.split('\n'), at = (words: string) => lines.findIndex(l => l.includes(words))
  expect([at('running'), at('background job'), at('Draw')].map(r => r - at('retry long'))).toEqual([1, 2, 3])
})

test('a self-message label steps off the loop line beside it', () => {
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  participant A as node\n  participant B as cache DB\n  participant C\n  participant D\n  alt node\n    C->>C: Render long running background job C Layout v123\n  else OK\n    D->>B: abc long running background job\n  end\n  B-)B: snake_case Queue\n  D->D: Parse worker\n  alt v123 retry retry\n    D->B: auth C C\n  else API\n    C-xC: node\n  end', mocha, 70)!
  expect(art.art).toMatch(/╯ worker/)
})

test('a stacked axis title keeps every letter', () => {
  const art = drawPele(loadPele().render, 'xychart-beta\n  title "worker Ship it v123"\n  x-axis 1 --> 35\n  y-axis "long running background job" -34 --> 176\n  bar [1, 10, 2, 591, 5, -14, -8, 92, 53]', mocha, 60)!
  expect(art.art.split('\n').map(l => l[0] ?? ' ').join('').replace(/\s/g, '')).toBe('longrunningbackgroundjob')
})

test('a quadrant label never hides a point marker', () => {
  const source = 'quadrantChart\n  title Login page GPU\n  x-axis Parse --> node\n  y-axis GPU --> abc\n  quadrant-2 x x\n  quadrant-3 long running background job\n  quadrant-4 Ship it C\n  retry: [0.71, 0.67]\n  node: [0.39, 0.23]\n  GPU: [0.84, 0.15]'
  for (const columns of [30, 60, 100]) {
    const art = drawPele(loadPele().render, source, mocha, columns)
    if (art) expect(art.art.match(/●/g)?.length).toBe(3)
  }
  const crowded = drawPele(loadPele().render, 'quadrantChart\n  x-axis Parse --> DB\n  y-axis Login page --> worker\n  quadrant-1 auth Ship it\n  quadrant-2 Ship it x\n  quadrant-3 node\n  snake_case Login page: [0.27, 0.98]\n  long running background job 100: [0.33, 0.09]\n  OK: [0.56, 0.32]', mocha, 60)!
  expect(crowded.art.match(/●/g)?.length).toBe(3)
  expect(crowded.art).toContain('Ship it x')
})

test('a frame tab whose label sits on its bottom edge stays solid in mono', () => {
  const mono = pelePalette(PRESETS.mono, CANVAS.mono)
  const art = drawPele(loadPele().render, 'sequenceDiagram\n  participant A\n  participant B\n  participant C as retry long running background job worker\n  actor D as C auth\n  participant E as Ship it\n  C-->C: Parse\n  D->>C: x\n  D-->D: GPU C GPU\n  E-->E: Parse long running background job v123\n  alt Edges v123 snake_case\n    E-->>B: v123 OK\n  else 100 OK\n    D-xA: auth x DB\n  end', mono, 60)!
  expect(art.art.split('\n').find(l => l.includes('alt'))).not.toMatch(/░/)
})

test('a self-relationship line joins the entity border', () => {
  const art = drawPele(loadPele().render, 'erDiagram\n  ABC6 |o--|{ SNAKE_CASE2 : "x auth"\n  EDGES7 ||..o{ ABC6 : "long running background job"\n  ABC6 |o..|{ ABC6 : "retry"\n  SNAKE_CASE2 }o--|{ ABC6 : "x"\n  EDGES7 {\n    string node3\n    date cache1 PK\n    int render8 "Layout cache GPU"\n  }\n  RENDER1 {\n    date draw1 "C"\n  }\n  ABC6 {\n    string draw2\n  }', mocha, 80)!
  expect(art.art).toMatch(/├┼┄*╯/)
  expect(art.art).not.toMatch(/│┼┄*╯/)
})

test('a thin flow drawn over a band of its own shade leaves the band shaded in mono', () => {
  const mono = pelePalette(PRESETS.mono, CANVAS.mono)
  const art = drawPele(loadPele().render, 'sankey-beta\nnave caf,Layout,48\nnave caf,Login page,1\nnave caf,Login page,85\nLayout,Login page,381\nLayout,Login page,9\nLayout,Login page,228', mono, 40)!
  expect(art.art).toContain('Login page 704')
  expect(art.art).not.toMatch(/▓█+▒/)
})

test('a wrapped label is never drawn with another label between its lines', () => {
  const source = 'quadrantChart\n  x-axis Layout --> Queue\n  y-axis Ship it --> GPU\n  quadrant-2 long running background job nave caf\n  retry: [0.96, 0.62]\n  API C: [0.32, 0.87]\n  v123 cache: [0.13, 0.93]\n  x Parse: [0.24, 0.19]\n  retry: [0.46, 0.87]\n  Edges: [0.19, 0.09]\n  x abc: [0.56, 0.10]'
  for (const columns of [40, 100]) {
    const art = drawPele(loadPele().render, source, mocha, columns)
    if (!art) continue
    const lines = art.art.split('\n'), first = lines.findIndex(l => l.includes('long running'))
    expect(lines[first + 1]).toMatch(/background job/)
  }
})

test('a subgraph title squeezed against an edge moves along its band to a gap with room', () => {
  const art = drawPele(loadPele().render, 'flowchart RL\n  n0[/"long running background job snake_case"\\]\n  n1("worker 数据 C++ Login page")\n  n2[["x Login page Parse"]]\n  n3{{"retry 100% Edges"}}\n  n4{{"100%"}}\n  n0 --o|Layout Layout| n1\n  n1 ==>|DB| n2\n  n1 -.-> n3\n  n3 --- n4\n  n4 <--> n2\n  subgraph s1 [GPU nave caf]\n    n4\n    n3\n  end', mocha, 80)!
  expect(art.art).toMatch(/│█GPU nave caf█│/)
})

test('a label on a backdrop never runs into the label beside it', () => {
  const source = 'quadrantChart\n  x-axis Login page --> OK\n  y-axis auth --> Ship it\n  quadrant-1 Layout Ship it\n  quadrant-2 retry\n  quadrant-3 Login page\n  quadrant-4 Draw\n  DB: [0.43, 0.80]\n  nave caf Queue: [0.57, 0.09]\n  GPU: [0.76, 0.38]\n  abc: [0.47, 0.50]\n  Render: [0.65, 0.83]\n  v123 100: [0.86, 0.27]\n  cache: [0.26, 0.19]\n  C Queue: [0.25, 0.98]'
  for (const columns of [40, 60, 100]) {
    const art = drawPele(loadPele().render, source, mocha, columns)
    if (art) expect(art.art).not.toMatch(/\w█\w/)
  }
})

test('a subgraph border that moves out for a node inside never runs into a node outside', () => {
  const hexagon = 'flowchart RL\n  n0[["naïve café auth Queue 100%"]]\n  n1[/"API 100% retry Edges"/]\n  n2{{"x retry"}}\n  n3>"Login page naïve café auth"]\n  n4{{"OK"}}\n  n0 --x n1\n  n1 --- n2\n  n1 ==>|worker auth| n3\n  n1 -.->|retry| n4\n  n1 ==> n0\n  subgraph s1 [Parse]\n    n4\n    n3\n  end'
  const slope = 'flowchart RL\n  n0[\\"v1.2.3 Ship it v1.2.3 OK"\\]\n  n1(("日本語テキスト a-b-c"))\n  n2{"Edges 日本語テキスト Layout"}\n  n3[/"x auth"\\]\n  n4[["数据 C++ naïve café"]]\n  n5[("数据 retry auth")]\n  n0 --- n1\n  n1 -.->|API| n2\n  n2 --o n3\n  n2 --x n4\n  n2 <--> n5\n  n0 -.-> n1\n  subgraph s1 [auth]\n    n5\n    n4\n  end'
  for (const [source, edge] of [[hexagon, '>'], [slope, '╲']] as const) {
    const art = drawPele(loadPele().render, source, mocha, 70)!
    expect(art.art).toContain(`${edge} │`)
    expect(art.art).not.toContain(`${edge}│`)
  }
})

test('a stacked axis title starts below a chart title it would touch', () => {
  const source = 'xychart-beta\n  title "Median render time by diagram size (warm cache)"\n  x-axis ["tiny", "small", "medium", "large", "huge"]\n  y-axis "render time in ms" 0 --> 40\n  line [4, 9, 14, 22, 37]'
  for (const columns of [30, 50]) expect(drawPele(loadPele().render, source, mocha, columns)!.art).not.toMatch(/^\w\w/m)
})

test('a mindmap cloud keeps its own border row under the node above', () => {
  const source = 'mindmap\n  root((node))\n    (cache)\n      )node(\n    {{Parse API}}'
  for (const columns of [30, 40]) expect(drawPele(loadPele().render, source, mocha, columns)!.art).toMatch(/ cache\s*│\n.*╰┬─*╯/)
})

test('two numbers never run together into one', () => {
  const sankey = 'sankey-beta\nC,node,95\nnave caf,100,700\nC,100,1\n100,node,2\nC,node,811\nretry,nave caf,3'
  for (const columns of [60, 80, 160]) expect(drawPele(loadPele().render, sankey, mocha, columns)?.art ?? '').not.toMatch(/700\d|7100/)
  const chart = 'xychart-beta horizontal\n  title "OK Layout Login page"\n  x-axis ["v123", "Login page", "Edges", "retry"]\n  y-axis "node"\n  line [3, 865, 4, 598]\n  line [759, 660, -6, 59]\n  line [424, 364, 110, -5]'
  expect(drawPele(loadPele().render, chart, mocha, 30)?.art ?? '').not.toMatch(/\d{5}/)
})

test('a self-message label never runs into the participant boxes below', () => {
  const source = 'sequenceDiagram\n    participant L as Team lead\n    participant A as Server\n    participant C as Worker\n    participant M as Reviewers\n    L->>A: opens report (team id, workspace)\n    A->>C: existing request\n    C-->>A: task counts as JSON\n    C->>L: embed in report\n    A->>A: snapshot stored on report\n    L->>A: suggestions with @mentions + attachments\n    M->>A: Draft review\n    A-->>M: draft, Approve / Edit / Reject\n    M->>A: Approve\n    A->>A: store + log, queue, files, reply, announcement'
  for (const columns of [60, 80, 120]) {
    const lines = (drawPele(loadPele().render, source, mocha, columns)?.art ?? '').split('\n'), foot = lines.findIndex(l => l.includes('┴'))
    expect(lines.slice(foot < 0 ? lines.length : foot).some(l => l.includes('announcement'))).toBe(false)
  }
})

test('a message label on a coloured block keeps the lifeline beside it whole', () => {
  const source = 'sequenceDiagram\n  participant A as GPU Layout Queue\n  participant B\n  actor C\n  participant D\n  actor E as Edges\n  D->>A: OK\n  rect rgb(41, 58, 74)\n    A-->>D: Ship it\n  end\n  rect rgb(50, 117, 182)\n    E-xB: DB\n  end\n  loop Parse retry GPU\n    C-xA: abc DB 100\n  end\n  alt Layout\n    D-)D: Ship it\n  else cache OK Render\n    A-->A: node\n  end\n  Note right of A: abc\n  critical GPU API\n    B-xC: Edges\n  end\n  rect rgb(165, 47, 98)\n    A-->>B: Render\n  end\n  E-)D: Ship it'
  const lines = drawPele(loadPele().render, source, mocha, 60)!.art.split('\n'), row = lines.findIndex(l => l.includes('DB'))
  expect([...lines[row]!].some((ch, c) => ch === ' ' && /[│┼]/.test([...lines[row - 1]!][c] ?? '') && /[│┼]/.test([...lines[row + 1]!][c] ?? ''))).toBe(false)
})

test('a mindmap that fits around its root keeps its radial layout instead of turning into a tree', () => {
  const source = 'mindmap\n  root((Pele in terminal))\n    Layout\n      measurer\n      cells\n    Drawing\n      box lines\n      braille curves\n    Color\n      truecolor'
  const art = drawPele(loadPele().render, source, mocha, 80)!
  expect(art.art.split('\n').some(l => l.includes('Pele in terminal') && l.includes('Layout'))).toBe(true)
})

test('a thin sankey flow rising to the top of its node ends in the node bar, not a row above it', () => {
  const mono = pelePalette(PRESETS.mono, CANVAS.mono)
  const art = drawPele(loadPele().render, 'sankey-beta\nAPI,Parse,2\nx,Parse,503\nShip it,Parse,55\nShip it,API,2\nAPI,x,2', mono, 80)!
  expect(art.art).not.toMatch(/╭╴/)
  expect(art.art).toMatch(/╭─+▒/)
})

test('a subgraph a few columns too wide for its border spacing still draws, with the nodes against the border', () => {
  const source = 'flowchart RL\n  n0[\\"v1.2.3 Ship it v1.2.3 OK"\\]\n  n1(("日本語テキスト a-b-c"))\n  n2{"Edges 日本語テキスト Layout"}\n  n3[/"x auth"\\]\n  n4[["数据 C++ naïve café"]]\n  n5[("数据 retry auth")]\n  n0 --- n1\n  n1 -.->|API| n2\n  n2 --o n3\n  n2 --x n4\n  n2 <--> n5\n  n0 -.-> n1\n  subgraph s1 [auth]\n    n5\n    n4\n  end'
  const art = drawPele(loadPele().render, source, mocha, 60)
  expect(art?.width).toBeLessThanOrEqual(60)
  expect(drawPele(loadPele().render, source, mocha, 80)!.art).not.toMatch(/│┌┬/)
})

test('a self-loop is drawn with box lines instead of braille dots', () => {
  const source = 'flowchart LR\n  U[You] --> M[Memory tree<br/>builds view]\n  M --> C[claude -p]\n  C -- messages --> M\n  M -. summaries via<br/>claude -p haiku .-> M'
  for (const columns of [80, 120]) {
    const art = drawPele(loadPele().render, source, mocha, columns)!.art
    expect(art).not.toMatch(/[\u2801-\u28ff]/)
    expect(art).toMatch(/╰─*╯/)
  }
})

test('the lines of a wrapped label stay on consecutive rows', () => {
  const source = 'flowchart LR\n  U[You in unii TUI] --> M[Memory tree<br/>builds view]\n  M --> C["claude -p<br/>system = Unii prompt + view<br/>--mcp-config zoom/date"]\n  C -- stream-json --> U\n  C -- messages --> M\n  M -. summaries via<br/>claude -p haiku .-> M'
  const lines = drawPele(loadPele().render, source, mocha, 120)!.art.split('\n')
  expect(lines.findIndex(l => l.includes('zoom/date'))).toBe(lines.findIndex(l => l.includes('--mcp-config')) + 1)
  const members = drawPele(loadPele().render, 'classDiagram\n  class GPU89 {\n    +int ok\n    int c\n  }\n  class DB11 {\n    -String ok\n    String layout\n    +layout() void\n    +navecaf()\n  }\n  DB11 "*" ..> "many" DB11', pelePalette(PRESETS.mono, CANVAS.mono), 60)!.art.split('\n')
  expect(members.findIndex(l => l.includes('int c '))).toBe(members.findIndex(l => l.includes('+int ok')) + 1)
  expect(members.join('\n')).not.toMatch(/─\+int ok/)
})
