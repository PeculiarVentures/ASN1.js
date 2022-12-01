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
 * Get a sequence with optional parameters
 *
 * @param getschema - true to get the schema for the verification
 * @param value0 - an optional paramter to embed into the sequence
 * @param value1 - an optional paramter to embed into the sequence
 * @param value2 - an optional paramter to embed into the sequence
 * @param brokensorted - to test invalid sorted optional values
 * @returns the asn1 sequence object
 */
function getSequence(getschema: boolean, value0?: string, value1?: number, value2?: boolean, brokensorted?: boolean): asn1js.Sequence {
    const seq = new asn1js.Sequence({
        value: [
            new asn1js.Utf8String({name: "string", ...(!getschema && { value: "string"}) }),
            new asn1js.Boolean({name: "mytest", ...(!getschema && { value: true}) }),
        ]
    });

    const value = seq.valueBlock.value;
    if(brokensorted) {
        if (getschema || value0 !== undefined)
            value.push(new asn1js.Utf8String({name: "optional0", ...(!getschema && { value: value0 }), idBlock: {optionalID: 0}}));
        if (getschema || value2 !== undefined)
            value.push(new asn1js.Boolean({name: "optional2", ...(!getschema && { value: value2 }), idBlock: {optionalID: 2}}));
        if (getschema || value1 !== undefined)
            value.push(new asn1js.Integer({name: "optional1", ...(!getschema && { value: value1 }), idBlock: {optionalID: 1}}));
    } else {
        if (getschema || value0 !== undefined)
            value.push(new asn1js.Utf8String({name: "optional0", ...(!getschema && { value: value0 }), idBlock: {optionalID: 0}}));
        if (getschema || value1 !== undefined)
            value.push(new asn1js.Integer({name: "optional1", ...(!getschema && { value: value1 }), idBlock: {optionalID: 1}}));
        if (getschema || value2 !== undefined)
            value.push(new asn1js.Boolean({name: "optional2", ...(!getschema && { value: value2 }), idBlock: {optionalID: 2}}));
    }
    return seq;
}

/**
 * Gets a large sequence with different optional parameters
 *
 * Loops a value from 0 to maximum
 *
 * value%3 == 0 -> asn1js.boolean { value: value%2 ? true : false }
 * value%3 == 1 -> asn1js.Integer { value: value}
 * value%3 == 2 -> asn1js.Utf8String { value: `${value}`}
 */
function getLargeSequence(getschema: boolean, maxium: number): asn1js.Sequence {
        const seq = new asn1js.Sequence({
            value: [
                new asn1js.Utf8String({name: "string", ...(!getschema && { value: "string"}) }),
                new asn1js.Boolean({name: "mytest", ...(!getschema && { value: true}) }),
            ]
        });
        for(let value = 0; value < maxium; value++) {
            const mode = value % 3;
            if (mode === 0)
                seq.valueBlock.value.push(new asn1js.Boolean({name: `optional_${value}`, ...(!getschema && { value: value % 2 ? true : false }), idBlock: {optionalID: value}}));
            else if (mode === 1)
                seq.valueBlock.value.push(new asn1js.Integer({name: `optional_${value}`, ...(!getschema && { value: value }), idBlock: {optionalID: value}}));
            else if (mode === 2)
                seq.valueBlock.value.push(new asn1js.Utf8String({name: `optional_${value}`, ...(!getschema && { value: `${value}` }), idBlock: {optionalID: value}}));
        }
        return seq;
}

// optional2 = true;
const optional2Set = "30 0e 0c 06 73 74 72 69 6e 67 01 01 ff 82 01 ff";
// optional0 = "value1";
// optional1 = 2;
// optional2 = false;
const allOptionalsSet = "30 19 0c 06 73 74 72 69 6e 67 01 01 ff 80 06 76 61 6c 75 65 31 81 01 02 82 01 00";
// Loop value from 0 to 39 (modulo%3 defines Boolean value%2 ? true : false, Integer value, UTF8String "value")
const multipleOptionalsSet = "30 81 96 0c 06 73 74 72 69 6e 67 01 01 ff 80 01 00 81 01 01 82 01 32 83 01 ff 84 01 04 85 01 35 86 01 00 87 01 07 88 01 38 89 01 ff 8a 01 0a 8b 02 31 31 8c 01 00 8d 01 0d 8e 02 31 34 8f 01 ff 90 01 10 91 02 31 37 92 01 00 93 01 13 94 02 32 30 95 01 ff 96 01 16 97 02 32 33 98 01 00 99 01 19 9a 02 32 36 9b 01 ff 9c 01 1c 9d 02 32 39 9e 01 00 9f 1f 01 1f 9f 20 02 33 32 9f 21 01 ff 9f 22 01 22 9f 23 02 33 35 9f 24 01 00 9f 25 01 25 9f 26 02 33 38 9f 27 01 ff";

context("Optional parameter implementation tests", () => {
    it ("encode sequence with one optional parameter set", () => {
        const seq = getSequence(false, undefined, undefined, true);
        const data = seq.toBER();
        const hex = buf2hex(data);
        assert.equal(hex, optional2Set);
    });

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

    it ("encode sequence with all optional parameters set", () => {
        const seq = getSequence(false, "value1", 2, false);
        const data = seq.toBER();
        const hex = buf2hex(data);
        assert.equal(hex, allOptionalsSet);
    });

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

    it ("encode a sequence with optional parameters > 31 (multiple tag number fields)", () => {
        const seq = getLargeSequence(false, 40);
        const data = seq.toBER();
        const hex = buf2hex(data);
        assert.equal(hex, multipleOptionalsSet);
    });

    it ("decode a sequence with optional parameters > 31 (multiple tag number fields)", () => {
        const buf = hex2buf(multipleOptionalsSet);
        const schema = getLargeSequence(true, 40);
        const result = asn1js.verifySchema(buf, schema);
        assert.ok(result.verified, "Could not verify encoded data with schema");
        for(let value = 0; value < 40; value++) {
            const mode = value % 3;
            if (mode === 0) {
                const property = result.result.getTypedValueByName(asn1js.Boolean, `optional_${value}`);
                assert.notEqual(property, undefined, "Missing value in result");
                if (property)
                    assert.equal(property.getValue(), value % 2 ? true : false, "Value did not match the expected");
            } else if (mode === 1) {
                const property = result.result.getTypedValueByName(asn1js.Integer, `optional_${value}`);
                assert.notEqual(property, undefined, "Missing value in result");
                if (property)
                    assert.equal(property.getValue(), value, "Value did not match the expected");
              //  value.push(new asn1js.Integer({name: `optional_${iOptional}`, ...(!getschema && { value: iOptional }), idBlock: {optionalID: iOptional}}));
            }else if (mode === 2) {
                const property = result.result.getTypedValueByName(asn1js.Utf8String, `optional_${value}`);
                assert.notEqual(property, undefined, "Missing value in result");
                if (property)
                    assert.equal(property.getValue(), `${value}`, "Value did not match the expected");
            }
        }
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


    it ("not ordered optionals in schema", () => {
        const schema = getSequence(true, undefined, undefined, undefined, true);
        const data = getSequence(false, "string", 1, true, false);
        const encoded = data.toBER();
        const result = asn1js.verifySchema(encoded, schema);
        assert.ok(result.verified, "Could not verify encoded data with schema");
        const obj1 = result.result.getTypedValueByName(asn1js.Utf8String, "optional0");
        const obj2 = result.result.getTypedValueByName(asn1js.Integer, "optional1");
        const obj3 = result.result.getTypedValueByName(asn1js.Boolean, "optional2");
        assert.notEqual(obj1, undefined, "Object not undefined");
        if(obj1)
            assert.equal(obj1.getValue(), "string", "wrong value");
        assert.notEqual(obj2, undefined, "Object not undefined");
        if(obj2)
            assert.equal(obj2.getValue(), 1, "wrong value");
        assert.notEqual(obj3, undefined, "Object not undefined");
        if(obj3)
            assert.equal(obj3.getValue(), true, "wrong value");
    });
});

