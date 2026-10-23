// @vitest-environment happy-dom
import { beforeAll, describe, expect, test } from "vitest";
import { ScrollRoom } from "../src/ui/scroll-room";

beforeAll(() => {
	HTMLElement.prototype.createDiv = function (cls?: string | { cls?: string }) {
		const element = this.ownerDocument.createElement("div");
		element.className = typeof cls === "string" ? cls : (cls?.cls ?? "");
		this.appendChild(element);
		return element;
	};
	HTMLElement.prototype.setCssStyles = function (styles: Partial<CSSStyleDeclaration>) {
		Object.assign(this.style, styles);
	};
});

const room = (): { scroller: HTMLElement; scrollRoom: ScrollRoom; el: () => HTMLElement | null } => {
	const scroller = document.createElement("div");
	return {
		scroller,
		scrollRoom: new ScrollRoom(scroller),
		el: () => scroller.querySelector<HTMLElement>(".dc-scroll-room"),
	};
};

describe("ScrollRoom", () => {
	test("ends a 1px marker at the extent", () => {
		const { scrollRoom, el } = room();

		scrollRoom.set(500);

		expect(el()?.style.top).toBe("499px");
	});

	test("rounds a fractional extent up so the last pixel of the card is reachable", () => {
		const { scrollRoom, el } = room();

		scrollRoom.set(500.2);

		expect(el()?.style.top).toBe("500px");
	});

	test("moves the marker when the extent changes", () => {
		const { scroller, scrollRoom, el } = room();

		scrollRoom.set(500);
		scrollRoom.set(720);

		expect(el()?.style.top).toBe("719px");
		expect(scroller.querySelectorAll(".dc-scroll-room")).toHaveLength(1);
	});

	test("writes nothing when the extent has not changed", () => {
		// A style write is a mutation; an unchanged extent must not produce one, or
		// scroll-driven repositions would write on every frame.
		const { scroller, scrollRoom } = room();
		scrollRoom.set(500);
		let mutations = 0;
		const observer = new MutationObserver((records) => (mutations += records.length));
		observer.observe(scroller, { attributes: true, childList: true, subtree: true });

		scrollRoom.set(500);
		scrollRoom.set(499.5);

		expect(observer.takeRecords()).toHaveLength(0);
		expect(mutations).toBe(0);
		observer.disconnect();
	});

	test("drops the marker when the column has no cards", () => {
		const { scrollRoom, el } = room();
		scrollRoom.set(500);

		scrollRoom.set(null);

		expect(el()).toBeNull();
	});

	test("adds the marker back after it was dropped", () => {
		const { scrollRoom, el } = room();
		scrollRoom.set(500);
		scrollRoom.set(null);

		scrollRoom.set(500);

		expect(el()?.style.top).toBe("499px");
	});

	test("re-attaches a marker its scroller threw away", () => {
		const { scroller, scrollRoom, el } = room();
		scrollRoom.set(500);
		scroller.replaceChildren();

		scrollRoom.set(500);

		expect(el()?.style.top).toBe("499px");
	});

	test("removes the marker on destroy", () => {
		const { scrollRoom, el } = room();
		scrollRoom.set(500);

		scrollRoom.destroy();

		expect(el()).toBeNull();
	});
});
