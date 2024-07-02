import { initDragging } from "./dragging";

export function showReopener() {
  top!.addEventListener('resize', () => {
    sessionStorage.removeItem('vtbot-ui-reopener');
    // todo: ensure reopener is visible after resize.
    // for now just reload to make it see again.
  });
  const { reopenerLeft, reopenerTop } = JSON.parse(sessionStorage.getItem('vtbot-ui-reopener') ?? '{"reopenerLeft": "calc(100vw - 32px)", "reopenerTop": "16px"}');
  top!.document.body.insertAdjacentHTML('beforeend', `<img title="reopen the inspection chamber" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iZGFya3NsYXRlZ3JheSIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMSAyM2gxM1YxMEgxem05LTRoMTNWNkgxMHptLTUtNWgxM1YxSDV6Ii8+PC9zdmc+" id="vtbot-ui-reopen" style="transform: scale(2); cursor: pointer; position: fixed; z-index:100; left: ${reopenerLeft}; top: ${reopenerTop}">`);
  const reopener = top!.document.querySelector<HTMLElement>('#vtbot-ui-reopen')!;
  let dragged = false;
  reopener.addEventListener('click', () => {
    setTimeout(() => (dragged = false), 100);
    if (!dragged) {
      sessionStorage.removeItem('vtbot-ui-closed');
      top!.location.reload();
    }
  });
  initDragging(reopener, (e: MouseEvent | TouchEvent) => {
    reopener.style.left = `${(e instanceof TouchEvent ? e.touches[0]?.clientX : e.clientX) ?? (top!.innerWidth - 32)}px`;
    reopener.style.top = `${(e instanceof TouchEvent ? e.touches[0]?.clientY : e.clientY) ?? 16}px`;
    dragged = true;
    sessionStorage.setItem('vtbot-ui-reopener', JSON.stringify({ reopenerLeft: reopener.style.left, reopenerTop: reopener.style.top }));
  });
}