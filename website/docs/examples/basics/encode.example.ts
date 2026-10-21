import * as asn1js from "asn1js";

// SEQUENCE { INTEGER 42, UTF8String "hello", BOOLEAN TRUE }
const sequence = new asn1js.Sequence({
  value: [
    new asn1js.Integer({ value: 42 }),
    new asn1js.Utf8String({ value: "hello" }),
    new asn1js.Boolean({ value: true }),
  ],
});

// toBER() returns an ArrayBuffer
const der = sequence.toBER();
console.log("bytes:", der.byteLength);

// toString("hex") returns the same encoding as a hex string
console.log("hex:", sequence.toString("hex"));

// Structures can also be built step by step
const list = new asn1js.Sequence();
for (const value of [1, 2, 3]) {
  list.valueBlock.value.push(new asn1js.Integer({ value }));
}
console.log("list:", list.toString("hex"));
