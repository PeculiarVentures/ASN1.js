import * as asn1js from 'asn1js';

var asn1_schema = new asn1js.Sequence({
  name: "block1",
  value: [
    new asn1js.Null({
      name: "block2"
    }),
    new asn1js.Integer({
      name: "block3",
      optional: true // This block is absent inside data, but it's "optional". Hence verification against the schema will be passed.
    })
  ]
});

var variant1 = org.pkijs.verifySchema(encoded_sequence, asn1_schema); // Verify schema together with decoding of raw data
var variant1_verified = variant1.verified;
var variant1_result = variant1.result; // Verified decoded data with all block names inside
