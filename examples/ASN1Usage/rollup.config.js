import rollupNodeResolve from "rollup-plugin-node-resolve";

export default {
	input: "es6.js",
	plugins: [
		rollupNodeResolve({ jsnext: true, main: true })
	],
	output: [
		{
			file: "bundle.js",
			format: "iife",
			outro: `
window.test = test;

function context(name, func) {}`
		},
		{
			file: "../../test/browser/asn1UsageExample.js",
			format: "es",
		},
	]
};