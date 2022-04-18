import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
	{	
		input: "./src/asn1.js",
		output: {
			file: "build/asn1.bundle.mjs",
			format: "es"
		},
		plugins: [nodeResolve()]
	}
];