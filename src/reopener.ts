import { initDragging } from './dragging';
import { src } from './pngs/chamber';

export const STANDBY = 'vtbag-ui-standby';
const REOPENER_POSITION = 'vtbag-ui-reopener-position';

export function showReopener() {
	const { reopenerLeft, reopenerTop } = JSON.parse(
		top!.sessionStorage.getItem(REOPENER_POSITION) ??
			'{"reopenerLeft": "0px", "reopenerTop": "0px"}'
	);
	top!.document.querySelector('#vtbag-ui-reopen')?.remove();
	top!.document.body.insertAdjacentHTML(
		'beforeend',
		`<div title="Reactivate the inspection chamber" id="vtbag-ui-reopen" style="position: fixed; z-index:1100; left: ${reopenerLeft}; top: ${reopenerTop}"><img style="  border-radius: 50%;
  border: 8px dashed #8888;
  mask-image: radial-gradient(ellipse at center, white 35%, transparent 71%);
" src=${src} alt="Reactivate the inspection chamber"><div>

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
	initListeners();
}

function initListeners() {
	const reopener = top!.document.querySelector<HTMLElement>('#vtbag-ui-reopen')!;
	let dragged = { x: -1, y: -1 };
	let startPosition = { x: -1, y: -1 };
	reopener.addEventListener('click', open);
	reopener.addEventListener('touchend', open);
	initDragging(
		reopener,
		(x, y) => {
			reopener.style.left = `${x}px`;
			reopener.style.top = `${y}px`;
			dragged = { x, y };
			saveReopenerPosition(reopener);
		},
		(x, y) => ((dragged = { x: -1, y: -1 }), (startPosition = { x, y }))
	);

	function open() {
		if (
			dragged.x === -1 ||
			Math.pow(startPosition.x - dragged.x, 2) + Math.pow(startPosition.y - dragged.y, 2) <= 16
		) {
			top!.sessionStorage.removeItem(STANDBY);
			top!.location.reload();
		}
	}
}
function saveReopenerPosition(reopener: HTMLElement) {
	top!.sessionStorage.setItem(
		REOPENER_POSITION,
		JSON.stringify({
			reopenerLeft: reopener.style.left,
			reopenerTop: reopener.style.top,
		})
	);
}
