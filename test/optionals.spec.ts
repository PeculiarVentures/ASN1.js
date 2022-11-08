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

function buf2numbers(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)]
		.map(x => x.toString())
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
 * @param value0 - an optional paramter to embed into the sequence
 * @param value1 - an optional paramter to embed into the sequence
 * @param value2 - an optional paramter to embed into the sequence
 * @returns the asn1 sequence object
 */
function getSequence(getschema: boolean, value0?: string, value1?: number, value2?: boolean): asn1js.Sequence {
    const seq = new asn1js.Sequence({
        value: [
            new asn1js.Utf8String({name: "string", value: "string"}),
            new asn1js.Boolean({name: "mytest", value: true}),
        ]
    });

    const value = seq.valueBlock.value;
    if (getschema || value0 !== undefined)
        value.push(new asn1js.Utf8String({name: "optional0", value: value0, idBlock: {optionalID: 0}}));
    if (getschema || value1 !== undefined)
        value.push(new asn1js.Integer({name: "optional1", value: value1, idBlock: {optionalID: 1}}));
    if (getschema || value2 !== undefined)
        value.push(new asn1js.Boolean({name: "optional2", value: value2, idBlock: {optionalID: 2}}));
    return seq;
}

// optional2 = true;
const optional2Set = "30 0e 0c 06 73 74 72 69 6e 67 01 01 ff 82 01 ff";
// optional0 = "value1";
// optional1 = 2;
// optional2 = false;
const allOptionalsSet = "30 19 0c 06 73 74 72 69 6e 67 01 01 ff 80 06 76 61 6c 75 65 31 81 01 02 82 01 00";

context("Optional parameter test", () => {
    it ("encode sequence with one optional parameter set", () => {
        const seq = getSequence(false, undefined, undefined, true);
        const data = seq.toBER();
        const hex = buf2hex(data);
        assert.equal(hex, optional2Set);
    });

    it ("encode sequence with all optional parameters set", () => {
        const seq = getSequence(false, "value1", 2, false);
        const data = seq.toBER();
        const hex = buf2hex(data);
        assert.equal(hex, allOptionalsSet);
    });

/*
    it ("decode sequence with one optional set", () => {
        const buf = hex2buf(optional2Set);
        const schema = getSequence(true);
        const result = asn1js.verifySchema(buf, schema);
        assert.ok(result.verified, "Could not verify encoded data with schema");
        const res2 = result.result.getTypedValueByName(asn1js.Boolean, "optional2");
        assert.notEqual(res2, undefined, "Result undefined");
        if(res2)
            assert.equal(res2.getValue(), true, "Result not true");
    });
*/

    it ("decode sequence with all optionals set", () => {
        const buf = hex2buf(allOptionalsSet);
        const schema = getSequence(true);
        const result = asn1js.verifySchema(buf, schema);
        assert.ok(result.verified, "Could not verify encoded data with schema");
        const res0 = result.result.getTypedValueByName(asn1js.Utf8String, "optional0");
        const res1 = result.result.getTypedValueByName(asn1js.Integer, "optional1");
        const res2 = result.result.getTypedValueByName(asn1js.Boolean, "optional2");
        assert.notEqual(res0, undefined, "Result0 undefined");
        assert.notEqual(res1, undefined, "Result1 undefined");
        assert.notEqual(res2, undefined, "Result2 undefined");
        if (res0)
            assert.equal(res0.getValue(), "value1", "Result0 invalid result value");
        if (res1)
            assert.equal(res1.getValue(), 2, "Result1 invalid result value");
        if (res2)
            assert.equal(res2.getValue(), false, "Result2 invalid result value");
    });

    it ("access existing optional property by name", () => {
        const buf = hex2buf(optional2Set);
        const schema = getSequence(true);
        const result = asn1js.verifySchema(buf, schema);
        assert.ok(result.verified, "Could not verify encoded data with schema");
        const obj = result.result.getValueByName("optional2");
        assert.ok(obj !== undefined, "Object not found");
    });

    it ("access existing optional property by name and type", () => {
        const buf = hex2buf(optional2Set);
        const schema = getSequence(true);
        const result = asn1js.verifySchema(buf, schema);
        assert.ok(result.verified, "Could not verify encoded data with schema");
        const obj = result.result.getTypedValueByName(asn1js.Boolean, "optional2");
        assert.ok(obj !== undefined, "Object not found");
        if (obj)
            assert.equal(obj.getValue(), true, "Property not true");
    });

    it ("access not existing optional property by name", () => {
        const buf = hex2buf(optional2Set);
        const schema = getSequence(true);
        const result = asn1js.verifySchema(buf, schema);
        assert.ok(result.verified, "Could not verify encoded data with schema");
        const obj = result.result.getValueByName("optional1");
        assert.equal(obj, undefined, "Object not undefined");
    });

    it ("access not existing optional property by name and type by wrong name", () => {
        const buf = hex2buf(optional2Set);
        const schema = getSequence(true);
        const result = asn1js.verifySchema(buf, schema);
        assert.ok(result.verified, "Could not verify encoded data with schema");
        const obj = result.result.getTypedValueByName(asn1js.Boolean, "optional1");
        assert.equal(obj, undefined, "Object not undefined");
    });

    it ("access not existing optional property by name and type by wrong type", () => {
        const buf = hex2buf(optional2Set);
        const schema = getSequence(true);
        const result = asn1js.verifySchema(buf, schema);
        assert.ok(result.verified, "Could not verify encoded data with schema");
        const obj = result.result.getTypedValueByName(asn1js.Utf8String, "optional2");
        assert.equal(obj, undefined, "Object not undefined");
    });
});

