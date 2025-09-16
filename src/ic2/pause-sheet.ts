export function setupPauseSheet() {
	const iframe = top!.__vtbag!.ic2!.iframe!;
	const sheet = (top!.__vtbag!.ic2!.pauseSheet = new (iframe.contentWindow as any).CSSStyleSheet());
	sheet.replaceSync(`
							::view-transition,
							::view-transition-group(*),
							::view-transition-group-children(*),
							::view-transition-image-pair(*),
							::view-transition-old(*),
							::view-transition-new(*){
								animation-play-state: paused;
							}`);

	iframe.contentDocument!.adoptedStyleSheets.push(sheet);
	return sheet;
}
