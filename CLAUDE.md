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
Shipped as 1.0.0 and published in the community directory.
- One command: "Sort task block at cursor"
- Bind it to a hotkey via Obsidian's Hotkeys settings (do not hardcode a hotkey
  in the plugin — just register the command)
- Operates ONLY on the contiguous checklist block surrounding the cursor:
  1. Get cursor line via `editor.getCursor().line`
  2. Walk upward from the cursor line while lines match the checklist regex
     (see below) or are indented continuations (sub-items) of one — stop at
     the first line that is blank or doesn't match
  3. Walk downward the same way
  4. The block = all lines from the first match to the last match (inclusive)
  5. If the cursor line itself is not a checklist line, do nothing and show
     a small notice ("No task list found at cursor") via `new Notice(...)`;
     a done task under the cursor is a valid starting point
- Checklist line regex: `/^(\s*)-\s\[(.)\](?:\s(.*))?$/` — the text is
  optional so a bare `- [ ]` is a task and not a block boundary; top-level items
  only for
  sorting purposes; a line is a "sub-item" of the item above it if its
  indentation is greater than that item's indentation
- Sort key, in order:
  1. Placement of empty, done (`- [x]`) and in-progress (`- [/]`) tasks, see
     v2 below; other status markers are always sorted as ordinary active tasks
  2. Priority: 🔺 before ⏫ before 🔼 before (no priority) before 🔽 before ⏬
  3. Due date (📅 YYYY-MM-DD) ascending; tasks with no due date sort after
     tasks that have one, within the same priority tier
- Sorting must be STABLE for ties (equal priority + equal/no due date keeps
  original relative order)
- When an item is moved, its indented sub-items move with it as a unit
- Rewrite only those lines back into the editor at the same range
  (`editor.replaceRange(newText, {line: startLine, ch: 0}, {line: endLine, ch: ...})`) —
  do not touch the rest of the file
- Done tasks (`- [x]`) belong to the block and do not split it

## Scope (v2)
- Settings tab with one dropdown per group — done (`- [x]`), in progress
  (`- [/]`) and empty (an unfinished task with no text, with or without a
  trailing space) — each choosing between "Sort with the others", "Move to top"
  and "Move to bottom"
- Empty only applies to `- [ ]`; `- [x]` with no text follows the done setting,
  the point of the group is that a freshly created item lands at the end
- Defaults: done and empty to the bottom, in progress sorted along with the
  active tasks
- Pinned groups are not sorted internally: they keep their original relative
  order and carry their sub-items

## Explicitly OUT of scope
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
- Unit tests for the pure sorting logic in `tests/`, run with `npm test`
  (esbuild + the built-in Node test runner, no extra dependencies)
- Manual testing in a scratch vault with sample checklists on top of that
- Test cases to verify explicitly:
  1. Simple flat list, mixed priorities, no dates — sorts by priority only
  2. Same priority, different due dates — sorts by date within tier
  3. Mixed priority + dates together — priority wins, date breaks ties
  4. A task with sub-items (indented lines below it) — sub-items travel
     with their parent
  5. A `- [x]` done task inside the block — moves below the unfinished tasks
     and does not split the block
  6. Cursor NOT on a checklist line — shows notice, does nothing, no crash
  7. Block of exactly one task — no-op, no crash
  8. Two separate checklist blocks in the same file, cursor in the second
     one — only that block changes, the first is untouched

## Definition of Done for v1
- Command appears in command palette as "Sort task block at cursor"
- Can be bound to a hotkey in Settings → Hotkeys
- All 8 test cases above pass manually in a scratch vault
- No console errors on any of the test cases

## Git Workflow
- Commit after: sample template cloned + builds, basic parsing works,
  sorting logic works, file rewrite works, hotkey bound
