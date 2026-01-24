interface NormalizedTiming {
	start: number;
	end: number;
	delay: number;
	duration: number;
}

export function normalizeTimings(
	timings: ComputedEffectTiming[],
	maxEnd: number
): NormalizedTiming[] {
	const width = 100;
	return timings.map((timing) => ({
		start: ((timing.startTime as number) / maxEnd) * width,
		end: ((timing.endTime as number) / maxEnd) * width,
		delay: ((timing.delay as number) / maxEnd) * width,
		duration: ((timing.duration as number) / maxEnd) * width,
	}));
}

export function createTimingBar(timing: ComputedEffectTiming, maxEnd: number): SVGSVGElement {
	const width = 100;
	const start = (((timing.startTime as number) || 0) / maxEnd) * width,
		// end = (timing.endTime as number || maxEnd) / maxEnd * width,
		delay = (((timing.delay as number) || 0) / maxEnd) * width,
		duration =
			(((timing.duration as number) || maxEnd - ((timing.delay as number) || 0)) / maxEnd) * width;
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', '0 0 100 10');
	svg.setAttribute('width', '12ch'); // Extra space for easing curve
	svg.setAttribute('height', '1.2em');

	svg.innerHTML = `
    <!-- Timeline shadow -->
    <rect x="${start}" y="4.5" width="${100 /* end - start */}" 
          height="1" fill="none" stroke="#888" stroke-width="1.2"/>
    
    <!-- Active candlestick (color by direction) -->
    <rect x="${start + delay}" y="2" width="${duration}" height="6" rx="1" 
          fill="${'#4f46e5'}" 
          stroke="#3730a3" stroke-width="0.5"/>
  `;
	return svg;
}
