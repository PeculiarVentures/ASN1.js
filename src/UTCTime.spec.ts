import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("UTCTime", () => {
  it("encodes the boundary years of the two-digit range", () => {
    assert.strictEqual(new asn1js.UTCTime({ valueDate: new Date(Date.UTC(1950, 0, 1)) }).toString(), "500101000000Z");
    assert.strictEqual(new asn1js.UTCTime({ valueDate: new Date(Date.UTC(2049, 11, 31, 23, 59, 59)) }).toString(), "491231235959Z");
  });

  it("throws on years it cannot represent", () => {
    for (const year of [1850, 1949, 2050, 2150]) {
      assert.throws(() => new asn1js.UTCTime({ valueDate: new Date(Date.UTC(year, 0, 1)) }), /between 1950 and 2049/);
    }
    assert.throws(() => new asn1js.UTCTime({ valueDate: new Date(NaN) }), RangeError);
  });

  it("leaves GeneralizedTime years unrestricted", () => {
    const asn = new asn1js.GeneralizedTime({ valueDate: new Date(Date.UTC(2150, 0, 1)) });

    assert.strictEqual(asn.toDate().getUTCFullYear(), 2150);
  });

  it("stringifies without throwing when no date is set", () => {
    assert.strictEqual(new asn1js.UTCTime().toString(), "000000000000Z");

    const parsed = asn1js.fromBER(new Uint8Array([0x17, 0x01, 0x41]));
    assert.doesNotThrow(() => `${parsed.result}`);
  });
});
