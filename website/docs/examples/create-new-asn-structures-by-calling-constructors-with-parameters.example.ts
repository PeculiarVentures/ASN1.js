import * as asn1js from 'asn1js';

var sequence2 = new asn1js.Sequence({
  value: [
    new asn1js.Integer({ value: 1 }),
    new asn1js.Integer({
      isHexOnly: true,
      valueHex: integer_data
    }),
  ]
});
