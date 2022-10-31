/* eslint-disable @typescript-eslint/no-unused-vars */
import * as assert from "assert";
import * as asn1js from "../src";

/**
 * Converts an array buffer to hex notation
 *
 * @param buffer - the buffer to convert
 * @returns the buffer in hex string notation
 */
function buf2hex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)]
		.map(x => x.toString(16).padStart(2, "0"))
		.join(" ");
}

/**
 * Converts a hex string to an array buffer
 *
 * @param hex - the hex string (with our without spaces)
 * @returns the converted hex buffer as array
 */
function hex2buf(hex: string): Uint8Array {
    const bytes = new Array<number>();
    hex = hex.replace(/ /g, "");
    hex.replace(/../g, (pair: string) => {
        bytes.push(parseInt(pair, 16));
        return "";
    });

    return new Uint8Array(bytes);
}

/**
 * Returns a random integer between 0 and max-1
 *
 * @param max - the (exclusive) max value to return
 * @returns a random integer between 0 and max-1
 */
function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Encodes a number value as real and returns the BER hex notation of it
 *
 * @param value - the value to encode
 * @returns the hex BER encoded value
 */
function encodeReal(value: number): string {
    const real = new asn1js.Real({value});
    const data = real.toBER();
    return buf2hex(data);
}

/**
 * Decodes a BER hex encoded number and returns the number value or undefined on failure
 *
 * @param value - the hex BER encoded value
 * @returns the number value or undefined on error
 */
function decodeReal(value: string): number | undefined {
    const data = hex2buf(value);
    const result = asn1js.fromBER(data);
    if(result.result instanceof asn1js.Real)
        return result.result.valueBlock.valueDec;
    return undefined;
}

context("Asn1Real implementation test", () => {
    it("decode asnreal -0.128 base 2, objective systems created", () => {
        const testValue = -0.128;
        const resultValue = decodeReal("0909c0cb04189374bc6a7f");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal 0.128 base 2, objective systems created", () => {
        const testValue = 0.128;
        const resultValue = decodeReal("090980cb04189374bc6a7f");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal -128 base 2, objective systems created", () => {
        const testValue = -128;
        const resultValue = decodeReal("0903c00701");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal 128 base 2, objective systems created", () => {
        const testValue = 128;
        const resultValue = decodeReal("0903800701");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal -129 base 2, objective systems created", () => {
        const testValue = -129;
        const resultValue = decodeReal("0903c00081");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal 129 base 2, objective systems created", () => {
        const testValue = 129;
        const resultValue = decodeReal("0903800081");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal 32639 base 2, objective systems created", () => {
        const testValue = 32639;
        const resultValue = decodeReal("090480007f7f");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });
    it("decode asnreal -32639 base 2, objective systems created", () => {
        const testValue = -32639;
        const resultValue = decodeReal("0904c0007f7f");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal 32640 base 2, objective systems created", () => {
        const testValue = 32640;
        const resultValue = decodeReal("09038007ff");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal -32640 base 2, objective systems created", () => {
        const testValue = -32640;
        const resultValue = decodeReal("0903c007ff");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal 9e+45 base 2, objective systems created", () => {
        const testValue = 9e45;
        const resultValue = decodeReal("09 09 80 65 0c 9c 97 77 25 e4 19");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal 9e-45 base 2, objective systems created", () => {
        const testValue = 9e-45;
        const resultValue = decodeReal("09 0a 81 ff 3d 01 9b 0c 1e 2d e5 81");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal -9e+45 base 2, objective systems created", () => {
        const testValue = -9e45;
        const resultValue = decodeReal("09 09 c0 65 0c 9c 97 77 25 e4 19");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal -9e-45 base 2, objective systems created", () => {
        const testValue = -9e-45;
        const resultValue = decodeReal("09 0a c1 ff 3d 01 9b 0c 1e 2d e5 81");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal +∞, objective systems created", () => {
        const testValue = Number.POSITIVE_INFINITY;
        const resultValue = decodeReal("09 01 40");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal -∞, objective systems created", () => {
        const testValue = Number.NEGATIVE_INFINITY;
        const resultValue = decodeReal("09 01 41");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("decode asnreal NaN, objective systems created", () => {
        const testValue = Number.NaN;
        const resultValue = decodeReal("09 01 42");
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });


    it("encode & decode asnreal 0.128 base 2", () => {
        const testValue = 0.128;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal -0.128 base 2", () => {
        const testValue = -0.128;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal 128 base 2", () => {
        const testValue = 128;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal -128 base 2", () => {
        const testValue = -128;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal 129 base 2", () => {
        const testValue = 129;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal -129 base 2", () => {
        const testValue = -129;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal 32639 base 2", () => {
        const testValue = 32639;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal -32639 base 2", () => {
        const testValue = -32639;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal 32640 base 2", () => {
        const testValue = 32640;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal -32640 base 2", () => {
        const testValue = -32640;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal 9e+45 base 2", () => {
        const testValue = 9e+45;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal -9e+45 base 2", () => {
        const testValue = -9e+45;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    it("encode & decode asnreal 9e-45 base 2", () => {
        const testValue = 9e-45;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });


    it("encode & decode asnreal -9e-45 base 2", () => {
        const testValue = -9e-45;
        const encoded = encodeReal(testValue);
        const resultValue = decodeReal(encoded);
        assert.equal(testValue, resultValue, "Result value does not match expected value");
    });

    /*
        it("encode & decode asnreal random 1.000.000 iterations", () => {
            for(let iCount = 0; iCount < 1000000; iCount++) {
                let testValue = getRandomInt(Number.MAX_SAFE_INTEGER);
                if(getRandomInt(2) === 0)
                    testValue *= -1;
                if(getRandomInt(2) === 0) {
                    const divider = getRandomInt(Number.MAX_SAFE_INTEGER);
                        testValue /= divider;
                }
                const encoded = encodeReal(testValue);
                const resultValue = decodeReal(encoded);
                if(iCount % 10000 == 0)
                    console.log(`${Math.round(iCount * 100 / 1000000)}% - ${testValue} => ${encoded}`);
                assert.equal(testValue, resultValue, `Result value ${resultValue} does not match expected value ${testValue}`);
            }
        });
    */
});
