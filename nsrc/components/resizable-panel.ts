export class ResizablePanel extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.setupStyles();
	}

	setupStyles() {
		if (!this.shadowRoot) return;
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          flex: 1;
          position: relative;
          background: white;
          border: 1px solid #ddd;
          padding: 1rem;
          overflow: auto;
        }

        .panel-content {
          min-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-panel {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          padding: 0;
        }

        .remove-panel:hover {
          background: #ff6666;
        }
      </style>
      <div class="panel-content">
        <slot></slot>
      </div>
      <button class="remove-panel">×</button>
    `;
	}

	connectedCallback() {
		this.shadowRoot?.querySelector('.remove-panel')?.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('panel-remove', { bubbles: true, composed: true }));
		});
	}

	setFlex(value: number) {
		this.style.flex = value.toString();
	}

	getFlex() {
		return parseFloat(this.style.flex) || 1;
	}
}

customElements.define('resizable-panel', ResizablePanel);
