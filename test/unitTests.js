import * as asn1js from "../src/asn1.js";

const assert = require("assert");
//**************************************************************************************
context("Unit tests", () =>
{
	it("LocalBaseBlock", () =>
	{
		const baseBlock = new asn1js.BaseBlock({
			blockLength: 10,
			error: "error",
			warnings: ["warning 1", "warning 2"],
			valueBeforeDecode: (new Uint8Array([0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01]).buffer),
			name: "name",
			optional: true,
			primitiveSchema: new asn1js.OctetString(),
			idBlock: {
				isHexOnly: false,
				valueHex: (new Uint8Array([0x01])).buffer,
				tagClass: 1,
				tagNumber: 1,
				isConstructed: false
			},
			lenBlock: {
				isIndefiniteForm: false,
				longFormUsed: false,
				length: 10
			}
		});
		
		assert.equal(baseBlock.blockLength, 10, "Incorrect value for blockLength");
		assert.equal(baseBlock.error, "error", "Incorrect value for error");
		assert.equal(baseBlock.warnings.length, 2, "Incorrect value for warnings");
		assert.equal(baseBlock.valueBeforeDecode.byteLength, 10, "Incorrect value for valueBeforeDecode");
		assert.equal(baseBlock.constructor.blockName(), "BaseBlock", "Incorrect value for blockName");
		
		const parseFunction = (key, value) =>
		{
			switch(key)
			{
				case "valueHex":
				case "valueBeforeDecode":
					const matches = value.match(/[\da-f]{2}/gi);
					if(matches === null)
						return new ArrayBuffer(0);
					
					return (new Uint8Array(matches.map(hex => parseInt(hex, 16)))).buffer;
				default:
					return value;
			}
		};
		
		const string = JSON.stringify(baseBlock);
		const object = JSON.parse(string, parseFunction);

		const secondaryBaseBlock = new asn1js.BaseBlock(object);
		
		const octetString = new asn1js.OctetString({ valueHex: (new Uint8Array([0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01])).buffer });
		
		const secondaryOctetString = new asn1js.OctetString(JSON.parse(JSON.stringify(octetString), parseFunction))
	});
});
//**************************************************************************************
