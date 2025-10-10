import type { Group } from './capture';
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
	interface VtbagIcAnimationsElement extends HTMLElement {
		groupMaps: Map<HTMLElement, Map<string, Group>>;
	}
	interface VtbagIcScopeElement extends HTMLElement {
		init(element: HTMLElement, root: Group, animations: Animation[]): void;
		get element(): HTMLElement;
		get path(): string;
		animations: Animation[];
	}
	interface VtbagIcGroupListElement extends HTMLElement {
		animations: Animation[];
	}
	interface VtbagIcGroupElement extends HTMLElement {
		name: string;
		get scope(): VtbagIcScopeElement;
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
