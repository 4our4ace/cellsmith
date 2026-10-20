// node tools/ansi2html.mjs <screen.ans> <out.html>
// Turns `tmux capture-pane -e -p` output into an HTML page, for screenshots of a live session.
import { readFileSync, writeFileSync } from 'node:fs'
const [inp, out] = process.argv.slice(2)
const base = ['#000000','#cd3131','#0dbc79','#e5e510','#2472c8','#bc3fbc','#11a8cd','#e5e5e5','#666666','#f14c4c','#23d18b','#f5f543','#3b8eea','#d670d6','#29b8db','#ffffff']
const c256 = n => n < 16 ? base[n] : n < 232 ? (n -= 16, '#' + [Math.floor(n / 36), Math.floor(n / 6) % 6, n % 6].map(v => (v ? v * 40 + 55 : 0).toString(16).padStart(2, '0')).join('')) : '#' + ((n - 232) * 10 + 8).toString(16).padStart(2, '0').repeat(3)
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
let st = {}, html = ''
for (const line of readFileSync(inp, 'utf8').split('\n')) {
  for (const part of line.split(/(\x1b\[[0-9;:]*m)/)) {
    const m = /^\x1b\[([0-9;:]*)m$/.exec(part)
    if (!m) { if (part) { const fg = st.inv ? st.bg ?? '#1e1e2e' : st.fg, bg = st.inv ? st.fg ?? '#cdd6f4' : st.bg; const css = `${fg ? `color:${fg};` : ''}${bg ? `background:${bg};` : ''}${st.b ? 'font-weight:bold;' : ''}${st.i ? 'font-style:italic;' : ''}${st.d ? 'opacity:.6;' : ''}${st.u || st.s ? `text-decoration:${st.u ? 'underline ' : ''}${st.s ? 'line-through' : ''};` : ''}`; html += css ? `<span style="${css}">${esc(part)}</span>` : esc(part) } continue }
    const p = (m[1] || '0').split(/[;:]/).map(Number)
    for (let i = 0; i < p.length; i++) {
      const v = p[i]
      if (v === 0) st = {}; else if (v === 1) st.b = 1; else if (v === 2) st.d = 1; else if (v === 3) st.i = 1; else if (v === 4) st.u = 1; else if (v === 7) st.inv = 1; else if (v === 9) st.s = 1
      else if (v === 22) { st.b = 0; st.d = 0 } else if (v === 23) st.i = 0; else if (v === 24) st.u = 0; else if (v === 27) st.inv = 0; else if (v === 29) st.s = 0
      else if (v === 39) st.fg = null; else if (v === 49) st.bg = null
      else if (v >= 30 && v <= 37) st.fg = base[v - 30]; else if (v >= 90 && v <= 97) st.fg = base[v - 82]
      else if (v >= 40 && v <= 47) st.bg = base[v - 40]; else if (v >= 100 && v <= 107) st.bg = base[v - 92]
      else if (v === 38 || v === 48) { const k = v === 38 ? 'fg' : 'bg'; if (p[i + 1] === 2) { st[k] = '#' + p.slice(i + 2, i + 5).map(x => x.toString(16).padStart(2, '0')).join(''); i += 4 } else if (p[i + 1] === 5) { st[k] = c256(p[i + 2]); i += 2 } }
    }
  }
  html += '\n'
}
writeFileSync(out, `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#1e1e2e;color:#cdd6f4}pre{font:14px/17px 'DejaVu Sans Mono',monospace;margin:8px}</style><pre>${html}</pre>`)
