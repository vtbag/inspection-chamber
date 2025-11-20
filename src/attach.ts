if (parent !== self) {
	// This is an iframe, let's throw the hooks
	// If the parent window is not ready yet, we wait until it is.
	console.log('init', parent.__vtbag);
	if (parent.__vtbag && parent.__vtbag.ic2) {
		console.log('parent is ready, setup hooks', parent.__vtbag.ic2);
		const originalElementStartViewTransition = Element.prototype.startViewTransition;
		if (originalElementStartViewTransition) {
			Element.prototype.startViewTransition = parent.__vtbag.ic2.monkey!(
				originalElementStartViewTransition
			);
		}

		const originalDocumentStartViewTransition = document.startViewTransition;
		if (originalDocumentStartViewTransition) {
			document.startViewTransition = parent.__vtbag.ic2.monkey!(
				originalDocumentStartViewTransition
			);
		}
		addEventListener('pageswap', parent.__vtbag.ic2.pageswap!);
		addEventListener('pagereveal', parent.__vtbag.ic2.pagereveal!);
		addEventListener('animationstart', parent.__vtbag.ic2.animationStart!);
		addEventListener('animationend', parent.__vtbag.ic2.animationStop!);
	} else {
		console.log('Waiting for parent to be ready', parent?.__vtbag);
		setTimeout(() => {
			const iframe = window.frameElement as HTMLIFrameElement;
			if (iframe.src) iframe.contentWindow?.location.reload();
			else iframe.srcdoc = iframe.srcdoc;
		}, 250);
	}
} else {
	// This is the parent window
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
