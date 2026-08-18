# Task Sorter plugin for Obsidian

The plugin physically reorders the checklist under your cursor by priority and
due date — right-click, pick "Sort task block at cursor", and the lines actually
move in the note.

Unlike the [Tasks](https://obsidian.md/plugins?id=obsidian-tasks-plugin) plugin,
which sorts virtually inside a query block, this one rewrites the list itself, so
the order survives outside of any query. The emoji syntax is the same one Tasks
uses, so both plugins work on the same notes.

<!-- demo gif goes here -->

## Features

### Sorts only the block you are standing in
The contiguous run of `- [ ]` items around the cursor is sorted; a blank line, a
finished task or any other line ends the block. The rest of the note is never
touched.

### Priority first, due date second
🔺 → ⏫ → 🔼 → no priority → 🔽 → ⏬, then 📅 `YYYY-MM-DD` ascending within each
tier. Tasks with no due date come after the dated ones, and equal tasks keep
their original order.

```markdown
- [ ] Write the README
- [ ] Ship v1 🔺 📅 2026-08-20
- [ ] Reply to email 🔼
- [ ] Water the plants 🔽
- [ ] Buy milk ⏫
```
becomes
```markdown
- [ ] Ship v1 🔺 📅 2026-08-20
- [ ] Buy milk ⏫
- [ ] Reply to email 🔼
- [ ] Write the README
- [ ] Water the plants 🔽
```

### Sub-items travel with their parent
Indented lines below a task — notes, links, nested checkboxes — move together
with it as one unit.

### Finished tasks stay put
`- [x]` (and any other status marker) is treated as a block boundary, so done
tasks are never reordered and the list above and below them is sorted
separately.

## Installation

### Manual
1. Download `main.js` and `manifest.json` from the
   [latest release](https://github.com/artem98/obsidian_tasks_sort/releases)
2. Put them into `<vault>/.obsidian/plugins/task-sorter/`
3. Reload plugins and enable **Task Sorter** in Settings → Community plugins

### BRAT
Install via [BRAT](https://obsidian.md/plugins?id=obsidian42-brat):
`artem98/obsidian_tasks_sort`

## Usage

Put the cursor on a task and either right-click and choose
**Sort task block at cursor**, or run the same command from the command palette.
The menu entry only shows up when the cursor is on an unfinished task.

### Configure Obsidian hotkeys
1. Open Obsidian Settings
2. Go to Hotkeys
3. Filter "Sort" and you should see "Task Sorter: Sort task block at cursor"
4. Click on `+` icon and press hotkey (e.g. `⌘ + Shift + S`)

## Development

```sh
npm install
npm run dev    # watch build
npm run build  # type-check + production bundle
npm run lint
```

Copy `main.js` and `manifest.json` into
`<vault>/.obsidian/plugins/task-sorter/` and reload the plugin to test a build.

## License

MIT
