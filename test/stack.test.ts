import { describe, expect, test } from "vitest";
import { stackExtent, stackTops } from "../src/ui/stack";

describe("stackTops", () => {
	test("returns tops in the original input order", () => {
		const tops = stackTops(
			[
				{ top: 200, height: 40 },
				{ top: 0, height: 40 },
			],
			8,
		);
		expect(tops).toEqual([200, 0]);
	});

	test("pushes an overlapping card down past the previous one plus the gap", () => {
		// Second card wants top 30 but the first occupies 0..40; it gets 40 + gap.
		expect(
			stackTops(
				[
					{ top: 0, height: 40 },
					{ top: 30, height: 20 },
				],
				8,
			),
		).toEqual([0, 48]);
	});

	test("keeps a card whose anchor scrolled above the viewport at its negative top", () => {
		// First floor is -Infinity, so the top card keeps its negative anchor top.
		const tops = stackTops(
			[
				{ top: -100, height: 40 },
				{ top: -50, height: 40 },
			],
			8,
		);
		expect(tops[0]).toBe(-100);
		expect(tops[1]).toBe(-50); // -50 already clears -100 + 40 + 8 = -52
	});

	test("stacks in anchor order regardless of input order", () => {
		const tops = stackTops(
			[
				{ top: 100, height: 40 },
				{ top: 0, height: 40 },
				{ top: 50, height: 40 },
			],
			8,
		);
		// sorted anchors 0, 50, 100 → 0, 50, 100 (none overlaps the previous + gap)
		expect(tops).toEqual([100, 0, 50]);
	});
});

describe("stackExtent", () => {
	test("is null when no card is placed, so an empty column asks for no scroll room", () => {
		expect(stackExtent([], [], 16)).toBeNull();
	});

	test("reaches the lowest card's bottom edge plus the padding", () => {
		const placements = [
			{ top: 0, height: 40 },
			{ top: 10, height: 100 },
		];
		// Stacked at 0 and 48: the second card ends at 148.
		expect(stackExtent(placements, stackTops(placements, 8), 16)).toBe(164);
	});

	test("uses the lowest bottom edge whatever the input order", () => {
		// Resolved tops are given in input order: the tall card ends at 300, the short one at 110.
		const placements = [
			{ top: 0, height: 300 },
			{ top: 20, height: 10 },
		];
		expect(stackExtent(placements, [0, 100], 0)).toBe(300);
		expect(stackExtent(placements.toReversed(), [100, 0], 0)).toBe(300);
	});

	test("counts a stack that sits above the viewport top", () => {
		const placements = [{ top: -500, height: 40 }];
		expect(stackExtent(placements, stackTops(placements, 8), 16)).toBe(-444);
	});

	test("is unchanged by hidden cards, which are never placed", () => {
		// Cards with no height (resolved, hidden) and off-screen anchors are filtered out
		// before stacking, so the extent is that of the placed cards alone.
		const shown = [{ top: 0, height: 60 }];
		expect(stackExtent(shown, stackTops(shown, 8), 16)).toBe(76);
	});
});
