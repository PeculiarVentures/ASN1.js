import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("GraphicString", () => {
  it("to/from BER", () => {
    const testString = "some text";
    const asn = new asn1js.GraphicString({ value: testString });
    assert.strictEqual(asn.getValue(), testString);
    assert.strictEqual(asn.toString("hex"), "1909736f6d652074657874");
    assert.strictEqual(asn.toString(), `GraphicString : '${testString}'`);
  });
});
