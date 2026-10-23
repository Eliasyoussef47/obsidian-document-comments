/**
 * Lets a scroller scroll as far down as its margin column reaches. The column is an
 * overlay that tracks the note's scroll position, so a short note with many stacked
 * cards has nothing to scroll while the cards run past the bottom of the viewport.
 *
 * The room is a 1px element placed at the column's bottom edge. It is positioned
 * absolutely, so it extends the scroller's scrollable area without taking part in
 * the note's layout (CodeMirror's height measurement never sees it), and it is
 * placed from card geometry rather than from the scroll height, so writing it can't
 * change what the next layout pass computes.
 */
export class ScrollRoom {
	private el: HTMLElement | null = null;
	private extent: number | null = null;

	/** `scroller` must be a positioned element, so `top` counts from its content. */
	constructor(private scroller: HTMLElement) {}

	/** Make the scroller scrollable down to `extent`, in px from the top of its
	 *  scrolled content, or drop the room when null. Writes only when it changes. */
	set(extent: number | null): void {
		const next = extent === null ? null : Math.ceil(extent);
		const attached = this.el?.parentNode === this.scroller;
		if (next === this.extent && (next === null || attached)) return;
		this.extent = next;
		if (next === null) {
			this.el?.remove();
			this.el = null;
			return;
		}
		this.el ??= this.scroller.createDiv("dc-scroll-room");
		if (!attached) this.scroller.appendChild(this.el);
		this.el.setCssStyles({ top: `${next - 1}px` });
	}

	destroy(): void {
		this.set(null);
	}
}
