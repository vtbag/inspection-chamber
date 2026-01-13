if (parent !== self) {
	// This is an iframe, let's throw the hooks
	// If the parent window is not ready yet, we wait until it is.
	setup();
} else {
	// This is the top window
	// Nothing is urgent here and we do not want to mess with loading.
	console.info('[inspection-chamber] Top window detected, scheduling document replacement');
	requestIdleCallback(() => {
		replaceDocument(location.href, document.title);
	});
}

async function replaceDocument(href: string, title: string) {
	// reset the document state
	document.open();
	// @ts-ignore
	document.write('<!DOCTYPE html><html></html>');
	document.close();

	// @ts-ignore
	document.documentElement.innerHTML = htmlString(href, '🔬 ' + title);

	document.documentElement.querySelectorAll('script').forEach((oldScript) => {
		const newScript = document.createElement('script');
		Array.from(oldScript.attributes).forEach((attr) =>
			newScript.setAttribute(attr.name, attr.value)
		);
		newScript.textContent = oldScript.textContent;
		oldScript.parentNode!.replaceChild(newScript, oldScript);
	});
}

function setup() {
	const reload = () => {
		console.info('[inspection-chamber] Waiting for parent context to get ready', parent?.__vtbag);
		setTimeout(() => {
			const iframe = window.frameElement as HTMLIFrameElement;
			if (iframe.src) iframe.contentWindow?.location.reload();
			else iframe.srcdoc = iframe.srcdoc;
		}, 500);
	};

	console.info('[inspection-chamber] checking parent context', parent.__vtbag);
	if (!parent.__vtbag?.ic2) {
		reload();
		return;
	}
	let target = parent;
	while (target.__vtbag?.ic2 && target.__vtbag?.ic2?.chamberWindow === self) {
		if (target === target.parent) break;
		target = target.parent;
	}
	if (!target.__vtbag?.ic2) {
		reload();
		return;
	}
	const originalElementStartViewTransition = Element.prototype.startViewTransition;
	if (originalElementStartViewTransition) {
		Element.prototype.startViewTransition = target.__vtbag.ic2!.monkey!(
			originalElementStartViewTransition
		);
	}

	const originalDocumentStartViewTransition = document.startViewTransition;
	if (originalDocumentStartViewTransition) {
		document.startViewTransition = target.__vtbag.ic2.monkey!(originalDocumentStartViewTransition);
	}
	addEventListener('pageswap', target.__vtbag.ic2.pageswap!, { capture: true });
	addEventListener('pagereveal', target.__vtbag.ic2.pagereveal!, { capture: true });
	addEventListener('animationstart', target.__vtbag.ic2.animationStart!);
	addEventListener('animationend', target.__vtbag.ic2.animationStop!);
}
