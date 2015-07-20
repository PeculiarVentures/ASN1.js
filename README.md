## ASN1js

[![license](https://img.shields.io/badge/license-BSD-green.svg?style=flat)](https://raw.githubusercontent.com/GlobalSign/ASN1.js/master/LICENSE)

Abstract Syntax Notation One (ASN.1) is a standard and notation that describes rules and structures for representing, encoding, transmitting, and decoding data in telecommunications and computer networking. [ASN1js][] is a pure JavaScript library implementing this standard.  ASN.1 is the basis of all X.509 related data structures and numerous other protocols used on the web.

## Introduction

[ASN1js][] is the first library for [BER][] encoding/decoding in Javascript designed for browser use. [BER][] is the basic encoding rules for [ASN.1][] that all others are based on, [DER][] is the encoding rules used by PKI applications - it is a subset of [BER][]. The [ASN1js][] library was tested against [freely available ASN.1:2008 test suite], with some limitations related to JavaScript language. 

## Features of the library

* [ASN1js][] is a "base layer" for full-featured JS library [PKIjs][], which is using Web Cryptography API and has all classes, neccessary to work with PKI-related data;
* Fully object-oriented library. Inhiritence is using everywhere inside the lib;
* Working with HTML5 data objects (ArrayBuffer, Uint8Array etc.);
* Working with all ASN.1:2008 types;
* Working with [BER][] encoded data;
* All types inside the library constantly stores information about all ASN.1 sub blocks (tag block, length block or value block);
* User may have access to any byte inside any ASN.1 sub-block;
* Any sub-block may have unlimited length, as it described in ASN.1 standard (even "tag block");
* Ability to work with ASN.1 string date types (intcluding all "international" strings like UniversalString, BMPString, UTF8String) by passing native JavaScript strings into constuctors. And vice versa - all initially parsed data of ASN.1 string types right after decoding automatically converts into native JavaScript strings;
* Same with ASN.1 date-time types: for major types like UTCTime and GeneralizedTime there are automatic convertion between "JS date type - ASN.1 date-time type" + vice versa;
* Same with ASN.1 OBJECT-IDENTIFIER (OID) data-type: you can initialize OID by JavaScript string and can get string representation via calling "oid.value_block.toString()";
* Working with "easy-to-understand" ASN.1 schemas (pre-defined or built by user);
* Has special types to work with ASN.1 schemas:
  * ANY
  * CHOICE
  * REPEATED 
* User can name any block inside ASN.1 schema and easily get information by name;
* Ability to parse internal data inside a primitively encoded data types and automatically validate it against special schema;
* All types inside library are dynamic;
* All types can be initialized in static or dynamic ways.

## Examples

```javascript
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

```javascript
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

```javascript
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

```javascript
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
```

More examples could be found in "examples" directory or inside [PKIjs][] library.

## Related source code

* [C++ ASN1:2008 BER coder/decoder](https://github.com/YuryStrozhevsky/C-plus-plus-ASN.1-2008-coder-decoder) - the "father" of [ASN1js][] project;
* [Freely available ASN.1:2008 test suite](https://github.com/YuryStrozhevsky/ASN1-2008-free-test-suite) - the suite which can help you to validate (and better understand) any ASN.1 coder/decoder;

## Suitability
At this time this library should be considered suitable for research and experimentation, futher code and security review is needed before utilization in a production application.

## How to use ASN1js and PKIjs with Node.js

**!!! WARNING !!! **
**Currently there is no "polyfill" of WebCrypto in Node.js. Thus you will not be able to use signature / verification features of PKIjs in Node.js programs.**

In order to use [PKIjs][] you will also need [ASN1js][] plus [node.extend](https://www.npmjs.com/package/node.extend) package.
```javascript
    var merge = require("node.extend");

    var common = require("asn1js/org/pkijs/common");
    var _asn1js = require("asn1js");
    var _pkijs = require("pkijs");
    var _x509schema = require("pkijs/org/pkijs/x509_schema");

    // #region Merging function/object declarations for ASN1js and PKIjs 
    var asn1js = merge(true, _asn1js, common);

    var x509schema = merge(true, _x509schema, asn1js);

    var pkijs_1 = merge(true, _pkijs, asn1js);
    var pkijs = merge(true, pkijs_1, x509schema);
    // #endregion 
```

After that you will ba able to use ASN1js and PKIjs via common way:
```javascript
        // #region Decode and parse X.509 cert 
        var asn1 = pkijs.org.pkijs.fromBER(certBuffer);
        var cert;
        try
        {
            cert = new pkijs.org.pkijs.simpl.CERT({ schema: asn1.result });
        }
        catch(ex)
        {
            return;
        }
        // #endregion 
```

## License

Copyright (c) 2014, [GMO GlobalSign](http://www.globalsign.com/)
Copyright (c) 2015, [Peculiar Ventures](http://peculiarventures.com/)
All rights reserved.

Author 2014-2015, [Yury Strozhevsky](http://www.strozhevsky.com/).

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
