import { Editor, Notice, Plugin } from 'obsidian';
import { TaskSorterSettingTab } from './settings';
import { DEFAULT_SETTINGS, sortTaskBlock, TaskSorterSettings } from './sortTasks';

const COMMAND_NAME = 'Sort task block at cursor';

export default class TaskSorterPlugin extends Plugin {
	settings!: TaskSorterSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'sort-task-block',
			name: COMMAND_NAME,
			editorCallback: (editor: Editor) => this.sortBlockAtCursor(editor),
		});

		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				// Only offer the item when there is something to sort.
				if (this.blockAtCursor(editor) === null) return;
				menu.addItem((item) =>
					item
						.setTitle(COMMAND_NAME)
						.setIcon('arrow-down-narrow-wide')
						.onClick(() => this.sortBlockAtCursor(editor)),
				);
			}),
		);

		this.addSettingTab(new TaskSorterSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<TaskSorterSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private blockAtCursor(editor: Editor) {
		return sortTaskBlock(
			editor.getValue().split('\n'),
			editor.getCursor().line,
			this.settings,
		);
	}

	private sortBlockAtCursor(editor: Editor) {
		const sorted = this.blockAtCursor(editor);
		if (sorted === null) {
			new Notice('No task list found at cursor');
			return;
		}

		const lines = editor.getValue().split('\n');
		const original = lines.slice(sorted.start, sorted.end + 1);
		if (original.join('\n') === sorted.lines.join('\n')) return;

		editor.replaceRange(
			sorted.lines.join('\n'),
			{ line: sorted.start, ch: 0 },
			{ line: sorted.end, ch: editor.getLine(sorted.end).length },
		);
	}
}
