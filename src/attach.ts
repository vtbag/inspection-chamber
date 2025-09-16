if (self !== top) {
	// This is an iframe, let's throw the hooks
	// If the top window is not ready yet, we wait until it is.
	console.log('init', top?.__vtbag);
	if (top && top.__vtbag && top.__vtbag.ic2) {
		const originalElementStartViewTransition = Element.prototype.startViewTransition;
		if (originalElementStartViewTransition) {
			Element.prototype.startViewTransition = top.__vtbag.ic2.monkey!(
				originalElementStartViewTransition
			);
		}

		const originalDocumentStartViewTransition = document.startViewTransition;
		if (originalDocumentStartViewTransition) {
			document.startViewTransition = top.__vtbag.ic2.monkey!(originalDocumentStartViewTransition);
		}
		addEventListener('pageswap', top.__vtbag.ic2.pageswap!);
		addEventListener('pagereveal', top.__vtbag.ic2.pagereveal!);
	} else {
		setTimeout(() => (top!.__vtbag!.ic2!.iframe!.src = top!.__vtbag.ic2!.iframe!.src!), 100);
	}
} else {
	// This is the top window
	// Nothing is urgent here and we do not want to mess with loading.

	addEventListener('DOMContentLoaded', () => {
		const href = location.href;
		const title = document.title;
		// reset the document state
		document.open();
		document.write('<!DOCTYPE html><html></html>');
		document.close();

		document.documentElement.innerHTML = htmlString(href, '🔬 ' + title);

		document.documentElement.querySelectorAll('script').forEach((oldScript) => {
			const newScript = document.createElement('script');
			Array.from(oldScript.attributes).forEach((attr) =>
				newScript.setAttribute(attr.name, attr.value)
			);
			newScript.textContent = oldScript.textContent;
			oldScript.parentNode!.replaceChild(newScript, oldScript);
		});
	});
}
