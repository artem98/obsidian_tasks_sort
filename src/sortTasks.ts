/**
 * `- [ ] text`, capturing indentation, the status marker and the text. The text
 * is optional so that a bare `- [ ]` still counts as a task.
 */
const CHECKLIST_RE = /^(\s*)-\s\[(.)\](?:\s(.*))?$/;
const DUE_DATE_RE = /📅\s*(\d{4}-\d{2}-\d{2})/;
/** 🔺 before ⏫ before 🔼 before no priority before 🔽 before ⏬. */
const PRIORITY_RE = /[🔺⏫🔼🔽⏬]/u;
const PRIORITY_RANK: Record<string, number> = {
	'🔺': 0,
	'⏫': 1,
	'🔼': 2,
	'🔽': 4,
	'⏬': 5,
};
const NO_PRIORITY_RANK = 3;

/** Where a group of tasks ends up when the block is sorted. */
export type TaskPlacement = 'sort' | 'top' | 'bottom';

export interface TaskSorterSettings {
	donePlacement: TaskPlacement;
	inProgressPlacement: TaskPlacement;
	emptyPlacement: TaskPlacement;
}

export const DEFAULT_SETTINGS: TaskSorterSettings = {
	donePlacement: 'bottom',
	inProgressPlacement: 'sort',
	emptyPlacement: 'bottom',
};

export interface SortedBlock {
	start: number;
	end: number;
	lines: string[];
}

/** Placement buckets, in the order they end up in the note. */
const TOP = 0;
const SORTED = 1;
const BOTTOM = 2;

interface TaskItem {
	lines: string[];
	bucket: number;
	priority: number;
	dueDate: string | null;
}

function lineAt(lines: string[], index: number): string {
	return lines[index] ?? '';
}

function indentOf(line: string): number {
	return line.length - line.trimStart().length;
}

function matchTask(
	line: string,
): { indent: number; marker: string; text: string } | null {
	const match = CHECKLIST_RE.exec(line);
	if (match === null) return null;
	const [, indent = '', marker = '', text = ''] = match;
	return { indent: indent.length, marker, text };
}

/** A task of the block being sorted: same indentation, any status marker. */
function isTaskAt(lines: string[], index: number, indent: number): boolean {
	const task = matchTask(lineAt(lines, index));
	return task !== null && task.indent === indent;
}

/**
 * An unfinished task with no text is empty — the placeholder Obsidian leaves
 * when you start a new item. Otherwise `- [x]` is done and `- [/]` is in
 * progress, and every other status marker is an ordinary active task.
 */
function bucketOf(line: string, settings: TaskSorterSettings): number {
	const task = matchTask(line);
	if (task === null) return SORTED;

	let placement: TaskPlacement = 'sort';
	if (task.marker === ' ' && task.text.trim() === '') {
		placement = settings.emptyPlacement;
	}
	else if (task.marker.toLowerCase() === 'x') placement = settings.donePlacement;
	else if (task.marker === '/') placement = settings.inProgressPlacement;

	if (placement === 'top') return TOP;
	if (placement === 'bottom') return BOTTOM;
	return SORTED;
}

/** Any non-blank line indented deeper than the items belongs to the one above it. */
function isSubLineAt(lines: string[], index: number, indent: number): boolean {
	const line = lineAt(lines, index);
	return line.trim() !== '' && indentOf(line) > indent;
}

function priorityOf(line: string): number {
	const match = PRIORITY_RE.exec(line);
	return match === null ? NO_PRIORITY_RANK : PRIORITY_RANK[match[0]] ?? NO_PRIORITY_RANK;
}

function dueDateOf(line: string): string | null {
	const match = DUE_DATE_RE.exec(line);
	return match === null ? null : match[1] ?? null;
}

/** Tasks without a due date sort after tasks that have one. */
function compareDueDates(a: string | null, b: string | null): number {
	if (a === b) return 0;
	if (a === null) return 1;
	if (b === null) return -1;
	return a < b ? -1 : 1;
}

/**
 * Sorts the contiguous checklist block surrounding `cursorLine` by priority,
 * then by due date. Done and in-progress tasks can be pinned to the top or the
 * bottom of the block instead. Returns null when the cursor is not on a task.
 */
export function sortTaskBlock(
	lines: string[],
	cursorLine: number,
	settings: TaskSorterSettings = DEFAULT_SETTINGS,
): SortedBlock | null {
	const cursorTask = matchTask(lineAt(lines, cursorLine));
	if (cursorTask === null) return null;
	const indent = cursorTask.indent;

	let start = cursorLine;
	for (let i = cursorLine - 1; i >= 0; i--) {
		if (isTaskAt(lines, i, indent)) start = i;
		else if (!isSubLineAt(lines, i, indent)) break;
	}

	let end = cursorLine;
	for (let i = cursorLine + 1; i < lines.length; i++) {
		if (!isTaskAt(lines, i, indent) && !isSubLineAt(lines, i, indent)) break;
		end = i;
	}

	const items: TaskItem[] = [];
	let current: TaskItem | null = null;
	for (let i = start; i <= end; i++) {
		const line = lineAt(lines, i);
		if (current === null || isTaskAt(lines, i, indent)) {
			current = {
				lines: [line],
				bucket: bucketOf(line, settings),
				priority: priorityOf(line),
				dueDate: dueDateOf(line),
			};
			items.push(current);
		} else {
			// Sub-items travel with their parent.
			current.lines.push(line);
		}
	}

	// Array.prototype.sort is stable, so ties — and the pinned buckets, which are
	// not sorted at all — keep their original order.
	items.sort((a, b) => {
		if (a.bucket !== b.bucket) return a.bucket - b.bucket;
		if (a.bucket !== SORTED) return 0;
		return a.priority - b.priority || compareDueDates(a.dueDate, b.dueDate);
	});

	return { start, end, lines: items.flatMap((item) => item.lines) };
}
