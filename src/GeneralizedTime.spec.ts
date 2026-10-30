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
    it("YYYYMMDDHHMMSS with a time difference", () => {
      const asn = new asn1js.GeneralizedTime({ value: "20240229123456+0200" });
      assert.strictEqual(asn.toDate().toISOString(), "2024-02-29T10:34:56.000Z");
    });
    it("YYYYMMDDHHMM with a negative time difference", () => {
      const asn = new asn1js.GeneralizedTime({ value: "202312312130-0500" });
      assert.strictEqual(asn.toDate().toISOString(), "2024-01-01T02:30:00.000Z");
    });
    it("BER with a time difference", () => {
      const { offset, result } = asn1js.fromBER(new Uint8Array([0x18, 0x13, ...new TextEncoder().encode("20240229123456+0200")]));
      assert.notStrictEqual(offset, -1);
      assert.ok(result instanceof asn1js.GeneralizedTime);
      assert.strictEqual(result.toDate().toISOString(), "2024-02-29T10:34:56.000Z");
    });
    it("YYYYMMDDHHMMSS without a time difference is local time", () => {
      assert.strictEqual(new asn1js.GeneralizedTime({ value: "20240131120000" }).toDate().toISOString(), new Date(2024, 0, 31, 12).toISOString());
      assert.strictEqual(new asn1js.GeneralizedTime({ value: "20240229123456" }).toDate().toISOString(), new Date(2024, 1, 29, 12, 34, 56).toISOString());
    });
    it("local time uses the time zone of the host", () => {
      const tz = process.env.TZ;
      try {
        process.env.TZ = "Asia/Kolkata";
        assert.strictEqual(new asn1js.GeneralizedTime({ value: "20240131120000" }).toDate().toISOString(), "2024-01-31T06:30:00.000Z");
        process.env.TZ = "America/New_York";
        assert.strictEqual(new asn1js.GeneralizedTime({ value: "20240131120000" }).toDate().toISOString(), "2024-01-31T17:00:00.000Z");
      } finally {
        if (tz === undefined) delete process.env.TZ;
        else process.env.TZ = tz;
      }
    });
    it("year 0050 in UTC", () => {
      const asn = new asn1js.GeneralizedTime({ value: "00500101120000Z" });
      assert.strictEqual(asn.toDate().toISOString(), "0050-01-01T12:00:00.000Z");
    });
    it("year 0050 with a time difference", () => {
      const asn = new asn1js.GeneralizedTime({ value: "00500101120000+0100" });
      assert.strictEqual(asn.year, 50);
      assert.strictEqual(asn.toDate().toISOString(), "0050-01-01T11:00:00.000Z");
      assert.strictEqual(new asn1js.GeneralizedTime({ value: "00500101003000+0100" }).toDate().toISOString(), "0049-12-31T23:30:00.000Z");
    });
    it("time difference out of range or not digits", () => {
      assert.strictEqual(new asn1js.GeneralizedTime({ value: "20240229123456+2359" }).toDate().toISOString(), "2024-02-28T12:35:56.000Z");
      for (const value of ["20240229123456+9999", "20240229123456+2400", "20240229123456+0060", "20240229123456+2a", "20240229123456+2a00", "20240229123456+ 200", "20240229123456+-100"]) {
        assert.throws(() => new asn1js.GeneralizedTime({ value }), /Wrong input string for conversion/, value);
      }
    });
    it("day out of range for the month", () => {
      assert.strictEqual(new asn1js.GeneralizedTime({ value: "20000229120000Z" }).toDate().toISOString(), "2000-02-29T12:00:00.000Z");
      for (const value of ["20240230123456+0100", "20240230123456Z", "20230229123456Z", "19000229123456Z", "20240431123456Z", "20240100123456Z"]) {
        assert.throws(() => new asn1js.GeneralizedTime({ value }), /Wrong input string for conversion/, value);
      }
    });
    it("month, hour, minute or second out of range", () => {
      for (const value of ["20241301123456+0100", "20241301123456Z", "20240001123456Z", "20240229253456+0100", "20240229253456Z", "20240229126056Z", "20240229123460+0100"]) {
        assert.throws(() => new asn1js.GeneralizedTime({ value }), /Wrong input string for conversion/, value);
      }
    });
    it("parsing again resets the fields that the input does not contain", () => {
      const asn = new asn1js.GeneralizedTime({ value: "20000102120102.100Z" });
      asn.fromString("2000010213Z");
      assert.strictEqual(asn.toDate().toISOString(), "2000-01-02T13:00:00.000Z");
      asn.fromString("20000103Z");
      assert.strictEqual(asn.toDate().toISOString(), "2000-01-03T00:00:00.000Z");
    });
    it("ISO string", () => {
      const asn = new asn1js.GeneralizedTime({ value: "20000102120102.100Z" });
      assert.strictEqual(asn.toString("hex"), "181332303030303130323132303130322e3130305a");
    });
  });
});
