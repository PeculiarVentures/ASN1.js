import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("CharacterString", () => {
  it("to/from BER", () => {
    const testString = "some string";
    const asn = new asn1js.CharacterString({ value: testString });
    assert.strictEqual(asn.getValue(), testString);
    assert.strictEqual(asn.toString("hex"), "1d0b736f6d6520737472696e67");
    assert.strictEqual(asn.toString(), `CharacterString : '${testString}'`);
  });
});
