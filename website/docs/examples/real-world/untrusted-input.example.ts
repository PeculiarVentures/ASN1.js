import * as asn1js from "asn1js";

// Limits for data from the network, file uploads, and other untrusted sources
const limits: asn1js.FromBerOptions = {
  maxDepth: 32, // how deeply structures may nest
  maxNodes: 1000, // how many ASN.1 values may be decoded in total
  maxContentLength: 64 * 1024, // the largest length a single value may declare
};

// 100 nested SEQUENCEs around a NULL
let nested: asn1js.AsnType = new asn1js.Null();
for (let i = 0; i < 100; i++) {
  nested = new asn1js.Sequence({ value: [nested] });
}
const deep = asn1js.fromBER(nested.toBER(), limits);
console.log("deep:", deep.offset, deep.result.error);

// A SEQUENCE of 5000 INTEGERs
const many = new asn1js.Sequence({
  value: Array.from({ length: 5000 }, (_, value) => new asn1js.Integer({ value })),
});
const wide = asn1js.fromBER(many.toBER(), limits);
console.log("wide:", wide.offset, wide.result.error);

// An OCTET STRING header that claims 16 MiB of content
const header = new Uint8Array([0x04, 0x84, 0x01, 0x00, 0x00, 0x00]);
const large = asn1js.fromBER(header, limits);
console.log("large:", large.offset, large.result.error);

// Data within the limits decodes as usual
const small = new asn1js.Sequence({ value: [new asn1js.Integer({ value: 1 })] });
const ok = asn1js.fromBER(small.toBER(), limits);
console.log("small:", ok.offset, ok.result.toString());
