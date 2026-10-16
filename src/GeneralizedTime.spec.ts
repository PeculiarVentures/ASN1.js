import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("GeneralizedTime", () => {
  it("to/from BER", () => {
    const value = new Date("2000-01-02T12:11:10.100Z");
    const asn = new asn1js.GeneralizedTime({ valueDate: value });
    assert.ok(asn.getValue().startsWith, "2000");
    assert.strictEqual(asn.toString("hex"), "181132303030303130323132313131302e315a");
    assert.ok(asn.toString("ascii").startsWith("GeneralizedTime : 2000"));
    assert.ok(asn.toString().startsWith, "2000");
  });

  describe("fraction encoding from Date", () => {
    for (const [iso, expected] of [
      ["2000-01-02T12:11:10.120Z", "20000102121110.12Z"],
      ["2000-01-02T12:11:10.100Z", "20000102121110.1Z"],
      ["2000-01-02T12:11:10.123Z", "20000102121110.123Z"],
      ["2000-01-02T12:11:10.001Z", "20000102121110.001Z"],
      ["2000-01-02T12:11:10.010Z", "20000102121110.01Z"],
      ["2000-01-02T12:11:10.000Z", "20000102121110Z"],
    ]) {
      it(`${iso} -> ${expected}`, () => {
        const asn = new asn1js.GeneralizedTime({ valueDate: new Date(iso) });
        assert.strictEqual(asn.toString(), expected);
        assert.strictEqual(String.fromCharCode(...asn.valueBlock.valueHexView), expected);
        assert.strictEqual(asn.toDate().toISOString(), iso);
      });
    }
  });

  it("parses a fraction without trailing zeros", () => {
    const asn = new asn1js.GeneralizedTime({ value: "20000102121110.12Z" });
    assert.strictEqual(asn.toDate().toISOString(), "2000-01-02T12:11:10.120Z");
  });

  describe("fromString", () => {
    it("YYYYMMDD", () => {
      const asn = new asn1js.GeneralizedTime({ value: "20000102" });
      assert.strictEqual(asn.toString("hex"), "18083230303030313032");
    });
    it("YYYYMMDD with fraction", () => {
      assert.throws(() => {
        new asn1js.GeneralizedTime({ value: "20000102.100" });
      });
    });
    it("YYYYMMDD wrong", () => {
      assert.throws(() => {
        new asn1js.GeneralizedTime({ value: "!0000102" });
      });
    });
    it("YYYYMMDDHH", () => {
      const asn = new asn1js.GeneralizedTime({ value: "2000010212" });
      assert.strictEqual(asn.toString("hex"), "180a32303030303130323132");
    });
    it("YYYYMMDDHH with fraction", () => {
      const asn = new asn1js.GeneralizedTime({ value: "2000010212.100" });
      assert.strictEqual(asn.toString("hex"), "180e323030303031303231322e313030");
    });
    it("YYYYMMDDHH wrong", () => {
      assert.throws(() => {
        new asn1js.GeneralizedTime({ value: "!000010212" });
      });
    });
    it("YYYYMMDDHHMM", () => {
      const asn = new asn1js.GeneralizedTime({ value: "200001021201" });
      assert.strictEqual(asn.toString("hex"), "180c323030303031303231323031");
    });
    it("YYYYMMDDHHMM with fraction", () => {
      const asn = new asn1js.GeneralizedTime({ value: "200001021201.100" });
      assert.strictEqual(asn.toString("hex"), "18103230303030313032313230312e313030");
    });
    it("YYYYMMDDHHMM wrong", () => {
      assert.throws(() => {
        new asn1js.GeneralizedTime({ value: "!200001021201" });
      });
    });
    it("YYYYMMDDHHMMSS", () => {
      const asn = new asn1js.GeneralizedTime({ value: "20000102120102" });
      assert.strictEqual(asn.toString("hex"), "180e3230303030313032313230313032");
    });
    it("YYYYMMDDHHMMSS with fraction", () => {
      const asn = new asn1js.GeneralizedTime({ value: "20000102120102.100" });
      assert.strictEqual(asn.toString("hex"), "181232303030303130323132303130322e313030");
    });
    it("YYYYMMDDHHMMSS wrong", () => {
      assert.throws(() => {
        new asn1js.GeneralizedTime({ value: "!20000102120102" });
      });
    });
    it("incorrect string size", () => {
      assert.throws(() => {
        new asn1js.GeneralizedTime({ value: "2" });
      });
    });
    it("ISO string", () => {
      const asn = new asn1js.GeneralizedTime({ value: "20000102120102.100Z" });
      assert.strictEqual(asn.toString("hex"), "181332303030303130323132303130322e3130305a");
    });
  });
});
