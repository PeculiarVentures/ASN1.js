# Installation

Run one of the following commands to add `asn1js` to your project:

```bash npm2yarn
npm install asn1js
```

## Requirements

asn1js is an ES module and runs in modern browsers and in Node.js `^20.19.0 || >=22.12.0`. On these Node.js versions, CommonJS code can still load it with `require("asn1js")`.

If you compile TypeScript to CommonJS, set `"module"` to `"node20"` or `"nodenext"` in `tsconfig.json`.

## First steps

Import the library and decode some bytes:

```ts
import * as asn1js from "asn1js";

const sequence = new asn1js.Sequence({
  value: [new asn1js.Integer({ value: 42 }), new asn1js.Utf8String({ value: "hello" })],
});
const der = sequence.toBER();

const { offset, result } = asn1js.fromBER(der);
if (offset === -1) {
  throw new Error(result.error);
}
console.log(result.toString());
// SEQUENCE :
//   INTEGER : 42
//   UTF8String : 'hello'
```

Next, browse the [API reference](api/index.md).

## Upgrading from v3

v4 is ESM-only, raises the minimum Node.js version, and changes some encoding and validation behavior. Read the [breaking changes](https://github.com/PeculiarVentures/ASN1.js#breaking-changes-in-v4) before upgrading. Upgrade libraries that depend on asn1js, such as `pkijs` and `@peculiar/asn1-schema`, at the same time, because objects from two asn1js versions fail each other's `instanceof` checks.
