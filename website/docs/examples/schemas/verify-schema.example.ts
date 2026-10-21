import * as asn1js from "asn1js";

// AlgorithmIdentifier ::= SEQUENCE {
//   algorithm   OBJECT IDENTIFIER,
//   parameters  ANY OPTIONAL }
const algorithmIdentifier = new asn1js.Sequence({
  value: [new asn1js.ObjectIdentifier({ name: "algorithm" }), new asn1js.Any({ name: "parameters", optional: true })],
});

// sha256WithRSAEncryption with NULL parameters
const rsa = new asn1js.Sequence({
  value: [new asn1js.ObjectIdentifier({ value: "1.2.840.113549.1.1.11" }), new asn1js.Null()],
}).toBER();

// verifySchema decodes the bytes and checks them against the schema in one step.
// Every named block in the schema is available on `result` by its name.
const first = asn1js.verifySchema(rsa, algorithmIdentifier);
if (first.verified) {
  console.log("algorithm:", first.result.algorithm.getValue());
  console.log("parameters:", first.result.parameters.toString());
}

// Ed25519 has no parameters: the optional field is simply missing
const ed25519 = new asn1js.Sequence({
  value: [new asn1js.ObjectIdentifier({ value: "1.3.101.112" })],
}).toBER();

const second = asn1js.verifySchema(ed25519, algorithmIdentifier);
if (second.verified) {
  console.log("algorithm:", second.result.algorithm.getValue());
  console.log("has parameters:", "parameters" in second.result);
}

// Data that does not match the schema is reported, not thrown
const wrong = new asn1js.Sequence({ value: [new asn1js.Integer({ value: 1 })] }).toBER();
const third = asn1js.verifySchema(wrong, algorithmIdentifier);
console.log("verified:", third.verified);
