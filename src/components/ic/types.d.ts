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
		small: any;
		init(element: HTMLElement, root: Group, animations: Animation[]): void;
		get element(): HTMLElement;
		get path(): string;
		get scopeId(): number;
		animations: Animation[];
		get size(): string;
	}
	interface VtbagIcGroupListElement extends HTMLElement {
		sort(by: 'alpha' | 'paint-order'): void;
		get animations(): Animation[];
		set animations(animations: Animation[]);
	}
	interface VtbagIcGroupElement extends HTMLElement {
		group?: Group;
		get scope(): VtbagIcScopeElement;
		get name(): string;
		get animations(): Animation[];
		set animations(animations: Animation[]);
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
