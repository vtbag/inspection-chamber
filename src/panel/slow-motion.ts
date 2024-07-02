import { InspectionChamber } from "../types";

export function sloMoPlay() {
  top!.__vtbag.inspectionChamber!.animations?.forEach(
    (a) => (
      (a.playbackRate =
        1.0 /
        Math.max(
          0.000001,
          parseFloat(top!.document.querySelector<HTMLSpanElement>('#vtbot-ui-tsf')?.innerText ?? '1.0')
        )),
      a.playState === 'paused' && a.play()
    )
  );
}

export function initSlowMotion() {
  const sloMo = top!.document.querySelector('#vtbot-ui-slo-mo')!;
  const sloMoTsf = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-tsf')!;
  sloMo.addEventListener('input', (e) => {
    if (e.target instanceof HTMLInputElement) {
      const value = (Math.exp(parseInt(e.target.value, 10) / 100) - 100) / 100 + 1 - 0.14;
      sloMoTsf.innerText = `${value.toFixed(1)}`;
      sloMoPlay();
    }
  });
}