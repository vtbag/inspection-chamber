export type Modus = 'bypass' | 'slow-motion' | 'control' | 'compare';

export type InspectionChamber = {
	initialized: boolean;
	viewTransition?: ViewTransition | undefined;
	frameDocument?: Document | undefined;
	animations?: Animation[] | undefined;
	animationMap?: Map<string, Animation> | undefined;
	longestAnimation?: Animation | undefined;
	animationEndTime?: number | undefined;
	styleMap?: Map<string, CSSStyleDeclaration> | undefined;
	keyframesMap?: Map<string, Keyframe[]> | undefined;
	glow?: Animation | undefined;
	twin?: HTMLElement | undefined;
	updateNameVisibilityTimeout?: number | undefined;
};

declare global {
	interface Window {
		__vtbag: {
			inspectionChamber?: InspectionChamber | undefined;
		};
	}
}
