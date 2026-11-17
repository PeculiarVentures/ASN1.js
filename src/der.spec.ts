import * as assert from "assert";
import { describe, it } from "vitest";
import { checkDerForm, checkDerHeader, checkPrimitiveEncoding, checkSetOfOrder, checkSetOrder, compareSetOfElements } from "./der";
import type { DerViolationCode } from "./diagnostics";

function hex(value: string): Uint8Array {
  return Uint8Array.from(value.match(/../g) ?? [], (octet) => Number.parseInt(octet, 16));
}

function ascii(value: string): Uint8Array {
  return Uint8Array.from(value, (character) => character.charCodeAt(0));
}

function primitive(tag: number, value: string) {
  return checkPrimitiveEncoding(tag, false, hex(value));
}

describe("DER header validation", () => {
  it("accepts minimal short, long and arbitrarily large identifiers and lengths", () => {
    const identifiers = ["02", "9e", "9f1f", "9f20", "9f7f", "9f8100", `df${"81".repeat(20)}00`];
    const lengths = ["00", "01", "7f", "8180", "81ff", "820100", "83010000"];
    for (const identifier of identifiers) {
      for (const length of lengths) assert.strictEqual(checkDerHeader(hex(identifier), hex(length)), undefined, `${identifier} ${length}`);
    }
  });

  it("rejects nonminimal identifiers from their original octets", () => {
    for (const identifier of ["1f04", "9f00", "df1e", "9f8020", "9f808100", `df80${"81".repeat(20)}00`]) {
      assert.strictEqual(checkDerHeader(hex(identifier), hex("01"))?.code, "NON_MINIMAL_TAG", identifier);
    }
  });

  it("rejects indefinite and nonminimal length encodings", () => {
    assert.strictEqual(checkDerHeader(hex("30"), hex("80"))?.code, "INDEFINITE_LENGTH");
    for (const length of ["8100", "8101", "817f", "820001", "820080", "83000100"]) {
      assert.strictEqual(checkDerHeader(hex("04"), hex(length))?.code, "NON_MINIMAL_LENGTH", length);
    }
  });
});

describe("DER UNIVERSAL forms", () => {
  it("enforces the primitive and constructed form for every supported type", () => {
    const primitiveTags = [1, 2, 3, 4, 5, 6, 10, 12, 13, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30];
    for (const tag of primitiveTags) {
      assert.strictEqual(checkDerForm(tag, false), undefined, String(tag));
      assert.strictEqual(checkDerForm(tag, true)?.code, "INVALID_FORM", String(tag));
      assert.strictEqual(checkPrimitiveEncoding(tag, true, new Uint8Array())?.code, "INVALID_FORM", String(tag));
    }
    for (const tag of [16, 17]) {
      assert.strictEqual(checkDerForm(tag, true), undefined);
      assert.strictEqual(checkDerForm(tag, false)?.code, "INVALID_FORM");
      assert.strictEqual(checkPrimitiveEncoding(tag, true, new Uint8Array())?.code, "UNSUPPORTED_DER_TYPE");
      assert.strictEqual(checkPrimitiveEncoding(tag, false, new Uint8Array())?.code, "UNSUPPORTED_DER_TYPE");
    }
  });

  it("distinguishes EOC, reserved tags and unsupported types", () => {
    for (const constructed of [false, true]) {
      assert.strictEqual(checkDerForm(0, constructed)?.code, "UNEXPECTED_EOC");
      assert.strictEqual(checkPrimitiveEncoding(0, constructed, new Uint8Array())?.code, "UNEXPECTED_EOC");
      for (const tag of [15, 37, 38, 1000, Number.MAX_SAFE_INTEGER]) {
        assert.strictEqual(checkDerForm(tag, constructed)?.code, "INVALID_FORM", String(tag));
        assert.strictEqual(checkPrimitiveEncoding(tag, constructed, new Uint8Array())?.code, "INVALID_FORM", String(tag));
      }
      for (const tag of [7, 8, 9, 11, 14, 29, 31, 32, 33, 34, 35, 36]) {
        assert.strictEqual(checkDerForm(tag, constructed)?.code, "UNSUPPORTED_DER_TYPE", String(tag));
        assert.strictEqual(checkPrimitiveEncoding(tag, constructed, new Uint8Array())?.code, "UNSUPPORTED_DER_TYPE", String(tag));
      }
    }
  });
});

describe("DER primitive contents", () => {
  it("checks every supported non-string primitive with positive and negative vectors", () => {
    const cases: Array<{ tag: number; valid: string[]; invalid: Array<[string, DerViolationCode]> }> = [
      {
        tag: 1,
        valid: ["00", "ff"],
        invalid: [
          ["", "INVALID_BOOLEAN"],
          ["01", "INVALID_BOOLEAN"],
          ["7f", "INVALID_BOOLEAN"],
          ["0000", "INVALID_BOOLEAN"],
        ],
      },
      {
        tag: 2,
        valid: ["00", "7f", "80", "ff", "0080", "00ff", "ff00", "ff7f", "008000000a", "80000000000000000000"],
        invalid: [
          ["", "EMPTY_VALUE"],
          ["0001", "NON_MINIMAL_INTEGER"],
          ["0000000001", "NON_MINIMAL_INTEGER"],
          ["ff80", "NON_MINIMAL_INTEGER"],
          ["ffffffffff", "NON_MINIMAL_INTEGER"],
        ],
      },
      {
        tag: 10,
        valid: ["00", "01", "0080", "ff7f"],
        invalid: [
          ["", "EMPTY_VALUE"],
          ["0001", "NON_MINIMAL_INTEGER"],
          ["ff80", "NON_MINIMAL_INTEGER"],
        ],
      },
      {
        tag: 3,
        valid: ["00", "0000", "0780", "01fe", "030000f8"],
        invalid: [
          ["", "EMPTY_VALUE"],
          ["07", "BIT_STRING_UNUSED_BITS"],
          ["0800", "BIT_STRING_UNUSED_BITS"],
          ["ff00", "BIT_STRING_UNUSED_BITS"],
          ["0781", "BIT_STRING_PADDING"],
          ["0101", "BIT_STRING_PADDING"],
        ],
      },
      { tag: 4, valid: ["", "00", "ff", "02020001"], invalid: [] },
      {
        tag: 5,
        valid: [""],
        invalid: [
          ["00", "INVALID_NULL"],
          ["ffff", "INVALID_NULL"],
        ],
      },
    ];
    for (const { tag, valid, invalid } of cases) {
      for (const value of valid) assert.strictEqual(primitive(tag, value), undefined, `${tag}: ${value}`);
      for (const [value, code] of invalid) assert.strictEqual(primitive(tag, value)?.code, code, `${tag}: ${value}`);
    }
  });

  it("checks OID and RELATIVE-OID base-128 groups without converting large arcs", () => {
    for (const tag of [6, 13]) {
      for (const value of ["00", "2a00", "7f", "8100", "2a810000", `${"81".repeat(30)}00`]) assert.strictEqual(primitive(tag, value), undefined, `${tag}: ${value}`);
      for (const [value, code] of [
        ["", "EMPTY_VALUE"],
        ["8001", "INVALID_OID"],
        ["2a8000", "INVALID_OID"],
        ["2a81", "INVALID_OID"],
        ["ff", "INVALID_OID"],
      ] as const) {
        assert.strictEqual(primitive(tag, value)?.code, code, `${tag}: ${value}`);
      }
      assert.strictEqual(primitive(tag, "2a8000")?.contentOffset, 1);
      assert.strictEqual(primitive(tag, "2a8181")?.contentOffset, 2);
    }
  });

  it("reports exact local byte positions without mutating its input", () => {
    const backing = hex("aaaa030000f9bbbb");
    const content = backing.subarray(2, 6);
    assert.deepStrictEqual(checkPrimitiveEncoding(3, false, content), {
      code: "BIT_STRING_PADDING",
      message: "DER requires BIT STRING padding bits to be zero",
      contentOffset: 3,
    });
    assert.deepStrictEqual(backing, hex("aaaa030000f9bbbb"));
  });
});

describe("DER character strings", () => {
  it("validates UTF-8 scalar boundaries, overlong forms and continuation bytes", () => {
    const valid = ["", "00", "7f", "c280", "dfbf", "e0a080", "ed9fbf", "ee8080", "efbfbf", "f0908080", "f48fbfbf", "61c2a2e282acf09f9880"];
    const invalid = [
      "80",
      "bf",
      "c080",
      "c1bf",
      "c2",
      "c241",
      "dfc0",
      "e08080",
      "e09fbf",
      "e0a0",
      "eda080",
      "edbfbf",
      "ee8080ff",
      "f0808080",
      "f08fbfbf",
      "f4908080",
      "f5808080",
      "f888808080",
      "e28241",
      "f09f4180",
      "f09f9841",
    ];
    for (const value of valid) assert.strictEqual(primitive(12, value), undefined, value);
    for (const value of invalid) assert.strictEqual(primitive(12, value)?.code, "INVALID_STRING", value);
    assert.strictEqual(primitive(12, "61e28241")?.contentOffset, 3);
    assert.strictEqual(primitive(12, "61e282")?.contentOffset, 1);
  });

  it("checks the entire NumericString, PrintableString, IA5String and VisibleString alphabets", () => {
    for (const tag of [18, 19, 22, 26]) {
      assert.strictEqual(primitive(tag, ""), undefined);
      for (let octet = 0; octet < 256; octet++) {
        const character = String.fromCharCode(octet);
        const expected = tag === 18 ? /^[ 0-9]$/.test(character) : tag === 19 ? /^[A-Za-z0-9 '()+,\-./:=?]$/.test(character) : tag === 22 ? octet <= 127 : octet >= 32 && octet <= 126;
        const result = checkPrimitiveEncoding(tag, false, Uint8Array.of(0x31, octet));
        assert.strictEqual(result?.code, expected ? undefined : "INVALID_STRING", `${tag}: ${octet}`);
        if (!expected) assert.strictEqual(result?.contentOffset, 1);
      }
    }
  });

  it("checks BMPString and UniversalString widths and Unicode scalar values", () => {
    for (const value of ["", "0000", "0041", "d7ff", "e000", "ffff", "00410442"]) assert.strictEqual(primitive(30, value), undefined, value);
    for (const value of ["41", "004100", "d800", "dfff", "d800dc00"]) assert.strictEqual(primitive(30, value)?.code, "INVALID_STRING", value);
    for (const value of ["", "00000000", "00000041", "0000d7ff", "0000e000", "00010000", "0010ffff"]) assert.strictEqual(primitive(28, value), undefined, value);
    for (const value of ["000000", "0000004100", "0000d800", "0000dfff", "00110000", "ffffffff"]) assert.strictEqual(primitive(28, value)?.code, "INVALID_STRING", value);
    assert.strictEqual(primitive(30, "0041d800")?.contentOffset, 2);
    assert.strictEqual(primitive(28, "0000004100110000")?.contentOffset, 4);
  });

  it("accepts opaque ISO 2022 string contents in primitive form", () => {
    for (const tag of [20, 21, 25, 27]) {
      for (const value of ["", "00", "ffff", "1b242841ff"]) assert.strictEqual(primitive(tag, value), undefined, `${tag}: ${value}`);
    }
  });
});

describe("DER times", () => {
  it("accepts canonical UTCTime and GeneralizedTime with arbitrary fractional precision", () => {
    for (const value of ["500101000000Z", "491231235959Z", "000229123456Z", "960229000000Z", "040229000000Z"]) {
      assert.strictEqual(checkPrimitiveEncoding(23, false, ascii(value)), undefined, value);
    }
    for (const value of [
      "00000229000000Z",
      "19000101000000Z",
      "20000229123456Z",
      "24000229000000Z",
      "99991231235959Z",
      "20261115123456.5Z",
      "20261115123456.00001Z",
      `20261115123456.${"0".repeat(1024)}1Z`,
    ]) {
      assert.strictEqual(checkPrimitiveEncoding(24, false, ascii(value)), undefined, value);
    }
  });

  it("rejects noncanonical layouts and invalid calendar values for both time types", () => {
    for (const generalized of [false, true]) {
      const tag = generalized ? 24 : 23;
      const year = generalized ? "2026" : "26";
      const valid = `${year}1115123456Z`;
      const invalid = [
        "",
        valid.toLowerCase(),
        `x${valid}`,
        `${valid}x`,
        `${valid}\n`,
        valid.slice(0, -1),
        `${year}1115123456+0000`,
        `${year}11151234Z`,
        `${year}111512Z`,
        `${year}0015123456Z`,
        `${year}1315123456Z`,
        `${year}1100123456Z`,
        `${year}1131123456Z`,
        `${year}0230123456Z`,
        `${year}1115240000Z`,
        `${year}1115126056Z`,
        `${year}1115123461Z`,
        `${year}1115123456.Z`,
        `${year}1115123456,5Z`,
        `${year}1115123456.0Z`,
        `${year}1115123456.50Z`,
        `${year}1115123456.5xZ`,
      ];
      for (const value of invalid) assert.strictEqual(checkPrimitiveEncoding(tag, false, ascii(value))?.code, "INVALID_TIME", `${tag}: ${value}`);
    }
    assert.strictEqual(checkPrimitiveEncoding(23, false, ascii("260229000000Z"))?.code, "INVALID_TIME");
    for (const year of ["1900", "2100", "2026"]) assert.strictEqual(checkPrimitiveEncoding(24, false, ascii(`${year}0229000000Z`))?.code, "INVALID_TIME");
    assert.strictEqual(checkPrimitiveEncoding(23, false, ascii("261115123456.5Z"))?.code, "INVALID_TIME");
    assert.strictEqual(checkPrimitiveEncoding(24, false, ascii("20261315123456Z"))?.contentOffset, 4);
  });

  it("permits ISO 8601 GeneralizedTime leap seconds only at a UTC month boundary", () => {
    // UTCTime explicitly restricts seconds to 00–59; GeneralizedTime uses ISO 8601.
    assert.strictEqual(checkPrimitiveEncoding(23, false, ascii("161231235960Z"))?.code, "INVALID_TIME");
    for (const value of ["20161231235960Z", "20150630235960.5Z", "20240229235960Z"]) assert.strictEqual(checkPrimitiveEncoding(24, false, ascii(value)), undefined, value);
    for (const value of ["20161230235960Z", "20161231235860Z", "20161231125960Z", "20161231235961Z"]) assert.strictEqual(checkPrimitiveEncoding(24, false, ascii(value))?.code, "INVALID_TIME", value);
  });
});

describe("DER SET and SET OF ordering", () => {
  it("compares SET OF encodings as octet strings with conceptual zero padding", () => {
    for (const [left, right] of [
      ["020100", "020101"],
      ["0201ff", "02020080"],
      ["0400", "040100"],
      ["ff", "ff01"],
      ["", "01"],
    ]) {
      assert.ok(compareSetOfElements(hex(left), hex(right)) < 0, `${left} < ${right}`);
      assert.ok(compareSetOfElements(hex(right), hex(left)) > 0, `${right} > ${left}`);
    }
    for (const [left, right] of [
      ["", ""],
      ["00", "0000"],
      ["01", "010000"],
      ["020100", "020100"],
    ]) {
      assert.strictEqual(compareSetOfElements(hex(left), hex(right)), 0, `${left} = ${right}`);
      assert.strictEqual(compareSetOfElements(hex(right), hex(left)), 0);
    }
  });

  it("allows ordered duplicate SET OF elements and identifies the first descending element", () => {
    assert.strictEqual(checkSetOfOrder([]), undefined);
    assert.strictEqual(checkSetOfOrder([hex("020100")]), undefined);
    assert.strictEqual(checkSetOfOrder([hex("020100"), hex("020100"), hex("020101"), hex("0400")]), undefined);
    const issue = checkSetOfOrder([hex("020100"), hex("0400"), hex("020101"), hex("020100")]);
    assert.strictEqual(issue?.code, "SET_OF_ORDER");
    assert.strictEqual(issue?.elementIndex, 2);
  });

  it("orders SET by actual tag class then numeric tag, ignoring the constructed flag", () => {
    assert.strictEqual(checkSetOrder([]), undefined);
    assert.strictEqual(checkSetOrder([hex("30"), hex("17"), hex("5f1f"), hex("80"), hex("e0")]), undefined);
    assert.strictEqual(checkSetOrder([hex("02"), hex("22"), hex("02")]), undefined);
    assert.strictEqual(checkSetOrder([hex("02"), hex("81"), hex("82")]), undefined);
    assert.strictEqual(checkSetOrder([hex("17"), hex("30")])?.elementIndex, 1);
    assert.strictEqual(checkSetOrder([hex("81"), hex("5f8100")])?.code, "SET_ORDER");
    // An untagged CHOICE uses the encoded alternative, so selected [2] follows [1].
    assert.strictEqual(checkSetOrder([hex("81"), hex("82")]), undefined);
    assert.strictEqual(checkSetOrder([hex("82"), hex("81")])?.code, "SET_ORDER");
  });

  it("orders long tags numerically beyond safe integers and distinguishes equal-length groups", () => {
    const ascending = ["9e", "9f1f", "9f7f", "9f8100", "9fff7f", "9f818000", `9f${"81".repeat(20)}00`, `9f${"81".repeat(20)}01`, `9f${"81".repeat(21)}00`].map(hex);
    assert.strictEqual(checkSetOrder(ascending), undefined);
    for (let i = 1; i < ascending.length; i++) {
      const issue = checkSetOrder([ascending[i], ascending[i - 1]]);
      assert.strictEqual(issue?.code, "SET_ORDER", String(i));
      assert.strictEqual(issue?.elementIndex, 1);
    }
    const constructed = ascending[6].slice();
    constructed[0] |= 0x20;
    assert.strictEqual(checkSetOrder([constructed, ascending[6]]), undefined);
  });
});
