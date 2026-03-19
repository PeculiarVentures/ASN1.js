/* eslint-disable @stylistic/max-len */
import * as assert from "assert";
import * as asn1js from "../src";
import { BaseBlock } from "../src";
import { checkBufferParams } from "../src/internals/utils";

const certB64 = "MIIDLjCCAhagAwIBAgIBATANBgkqhkiG9w0BAQsFADA6MRkwFwYDVQQDExBUZXN0IGNlcnRpZmljYXRlMR0wGwYJKoZIhvcNAQkBFg5zb21lQGVtYWlsLm5ldDAeFw0yMTAzMTYwMDAwMDBaFw0yMTA0MTYwMDAwMDBaMDoxGTAXBgNVBAMTEFRlc3QgY2VydGlmaWNhdGUxHTAbBgkqhkiG9w0BCQEWDnNvbWVAZW1haWwubmV0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3N6J0GUJ8URj2fduC26mjCzWf75jM3QSLQYiXSTAMqJA9apf09GMmT+UC6jq2J1U49mXGezE64uXv2tyys9S07xgRkNAWPJXz0opKYud4XPEpdxKfQkD2XklK+8R3BPhAOOxSpfR+SFkLxTMiDHsOt+Xbb98DZ8F3QkzHLvX42jEfAR0StIRLgFYEtf4vX9q4OsYTeJ4xk61lTJc3d0ep/JTp55fxWRaQdzhg+fkv9XwJxxhW9pJRekZORnRb4Q1Zyw+uecuIffsmhLzang45npfzAKXuPaE6lnRMHauLQ1rGGqYA/Vaq4UU6yZUTVLpsKON7b1xogMQrqIkbqtTuQIDAQABoz8wPTAMBgNVHRMBAf8EAjAAMA4GA1UdDwEB/wQEAwIEkDAdBgNVHQ4EFgQUl4hohjz9Xxb4lYhsOiq9wVqKv8YwDQYJKoZIhvcNAQELBQADggEBAIKH86qkFJV3FZyblAMWDSEbEi4MV2Epb5ty7wpSatHvz8NKtmB/hVFGwWFBj5OfS9wfaX6Uw24DyBSBOOqEzonUeqFTDo54zqQ4fQ+UlC/79aq7awGpEuXFnUF3xiLFqHNz5zUeKEYY0W5XKFg/TiW6hAmxlDg5ybAoHDROpwT4u6TuOK6OxMneQRBESmZlO43DYwCG950fXEDJT2gXVLbbSSTln8JBHfTAwOgmsDtaZOCieTS6KYwscWy3u/8xxMyX8NS3A1Zeh0jtk/irKzfsNAdcl8aQwdckGAkPWT/9EqawC33Ep3+2br41+K1jjGT8LeYDlMYSJycWo9tltKc=";

function concatArrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
}

function encodeLength(length: number): Uint8Array {
  if (length < 0x80) {
    return Uint8Array.of(length);
  }

  const bytes = [];
  let value = length;
  while (value > 0) {
    bytes.unshift(value & 0xff);
    value >>= 8;
  }

  return Uint8Array.of(0x80 | bytes.length, ...bytes);
}

function wrapSequence(content: Uint8Array): Uint8Array {
  return concatArrays(Uint8Array.of(0x30), encodeLength(content.length), content);
}

function wrapIndefiniteSequence(content: Uint8Array): Uint8Array {
  return concatArrays(Uint8Array.of(0x30, 0x80), content, Uint8Array.of(0x00, 0x00));
}

function makeNestedSequence(depth: number): Uint8Array {
  let current: Uint8Array = Uint8Array.of(0x05, 0x00);
  for (let index = 0; index < depth; index += 1) {
    current = wrapSequence(current);
  }

  return current;
}

function makeNestedIndefiniteSequence(depth: number): Uint8Array {
  let current: Uint8Array = Uint8Array.of(0x05, 0x00);
  for (let index = 0; index < depth; index += 1) {
    current = wrapIndefiniteSequence(current);
  }

  return current;
}

function makeSequenceOfNulls(count: number, isIndefiniteForm = false): Uint8Array {
  const items = new Array<Uint8Array>(count).fill(Uint8Array.of(0x05, 0x00));
  const content = concatArrays(...items);

  return isIndefiniteForm
    ? concatArrays(Uint8Array.of(0x30, 0x80), content, Uint8Array.of(0x00, 0x00))
    : wrapSequence(content);
}

function makeOctetString(length: number): Uint8Array {
  return concatArrays(Uint8Array.of(0x04), encodeLength(length), new Uint8Array(length));
}

describe("Unit tests", () => {
  describe("utils", () => {
    it("buffer incorrect type", () => {
      const buffer = "wrong";
      const block = new BaseBlock();
      const res = checkBufferParams(block, buffer as unknown as Uint8Array, 0, 0);
      assert.strictEqual(res, false);
    });
    it("buffer 0 length", () => {
      const buffer = new Uint8Array();
      const block = new BaseBlock();
      const res = checkBufferParams(block, buffer, 0, 0);
      assert.strictEqual(res, false);
    });
    it("offset is negative", () => {
      const buffer = new Uint8Array(10);
      const block = new BaseBlock();
      const res = checkBufferParams(block, buffer, -1, 0);
      assert.strictEqual(res, false);
    });
    it("length is negative", () => {
      const buffer = new Uint8Array(10);
      const block = new BaseBlock();
      const res = checkBufferParams(block, buffer, 0, -1);
      assert.strictEqual(res, false);
    });
    it("out of range", () => {
      const buffer = new Uint8Array(10);
      const block = new BaseBlock();
      const res = checkBufferParams(block, buffer, 8, 3);
      assert.strictEqual(res, false);
    });
  });

  it("LocalBaseBlock", () => {
    const baseBlock = new asn1js.BaseBlock({
      blockLength: 10,
      error: "error",
      warnings: ["warning 1", "warning 2"],
      valueBeforeDecode: new Uint8Array([0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01]),
      name: "name",
      optional: true,
      primitiveSchema: new asn1js.OctetString(),
      idBlock: {
        isHexOnly: false,
        valueHex: new Uint8Array([0x01]),
        tagClass: 1,
        tagNumber: 1,
        isConstructed: false,
      },
      lenBlock: {
        isIndefiniteForm: false,
        longFormUsed: false,
        length: 10,
      },
    });

    assert.equal(baseBlock.blockLength, 10, "Incorrect value for blockLength");
    assert.equal(baseBlock.error, "error", "Incorrect value for error");
    assert.equal(baseBlock.warnings.length, 2, "Incorrect value for warnings");
    assert.equal(baseBlock.valueBeforeDecodeView.byteLength, 10, "Incorrect value for valueBeforeDecode");
    assert.equal((baseBlock.constructor as typeof asn1js.BaseBlock).blockName(), "BaseBlock", "Incorrect value for blockName");

    const parseFunction = (key: string, value: any): any => {
      switch (key) {
        case "valueHex":
        case "valueBeforeDecode": {
          if (typeof value !== "string") {
            throw new Error(`Incorrect type of value for key '${key}'`);
          }
          const matches = value.match(/[\da-f]{2}/gi);
          if (!matches)
            return new ArrayBuffer(0);

          return (new Uint8Array(matches.map((hex) => parseInt(hex, 16)))).buffer;
        }
        default:
          return value;
      }
    };

    const string = JSON.stringify(baseBlock);
    const object = JSON.parse(string, parseFunction);

    new asn1js.BaseBlock(object);

    const octetString = new asn1js.OctetString({ valueHex: (new Uint8Array([0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01])).buffer });

    new asn1js.OctetString(JSON.parse(JSON.stringify(octetString), parseFunction));
  });

  it("toString", () => {
    const { result } = asn1js.fromBER(new Uint8Array(Buffer.from(certB64, "base64")).buffer);
    const asnString = result.toString();
    // console.log(asnString);
    assert.strictEqual(asnString.length > 0, true);
  });

  describe("fromBER resource limits", () => {
    it("parses regular ASN.1 with explicit limits", () => {
      const certificate = new Uint8Array(Buffer.from(certB64, "base64"));
      const result = asn1js.fromBER(certificate, {
        maxDepth: 32,
        maxNodes: 512,
        maxContentLength: 64 * 1024,
      });

      assert.notEqual(result.offset, -1, "Certificate should parse within configured limits");
    });

    it("returns a controlled error when maxDepth is exceeded", () => {
      const result = asn1js.fromBER(makeNestedSequence(11), {
        maxDepth: 10,
        maxNodes: 64,
        maxContentLength: 4096,
      });

      assert.equal(result.offset, -1, "Deep nesting should fail");
      assert.equal(result.result.error, "Maximum ASN.1 nesting depth exceeded");
    });

    it("stops very deep inputs before the JavaScript stack overflows", () => {
      assert.doesNotThrow(() => {
        const result = asn1js.fromBER(makeNestedSequence(2000), {
          maxDepth: 100,
          maxNodes: 5000,
          maxContentLength: 1024 * 1024,
        });

        assert.equal(result.offset, -1, "Very deep nesting should fail with a parse error");
        assert.equal(result.result.error, "Maximum ASN.1 nesting depth exceeded");
      });
    });

    it("returns a controlled error when maxNodes is exceeded", () => {
      const result = asn1js.fromBER(makeSequenceOfNulls(6), {
        maxDepth: 8,
        maxNodes: 6,
        maxContentLength: 4096,
      });

      assert.equal(result.offset, -1, "Wide input should fail once node budget is exhausted");
      assert.equal(result.result.error, "Maximum ASN.1 node count exceeded");
    });

    it("returns a controlled error when primitive content exceeds maxContentLength", () => {
      const result = asn1js.fromBER(makeOctetString(5), {
        maxDepth: 8,
        maxNodes: 32,
        maxContentLength: 4,
      });

      assert.equal(result.offset, -1, "Primitive content length limit should be enforced");
      assert.equal(result.result.error, "Maximum ASN.1 content length exceeded");
    });

    it("returns a controlled error when constructed content exceeds maxContentLength", () => {
      const result = asn1js.fromBER(makeSequenceOfNulls(3), {
        maxDepth: 8,
        maxNodes: 32,
        maxContentLength: 5,
      });

      assert.equal(result.offset, -1, "Constructed content length limit should be enforced");
      assert.equal(result.result.error, "Maximum ASN.1 content length exceeded");
    });

    it("applies maxDepth to indefinite-length constructed input", () => {
      const result = asn1js.fromBER(makeNestedIndefiniteSequence(11), {
        maxDepth: 10,
        maxNodes: 64,
        maxContentLength: 4096,
      });

      assert.equal(result.offset, -1, "Indefinite nested input should fail by depth");
      assert.equal(result.result.error, "Maximum ASN.1 nesting depth exceeded");
    });

    it("applies maxNodes to indefinite-length constructed input", () => {
      const result = asn1js.fromBER(makeSequenceOfNulls(6, true), {
        maxDepth: 8,
        maxNodes: 6,
        maxContentLength: 4096,
      });

      assert.equal(result.offset, -1, "Indefinite wide input should fail by node count");
      assert.equal(result.result.error, "Maximum ASN.1 node count exceeded");
    });
  });
});
