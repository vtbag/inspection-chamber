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
		updateAnimationsHead(): unknown;
		movePseudos(): void;
	}
	interface VtbagIcIdentifyElement extends HTMLElement {
		show(): void;
		hide(): void;
	}
	interface VtbagIcScopeElement extends HTMLElement {
		init(element: HTMLElement, root: Group, animations: Animation[]): void;
		get element(): HTMLElement;
		get path(): string;
		get scopeId(): number;
		get animations(): Animation[];
		set animations(as: Animation[]);
		updateScopeHead(): void;
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
		twin: HTMLDivElement;
		icGroup: VtbagIcGroupElement;
		get exists(): boolean;
		createTwin(): void;
		moveTwin(): void;
		name(escaped = false): string;
		animations(): Animation[];
		computedStyleCompact(
			all = false
		): Promise<{ key: string; value: string; defaultValue: string; priority: string }[]>;
		onIntersectionChange(entry: IntersectionObserverEntry);
	}
	interface VtbagIcPseudoDetailsElement extends HTMLElement {
		set(pseudo: string): void;
	}
	interface VtbagIcViewTransitionCaptureElement extends HTMLElement {
		calledOn: HTMLElement | Document;
		init(calledOn: HTMLElement, transitionRoot: HTMLElement): void;
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
