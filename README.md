# Obsidian Task Sorter

Physically reorders `- [ ]` checklist lines inside a note, sorted by priority
emoji (⏫ 🔼 🔽) and/or due date (📅 YYYY-MM-DD), triggered by a command/hotkey —
unlike the Tasks plugin, which only sorts virtually inside a query block.

## Development

```sh
npm install
npm run dev    # watch build
npm run build  # type-check + production bundle
npm run lint
```

## Installing locally

Copy `main.js` and `manifest.json` into `<vault>/.obsidian/plugins/task-sorter/`,
then enable the plugin in Settings → Community plugins.
