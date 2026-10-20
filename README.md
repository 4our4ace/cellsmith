# cellsmith

Claude Code replies drawn on the terminal's cell grid. cellsmith is a Claude Code mod that gives tables, code, headings, lists and tool calls a color theme, and turns every `mermaid` block into a diagram: [Pele](https://pele.run) lays it out, and `plugin/hooks/pele.ts` draws the layout with box-drawing lines, block fills and real text. It needs nothing but text and true color, so it works in any modern terminal.

![A reply drawn by cellsmith: a flowchart, a sequence diagram, a pie chart, a gantt chart, a state diagram and a bar chart side by side](plugin/docs/images/hero.png)

## Install

Requires Claude Code **2.1.287** or later. In Claude Code:

```
/plugin marketplace add 4our4ace/cellsmith
/plugin install cellsmith@cellsmith
```

Then `/reload-plugins`, or start a new session. `/cellsmith` shows the help screen, `/cellsmith demo` a reply with everything it draws, and `/cellsmith theme <name>` switches among 16 themes. If you use [prismantis](https://github.com/NahumLitvin/prismantis), disable it (`claude plugin disable prismantis@prismantis`), since both draw replies.

Every option, screenshot and limit is in the [plugin README](plugin/README.md).

![The same reply drawn by Claude Code on the left and by cellsmith on the right](plugin/docs/images/compare.png)

## What it draws

- **Diagrams:** flowcharts, sequence, state, class and ER diagrams, pie, bar and line charts, gantt charts, timelines, mindmaps, quadrant charts, git graphs and sankey diagrams. A diagram too wide for the terminal is laid out again narrower or top-down; one that still does not fit falls back to box art, then to its source.
- **Text:** themed tables with copy buttons, highlighted code, headings, task lists, quotes and alerts, numbers and paths in their own colors, Hebrew and Arabic right to left, and LaTeX math as images in kitty and Ghostty.
- **Claude Code itself:** one-line tool rows, your prompts in a bubble, bar or chevron, and the turn footer.

No network calls. It runs a program only when you click `⧉ html` (the clipboard helper) or turn on LaTeX (RaTeX's renderer).

## Repository

| Path | What |
| --- | --- |
| `.claude-plugin/marketplace.json` | the repository is a plugin marketplace named `cellsmith` |
| `plugin/` | the mod, the only part that gets installed; its own [README](plugin/README.md) and [AGENTS.md](plugin/AGENTS.md) |
| `scripts/` | dev only: the vendor build (Pele with 13 diagram types), benchmark, render snapshots |
| `tools/` | run the diagram engine from Node, outside Claude Code |
| `samples/` | one `.mmd` file per diagram type |

## Draw diagrams without Claude Code

Node 24 or newer runs the plugin's TypeScript directly.

```sh
node tools/cli.mjs samples/*.mmd                      # 24-bit color, sized to the window
node tools/cli.mjs samples/pie.mmd --theme dracula    # any of the 16 themes
node tools/cli.mjs samples/flowchart-lr.mmd --cols 60 # wide charts turn top-down to fit
node tools/cli.mjs samples/er.mmd --plain             # no color, just the characters
node tools/preview.mjs out.html samples/*.mmd         # an HTML page
```

`tools/ansi2html.mjs` turns a `tmux capture-pane -e` dump of a live session into HTML for screenshots (see `plugin/.claude/skills/live-check`).

## Develop

```sh
git clone https://github.com/4our4ace/cellsmith
claude plugin marketplace add ./cellsmith    # a local marketplace is read live: /reload-plugins after an edit
claude plugin install cellsmith@cellsmith
npm --prefix cellsmith/scripts install
cd cellsmith/plugin
claude plugin validate .
claude plugin test .
../scripts/node_modules/.bin/tsc -p .
npm --prefix ../scripts run snapshot
npm --prefix ../scripts run bench:check
```

`npm --prefix scripts run build:vendor` rebuilds `plugin/hooks/vendor/` after changing Pele's version or the bundled diagram types. Tested on Linux (WSL); macOS and native Windows are not checked by hand yet.

## Credits and license

MIT. cellsmith is © [4our4ace](https://github.com/4our4ace). It is a fork of [prismantis](https://github.com/NahumLitvin/prismantis) 0.14.0, © Nahum Litvin, and draws diagrams laid out by [Pele](https://github.com/obsidianmd/pele), © kepano. See [plugin/LICENSE](plugin/LICENSE) and [plugin/docs/THIRD_PARTY_NOTICES.md](plugin/docs/THIRD_PARTY_NOTICES.md).

cellsmith is an independent project. It is not affiliated with or endorsed by Anthropic, Obsidian, the prismantis project or the Mermaid project. Claude and Claude Code are trademarks of Anthropic.
