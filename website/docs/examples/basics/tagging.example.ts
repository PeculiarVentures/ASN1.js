import * as asn1js from "asn1js";

const CONTEXT_SPECIFIC = 3;

// EXPLICIT tagging wraps the inner value: [0] EXPLICIT INTEGER 2
// (this is how X.509 encodes the certificate version)
const explicit = new asn1js.Constructed({
  idBlock: { tagClass: CONTEXT_SPECIFIC, tagNumber: 0 },
  value: [new asn1js.Integer({ value: 2 })],
});
console.log("explicit:", explicit.toString("hex"));

// IMPLICIT tagging replaces the tag: [1] IMPLICIT INTEGER 5
// Encode the inner value and reuse its content bytes under the new tag
const inner = new asn1js.Integer({ value: 5 });
const implicit = new asn1js.Primitive({
  idBlock: { tagClass: CONTEXT_SPECIFIC, tagNumber: 1 },
  valueHex: inner.valueBlock.valueHexView,
});
console.log("implicit:", implicit.toString("hex"));

// Decoding: a decoder cannot know the original type of an IMPLICIT value,
// so it returns a generic Primitive. Rebuild the type from its content bytes.
const decoded = asn1js.fromBER(implicit.toBER()).result;
console.log("tag:", `[${decoded.idBlock.tagNumber}]`);
if (decoded instanceof asn1js.Primitive) {
  console.log("decoded as: Primitive");
  const value = new asn1js.Integer({ valueHex: decoded.valueBlock.valueHexView });
  console.log("value:", value.toBigInt());
}
