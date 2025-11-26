import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
	build: {
		outDir: 'IC',
		target: 'esnext',
		rollupOptions: {
			input: 'InspectionChamber/index.html',
		}
	},
	plugins: [viteSingleFile()],


});