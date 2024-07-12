import { initDragging } from './dragging';
import { src} from './pngs/chamber';

export function showReopener() {
	top!.addEventListener('resize', () => {
		// todo: ensure reopener is visible after resize.
		// For now just start a new session to make it visible again.
	});
	const { reopenerLeft, reopenerTop } = JSON.parse(
		sessionStorage.getItem('vtbag-ui-reopener') ??
		'{"reopenerLeft": "0px", "reopenerTop": "0px"}'
	);
	top!.document.body.insertAdjacentHTML(
		'beforeend',
		`<div title="reopen the inspection chamber" id="vtbag-ui-reopen" style="position: fixed; z-index:1100; left: ${reopenerLeft}; top: ${reopenerTop}"><img style="  border-radius: 50%;
  border: 8px dashed #8888;
  mask-image: radial-gradient(ellipse at center, white 35%, transparent 71%);
" src=${src} alt="" /><div>

		<style>
			#vtbag-ui-reopen g {
				stroke: #797c;
			}
			#vtbag-ui-reopen:hover {
				cursor: grab;
			}
			#vtbag-ui-reopen:hover g {
				stroke: #a97;
			}

			:root.dragging #vtbag-ui-reopen {
				cursor: grabbing;
			}
			:root.dragging #vtbag-ui-reopen g {
				stroke: #a97
			}
			</style>
			`
	);
	const reopener = top!.document.querySelector<HTMLElement>('#vtbag-ui-reopen')!;
	let dragged = false;
	reopener.addEventListener('click', () => {
		setTimeout(() => (dragged = false), 100);
		if (!dragged) {
			sessionStorage.removeItem('vtbag-ui-closed');
			top!.location.reload();
		}
	});
	initDragging(reopener, (e: MouseEvent | TouchEvent) => {
		reopener.style.left = `${(e instanceof TouchEvent ? e.touches[0]?.clientX - 16 : e.clientX - 16) ?? 0}px`;
		reopener.style.top = `${(e instanceof TouchEvent ? e.touches[0]?.clientY - 16 : e.clientY - 16) ?? 0}px`;
		dragged = true;
		saveReopenerPosition(reopener);
	});
}
function saveReopenerPosition(reopener: HTMLElement) {
	sessionStorage.setItem(
		'vtbag-ui-reopener',
		JSON.stringify({
			reopenerLeft: reopener.style.left,
			reopenerTop: reopener.style.top,
		})
	);
}

