export const showcaseText = (themes: readonly string[]): string => `
# cellsmith

Colored markdown for Claude Code replies: **bold**, *italic*, ~~struck~~, \`inline code\`, a [link](https://github.com/4our4ace/cellsmith) and a bare URL https://github.com/4our4ace/cellsmith/issues, both clickable, numbers like 99.9% and 250ms, paths like ~/src/app.ts.

## Commands

| Command | Does |
|---------|------|
| \`/cellsmith\` | This screen |
| \`/cellsmith theme <name>\` | Switch theme on the spot |
| \`/cellsmith copy\` | Copy the last reply, or \`copy code\` for its last code block |
| \`/config\` | Edit any option |

> [!NOTE]
> ${themes.length} themes ship with it. \`mono\` uses no color, only bold and dim.

### Pick a theme

\`\`\`bash
/cellsmith theme nord
/cellsmith theme github-light
\`\`\`

1. Dark: ${themes.filter(t => !/latte|light|dawn/.test(t) && t !== 'mono').join(', ')}
2. Light: ${themes.filter(t => /latte|light|dawn/.test(t)).join(', ')}
3. Plain
   - mono

> [!TIP]
> Any color slot beats the theme. Set \`headingColor\` or \`numberColor\` to a hex value in \`/config\`.

## Everything it draws

### Copy tables

Use \`⧉ md\` for Markdown, \`⧉ art\` for chat, or \`⧉ html\` for a formatted table. \`⧉ html\` shows in a local macOS or Linux terminal and writes HTML and tab-separated plain text together; Linux needs CopyQ running. If that fails, it copies the plain text alone.

| Item | Quantity | Status |
|:-----|---------:|:------:|
| **Apples** | 3 | *Ready* |
| Oranges | 5 | Pending |

### Alerts

> [!IMPORTANT]
> After updating the plugin, open sessions need \`/reload\`.

> [!WARNING]
> Terminals that copy on select (Warp) can turn a click on a copy button into a selection. Use the keyboard shortcut.
> Selecting a typeset formula copies blank cells. Its copy button copies the LaTeX.

> [!CAUTION]
> Claude Code refuses trees over 20000 nodes. A code block past about 500 highlighted lines falls back to plain text.

### Task lists

- [x] Parse the reply
- [x] Draw it
  - [x] Tables and code
  - [ ] Diagrams on the desktop app
- [ ] Ship the next release

### Your prompts

Scroll up: what you typed draws in a bubble. \`promptStyle\` switches to \`bar\`, \`chevron\` or \`off\` in \`/config\`.

### Tool rows

Tool calls draw as one line, dimmed on the right by default. Set \`toolStyle\` in \`/config\` to \`chat\`, \`tree-dim\`, \`tree-bold\` or \`classic\`. \`toolOutput: quiet\` in \`/config\` hides what Claude only read and says in plain words what each call did: \`Read src/app.ts lines 1–40\`, \`Searched src/ for "TODO"\`.

### Quotes and rules

> A quote keeps its text when you copy it, without the \`> \` markers.

---

### Code

\`\`\`json
{ "theme": "dracula", "headingStyle": "banner", "mermaid": true }
\`\`\`

#### Math

$$
\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

#### Diagrams

\`\`\`mermaid
flowchart LR
    R[Reply] --> P[Parse]
    P --> D[Draw]
    D --> S[Screen]
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant U as You
    participant C as Claude
    participant P as cellsmith
    U->>C: prompt
    C->>P: markdown
    P-->>U: colored reply
\`\`\`

\`\`\`mermaid
xychart-beta
    title "Color options per group"
    x-axis [text, head, num, code, diag]
    y-axis "options" 0 --> 8
    bar [7, 3, 2, 6, 2]
\`\`\`

\`\`\`mermaid
pie title Where a reply's time goes
    "Parse" : 15
    "Layout" : 45
    "Draw" : 40
\`\`\`

\`\`\`mermaid
gantt
    title Release
    dateFormat YYYY-MM-DD
    section Build
    Engine :a1, 2026-10-18, 3d
    Tests :after a1, 2d
    section Ship
    Install :2026-10-23, 1d
\`\`\`
`

export const helpText = (themes: readonly string[]): string => `
## Commands

| Command | Does |
|---------|------|
| \`/cellsmith theme <name>\` | Switch theme on the spot |
| \`/cellsmith copy\` | Copy the last reply, or \`copy code\` for its last code block |
| \`/cellsmith demo\` | Full showcase, every element and diagram |
| \`/cellsmith demo-rtl\` | Hebrew right-to-left showcase |

### ${themes.length} themes

- Dark: ${themes.filter(t => !/latte|light|dawn/.test(t) && t !== 'mono').join(', ')}
- Light: ${themes.filter(t => /latte|light|dawn/.test(t)).join(', ')}
- Plain: mono, no color, only bold and dim

Forked from [prismantis](https://github.com/NahumLitvin/prismantis), diagrams laid out by [Pele](https://pele.run)

> [!TIP]
> Any color slot beats the theme. Set \`headingColor\` or \`numberColor\` to a hex value in \`/config\`.

### Task lists

- [x] Tables, diagrams and charts drawn in the terminal
- [x] Copy tables as Markdown, art or HTML (macOS/Linux)
- [ ] Pick a \`taskStyle\` in \`/config\`: checks, ticks, box or progress

\`\`\`mermaid
flowchart LR
    R[Reply] --> P[Parse]
    P --> D[Draw]
    D --> S[Screen]
\`\`\`

\`\`\`mermaid
xychart-beta
    title "Color options per group"
    x-axis [text, head, num, code, diag]
    y-axis "options" 0 --> 8
    bar [7, 3, 2, 6, 2]
\`\`\`

> [!CAUTION]
> Claude Code refuses trees over 20000 nodes. A code block past about 500 highlighted lines falls back to plain text.
`

export const rtlShowcaseText = (): string => `
# עברית מימין לשמאל

**שלום חברים**, זו הדגמה של עברית עם מונחים באנגלית כמו \`kubectl\`, מספרים כמו 99.9% ו-250ms, נתיב כמו ~/src/app.ts וגם [קישור](https://github.com/4our4ace/cellsmith).

## רשימות

- פרוסים בשני אזורים (us-east ו-eu-west)
- מחליפים ערכת נושא עם \`/cellsmith theme nord\`

1. מתקינים את התוסף
2. שואלים שאלה בעברית

> עברית נקראת מימין לשמאל, גם בטרמינל בלי תמיכה בכיווניות

> [!TIP]
> כל ערכת נושא עובדת גם בעברית

| שירות | אזור | גרסה |
| :--- | :--- | ---: |
| שער | us-east | 2.14.0 |
| חיוב | eu-west | 1.8.3 |

\`\`\`bash
ls -la # רשימת הקבצים בתיקייה
\`\`\`
`
