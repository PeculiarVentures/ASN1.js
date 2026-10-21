import * as asn1js from "asn1js";

const CONTEXT_SPECIFIC = 3;

// A simplified X.509 GeneralNames:
// GeneralNames ::= SEQUENCE OF GeneralName
// GeneralName  ::= CHOICE {
//   rfc822Name  [1] IMPLICIT IA5String,
//   dNSName     [2] IMPLICIT IA5String }
const generalNames = new asn1js.Sequence({
  value: [
    new asn1js.Repeated({
      name: "names",
      value: new asn1js.Choice({
        value: [
          new asn1js.Primitive({ idBlock: { tagClass: CONTEXT_SPECIFIC, tagNumber: 1 } }),
          new asn1js.Primitive({ idBlock: { tagClass: CONTEXT_SPECIFIC, tagNumber: 2 } }),
        ],
      }),
    }),
  ],
});

// Build some data: two DNS names and one email address
const ia5 = (tagNumber: number, value: string) =>
  new asn1js.Primitive({
    idBlock: { tagClass: CONTEXT_SPECIFIC, tagNumber },
    valueHex: new asn1js.IA5String({ value }).valueBlock.valueHexView,
  });

const der = new asn1js.Sequence({
  value: [ia5(2, "example.com"), ia5(2, "www.example.com"), ia5(1, "admin@example.com")],
}).toBER();

// Repeated collects every matching element into an array under its name
const { verified, result } = asn1js.verifySchema(der, generalNames);
if (verified) {
  for (const name of result.names as asn1js.Primitive[]) {
    const kind = name.idBlock.tagNumber === 1 ? "email" : "dns";
    const value = new asn1js.IA5String();
    value.fromBuffer(name.valueBlock.valueHexView);
    console.log(`${kind}: ${value.getValue()}`);
  }
}

// Elements that match none of the CHOICE alternatives fail verification
const invalid = new asn1js.Sequence({ value: [new asn1js.Integer({ value: 1 })] }).toBER();
console.log("integer accepted:", asn1js.verifySchema(invalid, generalNames).verified);
