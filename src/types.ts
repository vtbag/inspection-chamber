import type { Features } from "./components/ic/features";

export type InspectionChamber = {
	viewTransition?: ViewTransition | null | undefined;
	globalViewTransition?: ViewTransition | null | undefined;
	frameDocument?: Document | undefined;
	animations?: Animation[] | undefined;
	longestAnimation?: Animation | undefined;
	animationEndTime?: number | undefined;
	styleMap?: Map<string, CSSStyleDeclaration> | undefined;
	keyframesMap?: Map<string, Keyframe[]> | undefined;
	glow?: Animation | undefined;
	twin?: HTMLElement | undefined;
	updateNameVisibilityTimeout?: number | undefined;
	mainPanel?: HTMLDivElement;
	innerPanel?: HTMLDivElement;
	pushBack?: HTMLDivElement | null;
};
export type IC2 = {
	animationStart?: (event: AnimationEvent) => void;
	animationStop?: (event: AnimationEvent) => void;
	context?: Window;
	monkey?:
	| (<
		T extends
		| typeof Element.prototype.startViewTransition
		| typeof document.startViewTransition,
	>(
		original: T
	) => T)
	| undefined;
	pagereveal?: (event: PageRevealEvent) => void;
	pageswap?: (event: PageSwapEvent) => void;
	document?: HTMLElement;
	intersectionObserver?: IntersectionObserver;
	vtMap?: Map<HTMLElement | Document, Features>;
	captureOldOnly?: boolean;
	captureFreezeTypes?: boolean;
	captureFrozen: ViewTransition[];
};

declare global {
	interface Window {
		__vtbag: {
			inspectionChamber?: InspectionChamber | undefined;
			ic2?: IC2 | undefined;
		};
	}
}
