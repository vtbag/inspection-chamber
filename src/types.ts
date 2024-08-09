export type InspectionChamber = {
	viewTransition?: ViewTransition | undefined;
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

declare global {
	interface Window {
		__vtbag: {
			inspectionChamber?: InspectionChamber | undefined;
		};
	}
}
