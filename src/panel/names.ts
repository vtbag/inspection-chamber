import { setStyles } from "../styles";
import { syncTwinAnimations } from "../twin";
import { Modus } from "../types";
import { resetFilter, resetSelected } from "./filter";
import { updateControl } from "./full-control";
import { mayViewTransition } from "./transition";

export function updateNames(leftTransitionNames: Set<string>, rightTransitionNames?: Set<string>) {
  //navigator.clipboard.writeText("");
  let names;
  mayViewTransition(() => {
    top!.document.querySelector('#vtbot-ui-info')!.innerHTML = '';
    top!.document.querySelectorAll('#vtbot-ui-names li').forEach((li) => li.remove());
    top!.document.querySelector<HTMLElement>('#vtbot-ui-names h4')!.innerText = rightTransitionNames
      ? 'Animation Groups'
      : 'Elements w/ View Transition Names';

    top!.document.querySelector<HTMLElement>('#vtbot-ui-names div')!.style.display = rightTransitionNames
      ? 'flex'
      : 'none';
    const list = top!.document.querySelector('#vtbot-ui-names > ol')!;
    names = [...new Set([...leftTransitionNames, ...(rightTransitionNames ?? [])])].sort();
    names.forEach((name, idx) => {
      const li = top!.document.createElement('li');
      li.innerText = name;
      if (rightTransitionNames && leftTransitionNames.has(name)) {
        li.classList.add('old');
      }
      if (rightTransitionNames?.has(name)) {
        li.classList.add('new');
      }
      li.style.viewTransitionName = `vtbot-name-${idx}`;
      list.appendChild(li);
    });
    top!.document.querySelector<HTMLElement>('#vtbot-ui-filter ul')!.style.display = rightTransitionNames
      ? 'block'
      : 'none';
    refreshNames();
  }, 'update names');
  return names;
}

export function refreshNames() {
  const names = top!.document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li');
  const filter = top!.document
    .querySelector<HTMLInputElement>('#vtbot-ui-filter ul input:checked')!
    .id.replace('vtbot-c-', '');
  const fragment = top!.document.querySelector<HTMLInputElement>(
    '#vtbot-ui-filter input[type="text"]'
  )!.value;
  mayViewTransition(() => {
    names.forEach((name) => {
      const style = name.style;
      const classes = name.classList;
      const text = name.innerText;
      style.display =
        (fragment === '' || text.includes(fragment)) &&
          (filter === 'all' ||
            (filter === 'both' && classes.contains('new') && classes.contains('old')) ||
            (filter === 'old-only' && classes.contains('old') && !classes.contains('new')) ||
            (filter === 'new-only' && classes.contains('new') && !classes.contains('old')) ||
            (filter === 'old' && classes.contains('old')) ||
            (filter === 'new' && classes.contains('new')))
          ? 'list-item'
          : 'none';
    });
  }, 'refresh names');
}


export function updateNameVisibility() {
  const frameDoc = top!.__vtbag.inspectionChamber!.frameDocument!;
  const mode = top!.document.documentElement.dataset.vtbotModus;
  const computedStyle = top!.getComputedStyle(top!.document.documentElement);
  const panelWidth = parseFloat(computedStyle.getPropertyValue('--vtbot-panel-width') || "0");
  const panelHeight = parseFloat(computedStyle.getPropertyValue('--vtbot-panel-height') || "0");
  syncTwinAnimations();
  top!.document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li').forEach((li) => {
    frameDoc.documentElement.offsetHeight;
    const name = li.innerText;
    const classes = li.classList;

    if (mode === 'control' || mode === 'slow-motion') {
      classes[classes.contains('old') &&
        insideViewport(frameDoc.querySelector(`#vtbot-twin--view-transition-old-${name}`), panelWidth, panelHeight) === false ? "add" : "remove"]('old-invisible');
      classes[classes.contains('new') &&
        insideViewport(frameDoc.querySelector(`#vtbot-twin--view-transition-new-${name}`), panelWidth, panelHeight) === false ? "add" : 'remove']('new-invisible');
      classes[(!classes.contains("old") || classes.contains("old-invisible")) && (!classes.contains("new") || classes.contains("new-invisible")) ? "add" : "remove"]('invisible');
    }
  });
  const inspectionChamber = top!.__vtbag.inspectionChamber!;
  const longestAnimation = inspectionChamber.longestAnimation;
  if (mode === 'slow-motion' && longestAnimation) {
    top!.document.querySelector<HTMLSpanElement>("#vtbot-ui-slo-mo-progress")!.innerText = ` ${~~(longestAnimation.currentTime ?? 0)} / ${inspectionChamber.animationEndTime} ms`;
  }
  if ((mode === 'control' || mode === 'slow-motion') && top!.document.documentElement.classList.contains('vtbot-vt-active')) {
    setTimeout(() => updateNameVisibility(), 33);
  }
}

function insideViewport(element: HTMLElement | null, panelWidth = 0, panelHeight = 0) {
  if (!element) return undefined;
  const { top, right, bottom, left, width, height } = element.getBoundingClientRect();

  return (
    width > 0 &&
    height > 0 &&
    top < (window.top!.innerHeight - panelHeight) &&
    bottom > 0 &&
    left < (window.top!.innerWidth - panelWidth) &&
    right > 0
  );
}

export function updateImageVisibility() {
  const rules: string[] = [];

  top!.document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li').forEach((li) => {
    const name = li.innerText;
    const classes = li.classList;
    if (classes.contains('old-hidden')) {
      rules.push(`::view-transition-old(${name}) { visibility: hidden; }`);
    }
    if (classes.contains('new-hidden')) {
      rules.push(`::view-transition-new(${name}) { visibility: hidden; }`);
    }
  });
  setStyles(rules.join('\n'), 'image-visibility');
}

function highlightNames(name: string) {
  const control =
    top!.document.documentElement.dataset.vtbotModus === 'control' &&
    top!.document.querySelector<HTMLElement>('#vtbot-ui-names h4')!.innerText === 'Animation Groups';
  const lis = top!.document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li');
  let selected: HTMLLIElement | undefined;
  lis.forEach((li) => {
    if (li.innerText === name) {
      const sel = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-controller')!;
      const prog = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-progress')!;
      const unsel = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-controller2')!;
      const unprog = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-progress2')!;
      if (li.classList.contains('selected')) {
        unsel.value = sel.value;
        unprog.innerText = prog.innerText;
      } else {
        sel.value = unsel.value;
        prog.innerText = unprog.innerText;
      }

      li.classList[control ? 'toggle' : 'add']('selected');
      selected = li;
      if (li.style.display === 'none') resetFilter();
    } else {
      if (!control) li.classList.remove('selected');
    }
  });
  selected &&
    selected.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
}

function writeSelectorToClipboard(elem?: Element | null) {
  if (elem) {
    navigator.clipboard.writeText(
      `inspect(top.document.querySelector("#vtbot-main-frame").contentDocument.querySelector("${deriveCSSSelector(elem)}"))`
    );
    top!.document.querySelector<HTMLInputElement>('#vtbot-ui-info')!.innerHTML = `<h4>Info</h4>
						<p>DevTools selector '<b><code>${deriveCSSSelector(elem)}</code></b>' copied to clipboard. Paste to DevTools console to further inspect the element.</p>`;
  } else {
    navigator.clipboard.writeText(
      `inspect(top.document.querySelector("#vtbot-main-frame").contentDocument.querySelector(":root"))`
    );
    top!.document.querySelector<HTMLInputElement>('#vtbot-ui-info')!.innerHTML = `<h4>Info</h4>
						<p>DevTools selector '<b><code>:root</code></b>' copied to clipboard. Paste to DevTools console, then expand the element and its <code>::view-transition</code> pseudo element.</p>`;
  }
}

function deriveCSSSelector(element?: Element, useIds = true) {
  let path: string[] = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    if (useIds && element.id) {
      selector = '#' + element.id;
      path.unshift(selector);
      break;
    } else {
      let sibling = element;
      let nth = 1;
      while ((sibling = sibling.previousElementSibling as Element)) {
        if (sibling.nodeName.toLowerCase() === selector) nth++;
      }
      if (nth !== 1) {
        selector += ':nth-of-type(' + nth + ')';
      }
    }
    path.unshift(selector);
    element = element.parentNode as Element;
  }
  return path.join(' > ');
}


export function initNames() {
  top!.document
    .querySelector('#vtbot-ui-names button')!
    .addEventListener('click', () => resetSelected());
  top!.document.querySelector('#vtbot-ui-names ol')!.addEventListener('click', (e) => {
    if (e.target instanceof HTMLElement) {
      const targetLi = e.target.closest('li');

      if (targetLi && e instanceof MouseEvent) {
        const modus = top!.document.documentElement.dataset.vtbotModus;
        mayViewTransition(() => {
          const { left, width } = targetLi.getBoundingClientRect();
          const x = e.clientX - left;
          const leftClick = x >= 0 && x <= 20;
          const rightClick = x >= width - 20 && x <= width;

          const classes = targetLi.classList;
          if (leftClick && classes.contains('old')) {
            classes.toggle('old-hidden');
            updateImageVisibility();
            return;
          }
          if (rightClick && classes.contains('new')) {
            classes.toggle('new-hidden');
            updateImageVisibility();
            return;
          }
          const name = targetLi.innerText;
          window.top?.document.documentElement.classList.contains("vtbot-vt-active") && highlightInFrame(name);
          highlightNames(name);
          const elem = window.top!.__vtbag.inspectionChamber?.frameDocument!.querySelector(`[data-vtbot-transition-name="${name}"]`);

          if (modus && (modus !== 'bypass')) writeSelectorToClipboard(elem);
        }, 'names', true);
      }
    }
    updateControl();
  });
}

const glow = [
  // Keyframes
  { boxShadow: '0 0  0px blue' },
  { boxShadow: '0 0 50px blue' },
  {
    boxShadow: '0 0 100px blue',
    display: 'inline-block',
    minWidth: '20px',
    minHeight: '20px',
    backgroundColor: 'darkslateblue',
  },
  { boxShadow: '0 0 50px blue' },
  { boxShadow: '0 0  0px blue' },
];

export function highlightInFrame(name: string) {
  if (top!.document.documentElement.classList.contains('vtbot-vt-active')) {
    glowPseudo(name);
  } else {
    const chamber = top!.__vtbag.inspectionChamber!;
    const el = chamber.frameDocument!.querySelector<HTMLElement>(`[data-vtbot-transition-name="${name}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
      const display = self.getComputedStyle(el).display;
      glow[2]!.display = !display.includes('block') ? 'inline-block' : display;
      chamber.glow = el.animate(glow, { duration: 500, iterations: 1 });
      setTimeout(() => chamber.glow = undefined, 500);
    }
  }
}

function glowPseudo(name: string) {
  setStyles(
    `
		::view-transition-old(${name}) {
			box-shadow: 0 0 100px darkslateblue;
			background-color: lightblue;
			transition: all 0.5s;
		}
		::view-transition-new(${name}) {
			box-shadow: 0 0 100px darkolivegreen;
			background-color: lightgreen;
			transition: all 0.5s;
		}`,
    'glow'
  );
  setTimeout(() => setStyles('', 'glow'), 500);
}
