export type Modus = 'bypass' | 'slow-motion' | 'control' | 'compare';

export type InspectionChamber = {
	viewTransition?: ViewTransition|undefined;
	frameDocument?: Document | undefined;
	animations?: Animation[] | undefined;
	animationMap?: Map<string, Animation>|undefined;
	longestAnimation?: Animation | undefined;
	animationEndTime?: number|undefined;
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
