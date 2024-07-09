import { initDragging } from './dragging';

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
		`<div title="reopen the inspection chamber" id="vtbag-ui-reopen" style="position: fixed; z-index:1100; left: ${reopenerLeft}; top: ${reopenerTop}"><svg xmlns="http://www.w3.org/2000/svg"   width="2em" height="2em" viewBox="0 0 48 48"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M35 14c0-5.523-4.925-10-11-10S13 8.477 13 14m-6 2a2 2 0 0 1 2-2h30a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v0a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v0a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zm3 14v14h28V30"/><path d="M20 26h8v6h-8z"/></g></svg><div>

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

