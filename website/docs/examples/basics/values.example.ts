import * as asn1js from "asn1js";

// INTEGER: numbers up to 2^53 via `value`, any size via BigInt
const small = new asn1js.Integer({ value: 65537 });
const big = asn1js.Integer.fromBigInt(2n ** 100n);
console.log("small:", small.valueBlock.valueDec, small.toString("hex"));
console.log("big:", big.toBigInt());

// OBJECT IDENTIFIER: dotted strings
const oid = new asn1js.ObjectIdentifier({ value: "1.2.840.113549.1.1.11" });
console.log("oid:", oid.getValue(), oid.toString("hex"));

// Strings: native JavaScript strings in and out
const name = new asn1js.Utf8String({ value: "Grüße 👋" });
const country = new asn1js.PrintableString({ value: "US" });
console.log("strings:", name.getValue(), country.getValue());

// Dates: UTCTime covers 1950–2049, GeneralizedTime covers any year
const date = new Date(Date.UTC(2030, 0, 15, 12, 0, 0));
const utcTime = new asn1js.UTCTime({ valueDate: date });
console.log("UTCTime:", utcTime.toString(), utcTime.toDate().toISOString());

const farFuture = new Date(Date.UTC(2055, 0, 1));
try {
  new asn1js.UTCTime({ valueDate: farFuture });
} catch (error) {
  console.log("UTCTime 2055:", (error as Error).message);
}
const generalizedTime = new asn1js.GeneralizedTime({ valueDate: farFuture });
console.log("GeneralizedTime:", generalizedTime.toDate().toISOString());
