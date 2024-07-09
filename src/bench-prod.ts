export const bench: Promise<string> = (async () => {
	return await (await fetch('/vtbag/bench/')).text();
})();
