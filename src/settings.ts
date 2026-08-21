import { App, PluginSettingTab, Setting } from 'obsidian';
import TaskSorterPlugin from './main';
import { TaskPlacement } from './sortTasks';

const PLACEMENT_OPTIONS: Record<TaskPlacement, string> = {
	sort: 'Sort with the others',
	top: 'Move to top',
	bottom: 'Move to bottom',
};

export class TaskSorterSettingTab extends PluginSettingTab {
	plugin: TaskSorterPlugin;

	constructor(app: App, plugin: TaskSorterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Completed tasks')
			.setDesc('Where "- [x]" tasks end up when a block is sorted.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(PLACEMENT_OPTIONS)
					.setValue(this.plugin.settings.donePlacement)
					.onChange(async (value) => {
						this.plugin.settings.donePlacement = value as TaskPlacement;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Empty tasks')
			.setDesc('Where tasks with no text end up when a block is sorted.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(PLACEMENT_OPTIONS)
					.setValue(this.plugin.settings.emptyPlacement)
					.onChange(async (value) => {
						this.plugin.settings.emptyPlacement = value as TaskPlacement;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('In-progress tasks')
			.setDesc('Where "- [/]" tasks end up when a block is sorted.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(PLACEMENT_OPTIONS)
					.setValue(this.plugin.settings.inProgressPlacement)
					.onChange(async (value) => {
						this.plugin.settings.inProgressPlacement = value as TaskPlacement;
						await this.plugin.saveSettings();
					}),
			);
	}
}
