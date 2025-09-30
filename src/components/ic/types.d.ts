declare namespace JSX {
	interface IntrinsicElements {
		'vtbag-ic-animations': {};
		'vtbag-ic-scope': {
			element: Element;
		};
		'vtbag-ic-group-list': {};
		'vtbag-ic-group': {
			name: string;
		};
	}
}
declare global {
	interface VtbagIcAnimationsElement extends HTMLElement {}
	interface VtbagIcScopeElement extends HTMLElement {
		get path(): string;
		element: Element;
		animations: Animation[];
	}
	interface VtbagIcGroupListElement extends HTMLElement {
		animations: Animation[];
	}
	interface VtbagIcGroupElement extends HTMLElement {
		name: string;
		animations: Animation[];
	}
	interface VtbagIcPseudoElement extends HTMLElement {
		exists: boolean;
	}
	interface HTMLElementTagNameMap {
		'vtbag-ic-animations': VtbagIcAnimationsElement;
		'vtbag-ic-scope': VtbagIcScopeElement;
		'vtbag-ic-group-list': VtbagIcGroupListElement;
		'vtbag-ic-group': VtbagIcGroupElement;
		'vtbag-ic-pseudo': VtbagIcPseudoElement;
	}
}

export {};
