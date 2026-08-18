# CLAUDE.md — Obsidian Task Sorter Plugin

## Fundamental Rules
- Start simple. Get one working command before adding config options.
- Small, focused git commits with clear messages after every working milestone.
- Make the smallest change that moves toward the goal. No speculative abstractions.
- Never break a working build to add a new feature — extend, don't rewrite.
- No unnecessary dependencies — Obsidian API + TypeScript is enough.

## What This Plugin Does
Physically reorders `- [ ]` checklist lines inside a note, sorted by priority
emoji (⏫ 🔼 🔽) and/or due date (📅 YYYY-MM-DD), triggered by a command/hotkey —
unlike the Tasks plugin, which only sorts virtually inside a query block.

## Scope (v1 — keep it small)
- One command: "Sort tasks in current file"
- Sorts only a single contiguous checklist block (the one under/around the cursor,
  or the whole file — pick ONE for v1, whole file is simpler)
- Sort key: priority first (⏫ > 🔼 > none > 🔽), then due date ascending
- Preserves indented sub-items attached to their parent line
- Ignores non-checklist lines (leaves everything else untouched)

## Explicitly OUT of scope for v1
- Settings UI / configurable sort order
- Multiple sort profiles
- Auto-sort on every edit (v1 is manual trigger only, via command palette/hotkey)
- Cross-file sorting

## Tech Stack
- TypeScript
- Obsidian Plugin API (`obsidian.d.ts`)
- esbuild for bundling (standard in the official sample plugin template)
- No runtime dependencies beyond Obsidian's own API

## Project Setup Steps
1. Clone https://github.com/obsidianmd/obsidian-sample-plugin as the starting point
2. `npm install`
3. Rename plugin id/name in `manifest.json`
4. Implement `main.ts`:
   - Register command via `this.addCommand()`
   - Read active file: `this.app.workspace.getActiveFile()`
   - Read content: `this.app.vault.read(file)`
   - Parse lines, extract checklist block(s)
   - Regex for priority: `/[⏫🔼🔽]/`
   - Regex for due date: `/📅\s*(\d{4}-\d{2}-\d{2})/`
   - Sort array of {line, subLines, priority, dueDate}
   - Rebuild file content, write back: `this.app.vault.modify(file, newContent)`
5. Build with `npm run build` (esbuild dev mode: `npm run dev` for watch)
6. Copy `main.js` + `manifest.json` (+ `styles.css` if any) into
   `<vault>/.obsidian/plugins/task-sorter/`
7. Enable in Obsidian → Settings → Community Plugins (turn on Developer mode
   first if loading unpacked, or just drop files in and reload)

## Testing Approach
- Manual testing in a scratch vault with sample checklists first
- Test edge cases: nested sub-tasks, tasks with no priority/date mixed in,
  already-done tasks (`- [x]`) — decide whether v1 touches these or skips them

## Git Workflow
- Commit after: sample template cloned + builds, basic parsing works,
  sorting logic works, file rewrite works, hotkey bound
