import * as assert from "assert";
import { Convert } from "pvtsutils";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("BmpString", () => {
  it("toBER/fromBER", () => {
    const testBER = Convert.FromHex("1e2400740065007300740020006d006500730073006100670065002004420435043a04410442");
    const testValue = "test message текст";

    const asn = new asn1js.BmpString({ value: testValue });
    const ber = asn.toBER();
    assert.strictEqual(Convert.ToHex(ber), Convert.ToHex(testBER));

    const asnParsed = asn1js.fromBER(ber);
    assert.ok(asnParsed.result instanceof asn1js.BmpString);
    assert.strictEqual(asnParsed.result.valueBlock.value, testValue);
  });
});
