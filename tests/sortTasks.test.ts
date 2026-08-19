import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
	DEFAULT_SETTINGS,
	sortTaskBlock,
	TaskSorterSettings,
} from '../src/sortTasks';

/** Sorts the block at `cursor` and returns the whole text back. */
function sort(
	text: string,
	cursor: number,
	settings: Partial<TaskSorterSettings> = {},
): string | null {
	const lines = text.split('\n');
	const block = sortTaskBlock(lines, cursor, { ...DEFAULT_SETTINGS, ...settings });
	if (block === null) return null;
	return [
		...lines.slice(0, block.start),
		...block.lines,
		...lines.slice(block.end + 1),
	].join('\n');
}

describe('priority', () => {
	test('sorts a flat list by priority', () => {
		assert.equal(
			sort('- [ ] b 🔽\n- [ ] c\n- [ ] a ⏫\n- [ ] d 🔼', 0),
			'- [ ] a ⏫\n- [ ] d 🔼\n- [ ] c\n- [ ] b 🔽',
		);
	});

	test('orders the full scale 🔺 ⏫ 🔼 none 🔽 ⏬', () => {
		assert.equal(
			sort('- [ ] e 🔽\n- [ ] f ⏬\n- [ ] c\n- [ ] a 🔺\n- [ ] b ⏫\n- [ ] d 🔼', 0),
			'- [ ] a 🔺\n- [ ] b ⏫\n- [ ] d 🔼\n- [ ] c\n- [ ] e 🔽\n- [ ] f ⏬',
		);
	});
});

describe('due date', () => {
	test('breaks ties within a priority tier, undated last', () => {
		assert.equal(
			sort('- [ ] x 🔼 📅 2026-09-01\n- [ ] y 🔼\n- [ ] z 🔼 📅 2026-08-20', 1),
			'- [ ] z 🔼 📅 2026-08-20\n- [ ] x 🔼 📅 2026-09-01\n- [ ] y 🔼',
		);
	});

	test('never outweighs priority', () => {
		const list = '- [ ] late ⏫ 📅 2026-12-31\n- [ ] soon 🔼 📅 2026-08-19';
		assert.equal(sort(list, 0), list);
	});

	test('keeps equal tasks in their original order', () => {
		const list = '- [ ] first\n- [ ] second\n- [ ] third';
		assert.equal(sort(list, 1), list);
	});
});

describe('sub-items', () => {
	test('travel with their parent', () => {
		assert.equal(
			sort('- [ ] b\n\tnote b\n\t- [ ] child b\n- [ ] a ⏫\n\tnote a', 0),
			'- [ ] a ⏫\n\tnote a\n- [ ] b\n\tnote b\n\t- [ ] child b',
		);
	});

	test('a nested list is sorted on its own level', () => {
		assert.equal(
			sort('- [ ] parent\n\t- [ ] n2 🔽\n\t- [ ] n1 ⏫', 2),
			'- [ ] parent\n\t- [ ] n1 ⏫\n\t- [ ] n2 🔽',
		);
	});
});

describe('done tasks', () => {
	const mixed = '- [ ] b 🔽\n- [ ] a ⏫\n- [x] done\n- [ ] d 🔽\n- [ ] c ⏫';
	const sorted = '- [ ] a ⏫\n- [ ] c ⏫\n- [ ] b 🔽\n- [ ] d 🔽\n- [x] done';

	test('sink to the bottom without splitting the block', () => {
		assert.equal(sort(mixed, 0), sorted);
	});

	test('do not cut off tasks below them', () => {
		assert.equal(sort(mixed, 4), sorted);
	});

	test('can hold the cursor themselves', () => {
		assert.equal(
			sort('- [ ] b 🔽\n- [x] done\n- [ ] a ⏫', 1),
			'- [ ] a ⏫\n- [ ] b 🔽\n- [x] done',
		);
	});

	test('keep their order relative to each other', () => {
		assert.equal(
			sort('- [x] first done\n- [ ] b 🔽\n- [x] second done\n- [ ] a ⏫', 1),
			'- [ ] a ⏫\n- [ ] b 🔽\n- [x] first done\n- [x] second done',
		);
	});

	test('carry their sub-items down', () => {
		assert.equal(
			sort('- [x] done\n\tnote of done\n- [ ] a ⏫', 2),
			'- [ ] a ⏫\n- [x] done\n\tnote of done',
		);
	});

	test('are recognised in upper case', () => {
		assert.equal(
			sort('- [X] done\n- [ ] a ⏫', 0),
			'- [ ] a ⏫\n- [X] done',
		);
	});

	test('a block of only done tasks is left alone', () => {
		const list = '- [x] a\n- [x] b';
		assert.equal(sort(list, 0), list);
	});
});

describe('other status markers', () => {
	test('in progress stays among the active tasks', () => {
		assert.equal(
			sort('- [ ] c\n- [/] wip\n- [ ] a ⏫', 1),
			'- [ ] a ⏫\n- [ ] c\n- [/] wip',
		);
	});

	test('in progress is sorted by its own priority', () => {
		assert.equal(
			sort('- [ ] plain\n- [x] done\n- [/] wip ⏫', 0),
			'- [/] wip ⏫\n- [ ] plain\n- [x] done',
		);
	});
});

describe('placement settings', () => {
	const list = '- [x] done\n- [ ] b 🔽\n- [/] wip\n- [ ] a ⏫';

	test('defaults keep done at the bottom and in progress in the sort', () => {
		assert.equal(
			sort(list, 1),
			'- [ ] a ⏫\n- [/] wip\n- [ ] b 🔽\n- [x] done',
		);
	});

	test('done tasks can be pinned to the top', () => {
		assert.equal(
			sort(list, 1, { donePlacement: 'top' }),
			'- [x] done\n- [ ] a ⏫\n- [/] wip\n- [ ] b 🔽',
		);
	});

	test('done tasks can join the sort', () => {
		assert.equal(
			sort(list, 1, { donePlacement: 'sort' }),
			'- [ ] a ⏫\n- [x] done\n- [/] wip\n- [ ] b 🔽',
		);
	});

	test('in-progress tasks can be pinned to the top', () => {
		assert.equal(
			sort(list, 1, { inProgressPlacement: 'top' }),
			'- [/] wip\n- [ ] a ⏫\n- [ ] b 🔽\n- [x] done',
		);
	});

	test('in-progress tasks can be pinned to the bottom', () => {
		assert.equal(
			sort(list, 1, { inProgressPlacement: 'bottom' }),
			'- [ ] a ⏫\n- [ ] b 🔽\n- [x] done\n- [/] wip',
		);
	});

	test('both groups can be pinned to opposite ends', () => {
		assert.equal(
			sort(list, 1, { donePlacement: 'top', inProgressPlacement: 'bottom' }),
			'- [x] done\n- [ ] a ⏫\n- [ ] b 🔽\n- [/] wip',
		);
	});

	test('pinned groups keep their own order and their sub-items', () => {
		assert.equal(
			sort(
				'- [x] first\n\tnote\n- [ ] a ⏫\n- [x] second',
				2,
				{ donePlacement: 'top' },
			),
			'- [x] first\n\tnote\n- [x] second\n- [ ] a ⏫',
		);
	});
});

describe('block boundaries', () => {
	test('only the block around the cursor is touched', () => {
		assert.equal(
			sort('- [ ] b1 🔽\n- [ ] a1 ⏫\n\n- [ ] b2 🔽\n- [ ] a2 ⏫', 4),
			'- [ ] b1 🔽\n- [ ] a1 ⏫\n\n- [ ] a2 ⏫\n- [ ] b2 🔽',
		);
	});

	test('a single task is a no-op', () => {
		const note = 'intro\n\n- [ ] only 🔼\n\noutro';
		assert.equal(sort(note, 2), note);
	});

	test('returns null when the cursor is not on a task', () => {
		assert.equal(sort('just text\n- [ ] a ⏫', 0), null);
	});

	test('returns null past the end of the file', () => {
		assert.equal(sort('- [ ] a ⏫', 5), null);
	});
});
