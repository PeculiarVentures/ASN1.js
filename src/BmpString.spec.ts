import * as assert from "assert";
import { hex } from "@peculiar/utils";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("BmpString", () => {
  it("toBER/fromBER", () => {
    const testBER = hex.decode("1e2400740065007300740020006d006500730073006100670065002004420435043a04410442");
    const testValue = "test message текст";

    const asn = new asn1js.BmpString({ value: testValue });
    const ber = asn.toBER();
    assert.strictEqual(hex.encode(ber), hex.encode(testBER));

    const asnParsed = asn1js.fromBER(ber);
    assert.ok(asnParsed.result instanceof asn1js.BmpString);
    assert.strictEqual(asnParsed.result.valueBlock.value, testValue);
  });

  it("returns an error for odd-length content", () => {
    const asnParsed = asn1js.fromBER(hex.decode("1e03004100"));
    assert.strictEqual(asnParsed.offset, -1);
    assert.strictEqual(asnParsed.result.error, "BMPString value length must be a multiple of 2");
  });

  it("returns an error instead of throwing for odd-length indefinite content", () => {
    const asnParsed = asn1js.fromBER(hex.decode("3e8000"));
    assert.strictEqual(asnParsed.offset, -1);
    assert.strictEqual(asnParsed.result.error, "BMPString value length must be a multiple of 2");
  });
});
