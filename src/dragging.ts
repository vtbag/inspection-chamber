export function initDragging(
	draggable: HTMLElement,
	dragging: (e: MouseEvent | TouchEvent) => void
) {
	const root = top!.document.documentElement;

	const startDragging = (e: Event) => {
		root.classList.add('dragging');
		const mainFrame = root.querySelector<HTMLIFrameElement>('#vtbag-main-frame');
		mainFrame && (mainFrame.style.pointerEvents = 'none');
		e.preventDefault();
	};

	const drag = (e: MouseEvent | TouchEvent) => {
		if (root.classList.contains('dragging')) dragging(e);
	};

	const stopDragging = () => {
		if (root.classList.contains('dragging')) {
			root.classList.remove('dragging');
			const mainFrame = root.querySelector<HTMLIFrameElement>('#vtbag-main-frame');
			mainFrame && (mainFrame.style.pointerEvents = 'auto');
		}
	};

	draggable.addEventListener('mousedown', startDragging);
	draggable.addEventListener('touchstart', startDragging, { passive: false });

	draggable.ownerDocument.addEventListener('mousemove', drag);
	draggable.ownerDocument.addEventListener('touchmove', drag);

	draggable.ownerDocument.addEventListener('mouseup', stopDragging);
	draggable.ownerDocument.addEventListener('touchend', stopDragging);
}
