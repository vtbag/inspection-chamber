export abstract class ICElement extends HTMLElement {
	#initialized = false;

	protected setUp() { }

	protected tearDown() { }

	connectedCallback() {
		if (!this.#initialized) {
			this.#initialized = true;
			this.setUp();
			this.render();
		}
	}

	disconnectedCallback() {
		requestAnimationFrame(() => {
			if (this.isConnected) return;
			this.#initialized = false;
			this.tearDown();
		});
	}

	protected abstract render(): void;
}
