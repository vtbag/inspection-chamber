let dragged = null as EventTarget | null;

export function initDragging(
	draggable: HTMLElement,
	dragging: (x: number, y: number) => void,
	start?: (x: number, y: number) => void
) {
	const root = top!.document.documentElement;

	let startX: number;
	let startY: number;
	const lX = (x: number) => x < 0 ? 0 : x > (innerWidth - 16) ? (innerWidth - 16) : x;
	const lY = (y: number) => y < 0 ? 0 : y > (innerHeight - 16) ? (innerHeight - 16) : y;
	const xe = (e: TouchEvent | MouseEvent, delta = 0) =>
		lX(((e instanceof TouchEvent ? e.touches[0]?.clientX : e.clientX) ?? 0)) - delta;
	const ye = (e: TouchEvent | MouseEvent, delta = 0) =>
		lY(((e instanceof TouchEvent ? e.touches[0]?.clientY : e.clientY) ?? 0)) - delta;

	const startDragging = (e: TouchEvent | MouseEvent, t: HTMLElement) => {
		dragged = t;
		const x = xe(e);
		const y = ye(e);
		startX = x - t.getBoundingClientRect().x;
		startY = y - t.getBoundingClientRect().y;
		root.classList.add('dragging');
		const mainFrame = root.querySelector<HTMLIFrameElement>('#vtbag-main-frame');
		mainFrame && (mainFrame.style.pointerEvents = 'none');
		start && start(x - startX, y - startY);
		e.cancelable && e.preventDefault();
	};

	const drag = (e: MouseEvent | TouchEvent) => {
		if (root.classList.contains('dragging')) dragging(xe(e, startX), ye(e, startY));
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
