import * as asn1js from "../src/asn1.js";

const fs = require("fs");
const  path = require("path");

const assert = require("assert");
//**************************************************************************************
context("ASN.1:2008 TestSuite Tests", () =>
{
	const testDir = `${__dirname}/../node_modules/asn1-test-suite/suite`;
	
	function getCorrectBuffer(content)
	{
		const arrayBuffer = new ArrayBuffer(content.length);
		const uint8Array = new Uint8Array(arrayBuffer);
		
		for(let i = 0; i < content.length; i++)
			uint8Array[i] = content[i];

		return arrayBuffer.slice(0);
	}
	
	it("Test Case #1", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc1.ber"))));

		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.idBlock.tagNumber, -1, "Tag number must be set to default value (-1)");
		assert.equal(asn1.result.idBlock.valueHex.byteLength, 10, "Hexadecimal representation of ID block must has 10 in length");
		assert.equal(asn1.result.idBlock.warnings.length, 1, "Should just one warning in ID block");
		assert.equal(asn1.result.idBlock.warnings[0], "Tag too long, represented as hex-coded", "Text of the warning in ID block does not match");
	});
	
	it("Test Case #2", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc2.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "End of input reached before message was fully decoded", "Error message does not match");
	});
	
	it("Test Case #3", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc3.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "Zero buffer length", "Error message does not match");
		assert.equal("error" in asn1.result.lenBlock, true, "Error information must exists inside ASN.1 length block");
		assert.equal(asn1.result.lenBlock.error, "Zero buffer length", "Error message inside length block does not match");
	});
	
	it("Test Case #4", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc4.ber"))));

		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "Length block 0xFF is reserved by standard", "Error message does not match");
		assert.equal("error" in asn1.result.lenBlock, true, "Error information must exists inside ASN.1 length block");
		assert.equal(asn1.result.lenBlock.error, "Length block 0xFF is reserved by standard", "Error message inside length block does not match");
	});
	
	it("Test Case #5", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc5.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.lenBlock.length, 1, "Length must be equal to 1");
		assert.equal(asn1.result.lenBlock.longFormUsed, true, "Long form of length encoding must be detected");
		assert.equal(asn1.result.lenBlock.warnings.length, 1, "Should just one warning in length block");
		assert.equal(asn1.result.lenBlock.warnings[0], "Unneccesary usage of long length form", "Text of the warning in length block does not match");
	});
	
	it("Test Case #6", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc6.ber"))));

		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #7", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc7.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #8", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc8.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #9", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc9.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #10", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc10.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #11", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc11.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #12", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc12.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #13", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc13.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #14", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc14.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #15", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc15.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #16", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc16.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #17", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc17.ber"))));
		
		// Tests for "REAL" type at the moment should just parse data
	});
	
	it("Test Case #18", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc18.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.valueBlock._valueDec, -4095, "Value block value must be equal to -4095");
		assert.equal(asn1.result.valueBlock.warnings.length, 1, "Should just one warning in value block");
		assert.equal(asn1.result.valueBlock.warnings[0], "Needlessly long format", "Text of the warning in length block does not match");
	});
	
	it("Test Case #19", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc19.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message inside value block does not match");
	});
	
	it("Test Case #20", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc20.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.valueBlock.isHexOnly, true, "Value block value must be \"hex only\"");
		assert.equal(asn1.result.valueBlock.warnings.length, 1, "Should just one warning in value block");
		assert.equal(asn1.result.valueBlock.warnings[0], "Too big Integer for decoding, hex only", "Text of the warning in length block does not match");
		assert.equal(asn1.result.valueBlock.valueHex.byteLength, 9, "Value block hex value must be 9 in length");
	});
	
	it("Test Case #21", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc21.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.valueBlock.value[0].warnings.length, 1, "Should just one warning in value block");
		assert.equal(asn1.result.valueBlock.value[0].warnings[0], "Needlessly long format of SID encoding", "Text of the warning in SID block does not match");
		assert.equal(asn1.result.valueBlock.value[0].valueDec, 81, "First SID block must has value 81");
		assert.equal(asn1.result.valueBlock.value[1].warnings.length, 1, "Should just one warning in value block");
		assert.equal(asn1.result.valueBlock.value[1].warnings[0], "Needlessly long format of SID encoding", "Text of the warning in SID block does not match");
		assert.equal(asn1.result.valueBlock.value[1].valueDec, 1, "First SID block must has value 1");
	});
	
	it("Test Case #22", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc22.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.valueBlock.value[0].warnings.length, 1, "Should just one warning in value block");
		assert.equal(asn1.result.valueBlock.value[0].warnings[0], "Too big SID for decoding, hex only", "Text of the warning in SID block does not match");
		assert.equal(asn1.result.valueBlock.value[0].valueHex.byteLength, 11, "Hex buffer for first SID value must be 11 in length");
		assert.equal(asn1.result.valueBlock.value[0].isHexOnly, true, "First SID value must be \"hex only\"");
	});
	
	it("Test Case #23", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc23.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message inside value block does not match");
	});
	
	it("Test Case #24", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc24.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
	});
	
	it("Test Case #25", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc25.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.valueBlock.warnings.length, 2, "Should just two warnings in value block");
		assert.equal(asn1.result.valueBlock.warnings[0], "Boolean value encoded in more then 1 octet", "Text of the warning value block does not match");
		assert.equal(asn1.result.valueBlock.warnings[1], "Needlessly long format", "Text of the warning value block does not match");
		assert.equal(asn1.result.valueBlock.value, false, "Boolean value must be \"false\"");
	});
	
	it("Test Case #26", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc26.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.valueBlock.warnings.length, 2, "Should just two warnings in value block");
		assert.equal(asn1.result.valueBlock.warnings[0], "Boolean value encoded in more then 1 octet", "Text of the warning value block does not match");
		assert.equal(asn1.result.valueBlock.warnings[1], "Needlessly long format", "Text of the warning value block does not match");
		assert.equal(asn1.result.valueBlock.value, true, "Boolean value must be \"true\"");
	});
	
	it("Test Case #27", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc27.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message inside value block does not match");
	});
	
	it("Test Case #28", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc28.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
		assert.equal(asn1.result.valueBlock.value, true, "Boolean value must be \"true\"");
	});
	
	it("Test Case #29", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc29.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
		assert.equal(asn1.result.valueBlock.value, false, "Boolean value must be \"false\"");
	});
	
	it("Test Case #30", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc30.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 1, "Should just one warning");
		assert.equal(asn1.result.warnings[0], "Non-zero length of value block for Null type", "Text of the warning does not match");
	});
	
	it("Test Case #31", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc31.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message does not match");
	});
	
	it("Test Case #32", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc32.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
	});
	
	it("Test Case #33", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc33.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "Unused bits for BitString must be in range 0-7", "Error message does not match");
	});
	
	it("Test Case #34", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc34.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message does not match");
	});
	
	it("Test Case #35", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc35.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "BIT STRING may consists of BIT STRINGs only", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "BIT STRING may consists of BIT STRINGs only", "Error message inside value block does not match");
	});
	
	it("Test Case #36", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc36.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "Usign of \"unused bits\" inside constructive BIT STRING allowed for least one only", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "Usign of \"unused bits\" inside constructive BIT STRING allowed for least one only", "Error message inside value block does not match");
	});
	
	it("Test Case #37", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc37.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
		assert.equal(asn1.result.valueBlock.isIndefiniteForm, false, "Form of encoding for value block must be \"indefinite = false\"");
	});
	
	it("Test Case #38", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc38.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
		assert.equal(asn1.result.valueBlock.isIndefiniteForm, true, "Form of encoding for value block must be \"indefinite\"");
	});
	
	it("Test Case #39", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc39.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
		assert.equal(asn1.result.idBlock.isConstructed, true, "Constructed form of encoding must be found");
		assert.equal(asn1.result.valueBlock.value.length, 0, "Encoding of empty BitString must be found");
	});
	
	it("Test Case #40", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc40.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
		assert.equal(asn1.result.idBlock.isConstructed, false, "Primitive form of encoding must be found");
		assert.equal(asn1.result.valueBlock.value.length, 0, "Encoding of empty BitString must be found");
	});
	
	it("Test Case #41", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc41.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "OCTET STRING may consists of OCTET STRINGs only", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "OCTET STRING may consists of OCTET STRINGs only", "Error message inside value block does not match");
	});
	
	it("Test Case #42", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc42.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message inside value block does not match");
		
		assert.equal(asn1.result.idBlock.isConstructed, true, "ID block must indicate constructed encoding");
		assert.equal(asn1.result.valueBlock.isConstructed, true, "Value block must indicate constructed encoding");
	});
	
	it("Test Case #43", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc43.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "End of input reached before message was fully decoded (inconsistent offset and length values)", "Error message inside value block does not match");
		
		assert.equal(asn1.result.idBlock.isConstructed, false, "ID block must indicate primitive encoding");
		assert.equal(asn1.result.valueBlock.isConstructed, false, "Value block must indicate primitive encoding");
	});
	
	it("Test Case #44", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc44.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
		assert.equal(asn1.result.idBlock.isConstructed, false, "Primitive form of encoding must be found");
		assert.equal(asn1.result.valueBlock.value.length, 0, "Encoding of empty OctetString must be found");
	});
	
	it("Test Case #45", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc45.ber"))));
		
		assert.notEqual(asn1.offset, -1, "Initial ASN.1 parsed unsuccessfully");
		assert.equal(asn1.result.warnings.length, 0, "Should be no warnings");
		assert.equal(asn1.result.error.length, 0, "Should be no errors");
		assert.equal(asn1.result.idBlock.isConstructed, true, "Constructive form of encoding must be found");
		assert.equal(asn1.result.valueBlock.value.length, 0, "Encoding of empty OctetString must be found");
	});
	
	it("Test Case #46", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc46.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "Indefinite length form used for primitive encoding form", "Error message does not match");
		assert.equal(asn1.result.lenBlock.isIndefiniteForm, true, "Length block must indicate \"indefinite\" form was using");
		assert.equal(asn1.result.idBlock.isConstructed, false, "ID block must indicate primitive encoding");
	});
	
	it("Test Case #47", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc47.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "EndOfContent is unexpected, BIT STRING may consists of BIT STRINGs only", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "EndOfContent is unexpected, BIT STRING may consists of BIT STRINGs only", "Error message inside value block does not match");
		
		assert.equal(asn1.result.valueBlock.value.length, 4, "Value block must have 4 values");
		assert.equal(asn1.result.valueBlock.value[1].constructor.blockName(), asn1js.EndOfContent.blockName(), "Second value in value block must be \"EndOfContent\"");
	});
	
	it("Test Case #48", () =>
	{
		const asn1 = asn1js.fromBER(getCorrectBuffer(fs.readFileSync(path.join(testDir, "tc48.ber"))));
		
		assert.equal(asn1.offset, -1, "Initial ASN.1 should be parsed with error");
		assert.equal("error" in asn1.result, true, "Error information must exists inside ASN.1 result");
		assert.equal(asn1.result.error, "Unused bits for BitString must be in range 0-7", "Error message does not match");
		assert.equal("error" in asn1.result.valueBlock, true, "Error information must exists inside ASN.1 value block");
		assert.equal(asn1.result.valueBlock.error, "Unused bits for BitString must be in range 0-7", "Error message inside value block does not match");
		
		assert.equal(asn1.result.idBlock.isConstructed, true, "ID block must indicate constructive encoding");
		assert.equal(asn1.result.valueBlock.value.length, 2, "Value block must have 2 values");
	});
});
//**************************************************************************************
