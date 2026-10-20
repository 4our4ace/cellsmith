// Shared by the dev tools: runs the plugin's own engine (hooks/pele.ts) under Node.
import { loadPele } from '../plugin/hooks/vendor/pele.js'
import { drawPele, pelePalette } from '../plugin/hooks/pele.ts'
import { CANVAS, PRESETS } from '../plugin/hooks/presets.ts'

const { render } = loadPele()

export const THEMES = Object.keys(PRESETS)

export const drawSource = (source, { theme = 'catppuccin-mocha', columns = 120 } = {}) =>
  drawPele(render, source, pelePalette(PRESETS[theme] ?? {}, CANVAS[theme] ?? '#1e1e2e'), columns)

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(';')

export const toAnsi = art => art.rows.map(spans => spans.map(s => {
  const codes = ['0', ...(s.bold ? ['1'] : []), ...(s.fg ? [`38;2;${rgb(s.fg)}`] : []), ...(s.bg ? [`48;2;${rgb(s.bg)}`] : [])]
  return `\x1b[${codes.join(';')}m${s.text}`
}).join('') + '\x1b[0m')
