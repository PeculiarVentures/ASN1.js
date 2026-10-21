import * as asn1js from "asn1js";

// DER encoding of SEQUENCE { INTEGER 42, UTF8String "hello", BOOLEAN TRUE }
const hex = "300d02012a0c0568656c6c6f0101ff";
const der = Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16));

const { offset, result } = asn1js.fromBER(der);
if (offset === -1) {
  throw new Error(`Cannot decode: ${result.error}`);
}

// Print the whole decoded tree
console.log(result.toString());

// Read individual values
if (result instanceof asn1js.Sequence) {
  const [number, text, flag] = result.valueBlock.value;
  if (number instanceof asn1js.Integer) console.log("number:", number.toBigInt());
  if (text instanceof asn1js.Utf8String) console.log("text:", text.getValue());
  if (flag instanceof asn1js.Boolean) console.log("flag:", flag.getValue());
}

// Invalid input does not throw: check `offset` and `result.error`
const truncated = der.slice(0, 6);
const broken = asn1js.fromBER(truncated);
console.log("truncated input:", broken.offset, broken.result.error);
