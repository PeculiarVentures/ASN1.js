import * as assert from "assert";
import { hex } from "@peculiar/utils";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("Boolean", () => {
  it("empty constructor", () => {
    const asn = new asn1js.Boolean();
    assert.strictEqual(asn.getValue(), false);
    assert.strictEqual(asn.toString("hex"), "010100");
  });

  it("toString", () => {
    assert.strictEqual(new asn1js.Boolean({ value: true }).toString(), "BOOLEAN : true");
    assert.strictEqual(new asn1js.Boolean().toString(), "BOOLEAN : false");
  });

  it("toBER/fromBER", () => {
    const testBER = hex.decode("0101ff");
    const testValue = true;

    const asn = new asn1js.Boolean({ value: true });
    const ber = asn.toBER();
    assert.strictEqual(hex.encode(ber), hex.encode(testBER));

    const asnParsed = asn1js.fromBER(ber);
    assert.ok(asnParsed.result instanceof asn1js.Boolean);
    assert.strictEqual(asnParsed.result.getValue(), testValue);
  });

  it("encode parsed value without changes", () => {
    const testBER = hex.decode("010101");

    const asn = asn1js.fromBER(testBER);
    assert.ok(asn.result instanceof asn1js.Boolean);
    assert.strictEqual(asn.result.getValue(), true);

    const ber = asn.result.toBER();
    assert.strictEqual(hex.encode(ber), "010101");
  });

  it("from valueHex", () => {
    const asn = new asn1js.Boolean({ valueHex: new Uint8Array([0x01]) });

    assert.strictEqual(asn.valueBlock.value, true);
  });

  it("toJSON", () => {
    const asn = new asn1js.Boolean({ value: true });
    const json = asn.toJSON();
    assert.deepStrictEqual(json.valueBlock, {
      blockLength: 0,
      blockName: "BooleanValueBlock",
      error: "",
      isHexOnly: false,
      value: true,
      valueBeforeDecode: "",
      valueHex: "ff",
      warnings: [],
    });
  });

  it("change value", () => {
    const asn = new asn1js.Boolean();
    asn.setValue(true);
    assert.strictEqual(asn.toString("hex"), "0101ff");
  });
});
