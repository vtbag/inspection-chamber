import { deriveCSSSelector } from "./element-selector";
import { displayName, type Group } from "./group";

let badge: HTMLElement;

let current: HTMLElement | null = null;

function getLabel(el: HTMLElement, group: Group): string {
  if (!el) return '';
  return `${deriveCSSSelector(el)}<br>view-transition-name: ${displayName(group)}<br>view-transition-class: ${group.new?.viewTransitionClass || group.old?.viewTransitionClass || ''}<br>view-transition-group: ${group.old?.viewTransitionGroup || group.new?.viewTransitionGroup || ''}`;
}

function positionBadgeFor(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const document = el.ownerDocument;
  const window = document.defaultView!;
  badge.style.top = window.scrollY + r.top + 2 + 'px';
  badge.style.left = window.scrollX + r.left + 2 + 'px';
}


const refresh = () => {
  if (current) positionBadgeFor(current);
};

export function showBadge(el: HTMLElement, group: Group) {
  current = el;
  if (!badge) {
    const document = el.ownerDocument;
    const window = document.defaultView!;
    badge = document.createElement('div');
    badge.className = 'hover-badge-overlay';
    document.body.appendChild(badge);
    window.addEventListener('scroll', refresh, { passive: true });
    window.addEventListener('resize', refresh);
    document.head.insertAdjacentHTML('beforeend', `
      <style>
        .hover-badge-overlay {
          position: absolute;
          display: none;
          z-index: 100;
        }
        .hover-badge-overlay.show {
          display: block;
          padding: 2px 6px;
          background: rgba(0,0,0,0.7);
          color: white;
          font-size: 16px;
          border-radius: 4px;
          pointer-events: none;
        }
      </style>
    `);
  }
  badge.innerHTML = getLabel(el, group);
  badge.classList.add('show');
  positionBadgeFor(el);
}

export function hideBadge() {
  current = null;
  badge.classList.remove('show');
}


