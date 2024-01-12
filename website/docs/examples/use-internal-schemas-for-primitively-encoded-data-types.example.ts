import * as asn1js from 'asn1js';

var primitive_octetstring = new asn1js.OctetString({ valueHex: encoded_sequence }); // Create a primitively encoded OctetString where internal data is an encoded Sequence

var asn1_schema_internal = new asn1js.OctetString({
  name: "outer_block",
  primitiveSchema: new asn1js.Sequence({
    name: "block1",
    value: [
      new asn1js.Null({
        name: "block2"
      })
    ]
  })
});

var variant6 = org.pkijs.compareSchema(primitive_octetstring, primitive_octetstring, asn1_schema_internal);
var variant6_verified = variant4.verified;
var variant6_block1_tag_num = variant6.result.block1.idBlock.tagNumber;
var variant6_block2_tag_num = variant6.result.block2.idBlock.tagNumber;
