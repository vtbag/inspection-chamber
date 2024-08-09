import { plugInPanel } from './inner';

let firstModusInteraction = true;

export type Modus = 'bypass' | 'slow-motion' | 'full-control' | 'compare';

export function setModus(modus?: Modus) {
	top!.document.documentElement.dataset.vtbagModus = modus || '';
}
export function getModus(): Modus {
	const modus = top!.document.documentElement.dataset.vtbagModus;
	return (modus ? modus : undefined) as Modus;
}

export function updateMessage(modus: Modus) {
	const messages = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-messages')!;
	messages.innerHTML = message[modus];
	plugInPanel(messages);
	const modi = top!.document.querySelector<HTMLDivElement>('#vtbag-ui-modi')!;
	if (
		firstModusInteraction &&
		modi.parentElement?.id === 'vtbag-ui-panel' &&
		messages.parentElement?.id === 'vtbag-ui-panel'
	) {
		firstModusInteraction = false;
		top!.document
			.querySelector('#vtbag-ui-panel')
			?.insertAdjacentElement(
				'afterbegin',
				top!.document.querySelector<HTMLInputElement>('#vtbag-ui-modi')!
			);
	}
	const closedMessages = top!.document.querySelector<HTMLHeadingElement>(
		'#vtbag-ui-panel #vtbag-ui-messages h4'
	);
	if (closedMessages && localStorage.getItem('vtbag-tutorial-mode') !== 'false') {
		closedMessages.click();
	}
}

const message: Record<Modus, string> = {
	bypass: `<h4>How to Bypass</h4><p>Navigation is <b>not intercepted</b>.</p><ol><li>Optional: Examine elements by selecting from the View Transition Name list</li><li>Navigate your page as usual</li></ol>`,
	'slow-motion': `<h4>View in Slow Motion</h4><ol><li>Use the slider to set a <b>time stretch factor</b></li><li>Press a link on your page to start a view transition and study the <b>slowed down animations!</li></ol>`,
	'full-control': `<h4>Take Full Control</h4><ol><li>Start a transition</li><li>Optional: Select animations from the name list</li><li>Move freely through the timeline of selected elements, check the single animations, hide old and new images or even animations to get a better view.</li><li>To end the inspection, click the [Exit] button in the Full Control panel or the <i>play indicator</i> ([>]) in the top left corner of the viewport.</li></ol>`,
	compare: `<h4>Compare Side-by-side</h4><p>Sometimes you need a clear view of where you're coming from and where you're going!</p><p>Compare the <b>old and new pages side by side</b> and see what morphs where.</p>`,
};
