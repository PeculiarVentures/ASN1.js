/* eslint-disable @typescript-eslint/no-unused-vars */
import * as assert from "assert";
import * as asn1js from "../src";
import { SchemaContext } from "../src";
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

    it("test choice on root level (using a constructed item that embeds the choice)", () => {
        // All choices would match the asn1 type but the type exposed the optional context-specific
        // Thus the context needs to be found by id and not by matching schema
        const schema = new asn1js.Constructed({
            name: "constructed",
            idBlock: {
                tagClass: ETagClass.CONTEXT_SPECIFIC,
            },
            value: [new asn1js.Choice({
                value: [
                    new asn1js.Sequence({name: "first",
                         idBlock: {optionalID: 1},
                         value: [
                            new asn1js.Utf8String({name: "first"}),
                            new asn1js.Boolean({name: "first", optional: true})
                        ]
                    }),
                    new asn1js.Sequence({name: "second",
                         idBlock: {optionalID: 2},
                         value: [
                            new asn1js.Utf8String({name: "second"}),
                            new asn1js.Integer({name: "second", optional: true})
                        ]
                    }),
                    new asn1js.Sequence({name: "third",
                         idBlock: {optionalID: 3},
                         value: [
                            new asn1js.Utf8String({name: "third"}),
                            new asn1js.Utf8String({name: "third", optional: true})
                        ]
                    }),
                ]
            })]
        });
        const seq = new asn1js.Constructed({
            name: "constructed",
            idBlock: {
                tagClass: ETagClass.CONTEXT_SPECIFIC,
                tagNumber: 2,
            },
            value: [
                new asn1js.Utf8String({value: "teststring"})
            ]
        });
        const data = seq.toBER();
        const hex = buf2hex(data);

        const context = new SchemaContext();
        context.debug = true;

        const result = asn1js.verifySchema(data, schema, undefined, context);
        assert.equal(result.verified, true, "Schema verification failed");
        if (result.verified) {
            assert.equal(result.result.name, "second", "Choice option not found");
            const utf8 = result.result.getTypedValueByName(asn1js.Utf8String, "second");
            assert.ok(utf8, "Sequence value not found");
            assert.equal(utf8.getValue(), "teststring", "Wrong value found");
        }
    });


});
