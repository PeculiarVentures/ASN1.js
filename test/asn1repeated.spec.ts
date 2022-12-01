/* eslint-disable @typescript-eslint/no-unused-vars */
import * as assert from "assert";
import * as asn1js from "../src";
import { SchemaContext } from "../src";
import { ILocalIdentificationBlockParams } from "../src/internals/LocalIdentificationBlock";
import { localFromBER } from "../src/parser";
import { ETagClass } from "../src/TypeStore";

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
 * Gets a repeated schema
 *
 * @param type - the type of object we want to get a repeated schema for
 * @returns the repeated schema
 */
function getRepeatedSchema(type: asn1js.AsnType, params: asn1js.RepeatedParams): asn1js.Repeated {
    return new asn1js.Repeated({
        ...params,
        value: type
    });
}

/**
 * Gets a repeated value
 *
 * @param type - the value we want to get a repeated sequence for
 * @returns the repeated schema
 */
function getRepeatedValue(type: asn1js.AsnType, params: asn1js.SequenceParams | undefined, amount: number): asn1js.Sequence {
    const seq = new asn1js.Sequence({
        ...params,
    });
    for (let iCount = 0; iCount < amount; iCount++) {
       seq.valueBlock.value.push(type);
    }
    return seq;
}

context("Asn1Repeated implementation tests", () => {
    it("validate a repeated simple against a matching schema", () => {
        const schema = getRepeatedSchema(new asn1js.Integer(), {name: "mandatory"});
        const seq = getRepeatedValue(new asn1js.Integer({value: 1}), undefined, 2);
        const data = seq.toBER();
        const result = asn1js.verifySchema(data, schema);
        assert.equal(result.verified, true, "Schema verification failed");
        if (result.verified) {
            const sequence = result.result;
            if(!asn1js.Sequence.typeGuard(sequence)) {
                assert("Result is not a sequence");
                return;
            }
            assert.equal(sequence?.name, "mandatory", "failed");
            assert.equal(sequence?.valueBlock.value.length, 2, "failed");
        }
    });
    it("validate a sequenced repeated values against a matching schema with optional repeated values 1", () => {
        const schema = new asn1js.Sequence({
            name: "testseq",
            value: [
                new asn1js.Utf8String({name: "string", value: "s1"}),
                new asn1js.Integer({name: "integer", value: 1}),
                getRepeatedSchema(new asn1js.Utf8String(), {name:"optional1", idBlock: {optionalID: 0}}),
                getRepeatedSchema(new asn1js.Integer(), {name:"optional2", idBlock: {optionalID: 1}}),
            ]
        });
        const seq = new asn1js.Sequence({
            value: [
                new asn1js.Utf8String({value: "s1"}),
                new asn1js.Integer({value: 1}),
                getRepeatedValue(new asn1js.Utf8String({value:"string"}), {idBlock: { optionalID: 0}}, 2),
                getRepeatedValue(new asn1js.Integer({value:1}), {idBlock: { optionalID: 1}}, 1)
            ]
        });
        const data = seq.toBER();
        const result = asn1js.verifySchema(data, schema);
        if (result.verified) {
            assert.equal(result.result.name, "testseq", "failed");
            const value1 = result.result.getTypedValueByName(asn1js.Utf8String, "string");
            assert.equal(value1.valueBlock.value, "s1", "failed");
            const value2 = result.result.getTypedValueByName(asn1js.Integer, "integer");
            assert.equal(value2.valueBlock.value, 1, "failed");
            const optional1 = result.result.getTypedValueByName(asn1js.Sequence, "optional1");
            assert.equal(optional1.valueBlock.value.length, 2, "failed");
            const optional2 = result.result.getTypedValueByName(asn1js.Sequence, "optional2");
            assert.equal(optional2.valueBlock.value.length, 1, "failed");
        }
    });

    it("validate a sequenced repeated values against a matching schema with optional repeated values 2", () => {
        const schema = new asn1js.Sequence({
            name: "testseq",
            value: [
                new asn1js.Utf8String({name: "string", value: "s1"}),
                new asn1js.Integer({name: "integer", value: 1}),
                getRepeatedSchema(new asn1js.Utf8String(), {name:"optional1", idBlock: {optionalID: 0}}),
                getRepeatedSchema(new asn1js.Integer(), {name:"optional2", idBlock: {optionalID: 1}}),
            ]
        });
        const seq = new asn1js.Sequence({
            value: [
                new asn1js.Utf8String({value: "s1"}),
                new asn1js.Integer({value: 1}),
                getRepeatedValue(new asn1js.Integer({value:1}), {idBlock: { optionalID: 0}}, 1)
            ]
        });
        const data = seq.toBER();
        const result = asn1js.verifySchema(data, schema);
        if (result.verified) {
            assert.equal(result.result.name, "testseq", "failed");
            const value1 = result.result.getTypedValueByName(asn1js.Utf8String, "string");
            assert.equal(value1.valueBlock.value, "s1", "failed");
            const value2 = result.result.getTypedValueByName(asn1js.Integer, "integer");
            assert.equal(value2.valueBlock.value, 1, "failed");
            const optional1 = result.result.getTypedValueByName(asn1js.Sequence, "optional1");
            assert.equal(optional1, undefined, "failed");
            const optional2 = result.result.getTypedValueByName(asn1js.Sequence, "optional2");
            assert.equal(optional2.valueBlock.value.length, 1, "failed");
        }
    });

});
