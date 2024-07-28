let dragged = null as EventTarget | null;

export function initDragging(
	draggable: HTMLElement,
	dragging: (x: number, y: number) => void,
	start?: () => void
) {
	const root = top!.document.documentElement;

	let startX: number;
	let startY: number;
	const x = (e: TouchEvent | MouseEvent, delta = 0) =>
		((e instanceof TouchEvent ? e.touches[0]?.clientX : e.clientX) ?? 0) - delta;
	const y = (e: TouchEvent | MouseEvent, delta = 0) =>
		((e instanceof TouchEvent ? e.touches[0]?.clientY : e.clientY) ?? 0) - delta;

	const startDragging = (e: TouchEvent | MouseEvent, t: HTMLElement) => {
		dragged = t;
		startX = x(e) - t.getBoundingClientRect().x;
		startY = y(e) - t.getBoundingClientRect().y;
		root.classList.add('dragging');
		const mainFrame = root.querySelector<HTMLIFrameElement>('#vtbag-main-frame');
		mainFrame && (mainFrame.style.pointerEvents = 'none');
		start && start();
		e.cancelable && e.preventDefault();
	};

	const drag = (e: MouseEvent | TouchEvent) => {
		if (root.classList.contains('dragging')) dragging(x(e, startX), y(e, startY));
	};

	const stopDragging = () => {
		if (root.classList.contains('dragging')) {
			root.classList.remove('dragging');
			const mainFrame = root.querySelector<HTMLIFrameElement>('#vtbag-main-frame');
			mainFrame && (mainFrame.style.pointerEvents = 'auto');
		}
		dragged = null;
	};

	draggable.addEventListener('mousedown', (e) => startDragging(e, draggable), { passive: false });
	draggable.addEventListener('touchstart', (e) => startDragging(e, draggable), { passive: false });

	draggable.ownerDocument.addEventListener('mousemove', (e) => dragged === draggable && drag(e), {
		passive: true,
	});
	draggable.ownerDocument.addEventListener('touchmove', (e) => dragged === draggable && drag(e), {
		passive: true,
	});

	draggable.ownerDocument.addEventListener(
		'mouseup',
		(e) => dragged === draggable && stopDragging(),
		{ passive: true }
	);
	draggable.ownerDocument.addEventListener(
		'touchend',
		(e) => dragged === draggable && stopDragging(),
		{ passive: true }
	);
}
