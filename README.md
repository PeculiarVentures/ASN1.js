## ASN1.js

Abstract Syntax Notation One (ASN.1) is a standard and notation that describes rules and structures for representing, encoding, transmitting, and decoding data in telecommunications and computer networking. ASN1.js is a pure JavaScript library implementing this standard.  ASN.1 is the basis of all X.509 related data structures and numerous other protocols used on the web.

## Introduction

[ASN1js][] library is a first [BER][] encoding/decoding library. [BER][] is basic [ASN.1][] rules, [DER][] is the only set of resctictions for [BER][]. The [ASN1js][] library was tested against [freely available ASN.1:2008 test suite], with some limitations related to JavaScript language. 

## Features of the library

* Fully object-oriented library. Inhiritence is using everywhere inside the lib;
* Working with HTML5 data objects (ArrayBuffer, Uint8Array etc.);
* Working with all ASN.1:2008 types;
* Working with [BER][] encoded data;
* All types inside the library constantly stores information about all ASN.1 sub blocks (tag block, length block or value block);
* User may have access to any byte inside any ASN.1 sub-block;
* Any sub-block may have unlimited length, as it described in ASN.1 standard (even "tag block");
* Working with "easy-to-understand" ASN.1 schemas (pre-defined or built by user);
* Has special types to work with ASN.1 schemas:
  * ANY
  * CHOICE
  * REPEATED 
* User can name any block inside ASN.1 schema and easily get information by name;
* All types inside library are dynamic types;
* All types can be initialized via static or dynamic way;

## Examples

```
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
```

```
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
```

```
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
    // #endregion

    var variant1 = org.pkijs.verifySchema(encoded_sequence, asn1_schema); // Verify schema together with decoding of raw data
    var variant1_verified = variant1.verified;
    var variant1_result = variant1.result; // Verified decoded data with all block names inside
```

More examples could be found in "examples" directory or inside [PKIjs][] library.

## Future extensions for the library

* Add support for ASN.1 REAL type

## License

Copyright (c) 2014, GMO GlobalSign
All rights reserved.

Author 2014, Yury Strozhevsky <www.strozhevsky.com>.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, 
   this list of conditions and the following disclaimer in the documentation 
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors 
   may be used to endorse or promote products derived from this software without 
   specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR 
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY 
OF SUCH DAMAGE. 


[ASN.1]: http://en.wikipedia.org/wiki/Abstract_Syntax_Notation_One
[ASN1js]: http://asn1js.org/
[PKIjs]: http://pkijs.org/
[BER]: http://en.wikipedia.org/wiki/X.690#BER_encoding
[DER]: http://en.wikipedia.org/wiki/X.690#DER_encoding
[freely available ASN.1:2008 test suite]: http://www.strozhevsky.com/free_docs/free_asn1_testsuite_descr.pdf