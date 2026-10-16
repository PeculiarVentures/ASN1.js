import * as assert from "assert";
import { Convert } from "@peculiar/utils";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("RawData", () => {
  it("to/from BER", () => {
    const value = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    const asn = new asn1js.RawData({ data: value });
    assert.strictEqual(Convert.ToHex(asn.dataView), "01020304050607080900");
    assert.strictEqual(Convert.ToHex(asn.toBER()), "01020304050607080900");

    const rawFromBER = new asn1js.RawData();
    rawFromBER.fromBER(value, 0, value.byteLength);
    assert.strictEqual(Convert.ToHex(rawFromBER.toBER()), "01020304050607080900");
  });
});
