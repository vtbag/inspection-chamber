let outerViewTransition: ViewTransition | undefined;
let outerName: string | undefined;

export function mayViewTransition(fun: () => void, name: string, skip = false) {

  if (
    skip ||
    top!.document.documentElement.classList.contains('vtbot-vt-active') ||
    outerViewTransition ||
    !top!.document.startViewTransition
  ) {
    console.log(`view transition '${name}' skipped in favour of '${outerName}'`);
    fun();
  } else {
    outerName = name;
    outerViewTransition = top!.document.startViewTransition(fun);
    outerViewTransition.finished.finally(() => (outerViewTransition = outerName = undefined));
  }
}

export function exitViewTransition() {
	top!.__vtbag.inspectionChamber!.viewTransition?.skipTransition();
}
