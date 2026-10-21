import * as asn1js from "asn1js";

// Some formats put an encoded structure inside an OCTET STRING.
// For example, an X.509 extension value:
// Extension ::= SEQUENCE {
//   extnID     OBJECT IDENTIFIER,
//   critical   BOOLEAN DEFAULT FALSE,
//   extnValue  OCTET STRING } -- contains a DER-encoded BasicConstraints
// BasicConstraints ::= SEQUENCE { cA BOOLEAN DEFAULT FALSE, ... }
const basicConstraints = new asn1js.Sequence({
  value: [new asn1js.Boolean({ value: true })],
});
const extension = new asn1js.Sequence({
  value: [
    new asn1js.ObjectIdentifier({ value: "2.5.29.19" }),
    new asn1js.Boolean({ value: true }),
    new asn1js.OctetString({ valueHex: basicConstraints.toBER() }),
  ],
});

// `primitiveSchema` describes the structure inside the OCTET STRING,
// and its named blocks are returned together with the outer ones
const schema = new asn1js.Sequence({
  value: [
    new asn1js.ObjectIdentifier({ name: "extnID" }),
    new asn1js.Boolean({ name: "critical", optional: true }),
    new asn1js.OctetString({
      name: "extnValue",
      primitiveSchema: new asn1js.Sequence({
        value: [new asn1js.Boolean({ name: "cA", optional: true })],
      }),
    }),
  ],
});

const { verified, result } = asn1js.verifySchema(extension.toBER(), schema);
console.log("verified:", verified);
if (verified) {
  console.log("extnID:", result.extnID.getValue());
  console.log("critical:", result.critical.getValue());
  console.log("cA:", result.cA.getValue());
}
