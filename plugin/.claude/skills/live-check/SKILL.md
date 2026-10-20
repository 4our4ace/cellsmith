---
name: live-check
description: Load the working copy of cellsmith into a real Claude Code session and screenshot how replies render. Use after any visual change, when asked to "screenshot", "see it", "try it live", or before claiming a rendering fix works.
---

# Live check

Tests prove the tree. Only a real render proves the look.

1. **Load the working copy:**
   - From a new terminal: `claude --plugin-dir <repo path>`. Saving files hot-reloads it.
   - From inside a session that loaded the `plugin-authoring` skill: copy `.claude-plugin/plugin.json`, `hooks/` and `types/` into that session's dev-mods folder. The person answers the one-time "Enable hot reloading" prompt, and the mod loads when the turn ends. Copy again after every edit.
2. **Print a sample reply** containing everything the change touches: a table with numbers and an aligned column, a `bash` block with flags and a quoted string, a path, a link, a heading and a `mermaid` block.
3. **Screenshot on the next turn**, after the reply has rendered:
   - macOS: capture only a terminal window, never the full screen (it grabs whatever else is open). Start one with `osascript -e 'tell application "Terminal" to do script "cd <repo> && claude \"/cellsmith demo\""' -e 'tell application "Terminal" to id of front window'`, wait for it to draw, then `screencapture -x -o -l <id> <scratch>/shot.png && sips -Z 1800 <scratch>/shot.png` and read the image. Apple Terminal draws no strikethrough. Quit that session when done.
   - Linux: `grim`, `gnome-screenshot -f` or `import -window root`.
   - Headless (WSL, no display): `tmux new-session -d -s live -x 250 -y 90 'CLAUDE_CODE_TMUX_TRUECOLOR=1 claude'`, answer the trust prompt, send `/cellsmith demo` with `tmux send-keys`, then `tmux capture-pane -e -p -S - -t live > screen.ans`, `node ../tools/ansi2html.mjs screen.ans screen.html` and screenshot the page with headless Chromium. Without that variable Claude Code sends only 256 colors inside tmux. Use 250 columns so a docked sidebar pane leaves the reply room. The faint lines inside `█` runs are the browser's font, not the drawing. Chromium's fonts lack `⧉` (copy buttons) and `⎿` (tree tool rows), which then draw as boxes: embed Noto Sans Math and Noto Sans Symbols (OFL) in the page as base64 `@font-face` data URIs, since fonts from `file://` URLs are blocked, and set them on those characters directly.
   - Windows: ask the person for a Win+Shift+S capture.
4. **Check** column alignment, rule lengths, colors against the theme tokens, wrapping at narrow widths, and that nothing falls back to the engine renderer. A dim line naming `cellsmith` in the transcript means a hook was refused; fix that first.
5. **Before publishing a screenshot**, check it shows no private repo names, hostnames, internal versions or other work data. Use a neutral sample for README images.
