# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-10-22

### Changed

- Diagrams are laid out by Pele 1.7.0 (was 1.6.0). Some flowcharts change, mostly ones with Chinese, Japanese or Korean labels, which Pele now wraps differently.
- pelext 0.2.0 fixes drawing glitches: mono pie slices no longer stick out half a cell past the pie's edge; sequence frame labels no longer erase the lifelines beside them, and frame tabs, else labels and self-message labels no longer cover the border they meet; a class multiplicity no longer covers its box's border; a subgraph title squeezed between edges no longer touches one; thin sankey flows reach their node, a sankey label that would hide the end of a flow moves to a free row, and mono sankey ribbons have no one-cell holes.
- pelext 0.2.1 fixes self-loops: a state or flowchart self-loop comes back on a row of its own instead of folding onto the box's bottom border or drawing as braille dots, two or three loops on one side of a box each get their own rows, and a loop's return leg no longer lands on a class or ER divider. Class members and timeline events no longer land on a divider or pill edge beside a wrapped label, and narrow mindmap leaves end in a line instead of a braille dot.
- The diagram engine is now its own package, [pelext](https://github.com/4our4ace/pelext), vendored as `hooks/vendor/pelext.js`. Every drawing is the same as before. Its command (`npx github:4our4ace/pelext diagram.mmd`) replaces `tools/cli.mjs` and `tools/preview.mjs`, and the engine's tests and quality tools moved with it.
- The mod is renamed from pelemantis to cellsmith, and its marketplace from pele-terminal to cellsmith. It installs as `cellsmith@cellsmith`, the command is `/cellsmith`, and other mods reach it as `$.cellsmith` and the `cellsmith.markdown` event. Options set for `pelemantis@pele-terminal` need setting again under the new id.
- Diagrams draw faster than prismantis's engine draws the same types. Turning Pele's SVG into terminal cells takes about a third of the time it did. Colors are plain numbers, the canvas is a few flat arrays, cells nothing was drawn on are skipped, fills walk each scanline's edge crossings once, labels look up each cell once while they slide, and the SVG reader splits attributes without a regex. The drawing is the same character for character.
- A diagram that cannot fit is given up sooner. The engine first asks Pele for the narrowest layout, and when that is the same layout it already has, it stops drawing as soon as the boxes and labels show it is too wide, instead of drawing it whole and throwing it away. Fills, circles and line checks also do less work per drawing; every drawing comes out the same as before.
- One second after a session starts, cellsmith draws five tiny diagrams (flowchart, sequence, class, state, ER) in the background, 100 ms apart, so the first real diagram of each kind does not pay the engine's first-run cost. The first flowchart of a session drew in about 48 ms and now draws in about 8; prismantis takes about 21.
- Uncolored stretches of a diagram are plain text inside their row, not elements of their own, so the demo reply is 11% fewer nodes.
- Every flowchart node shape has its own outline in box-drawing and block characters instead of braille dots, which many fonts draw small and faint. `[rect]` nodes get square corners (`┌┐`) and `(rounded)` nodes round ones (`╭╮`), as in Pele's SVG. Stadiums get `(` `)` sides, cylinders a lid line and double circles a double-line box. Decisions, circles, hexagons, flags, parallelograms and trapezoids keep their corners exact, with `╱╲` slopes between `▁▔` edges.
- Boxes side by side share rows. A box a few pixels lower than its neighbor no longer adds a row, so class, ER, state and flowchart diagrams are shorter.
- Shapes under a row and a half tall (gantt tasks, sequence notes and frame tabs, mindmap branches, git branch labels) draw as one filled row with their label centered, instead of straddling two rows.
- Filled boxes keep their top and bottom edges to the half row (`▄` and `▀`), so stacked timeline events stay separate boxes, and a line leaving a filled box starts at its edge instead of in a block of the box's color.
- A box holds only the labels that fit inside it. A quadrant point label that spills over its quadrant, as it does in Pele's SVG, no longer stretches the quadrant over its neighbor.
- Gantt charts draw one row per task, dotted gridlines over the section bands, and one today line under a `▼`. Solid bars cover the gridlines and today line under them, and the translucent bar of an active task lets the today line show through, as in the SVG.
- Line charts draw each value as a flat step centered on its label, joined by one riser halfway to the next, in box-drawing lines over faint `·` gridlines, instead of braille dots along a slope. Rows between y gridlines come in even numbers, so a value halfway between two gridlines gets its own row. The x axis sits one row below the lowest gridline, so the lowest value never hides in it. Axis ticks show again (`┤` on the y axis, `┬` on the x axis), and a mindmap branch shorter than a cell reaches its label.
- Where a line crosses a bar it turns the canvas color if its own color would not show on the bar, and a bar no longer bleeds half a cell past the line or below its axis.
- Pie slices and sankey ribbons keep their curved edges to an eighth of a row (`▁▂▃▄▅▆▇`) instead of half a row. Sankey node bars end on the same eighth as their ribbons, two ribbons that meet show no sliver of background between them, and a ribbon thinner than a row draws as a line.
- A pie stays round at any width: its slices and their labels scale together.
- Sequence diagrams draw activations as a heavy `┃` on the lifeline, actors as a small `○ ┼ Λ` figure, notes as filled boxes, self-messages as a loop back to the lifeline, and a cancelled message (`-x`) ending in `╳`. State diagram choices draw as `◇`, mindmap clouds and bangs get their own outlines.
- Rotated axis labels (the y axis of quadrant charts and xy charts) read across, wrapped into a short block beside the chart, instead of one letter per row. Only when that would make the chart too wide for the terminal do they stack again.
- Lines and labels keep a clean distance. An edge runs right up to a filled node instead of stopping half a cell short, and a centered label always has a space on both sides inside its box. A free label that touches or covers a vertical line, a marker or a fill slides to the nearest spot with a space on both sides, and a label lying across a horizontal line, like a quadrant border or a thin sankey ribbon, gets a space cut out of the line on each side. A message label that would sit on a middle lifeline steps off it, and the lifeline is drawn whole where the label was. Frame conditions do the same inside their frame (`│ │ [too wide]`), and keep a space from their tab (`█opt█ [maybe]`). A condition too long for any gap between lifelines sits on a backdrop in its tab's color, as tabs and notes do, instead of printing over the line. A label beside a fill, like a pie slice's percentage, gets the cell of fill next to it cleared, and a label packed against a small node steps a cell away from it.
- Diagrams use the width they are given. A sequence diagram too wide for the terminal first tries tighter actor spacing, then labels wrapped at word breaks, then participants one column apart, and no longer uses Pele's compact layout, which split words (`layout(sou` / `rce)`), laid labels over lifelines and merged neighboring participant boxes. When no clean layout fits, the reply falls back as before. Any other diagram that comes out a few columns too wide is laid out again a little narrower instead of falling back, so many more charts, gantts, quadrants and timelines draw in narrow panes.
- Lines under a translucent fill show through it, as in the SVG, and timeline connectors run unbroken from period to dot to events.
- A label whose color is too close to the fill behind it shifts toward the theme's text or background color until it reaches 3:1 contrast. Series beyond the theme's palette get dimmed variants of its colors, so neighboring series always differ.
- The mono theme fills each pie slice and sankey flow with its own shade (`▓▒░▚`, the first in solid blocks), draws finished gantt tasks in `░`, and shows labels on solid fills in reverse video, so diagrams that rely on color stay readable. A label on a shade gets a space cleared on each side (`░░░ README ░░░`), and sequence frame tabs and one-line notes draw in reverse video like the colored themes' pills.

### Fixed

- A composite state draws its border and header line around a faint fill, instead of a solid block with its header line poking out of the sides.
- End states and git merge commits draw as a ring with a dot (`◉`), not a plain dot.
- A gantt section band or task bar next to the axis no longer spills into the axis row, and a bar ends at its last day instead of covering the next day's gridline.
- Sequence diagram frames show the lifelines through them, nested frames and the `else` divider are drawn, and a note covers the lifelines under it.
- Class boxes drop the empty compartments Pele draws for a class without attributes or methods, and ER entity headers get their full separator line.
- A pie's slice labels no longer push its legend apart, so legend entries sit on consecutive rows.
- Git graph commit labels, which Pele tilts 45 degrees, lie flat under their commit and step down a row instead of printing over each other.
- Class and ER compartments keep their text columns aligned, and labels no longer touch the box border after the layout is squeezed to the terminal grid.
- The mono theme no longer drops gantt tasks that are done, which drew in the canvas color.
- A line leaving a tall filled box, like a vertical timeline's connector, starts at the box edge instead of cutting into its last column.
- Quadrant chart point labels no longer print over the quadrant borders, and stacked axis labels keep a space from the chart. A layout whose labels would print over each other is not used.
- Class diagram multiplicities keep a space from their relation marker (`◇ 1`).
- A colored sequence `rect` block ends on whole rows where lifelines run through it, instead of a half row with a notch at each lifeline (`▀│▀`).
- Nodes inside a subgraph keep their own boxes. A box re-centered every label inside it, nested boxes' labels included, so two nodes in a subgraph merged into one box. Now a label belongs to the smallest box around it, and only a label already near the middle is centered. Quadrant chart point labels, which the same bug pulled to the middle of their quadrant, now sit next to their points.
- Git tags draw as a one-row pill above their commit (`█v1█`) instead of a braille outline around a stray dot.
- A sequence actor at the bottom keeps its whole `○ ┼ Λ` figure with its name below it, and an actor or participant name on two lines stays on adjacent rows.
- A label that would start left of the diagram, like a long commit id in a top-to-bottom git graph, is drawn whole instead of cut off at the edge.
- Quadrant charts draw in 40 columns. Each point keeps its own row, and a y-axis title that wraps onto two lines stays together beside its quadrants.
- A mindmap branch runs right up to its label (`Layout ─────(`), and class compartment dividers reach the box border.
- A frame condition on a backdrop joins its tab into one bar (`█loop██[each mermaid block]█`), and an edge label on a backdrop is centered on its widest line.
- Left-aligned text in a box, like class members, keeps a space from the border after the box grows to fit it. The lines of a label that Pele left-aligns, as it does for some mindmap nodes, stay flush with each other instead of one line being re-centered on its own.
- A label that would cover a marker steps down a row when there is room, and a layout where a label would still print over a marker is not used. The outline-only copy Pele draws under a subgraph title that edges pass through is skipped, so the title counts as one label and the diagram is not refused. A wrapped label keeps each line on its own row, so a long gantt section name no longer prints one line over another.
- A line drawn over a fill of its own color draws as part of the fill instead of disappearing into it.
- A diagram too wide for the terminal is first laid out in the direction its author wrote, so a mindmap that fits around its root stays radial and a left-to-right chart that fits stays left to right. When that does not fit, the next layouts may turn top-down at any width, not only below 61 columns, and keep narrowing until one fits. A six-node left-to-right chain, which fell back to the classic engine anywhere from 61 to 107 columns, now turns top-down there, and some timelines and gantts that fell back now draw. After such a jump the search steps back to the widest layout that fits. A diagram whose layout cannot get any narrower is recognized after one extra layout and falls back at once instead of after six.
- The narrowing search leaps ahead only after Pele returns the same layout twice in a row, so gantts and timelines keep the width they drew at before.
- An edge that ends at a slanted node, like a hexagon or parallelogram, runs right up to its slope. An arrowhead sits on the border of the node it points at, instead of a row or a cell short with its line running on past it (`▼` over `│`), which also showed in a plain two-circle top-down flowchart.
- A message label that crosses a lifeline and has no gap to step into sits on a backdrop, as frame conditions do, instead of hiding the lifeline under its text.
- Quadrant point labels belong to their point, not their quadrant. A long label no longer stretches its quadrant into its neighbor (`╮╭` becoming `┬`), and the lines of a wrapped label move as one block instead of sliding apart. A free label with no room to keep a space from a border, like a 12-letter label in a 12-cell quadrant, sits on a backdrop that cuts the border instead of touching it.
- A node inside a subgraph keeps a space from the subgraph border. Where rounding to the grid would put them side by side (`)│`), the border moves out a cell, and where a node outside the subgraph is in the way, the diagram gets a column inside the border instead (`> │`, not `>│`). When those few columns are all that keep a diagram from fitting the terminal, it is drawn with the nodes against the border, as before, instead of falling back to the code block.
- A label still covering a line or a marker after it slides moves a row up or down when that row is free, and a label's backdrop never erases a point or a line end under it; a layout where it would is not used. A wrapped label whose block cannot move steps each stuck line a cell off the line beside it (`├──╯ worker`), and a backdrop that meets a plain wall covers it instead of leaving a stray `│`.
- A stacked axis title that starts near the top of a chart keeps its first letter.
- A label counts as inside a one-row shape when it sits on the shape's edge, as Pele places some frame conditions. A sequence frame tab in mono keeps its solid reverse-video look (`█alt██[condition]█`), and an ER relationship that loops back to its own entity joins the entity border (`├┼──╯`).
- A gantt section name that wraps onto more lines than its section has tasks gets extra rows in its band. Its last line no longer shares a row with the next section's name (`Parse caf`) or the axis, and a section name on three lines next to two tasks draws instead of falling back.
- A thin sankey flow that rises or drops to its node ends in the node's bar, instead of one row above or below it (`╭╴` over the bar).
- In mono, a thin sankey flow drawn over a ribbon of the same shade shows as part of the shaded ribbon instead of a solid white bar, and a label beside it keeps its cleared space.
- A layout that puts another label between the lines of a wrapped label, as a quadrant chart's points can do to its quadrant titles, is not used.
- A label inside a filled box, like a subgraph title, that has no space beside an edge running through the box moves along the box's fill to the nearest gap with room (`│█┃█Ship it auth█┃`) instead of touching the edge or hiding it under its last letter. It never leaves its box.
- A layout where a label's backdrop would run into the label beside it (`Login page█abc█`) is not used.
- A stacked y-axis title starts below a chart title it would touch, instead of running into it (`rMedian`).
- Mindmap cloud and bang nodes keep their own border rows instead of sharing one with the node above (`╰┬┬──────┴──╮`).
- Two labels side by side on one row first try to slide or step a row apart, and a layout where they still touch, running two numbers together (`2004006008001000`, `700100`), is not used.
- A layout where a label would cross the border of a box it does not belong to, like a wrapped self-message running into the participant boxes at the bottom of a sequence diagram, is not used.
- A message label on a colored sequence `rect` block sits on the block's color instead of a hole of canvas color, and steps off a lifeline beside it like a label outside a block, so the lifeline runs whole through the block (`███DB█│███`, not `███ DB ███`).
- Sequence notes and frames keep a column from the lifelines and frames beside them. Where rounding to the grid would put a border right next to a lifeline or another border (`┼╮`, `││ note │`, `│╭`), a column goes between them, and a note that grows a column to center its label grows away from a lifeline. A layout with no column to spare for this, or with a note that would touch a lifeline on either side, is not used.
- A cancelled message's `╳` sits beside the lifeline it ends at, like an arrowhead (`───╳│`, `│╳───`, `│╳─╯`), instead of on the lifeline when it comes from one side and a cell away from it when it comes from the other.
- A frame condition's backdrop stays inside its frame, so the frame's left border no longer goes missing on the condition's row.
- A line that loops from a node back to itself, like a flowchart self-loop, a class that refers to itself or an ER self-relationship, draws as a box-drawing loop beside its node (`┬▲` over `╰╯`, `├┄┄╮` down to `◁╯`) instead of a few braille dots, and an ER self-relationship opens out so both of its ends show (`┼○──╮` down to `├┼──╯`).
- The lines of a wrapped label stay on consecutive rows inside their box or card. An edge meeting the box between two lines, or a label beside the box, no longer pushes a blank row into the middle of the label (`--mcp-config`, blank, `zoom/date`). The lines are centered where they were, or kept at the top for left-aligned text like class members.

## [0.1.0] - 2026-10-18

The first cellsmith release, forked from prismantis 0.14.0.

### Changed

- Mermaid diagrams draw with a new engine. [Pele](https://pele.run) lays each diagram out with every character one terminal cell wide, and its SVG is drawn on the cell grid: straight lines as rounded box-drawing lines, curves and diagonals as braille dots, fills as quarter blocks with two colors per cell, and labels as real text. Both axes are remapped so every distinct line and label gets its own row and column while the drawing keeps its shape.
- Each node of a flowchart, sequence, state, class or ER diagram takes its own color from the theme, and both ends of a sequence participant match.
- Box corners are rounded and arrows are ► ◄ ▲ ▼.
- A diagram draws once its fence closes; while it streams it shows as code.

### Added

- Pie charts, gantt charts, timelines, mindmaps, quadrant charts, git graphs and sankey diagrams draw in the terminal, next to the flowchart, sequence, state, class, ER and xychart diagrams the old engine drew. The demo shows a pie and a gantt chart.
- Each theme preset names its background color, which diagrams use to blend translucent fills and to draw text on colored blocks.

### Kept

- The prismantis box-art engine stays as the fallback for a diagram Pele cannot draw, and draws every diagram when `mermaidAscii` is on.

The entries below are prismantis's own history up to 0.14.0, the version cellsmith forks.

## [0.14.0] - 2026-10-09

### Added

- `toolOutput: quiet` shows what Claude did, not what it read. Reads, searches, listings, web fetches and shell commands made only of read-only programs draw their row and nothing under it, and the row says it in plain words (`Read src/report.py lines 1–10`, `Searched src/ for "TODO"`); a shell call without such a form shows its description and the programs it ran. Other shell commands draw their first lines and a count, without the approval line, also inside a collapsed group. Edits keep their diff. A failed call shows the last real line of its error, a refused call (permission rule, auto mode classifier) its full reason. The ids of read-only calls are kept to the last 2000, so a long session does not grow them ([#53](https://github.com/NahumLitvin/prismantis/issues/53)).

### Fixed

- Tool row paths stay relative to the project after `/cd` or a worktree move. They followed the directory the session started in, so paths in a moved session fell back to `~/…`.

## [0.13.1] - 2026-10-09

### Fixed

- Inline `$…$` math draws as italic text without its dollar signs, so `($\rho = 4.3 / 5$)` reads as ρ = 4.3 / 5. Common TeX commands become symbols. Prices like `$5 and $10` and shell variables like `$HOME` stay as written.
- Chart y-axis ticks sit the same number of rows apart. A 0 to 2500 axis used to step 2, 3, 2, 3, 2 rows between its labels, because the chart height ignored how many ticks it needed; it now takes the nearest height that divides evenly.

## [0.13.0] - 2026-10-09

### Added

- Tables offer `⧉ md`, `⧉ art` and `⧉ html` copy actions. `⧉ html` copies the table as HTML, with headers, column alignment and inline formatting, together with tab-separated plain text, and verifies both before reporting success. `⧉ html` shows in a local macOS terminal or a Linux graphical session, where it needs CopyQ running; over SSH, on desktop and on other systems tables offer `⧉ md` and `⧉ art`. Without CopyQ, or when the clipboard helper fails, the action copies the plain text alone.
- LaTeX math: `$$…$$` and ` ```math ` formulas draw as typeset images in kitty and Ghostty through [RaTeX](https://github.com/erweixin/RaTeX)'s renderer, sized to the reply text and padded to whole rows, with a copy button for the LaTeX. Off by default: the `latex` option turns it on, and `ratex-render` must be on your `PATH`. Without the renderer or in other terminals they stay text in a `math` code block. New option `latex` ([#43](https://github.com/NahumLitvin/prismantis/issues/43)).

### Fixed

- Slash command output that carries terminal colors, like `/context`, is left to Claude Code's own drawing. It used to be refused for its escape codes, with a dim `refused` line in the transcript.
- A flowchart whose long edge label made it too wide for the terminal draws with that label cut short, where it used to fall back to its mermaid source. `⧉ source` still copies the full text.
- Tool rows show file paths relative to the project, and under the home directory as `~/…`, like Claude Code's own rows, instead of the full absolute path.
- Mermaid boxes stay closed around Korean, Chinese and Japanese labels. beautiful-mermaid counts each character as one column, so a wide character pushed the right border inward by one column per character. Wide characters are now measured as two columns before layout and drawn in their real width, in flowcharts, sequence diagrams and chart axes alike ([#56](https://github.com/NahumLitvin/prismantis/pull/56)).
- Only `https` and `http://localhost` links become clickable terminal hyperlinks, which every supported Claude Code accepts. On 2.1.287 a `mailto:` or plain `http:` link made Claude Code throw out the whole reply and draw its own. Other links, `javascript:` and `file:` included, draw as link text.
- Earlier replies stay parsed while a long reply streams in, and code and diagrams are not highlighted again on desktop, in fullscreen Apple Terminal or when another mod draws markdown through `$.prismantis.markdown`.
- The terminal is detected once per session instead of on every prompt, and the list of expanded tool calls no longer grows for the whole session.
- A left-to-right flowchart too wide for the terminal draws top to bottom, where it used to fall back to its mermaid source. A five-node pipeline with two-line labels went from 155 columns to 77.

## [0.12.0] - 2026-10-07

### Fixed

- A short table column next to a very wide one no longer breaks inside its words (`10` drawn as `1`/`0`). Columns that fit their share keep their full width, and only the wide ones split the rest ([#41](https://github.com/NahumLitvin/prismantis/pull/41)).
- Boxed tables keep their borders on every line of a row whose cells wrap. The `│` bars used to stop after the first line, leaving the rest of the row open. Rows with a link keep their link whole and get borders that follow the row's height, in terminals with or without clickable links ([#48](https://github.com/NahumLitvin/prismantis/pull/48), thanks @vrevolverrr and @b33eep).
- Double underscores inside a word stay as written, as CommonMark has it: `mcp__serena__activate_project` no longer draws as `mcp` **serena** `activate_project`. `__bold__` on its own still draws bold ([#51](https://github.com/NahumLitvin/prismantis/pull/51), thanks @vrevolverrr).
- A table column keeps at least the width of its longest word when the longest words of all columns fit, so a file path or URL in a narrow table is no longer cut in the middle. The other columns, even ones that would otherwise keep their full width, wrap to make room ([#49](https://github.com/NahumLitvin/prismantis/pull/49), thanks @b33eep).
- Hebrew and Arabic read right to left in Apple Terminal's fullscreen layout, tables included. Apple Terminal runs its own left-to-right bidi over every fullscreen line, so prismantis now sends each line already reordered for that pass. A number touching Latin text (`250ms`) and ordered-list numbers can still land on the wrong side ([#42](https://github.com/NahumLitvin/prismantis/pull/42)).
- Tables with many rows draw about twice as fast as in 0.11.0, because plain ASCII text is measured by its length.

## [0.11.0] - 2026-10-06

### Added

- Other mods can draw markdown the way prismantis draws replies: `$.prismantis.markdown({ surface, text, columns })` answers the drawn tree, without copy buttons, for their own panes and bands. The types ship as a contract in `types/index.d.ts` ([#38](https://github.com/NahumLitvin/prismantis/pull/38), thanks @Malorn44).

## [0.10.0] - 2026-10-06

### Added

- Your own prompts draw in the theme: a rounded bubble by default, or an accent bar or a bold chevron with the new `promptStyle` option (`off` keeps Claude Code's look). Task notifications and teammate messages are left alone ([#14](https://github.com/NahumLitvin/prismantis/issues/14)).
- `toolStyle` keeps tool rows apart from Claude's sentences: `chat` (the default) puts them dimmed on the right, `tree-dim` tucks them under with `⎿`, `tree-bold` adds bold one-line sentences, `classic` keeps the old look.

## [0.9.0] - 2026-10-06

### Added

- Links and bare URLs are clickable: they draw as terminal hyperlinks (OSC 8) and as anchors on desktop. Terminals without hyperlinks show the URL after the text, as before ([#9](https://github.com/NahumLitvin/prismantis/issues/9)).
- `/prismantis copy` copies the last reply and `/prismantis copy code` its last code block, a keyboard path that does not need a click ([#28](https://github.com/NahumLitvin/prismantis/issues/28)).

### Fixed

- The README no longer says `ctrl+x` then `tab` focuses the copy buttons. Since Claude Code 2.1.291 that chord focuses the area above the prompt.

## [0.8.0] - 2026-10-05

### Added

- Replies end with a `⧉ copy reply` button that copies the reply as Claude wrote it. One-line English narration gets none, so the button sits where there is something worth copying. Selecting Hebrew or Arabic on screen copies it in drawn order, reversed; this copies it in reading order.

### Changed

- `/prismantis` and `/prismantis demo` show task lists.
- Tables draw boxed by default: every cell in a box, with a double line under the header. `tableStyle` adds `box` as the new default; `rules`, `grid` and `minimal` stay for a lighter look.
- Tables get a second button, `⧉ art`, that copies a plain boxed table for Slack and chat, inside a ``` code block and wrapped to 100 columns so wide tables keep their shape. `⧉ copy` still gives the markdown.

## [0.7.1] - 2026-10-05

### Fixed

- On Windows the reply marker and the filled arrowheads in sequence and class diagrams drew as color emoji. The marker is now `●`, the same dot Claude Code uses off macOS, and the arrowheads are `►` and `◄`. A test fails if a drawn reply ever adds an emoji-capable character again ([#6](https://github.com/NahumLitvin/prismantis/issues/6)).

## [0.7.0] - 2026-10-05

### Added

- Task lists: `- [ ]` and `- [x]` draw as `[ ]` and `[✓]`, with done items dimmed and struck through. The new `taskStyle` option picks `checks` (the default), `ticks`, `box` or `progress`, which adds a done-count bar above each list. The copy button still copies the markdown as written ([#10](https://github.com/NahumLitvin/prismantis/issues/10)).

## [0.6.1] - 2026-10-05

### Changed

- The model-only note asks Claude to put commands and snippets you may copy in fenced code blocks, which get a copy button, instead of inline code, which does not. The note is now about 190 tokens per prompt.

## [0.6.0] - 2026-10-04

### Added

- The `rtl` option names your terminal (`warp`, `kitty`, `apple-terminal`, `iterm`, `ghostty`, `wezterm`, `vscode`, `alacritty`, `windows-terminal`, `gnome`, `konsole`), and `auto` (the default) detects it. Every terminal gets the right-to-left layout; only the way the letters are sent differs.
- `/prismantis demo-rtl` shows a Hebrew showcase with every element, drawn for the terminal it runs in.

### Fixed

- Hebrew and Arabic read backwards in terminals that do their own bidi. 0.5.0 reordered the letters everywhere, which is right only where the terminal has no bidi (Warp, Ghostty, WezTerm, VS Code, Alacritty, Windows Terminal). Kitty reverses each word itself, so it now gets the words in visual order with each word as written. Apple Terminal, iTerm2, GNOME Terminal and Konsole do whole-line bidi, so they get the letters as written. A terminal prismantis does not recognise is left alone.
- `/prismantis` output now spans the full width, so right-to-left blocks there sit on the right like they do in replies.
- Terminal detection runs again on every prompt, so a plugin reload no longer drops it.

### Changed

- The demo reply and tests use neutral region names (`us-east`, `eu-west`).

## [0.5.0] - 2026-10-04

### Added

- Hebrew and Arabic read in the right order in terminals without bidi support (Warp and most others). Paragraphs, headings, list items, quotes, alerts and table cells that are mostly right-to-left are reversed run by run, right aligned, and get their bullet, number or quote bar on the right. Bold, italic, inline code, links, numbers and paths keep their style, and inline code and paths stay left to right as one piece.
- The base direction is the dominant language by word count, so an English sentence with a few Hebrew words stays on the left and only those words flip.
- A table that is mostly right-to-left is mirrored and right aligned: its first column sits on the right. An English table with a Hebrew cell or two stays as it was.
- Right-to-left paragraphs, list items, quotes and alerts wrap at the terminal width in reading order before they are reordered, so a long line no longer reads wrong after the terminal wraps it.
- In code blocks only the text after a `#` or `//` comment marker is reordered. The code itself, and so a copy, is unchanged.
- The demo reply has a Hebrew section, covered by the render snapshots.

### Known issues

- A long heading or table cell that the terminal wraps still reads wrong, and so does a single word wider than the terminal.
- The terminal font must contain Hebrew or Arabic glyphs (Warp's default JetBrains Mono does not; DejaVu Sans Mono does).

## [0.4.1] - 2026-10-04

### Added

- Bash and PowerShell calls in the expanded transcript (`ctrl+o`) show the command with the same shell colors as code blocks, and the output below it in a rounded box. Output is capped at 120 lines (`… +N lines`), empty output reads `(No output)`, and stderr uses the error color. Other tools still use Claude Code's own rows when expanded.

## [0.4.0] - 2026-10-04

### Added

- `/prismantis` is now a one-screen help: commands, all 16 themes, a tip, a flowchart and a bar chart. `/prismantis demo` shows the full showcase with every heading level, all five alerts, code, and flowchart, sequence and bar diagrams.
- Regression tests: render snapshots of the demo reply in three themes, parse and draw time budgets, linear-scaling checks, and half-streamed input (open fence, cut table, unclosed alert) that must still draw.
- `npm --prefix scripts run bench:check` compares timings and render-tree node counts to a committed baseline, and CI fails if node counts grow more than 10%.

### Changed

- `/prismantis` with no arguments prints the help instead of the bare theme list.

### Known issues

- Claude Code refuses any render tree over 20000 nodes and draws its own plain text. A highlighted code block costs about 39 nodes per line, so a block past roughly 500 lines loses prismantis styling. Tables hold to about 1000 rows.

## [0.3.8] - 2026-10-02

### Changed

- An alert's copy button sits beside its box instead of taking a row above it.
- The demo reply shows the boxed H1, an H2 rule and a tip alert, and the README screenshot shows 0.3.8.

### Fixed

- Bar and line charts widen to fit their category labels, so `Human`, `Pigeon` and `Shrimp` no longer run together.

## [0.3.7] - 2026-10-02

### Added

- GitHub alerts (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`) draw as colored boxes with a title, and the model note mentions them.
- Single-series bar charts print each value above its bar, color the tallest bar and mute the rest.

### Changed

- Headings default to `banner`: H1 sits in a heavy box, H2 gets a heavy rule in the heading color, H3 keeps the heading color and H4 and below drop to bold text. Set `headingStyle` to `bold` for the old look.
- Warm redraws of a reply with diagrams are about 2.5x faster (0.28ms to 0.11ms median for the demo on an M4 Pro): diagram colors are cached per theme. Reproduce with `npm --prefix scripts run bench`.

### Fixed

- Diagram lines no longer show through spaces in edge labels. The fix is applied at build time from the upstream PR (beautiful-mermaid#157) until it is merged.
- A mermaid block that opens with a `%%` comment line (as in `%% weekly deploys` before `xychart-beta`) now draws instead of staying as code.
- Quoted chart labels (`x-axis ["<5s", ">10s"]`) no longer keep their quotes.
- The model-only note now tells Claude prismantis is not a tool to call, so "show it with prismantis" gets markdown instead of a search for a CLI. The note grew to about 150 tokens per prompt.

## [0.3.6] - 2026-10-02

### Added

- `/prismantis theme <name>` switches the theme on the spot; `/prismantis` lists all 15.

## [0.3.5] - 2026-10-02

### Fixed

- Copying a quote gives its text without the `> ` markers, so a drafted message pastes straight into chat.
- The README says how to reach copy buttons from the keyboard, since copy-on-select terminals like Warp can turn a click into a text selection.

## [0.3.4] - 2026-10-02

### Added

- A contrast test keeps every theme readable on its own background, with floors every official palette passes as designed.

### Known issues

- A diagram line can show through the spaces of an edge label. Reported upstream as beautiful-mermaid#154 with a fix offered.

## [0.3.3] - 2026-10-02

### Fixed

- Diagram hints now reach the model. Claude Code's built-in `sec-default` policy skips installed plugins' system-prompt hooks, so the 0.3.2 hint never arrived. The note now rides along with each prompt you type as model-only context, about 100 tokens per prompt.
- Stadium, cylinder and arrow-joined diagram boxes get their own colors. Subgraph containers stay in the plain diagram color.
- Edge labels written with a space before them (`A --> |label| B`) no longer make the diagram drop the target node.

## [0.3.2] - 2026-10-02

### Added

- Collapsed tool groups draw one summary line, such as `Ran 3 commands, read 2 files`, with a status dot, a failure count and the last target.
- The turn footer keeps Claude Code's word and colors the duration: `✻ Baked for 6m 20s`.
- Slash-command output renders as markdown, copy buttons included. Errors keep Claude Code's own line.
- `diagramHints` (on by default) adds one short system-prompt section so Claude uses diagrams and charts when they help.

### Fixed

- Expanded tool groups show their inline output again: their rows draw with Claude Code's own look.
- CJK and emoji count as two columns in tables, heading rules and diagram fit checks.
- A continuation line joins the list item it is indented under, not the last nested child.
- Inline code spans can contain backticks when the delimiter is longer, as in ``a `b` c``.

## [0.3.1] - 2026-10-02

### Fixed

- Code blocks lost their frame, so selecting code with the mouse no longer picks up border characters, the label or the button.

## [0.3.0] - 2026-10-02

### Renamed

- The project is now prismantis (prism + mantis). The repo moved to NahumLitvin/prismantis; GitHub redirects the old URL. Reinstall with `/plugin install prismantis@prismantis`.

### Added

- 15 themes from MIT-licensed palettes: Catppuccin Mocha and Latte, Dracula, Nord, Tokyo Night, Gruvbox dark and light, Rosé Pine and Dawn, Everforest, GitHub dark and light, One Dark, Solarized dark and light.
- Compact tool rows: `Ran <command>` with shell colors, `Read`/`Edited <path>`, status dots. Toggle with `toolRows`.
- Colorful diagrams: each mermaid box, participant and bar gets its own theme color. Bar and line charts (`xychart-beta`) and sequence diagrams draw too.
- Back-to-back tables and diagrams share a row and wrap, so wide terminals fill up.
- Charts size themselves to the terminal width.
- Copy buttons on code blocks, tables, diagrams, lists and quotes. Toggle with `copyButtons`.
- Diagrams get two copy buttons, source and drawn art. Code blocks get a language header.
- Syntax highlighting in 24 languages through a bundled Prism 1.30 (MIT).

### Changed

- `midnight`, `daylight` and `solarized` are now `catppuccin-mocha`, `catppuccin-latte` and `solarized-dark`, named after their sources.
- `customTheme` is gone. Every one of the 20 color tokens has its own `<token>Color` option instead.

### Fixed

- Copy buttons copy the exact markdown of tables, lists and quotes.
- Fences of four or more backticks keep nested ``` examples inside.
- Tables never draw wider than the terminal, and link columns are sized for the URL they show.
- An escaped trailing pipe stays in its table cell.
- Replies and code are parsed and highlighted once, not on every redraw.

### Removed

- Mermaid image mode and its mermaid-cli dependency. Diagrams draw as box art only, so prismantis runs no external programs and writes no files.

## [0.2.0] - 2026-10-02

### Added

- Mermaid diagrams as colored box art, sized to the terminal, with an ASCII-only option.
- Mermaid image mode: real PNGs from mermaid-cli in terminals with the kitty graphics protocol, box art as the fallback.
- `diagram` and `diagramText` color tokens.

## [0.1.0] - 2026-10-02

### Added

- Themed rendering of assistant replies: headings, paragraphs, lists, quotes, rules, code blocks and tables.
- Tables with colored headers, aligned columns and rules, sized to the terminal width.
- Highlighting for numbers, versions, IDs, file paths, links and inline code.
- Shell code blocks color the command, flags, strings and comments.
- Themes `midnight`, `daylight`, `solarized` and `mono`, plus per-token color overrides and a JSON custom theme.
