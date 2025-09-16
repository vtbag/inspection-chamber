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
	iframe?: HTMLIFrameElement;
	globalViewTransition?: ViewTransition | null | undefined;
	pageswap?: (event: PageSwapEvent) => void;
	pagereveal?: (event: PageRevealEvent) => void;
	monkey?:
		| (<
				T extends
					| typeof Element.prototype.startViewTransition
					| typeof document.startViewTransition,
		  >(
				original: T
		  ) => T)
		| undefined;

	pauseSheet?: CSSStyleSheet;
};

declare global {
	interface Window {
		__vtbag: {
			inspectionChamber?: InspectionChamber | undefined;
			ic2?: IC2 | undefined;
		};
	}
}
