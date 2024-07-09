export const bench: Promise<string> = (async () => {
	const res =  await (await fetch('/vtbag/bench/')).text();
	return res;
})();
