import { Editor, Notice, Plugin } from 'obsidian';
import { sortTaskBlock } from './sortTasks';

const COMMAND_NAME = 'Sort task block at cursor';

export default class TaskSorterPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'sort-task-block',
			name: COMMAND_NAME,
			editorCallback: (editor: Editor) => this.sortBlockAtCursor(editor),
		});

		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				// Only offer the item when there is something to sort.
				if (sortTaskBlock(editor.getValue().split('\n'), editor.getCursor().line) === null) {
					return;
				}
				menu.addItem((item) =>
					item
						.setTitle(COMMAND_NAME)
						.setIcon('arrow-down-narrow-wide')
						.onClick(() => this.sortBlockAtCursor(editor)),
				);
			}),
		);
	}

	private sortBlockAtCursor(editor: Editor) {
		const lines = editor.getValue().split('\n');
		const sorted = sortTaskBlock(lines, editor.getCursor().line);
		if (sorted === null) {
			new Notice('No task list found at cursor');
			return;
		}

		const original = lines.slice(sorted.start, sorted.end + 1);
		if (original.join('\n') === sorted.lines.join('\n')) return;

		editor.replaceRange(
			sorted.lines.join('\n'),
			{ line: sorted.start, ch: 0 },
			{ line: sorted.end, ch: editor.getLine(sorted.end).length },
		);
	}
}
