export class PanelResizer extends HTMLElement {
	isHorizontal: boolean;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.isHorizontal = true;
	}

	connectedCallback() {
		this.render();
		this.setupEventListeners();
	}

	render() {
		if (!this.shadowRoot) return;
		this.shadowRoot.innerHTML = `
      <style>
        :host div {
          position: absolute;
          z-index: 100;
          background: transparent;
        }
        :host(:hover) div {
          background: rgba(0, 0, 0, 0.1);
        }
        :host(.horizontal) div {
          cursor: col-resize;
          top: 0;
          bottom: 0;
          width: 8px;
          height: 100vh;
          transform: translateX(-4px);
        }
        :host(.vertical) div {
          cursor: row-resize;
          left: 0;
          right: 0;
          width: 100vw;
          height: 8px;
          transform: translateY(-4px);
        }
      </style>
      <div></div>
    `;

		this.className = this.isHorizontal ? 'horizontal' : 'vertical';
	}

	setupEventListeners() {
		let startPos = 0;

		const startResize = (e: MouseEvent) => {
			startPos = this.isHorizontal ? e.clientX : e.clientY;

			document.addEventListener('mousemove', resize);
			document.addEventListener('mouseup', stopResize);
		};

		const resize = (e: MouseEvent) => {
			const currentPos = this.isHorizontal ? e.clientX : e.clientY;
			const diff = currentPos - startPos;

			this.dispatchEvent(
				new CustomEvent('resizer-move', {
					bubbles: true,
					composed: true,
					detail: { diff },
				})
			);

			startPos = currentPos;
		};

		const stopResize = () => {
			document.removeEventListener('mousemove', resize);
			document.removeEventListener('mouseup', stopResize);
		};

		this.addEventListener('mousedown', startResize);
	}

	setOrientation(isHorizontal: boolean) {
		this.isHorizontal = isHorizontal;
		this.className = isHorizontal ? 'horizontal' : 'vertical';
	}
}

customElements.define('panel-resizer', PanelResizer);
