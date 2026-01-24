const STYLE =
	'color: light-dark(black, white); background-color: light-dark(#dfd, #242); padding: 2px 4px; border-radius: 4px; font-size: 1.2em;';

export function printToDevtools(...arg: any[]) {
	parent.console.log('\n%c[inspection chamber]%c\n' + arg[0], STYLE, '', ...arg.slice(1));
}

declare global {
	interface Window {
		console: { log: (...args: any) => void };
	}
}
