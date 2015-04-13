/*
 * Copyright (c) 2014, GMO GlobalSign
 * Copyright (c) 2015, Peculiar Ventures
 * All rights reserved.
 *
 * Author 2014-2015, Yury Strozhevsky <www.strozhevsky.com>.
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
function test()
{
    // #region How to create new ASN. structures 
    var sequence = new org.pkijs.asn1.SEQUENCE();
    sequence.value_block.value.push(new org.pkijs.asn1.INTEGER({ value: 1 }));

    var sequence_buffer = sequence.toBER(false); // Encode current sequence to BER (in ArrayBuffer)
    var current_size = sequence_buffer.byteLength;

    var integer_data = new ArrayBuffer(8);
    var integer_view = new Uint8Array(integer_data);
    integer_view[0] = 0x01;
    integer_view[1] = 0x01;
    integer_view[2] = 0x01;
    integer_view[3] = 0x01;
    integer_view[4] = 0x01;
    integer_view[5] = 0x01;
    integer_view[6] = 0x01;
    integer_view[7] = 0x01;

    sequence.value_block.value.push(new org.pkijs.asn1.INTEGER({
        is_hex_only: true,
        value_hex: integer_data
    })); // Put too long for decoding INTEGER value

    sequence_buffer = sequence.toBER(false);
    current_size = sequence_buffer.byteLength;
    // #endregion 

    // #region How to create new ASN.1 structures by calling constuctors with parameters 
    var sequence2 = new org.pkijs.asn1.SEQUENCE({
        value: [
            new org.pkijs.asn1.INTEGER({ value: 1 }),
            new org.pkijs.asn1.INTEGER({
                is_hex_only: true,
                value_hex: integer_data
            }),
        ]
    });
    // #endregion 

    // #region How to check that decoded value is too big 
    var big_integer_value;

    var big_integer = new org.pkijs.asn1.INTEGER({
        is_hex_only: true,
        value_hex: integer_data
    });

    if(big_integer.value_block.is_hex_only === false)
        big_integer_value = big_integer.value_block.value_dec; // Native integer value
    else
        big_integer_value = big_integer.value_block.value_hex; // ArrayBuffer
    // #endregion 

    // #region How to get ASN.1 structures from raw data (ASN.1 decoding)
    var encoded_sequence = new ArrayBuffer(4);
    var encoded_sequence_view = new Uint8Array(encoded_sequence);
    encoded_sequence_view[0] = 0x30;
    encoded_sequence_view[1] = 0x02;
    encoded_sequence_view[2] = 0x05;
    encoded_sequence_view[3] = 0x00;

    var decoded_asn1 = org.pkijs.fromBER(encoded_sequence);
    if(decoded_asn1.offset === (-1))
        return; // Error during decoding

    var decoded_sequence = decoded_asn1.result;

    var internal_value = decoded_sequence.value_block.value[0];
    var internal_value_tag_number = internal_value.id_block.tag_number; // Value of "5" equal to ASN.1 NULL type
    // #endregion 

    // #region How to work with ASN.1 strings 
    var bmp_string_encoded = new ArrayBuffer(16); // This ArrayBuffer consinsts of encoded ASN.1 BMPString with "abc_" + three first chars from Russian alphabet
    var bmp_string_view = new Uint8Array(bmp_string_encoded);
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

    var bmp_string_decoded = org.pkijs.fromBER(bmp_string_encoded);
    if(bmp_string_decoded.offset === (-1))
        return; // Error during decoding

    var javascript_string1 = bmp_string_decoded.result.value_block.value;

    var bmp_string = new org.pkijs.asn1.BMPSTRING({ value: "abc_абв" }); // Same with initialization by static JavaScript string
    var javascript_string2 = bmp_string.value_block.value;
    // #endregion 

    // #region How to validate ASN.1 against pre-defined schema 
    var asn1_schema = new org.pkijs.asn1.SEQUENCE({
        name: "block1",
        value: [
            new org.pkijs.asn1.NULL({
                name: "block2"
            }),
            new org.pkijs.asn1.INTEGER({
                name: "block3",
                optional: true // This block is absent inside data, but it's "optional". Hence verification against the schema will be passed.
            })
        ]
    });

    var variant1 = org.pkijs.verifySchema(encoded_sequence, asn1_schema); // Verify schema together with decoding of raw data
    var variant1_verified = variant1.verified;
    var variant1_result = variant1.result; // Verified decoded data with all block names inside

    var variant1_block1 = variant1_result.block1;
    var variant1_block2 = variant1_result.block2;

    var variant2 = org.pkijs.compareSchema(decoded_sequence, decoded_sequence, asn1_schema); // Compare already decoded ASN.1 against pre-defined schema
    var variant2_verified = variant2.verified;
    var variant2_result = variant2.result; // Verified decoded data with all block names inside

    var variant2_block1 = variant2_result.block1;
    var variant2_block2 = variant2_result.block2;

    var asn1_schema_any = new org.pkijs.asn1.SEQUENCE({
        name: "block1",
        value: [
            new org.pkijs.asn1.ANY({ // Special type, for ASN.1 schemas only - will validate schema against any ASN.1 type
                name: "block2"
            })
        ]
    });

    decoded_sequence = org.pkijs.fromBER(encoded_sequence).result; // Re-setting "decoded_sequence"

    var variant3 = org.pkijs.compareSchema(decoded_sequence, decoded_sequence, asn1_schema_any);
    var variant3_verified = variant3.verified;

    var asn1_schema_repeated = new org.pkijs.asn1.SEQUENCE({
        name: "block1",
        value: [
            new org.pkijs.asn1.REPEATED({ // Special type, for ASN.1 schemas only - will check that inside decoded data there are sequence of values with one type only
                name: "block2_array",
                value: new org.pkijs.asn1.NULL()
            })
        ]
    });

    decoded_sequence = org.pkijs.fromBER(encoded_sequence).result; // Re-setting "decoded_sequence"

    var variant4 = org.pkijs.compareSchema(decoded_sequence, decoded_sequence, asn1_schema_repeated);
    var variant4_verified = variant4.verified;

    var variant4_array = variant4.block2_array; // Array of internal blocks

    var asn1_schema_choice = new org.pkijs.asn1.SEQUENCE({
        name: "block1",
        value: [
            new org.pkijs.asn1.CHOICE({ // Special type, for ASN.1 schemas only - will check ASN.1 data has one of type
                value: [
                    new org.pkijs.asn1.NULL({
                        name: "block2"
                    }),
                    new org.pkijs.asn1.INTEGER({
                        name: "block2"
                    }),
                ]
            })
        ]
    });

    decoded_sequence = org.pkijs.fromBER(encoded_sequence).result; // Re-setting "decoded_sequence"

    var variant5 = org.pkijs.compareSchema(decoded_sequence, decoded_sequence, asn1_schema_choice);
    var variant5_verified = variant4.verified;
    // #endregion 

    // #region How to use "internal schemas" for primitevely encoded data types 
    var primitive_octetstring = new org.pkijs.asn1.OCTETSTRING({ value_hex: encoded_sequence }); // Create a primitively encoded OCTETSTRING where internal data is an encoded SEQUENCE

    var asn1_schema_internal = new org.pkijs.asn1.OCTETSTRING({
        name: "outer_block",
        primitive_schema: new org.pkijs.asn1.SEQUENCE({
            name: "block1",
            value: [
                    new org.pkijs.asn1.NULL({
                        name: "block2"
                    })
            ]
        })
    });

    var variant6 = org.pkijs.compareSchema(primitive_octetstring, primitive_octetstring, asn1_schema_internal);
    var variant6_verified = variant4.verified;
    var variant6_block1_tag_num = variant6.result.block1.id_block.tag_number;
    var variant6_block2_tag_num = variant6.result.block2.id_block.tag_number;
    // #endregion 
}
//**************************************************************************************
