import { Modus } from "../types";

export const message: Record<Modus, string> = {
	bypass: `<h4>How to Bypass</h4><p>Navigation is <b>not intercepted</b>.</p><ol><li>Optional: Examine elements by selecting from the View Transition Name list</li><li>Navigate your page as usual</li></ol>`,
	'slow-motion': `<h4>Use Slow Motion</h4><ol><li>Use the slider to set a <b>time stretch factor</b></li><li>Press a link on your page to start a view transition and study the <b>slowed down animations!</li></ol>`,
	control: `<h4>Take Full Control</h4><ol><li>Start a transition</li><li>Select animations</li><li>Move freely through the timeline and concentrate on selected elements and groups.</li></ol>`,
	compare: `<h4>Compare Side-by-side</h4><p>Sometimes you need a clear view of where you're coming from and where you're going!</p><p>Compare the <b>old and new pages side by side</b> and see what morphs where.</p>`,
};