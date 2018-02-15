/*
 * Copyright (c) 2014, GMO GlobalSign
 * Copyright (c) 2015-2018, Peculiar Ventures
 * All rights reserved.
 *
 * Author 2014-2018, Yury Strozhevsky <www.strozhevsky.com>.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, 
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, 
 *    this list of conditions and the following disclaimer in the documentation 
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors 
 *    may be used to endorse or promote products derived from this software without 
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR 
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY 
 * OF SUCH DAMAGE. 
 *
 */
//**************************************************************************************
import * as asn1js from "../../src/asn1";
//**************************************************************************************
function test()
{
    //region How to create new ASN. structures 
    let sequence = new asn1js.Sequence();
    sequence.valueBlock.value.push(new asn1js.Integer({ value: 1 }));

    let sequence_buffer = sequence.toBER(false); // Encode current sequence to BER (in ArrayBuffer)
    let current_size = sequence_buffer.byteLength;

    let integer_data = new ArrayBuffer(8);
    let integer_view = new Uint8Array(integer_data);
    integer_view[0] = 0x01;
    integer_view[1] = 0x01;
    integer_view[2] = 0x01;
    integer_view[3] = 0x01;
    integer_view[4] = 0x01;
    integer_view[5] = 0x01;
    integer_view[6] = 0x01;
    integer_view[7] = 0x01;

    sequence.valueBlock.value.push(new asn1js.Integer({
        isHexOnly: true,
        valueHex: integer_data
    })); // Put too long for decoding Integer value

    sequence_buffer = sequence.toBER(false);
    current_size = sequence_buffer.byteLength;
    //endregion 

    //region How to create new ASN.1 structures by calling constuctors with parameters 
    let sequence2 = new asn1js.Sequence({
        value: [
            new asn1js.Integer({ value: 1 }),
            new asn1js.Integer({
                isHexOnly: true,
                valueHex: integer_data
            }),
        ]
    });
    //endregion 

    //region How to check that decoded value is too big 
    let big_integer_value;

    let big_integer = new asn1js.Integer({
        isHexOnly: true,
        valueHex: integer_data
    });

    if(big_integer.valueBlock.isHexOnly === false)
        big_integer_value = big_integer.valueBlock.valueDec; // Native integer value
    else
        big_integer_value = big_integer.valueBlock.valueHex; // ArrayBuffer
    //endregion 

    //region How to get ASN.1 structures from raw data (ASN.1 decoding)
    let encoded_sequence = new ArrayBuffer(4);
    let encoded_sequence_view = new Uint8Array(encoded_sequence);
    encoded_sequence_view[0] = 0x30;
    encoded_sequence_view[1] = 0x02;
    encoded_sequence_view[2] = 0x05;
    encoded_sequence_view[3] = 0x00;

    let decoded_asn1 = asn1js.fromBER(encoded_sequence);
    if(decoded_asn1.offset === (-1))
        return; // Error during decoding

    let decoded_sequence = decoded_asn1.result;

    let internal_value = decoded_sequence.valueBlock.value[0];
    let internal_value_tagNumber = internal_value.idBlock.tagNumber; // Value of "5" equal to ASN.1 Null type
    //endregion 

    //region How to work with ASN.1 strings 
    let bmp_string_encoded = new ArrayBuffer(16); // This ArrayBuffer consinsts of encoded ASN.1 BMPString with "abc_" + three first chars from Russian alphabet
    let bmp_string_view = new Uint8Array(bmp_string_encoded);
    bmp_string_view[0] = 0x1E;
    bmp_string_view[1] = 0x0E;
    bmp_string_view[2] = 0x00;
    bmp_string_view[3] = 0x61;
    bmp_string_view[4] = 0x00;
    bmp_string_view[5] = 0x62;
    bmp_string_view[6] = 0x00;
    bmp_string_view[7] = 0x63;
    bmp_string_view[8] = 0x00;
    bmp_string_view[9] = 0x5F;
    bmp_string_view[10] = 0x04;
    bmp_string_view[11] = 0x30;
    bmp_string_view[12] = 0x04;
    bmp_string_view[13] = 0x31;
    bmp_string_view[14] = 0x04;
    bmp_string_view[15] = 0x32;

    let bmp_string_decoded = asn1js.fromBER(bmp_string_encoded);
    if(bmp_string_decoded.offset === (-1))
        return; // Error during decoding

    let javascript_string1 = bmp_string_decoded.result.valueBlock.value;

    let bmp_string = new asn1js.BmpString({ value: "abc_абв" }); // Same with initialization by static JavaScript string
    let javascript_string2 = bmp_string.valueBlock.value;
    //endregion 

    //region How to validate ASN.1 against pre-defined schema 
    let asn1_schema = new asn1js.Sequence({
        name: "block1",
        value: [
            new asn1js.Null({
                name: "block2"
            }),
            new asn1js.Integer({
                name: "block3",
                optional: true // This block is absent inside data, but it's "optional". Hence verification against the schema will be passed.
            })
        ]
    });

    let variant1 = asn1js.verifySchema(encoded_sequence, asn1_schema); // Verify schema together with decoding of raw data
    let variant1_verified = variant1.verified;
    let variant1_result = variant1.result; // Verified decoded data with all block names inside

    let variant1_block1 = variant1_result.block1;
    let variant1_block2 = variant1_result.block2;

    let variant2 = asn1js.compareSchema(decoded_sequence, decoded_sequence, asn1_schema); // Compare already decoded ASN.1 against pre-defined schema
    let variant2_verified = variant2.verified;
    let variant2_result = variant2.result; // Verified decoded data with all block names inside

    let variant2_block1 = variant2_result.block1;
    let variant2_block2 = variant2_result.block2;

    let asn1_schema_any = new asn1js.Sequence({
        name: "block1",
        value: [
            new asn1js.Any({ // Special type, for ASN.1 schemas only - will validate schema against any ASN.1 type
                name: "block2"
            })
        ]
    });

    decoded_sequence = asn1js.fromBER(encoded_sequence).result; // Re-setting "decoded_sequence"

    let variant3 = asn1js.compareSchema(decoded_sequence, decoded_sequence, asn1_schema_any);
    let variant3_verified = variant3.verified;

    let asn1_schema_repeated = new asn1js.Sequence({
        name: "block1",
        value: [
            new asn1js.Repeated({ // Special type, for ASN.1 schemas only - will check that inside decoded data there are sequence of values with one type only
                name: "block2_array",
                value: new asn1js.Null()
            })
        ]
    });

    decoded_sequence = asn1js.fromBER(encoded_sequence).result; // Re-setting "decoded_sequence"

    let variant4 = asn1js.compareSchema(decoded_sequence, decoded_sequence, asn1_schema_repeated);
    let variant4_verified = variant4.verified;

    let variant4_array = variant4.block2_array; // Array of internal blocks

    let asn1_schema_choice = new asn1js.Sequence({
        name: "block1",
        value: [
            new asn1js.Choice({ // Special type, for ASN.1 schemas only - will check ASN.1 data has one of type
                value: [
                    new asn1js.Null({
                        name: "block2"
                    }),
                    new asn1js.Integer({
                        name: "block2"
                    }),
                ]
            })
        ]
    });

    decoded_sequence = asn1js.fromBER(encoded_sequence).result; // Re-setting "decoded_sequence"

    let variant5 = asn1js.compareSchema(decoded_sequence, decoded_sequence, asn1_schema_choice);
    let variant5_verified = variant4.verified;
    //endregion 

    //region How to use "internal schemas" for primitevely encoded data types 
    let primitive_octetstring = new asn1js.OctetString({ valueHex: encoded_sequence }); // Create a primitively encoded OctetString where internal data is an encoded Sequence

    let asn1_schema_internal = new asn1js.OctetString({
        name: "outer_block",
        primitiveSchema: new asn1js.Sequence({
            name: "block1",
            value: [
                    new asn1js.Null({
                        name: "block2"
                    })
            ]
        })
    });

    let variant6 = asn1js.compareSchema(primitive_octetstring, primitive_octetstring, asn1_schema_internal);
    let variant6_verified = variant4.verified;
    let variant6_block1_tag_num = variant6.result.block1.idBlock.tagNumber;
    let variant6_block2_tag_num = variant6.result.block2.idBlock.tagNumber;
    //endregion 
}
//**************************************************************************************
context("Hack for Rollup.js", () =>
{
	return;

	test();
	setEngine();
});
//*********************************************************************************
context("ASN1js usage", () =>
{
	it("ASN1js usage", () =>
	{
		test();
	});
});
//*********************************************************************************
