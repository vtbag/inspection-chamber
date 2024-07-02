export type Modus = 'bypass' | 'slow-motion' | 'control' | 'compare';
export type Twin = { animations: Animation[]; dom: HTMLElement; map: Map<string, HTMLElement>; };

export type InspectionChamber = {
  viewTransition?: ViewTransition;
  frameDocument?: Document;
  animations?: Animation[] | undefined;
  animationMap?: Map<string, Animation> | undefined;
  longestAnimation?: Animation | undefined;
  animationEndTime?: number;
  glow?: Animation;
};

declare global {
	interface Window {
		__vtbag: {
			inspectionChamber?:InspectionChamber;
		};
	}
}


