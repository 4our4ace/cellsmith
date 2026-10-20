// node tools/cli.mjs <file.mmd>... [--plain] [--cols N] [--theme name]
import { readFileSync } from 'node:fs'
import { THEMES, drawSource, toAnsi } from './lib.mjs'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  return i < 0 ? fallback : args.splice(i, 2)[1]
}
const plainAt = args.indexOf('--plain')
const plain = plainAt >= 0 && args.splice(plainAt, 1).length > 0
const columns = Number(option('--cols', process.stdout.columns || 120))
const theme = option('--theme', 'catppuccin-mocha')
if (!THEMES.includes(theme)) throw new Error(`unknown theme ${theme}; one of ${THEMES.join(', ')}`)

for (const file of args) {
  const t0 = performance.now()
  const art = drawSource(readFileSync(file, 'utf8'), { theme, columns })
  const ms = (performance.now() - t0).toFixed(1)
  const name = file.split('/').at(-1)
  if (!art) { console.log(`── ${name}: did not fit ${columns} columns or did not parse\n`); continue }
  console.log(`── ${name} · ${art.type} · ${art.width}×${art.rows.length} cells · ${ms} ms`)
  console.log(plain ? art.art : toAnsi(art).join('\n'))
  console.log()
}
