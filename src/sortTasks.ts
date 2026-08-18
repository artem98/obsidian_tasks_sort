/** `- [ ] text`, capturing indentation and the status marker. */
const CHECKLIST_RE = /^(\s*)-\s\[(.)\]\s.*/;
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

export interface SortedBlock {
	start: number;
	end: number;
	lines: string[];
}

interface TaskItem {
	lines: string[];
	priority: number;
	dueDate: string | null;
}

function lineAt(lines: string[], index: number): string {
	return lines[index] ?? '';
}

function indentOf(line: string): number {
	return line.length - line.trimStart().length;
}

function matchTask(line: string): { indent: number; marker: string } | null {
	const match = CHECKLIST_RE.exec(line);
	if (match === null) return null;
	const [, indent = '', marker = ''] = match;
	return { indent: indent.length, marker };
}

/** Only `- [ ]` is sortable; `- [x]` and other statuses bound the block. */
function isOpenTaskAt(lines: string[], index: number, indent: number): boolean {
	const task = matchTask(lineAt(lines, index));
	return task !== null && task.indent === indent && task.marker === ' ';
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
 * then by due date. Returns null when the cursor is not on an open task.
 */
export function sortTaskBlock(
	lines: string[],
	cursorLine: number,
): SortedBlock | null {
	const cursorTask = matchTask(lineAt(lines, cursorLine));
	if (cursorTask === null || cursorTask.marker !== ' ') return null;
	const indent = cursorTask.indent;

	let start = cursorLine;
	for (let i = cursorLine - 1; i >= 0; i--) {
		if (isOpenTaskAt(lines, i, indent)) start = i;
		else if (!isSubLineAt(lines, i, indent)) break;
	}

	let end = cursorLine;
	for (let i = cursorLine + 1; i < lines.length; i++) {
		if (!isOpenTaskAt(lines, i, indent) && !isSubLineAt(lines, i, indent)) break;
		end = i;
	}

	const items: TaskItem[] = [];
	let current: TaskItem | null = null;
	for (let i = start; i <= end; i++) {
		const line = lineAt(lines, i);
		if (current === null || isOpenTaskAt(lines, i, indent)) {
			current = {
				lines: [line],
				priority: priorityOf(line),
				dueDate: dueDateOf(line),
			};
			items.push(current);
		} else {
			// Sub-items travel with their parent.
			current.lines.push(line);
		}
	}

	// Array.prototype.sort is stable, so ties keep their original order.
	items.sort(
		(a, b) => a.priority - b.priority || compareDueDates(a.dueDate, b.dueDate),
	);

	return { start, end, lines: items.flatMap((item) => item.lines) };
}
