/* eslint-disable @typescript-eslint/no-unused-vars */
import * as assert from "assert";
import { isFunction } from "util";
import { Utf8String } from "../build";
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
 * Get a sequence with optional parameters
 *
 * @param getschema - true to get the schema for the verification
 * @param bAddString - true to set the string to the choice
 * @param bAddBoolean - true to set the boolean to the choice
 * @param bAddInteger - true to set the integer to the choice
 * @returns an asn1 sequence object containing the choice
 */
function getChoice(getschema: boolean, bAddString: boolean, bAddBoolean: boolean, bAddInteger: boolean): asn1js.Sequence {

    if(getschema) {
        const choice = new asn1js.Choice({name: "choice"});
        if (bAddString)
            choice.value.push(new asn1js.Utf8String());
        if (bAddBoolean)
            choice.value.push(new asn1js.Boolean());
        if (bAddInteger)
            choice.value.push(new asn1js.Integer());
        const seq = new asn1js.Sequence({
            name: "base",
            value: [choice]
        });
        return seq;
    } else {
        const seq = new asn1js.Sequence({
            name: "base"
        });
        if (bAddString)
            seq.valueBlock.value.push(new asn1js.Utf8String({value: "optionalstring" }));
        if (bAddBoolean)
            seq.valueBlock.value.push(new asn1js.Boolean({value: true }));
        if (bAddInteger)
            seq.valueBlock.value.push(new asn1js.Integer({value: 1 }));
        return seq;
    }
}


context("Asn1Choice implementation tests", () => {
    it("validate a sequence against a matching schema", () => {
        const seq = getChoice(false, true, false, false);
        const data = seq.toBER();
        const schema = getChoice(true, true, true, true);
        const result = asn1js.verifySchema(data, schema);
        assert.ok(result.verified, "Schema verification failed");
        const value = result.result.getTypedValueByName(asn1js.Utf8String, "choice");
        assert.ok(value, "Property not found");
        assert.equal(value.getValue(), "optionalstring");
    });

    it("validate a sequence against a non matching choice", () => {
        const seq = getChoice(false, true, false, false);
        const data = seq.toBER();
        const schema = getChoice(true, false, true, true);
        const result = asn1js.verifySchema(data, schema);
        assert.equal(result.verified, false, "Schema verification succeede but should have failed");
        if(result.verified === false) {
            assert.equal(result.errors?.length, 1, "Error array did not contain the proper amount of errors");
            if(result.errors) {
                assert.equal(result.errors[0].context, "base:choice", "Wrong context");
                assert.equal(result.errors[0].error, 17, "Wrong error value");
            }
        }
    });
});
