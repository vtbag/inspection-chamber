export abstract class ICElement extends HTMLElement {
	#raf: number | null = null;
	#dirty = true;

	connectedCallback() {
		this.requestRender();
	}

	protected requestRender() {
		if (this.#raf === null) {
			this.#raf = requestAnimationFrame(() => {
				this.#raf = null;
				if (!this.isConnected || !this.#dirty) return;
				this.#dirty = false;
				this.render();
			});
		}
	}

	protected markDirty() {
		this.#dirty = true;
		this.requestRender();
	}

	protected abstract render(): void;
}
