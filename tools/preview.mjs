// node tools/preview.mjs <out.html> <file.mmd>... [--cols N] [--theme name]
// Writes the drawn diagrams as an HTML page, for screenshots with a headless browser.
import { readFileSync, writeFileSync } from 'node:fs'
import { CANVAS } from '../plugin/hooks/presets.ts'
import { drawSource } from './lib.mjs'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  return i < 0 ? fallback : args.splice(i, 2)[1]
}
const columns = Number(option('--cols', 120))
const theme = option('--theme', 'catppuccin-mocha')
const [out, ...files] = args

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const span = s => {
  if (s.fg && !s.bg && /^█+$/.test(s.text)) s = { ...s, text: ' '.repeat(s.text.length), bg: s.fg, fg: undefined }
  const style = `${s.fg ? `color:${s.fg};` : ''}${s.bg ? `background:${s.bg};` : ''}${s.bold ? 'font-weight:bold;' : ''}`
  return style ? `<span style="${style}">${esc(s.text)}</span>` : esc(s.text)
}

const figures = files.map(file => {
  const name = esc(file.split('/').at(-1))
  const art = drawSource(readFileSync(file, 'utf8'), { theme, columns })
  if (!art) return `<figure><figcaption>${name}: not drawn</figcaption></figure>`
  return `<figure><figcaption>${name} · ${art.type}</figcaption><pre>${art.rows.map(r => r.map(span).join('')).join('\n')}</pre></figure>`
})

writeFileSync(out, `<!doctype html><meta charset="utf-8"><style>
body{background:${CANVAS[theme] ?? '#1e1e2e'};color:#cdd6f4;margin:16px;display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start}
pre{font:15px/18px 'DejaVu Sans Mono',monospace;margin:0}
figcaption{color:#7f849c;font:12px sans-serif;margin-bottom:6px}
figure{margin:0}
</style>${figures.join('')}`)
