<h1 align="center">
  ASN1js
</h1>

<div align="center">

![NPM License](https://img.shields.io/npm/l/asn1js)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/PeculiarVentures/ASN1.js/publish.yml?branch=master&label=publish)
[![npm version](https://img.shields.io/npm/v/asn1js.svg)](https://www.npmjs.com/package/asn1js)
![Coveralls](https://img.shields.io/coverallsCoverage/github/PeculiarVentures/ASN1.js)
[![npm downloads](https://img.shields.io/npm/dm/asn1js.svg)](https://www.npmjs.com/package/asn1js)

</div>

Abstract Syntax Notation One (ASN.1) is a standard and notation that describes rules and structures for representing, encoding, transmitting, and decoding data in telecommunications and computer networking. [ASN1js] is a pure JavaScript library implementing this standard. ASN.1 is the basis of all X.509 related data structures and numerous other protocols used on the web.

## Install

```bash
npm install asn1js
```

Documentation, the API reference, and runnable examples are at [asn1js.org](https://asn1js.org).

## Breaking Changes In v4

v4 is ESM-only and requires Node.js `^20.19.0 || >=22.12.0` (was `>=12.0.0`). CommonJS code can still `require("asn1js")` on these versions; Node.js 22.0–22.11 can't. The exported API is unchanged, but some encoding and validation behavior changed (last three items).

- **TypeScript compiling to CommonJS:** use `"module": "node20"` or `"nodenext"` (`node16` fails with TS1479). ESM and bundler setups need no changes.
- **Jest in CommonJS mode:** switch to ESM mode or Vitest, or configure an ESM-to-CommonJS transformer and make sure `transformIgnorePatterns` doesn't exclude `asn1js` and its ESM dependencies, such as `@peculiar/utils`.
- **Deep imports** (`asn1js/build/index.js`, `asn1js/build/index.es.js`) are blocked by `exports`; import from `asn1js`.
- **One asn1js per app:** libraries such as `pkijs` and `@peculiar/asn1-schema` check `instanceof asn1js.Sequence` and similar, so objects from asn1js 4 fail those checks in a library that still depends on asn1js 3. Upgrade them together.
- **New `RangeError`s:** `new Integer({ value })` and the `valueDec` setter reject non-integer numbers (v3 truncated `1.5` to `1` and encoded `NaN` as empty). Encoding a `UTCTime` with a year outside 1950–2049 throws, including `new UTCTime({ valueDate })`; v3 wrapped 2050 to 1950. Use `GeneralizedTime` for those dates.
- **Encodings that differ from v3:** `Integer.fromBigInt` encodes negative values correctly (v3: `-32767n` → `0x81`, `-128n` → `0xff80`). `UniversalString` writes characters outside the BMP as one UCS-4 code point (`U+1F600` → `0001f600`, v3 wrote a surrogate pair; v3 output still decodes). OID arcs and tag numbers from 2^49 to 2^53 now encode (v3 produced an empty value).
- **Decoding:** a `BMPString` with an odd length or a `UniversalString` whose length isn't a multiple of 4 returns an error (`offset: -1`) instead of throwing. `UniversalString` lone surrogates and code points above U+10FFFF become U+FFFD with a warning. OID arcs and tag numbers above 2^53 stay hex-only and re-encode unchanged. "Needlessly long encoded length" now checks the first length octet, so lengths such as `83 00 00 07` get the warning.

## Introduction

[ASN1js] is the first library for [BER] encoding/decoding in JavaScript designed for browser use. [BER] is the basic encoding rules for [ASN.1] that all others are based on, [DER] is the encoding rules used by PKI applications - it is a subset of [BER]. The [ASN1js] library was tested against [freely available ASN.1:2008 test suite], with some limitations related to JavaScript language.

## Features of the library

- Based on latest features of JavaScript language from ES2015 standard;
- [ASN1js] is a "base layer" for full-featured JS library [PKIjs], which is using Web Cryptography API and has all classes, necessary to work with PKI-related data;
- Fully object-oriented library. Inheritance is used everywhere inside the lib;
- Working with HTML5 data objects (ArrayBuffer, Uint8Array etc.);
- Working with all ASN.1:2008 types;
- Working with [BER] encoded data;
- All types inside the library constantly stores information about all ASN.1 sub blocks (tag block, length block or value block);
- User may have access to any byte inside any ASN.1 sub-block;
- Any sub-block may have unlimited length, as it described in ASN.1 standard (even "tag block");
- Ability to work with ASN.1 string data types (including all "international" strings like UniversalString, BMPString, UTF8String) by passing native JavaScript strings into constructors. And vice versa - all initially parsed data of ASN.1 string types right after decoding automatically converts into native JavaScript strings;
- Same with ASN.1 date-time types: for major types like UTCTime and GeneralizedTime there are automatic conversion between "JS date type - ASN.1 date-time type" + vice versa;
- Same with ASN.1 OBJECT-IDENTIFIER (OID) data-type: you can initialize OID by JavaScript string and can get its string representation by calling `oid.getValue()`;
- Working with "easy-to-understand" ASN.1 schemas (pre-defined or built by user);
- Has special types to work with ASN.1 schemas:
  - Any
  - Choice
  - Repeated
- User can name any block inside ASN.1 schema and easily get information by name;
- Ability to parse internal data inside primitively encoded data types and automatically validate it against special schema;
- All types inside library are dynamic;
- All types can be initialized in static or dynamic ways.
- [ASN1js] fully tested against [ASN.1:2008 TestSuite].

## Examples

Runnable examples are on the [website](https://asn1js.org/docs/examples/):

- Basics: [decode BER and DER](https://asn1js.org/docs/examples/basics/decode), [encode to DER](https://asn1js.org/docs/examples/basics/encode), [convert to JavaScript values](https://asn1js.org/docs/examples/basics/values), [explicit and implicit tags](https://asn1js.org/docs/examples/basics/tagging)
- Schemas: [validate against a schema](https://asn1js.org/docs/examples/schemas/verify-schema), [CHOICE and SEQUENCE OF](https://asn1js.org/docs/examples/schemas/choice-and-repeated), [structures inside an OCTET STRING](https://asn1js.org/docs/examples/schemas/embedded-data)
- Real-world data: [read an X.509 certificate](https://asn1js.org/docs/examples/real-world/x509-certificate), [read a public key](https://asn1js.org/docs/examples/real-world/public-key), [parse untrusted input](https://asn1js.org/docs/examples/real-world/untrusted-input)

For complete PKI structures such as certificates, CMS, and PKCS#10 requests, see [PKIjs], which is built on [ASN1js].

## Object Identifiers

`ObjectIdentifier` and `RelativeObjectIdentifier` preserve large decimal components exactly, including UUID-based OIDs such as `2.25.329800735698586629295641978511506172918`. `getValue()`, ASCII output, and JSON values use decimal notation even when a component is stored internally as hex-only.

String values must contain complete non-negative decimal components. Absolute OIDs need at least two components: the first is 0, 1, or 2, and the second is at most 39 when the first is 0 or 1. Leading zeros, surrounding whitespace in each component, a leading `+`, and negative zero are normalized. Partial numbers, hexadecimal prefixes, and exponent notation are rejected.

Invalid strings clear the value and set both `error` and `valueBlock.error` without throwing. They no longer encode as another OID or as a valid prefix. For compatibility, `toBER()` still returns an empty OID (`0600` or `0d00`) on failure; check the OID's diagnostics before using the output, including when it is nested in a constructed value. Parent blocks do not propagate the child's error. A successful `setValue()` clears previous value errors. Constructors without a value remain available for schema declarations.

## Parsing Untrusted Input

`fromBER()` accepts optional parser resource limits for untrusted ASN.1 input.

```typescript
const asn1 = asn1js.fromBER(inputBuffer, {
  maxDepth: 100,
  maxNodes: 10000,
  maxContentLength: 16 * 1024 * 1024,
});
```

When any limit is exceeded the parser returns a normal `FromBerResult` error instead of exhausting the JavaScript stack or continuing to parse excessive input. See the [untrusted input example](https://asn1js.org/docs/examples/real-world/untrusted-input).

By default, primitive OCTET STRING values and primitive BIT STRING values with zero unused bits are also checked for a complete embedded ASN.1 value. Set `parseEmbedded: false` to keep those values as raw bytes without that heuristic interpretation; constructed children continue to be parsed normally.

Input is copied by default. Set `copyInput: false` to retain a normalized view over the exact input range without copying. The caller must keep the backing storage unchanged and must not detach it while the parsed tree is in use: mutations are visible through parsed byte views and can make them inconsistent with decoded fields. The entire backing buffer remains retained. This option provides no protection against shared-memory races.

For performance-sensitive callers that can meet these storage requirements, the following example explicitly opts out of copying the input. It also independently disables embedded-value detection with `parseEmbedded: false`; that option does not change input ownership.

```typescript
const asn1 = asn1js.fromBER(inputBuffer, {
  maxDepth: 100,
  maxNodes: 10000,
  maxContentLength: 16 * 1024 * 1024,
  parseEmbedded: false,
  copyInput: false,
});
```

## Related source code

- [C++ ASN1:2008 BER coder/decoder](https://github.com/YuryStrozhevsky/C-plus-plus-ASN.1-2008-coder-decoder) - the "father" of [ASN1js] project;
- [Freely available ASN.1:2008 test suite](https://github.com/YuryStrozhevsky/ASN1-2008-free-test-suite) - the suite which can help you to validate (and better understand) any ASN.1 coder/decoder;
- [NPM package for ASN.1:2008 test suite](https://github.com/YuryStrozhevsky/asn1-test-suite)

## Suitability

There are several commercial products, enterprise solutions as well as open source project based on versions of ASN1js. You should, however, do your own code and security review before using any open source library in a production application to ensure it will meet your needs.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, commit conventions and the release flow.

## License

asn1js is released under the [BSD 3-Clause License](LICENSE).

[ASN.1]: https://en.wikipedia.org/wiki/Abstract_Syntax_Notation_One
[ASN1js]: https://asn1js.org/
[PKIjs]: https://pkijs.org/
[BER]: https://en.wikipedia.org/wiki/X.690#BER_encoding
[DER]: https://en.wikipedia.org/wiki/X.690#DER_encoding
[freely available ASN.1:2008 test suite]: https://github.com/YuryStrozhevsky/ASN1-2008-free-test-suite
[ASN.1:2008 TestSuite]: https://github.com/YuryStrozhevsky/asn1-test-suite
