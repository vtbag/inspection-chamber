class MarkerPainter {

	static get inputArguments() {
		return ['<string>'];
	}
	paint(_context, _size, _styleMap, args) {
		const tmp = console.log;
		console.log = () => tmp("Foo", ...arguments);
		console.log('MARKER', args[0]?.toString());
		
	}
}
try {
	registerPaint('marker', MarkerPainter);
} catch (e) {
	console.warn('Could not register paint worklet', e);
}
