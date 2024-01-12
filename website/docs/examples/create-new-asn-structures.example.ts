import * as asn1js from 'asn1js';

var sequence = new asn1js.Sequence();
sequence.valueBlock.value.push(new asn1js.Integer({ value: 1 }));

var sequence_buffer = sequence.toBER(false); // Encode current sequence to BER (in ArrayBuffer)
var current_size = sequence_buffer.byteLength;

var integer_data = new ArrayBuffer(8);
var integer_view = new Uint8Array(integer_data);
integer_view[0] = 0x01;
integer_view[1] = 0x01;
integer_view[2] = 0x01;
integer_view[3] = 0x01;
integer_view[4] = 0x01;
integer_view[5] = 0x01;
integer_view[6] = 0x01;
integer_view[7] = 0x01;

sequence.valueBlock.value.push(new asn1js.Integer({
  isHexOnly: true,
  valueHex: integer_data,
})); // Put too long for decoding Integer value

sequence_buffer = sequence.toBER();
current_size = sequence_buffer.byteLength;
