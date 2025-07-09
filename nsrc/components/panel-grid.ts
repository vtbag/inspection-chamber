import { PanelResizer } from './panel-resizer';
import { ResizablePanel } from './resizable-panel';

export class PanelGrid extends HTMLElement {
	panels: ResizablePanel[];
	isHorizontal: boolean;

	constructor() {
		super();
		this.panels = [];
		this.isHorizontal = true;
	}

	connectedCallback() {
		this.render();
		this.setupEventListeners();
	}

	render() {
		this.style.display = 'flex';
		this.style.flexDirection = this.isHorizontal ? 'row' : 'column';
		this.style.height = '100%';
		this.style.width = '100%';
	}

	setupEventListeners() {
		document.getElementById('addPanel')?.addEventListener('click', () => this.addPanel());
		document
			.getElementById('toggleOrientation')
			?.addEventListener('click', () => this.toggleOrientation());

		this.addEventListener('panel-remove', (e: Event) => {
			if (e.target instanceof ResizablePanel) {
				this.removePanel(e.target);
			}
		});

		this.addEventListener('resizer-move', (e: Event) => {
			if (e.target instanceof PanelResizer) {
				this.handleResize(e.target, (e as CustomEvent).detail.diff);
			}
		});
	}

	addPanel() {
		const panel = document.createElement('resizable-panel') as ResizablePanel;
		panel.innerHTML = `Panel ${this.panels.length + 1}`;

		// Set initial flex for the new panel
		const defaultFlex = 0.2; // 20% of the available space
		panel.setFlex(defaultFlex);

		// Adjust existing panels to make room for the new one
		const remainingFlex = 1 - defaultFlex;
		const totalCurrentFlex = this.panels.reduce((sum, p) => sum + p.getFlex(), 0);

		this.panels.forEach((p) => {
			const adjustedFlex = (p.getFlex() / totalCurrentFlex) * remainingFlex;
			p.setFlex(adjustedFlex);
		});

		if (this.panels.length > 0) {
			const resizer = document.createElement('panel-resizer') as PanelResizer;
			resizer.setOrientation(this.isHorizontal);
			this.appendChild(resizer);
		}

		this.appendChild(panel);
		this.panels.push(panel);
	}

	removePanel(panel: ResizablePanel) {
		const index = this.panels.indexOf(panel);
		if (index > -1) {
			const removedFlex = panel.getFlex();

			// Redistribute the removed panel's flex to remaining panels
			const remainingPanels = this.panels.filter((p) => p !== panel);
			const totalRemainingFlex = remainingPanels.reduce((sum, p) => sum + p.getFlex(), 0);

			remainingPanels.forEach((p) => {
				const newFlex = p.getFlex() + removedFlex * (p.getFlex() / totalRemainingFlex);
				p.setFlex(newFlex);
			});

			if (index > 0) {
				const resizer = panel.previousElementSibling;
				if (resizer instanceof PanelResizer) {
					resizer.remove();
				}
			}

			panel.remove();
			this.panels.splice(index, 1);
		}
	}

	handleResize(resizer: PanelResizer, diff: number) {
		const prevPanel = resizer.previousElementSibling;
		const nextPanel = resizer.nextElementSibling;

		if (!(prevPanel instanceof ResizablePanel) || !(nextPanel instanceof ResizablePanel)) {
			return;
		}

		const prevRect = prevPanel.getBoundingClientRect();
		const nextRect = nextPanel.getBoundingClientRect();

		const totalSize = this.isHorizontal
			? prevRect.width + nextRect.width
			: prevRect.height + nextRect.height;

		// Calculate new sizes while maintaining minimum size
		const minSize = 50;
		const prevSize = Math.max(
			minSize,
			this.isHorizontal ? prevRect.width + diff : prevRect.height + diff
		);
		const nextSize = Math.max(minSize, totalSize - prevSize);

		// Adjust sizes if they exceed the total available space
		if (prevSize + nextSize > totalSize) {
			const ratio = totalSize / (prevSize + nextSize);
			prevPanel.setFlex((prevSize * ratio) / totalSize);
			nextPanel.setFlex((nextSize * ratio) / totalSize);
		} else {
			prevPanel.setFlex(prevSize / totalSize);
			nextPanel.setFlex(nextSize / totalSize);
		}
	}

	toggleOrientation() {
		this.isHorizontal = !this.isHorizontal;
		this.style.flexDirection = this.isHorizontal ? 'row' : 'column';

		const resizers = this.querySelectorAll<PanelResizer>('panel-resizer');
		resizers.forEach((resizer) => {
			resizer.setOrientation(this.isHorizontal);
		});
	}
}

customElements.define('panel-grid', PanelGrid);
