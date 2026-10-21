<li>

#### BER and DER encoding and decoding

Decode bytes into a tree of ASN.1 objects with `fromBER()` and encode them back with `toBER()`. Every tag, length, and value block stays accessible, byte by byte.

</li>

<li>

#### All ASN.1 types, as JavaScript values

Supports the universal types of ASN.1:2008. Integers convert to `bigint`, object identifiers to dotted strings, string types to `string`, and time types to `Date`.

</li>

<li>

#### Schema validation

Describe the structure you expect, then validate and extract fields by name in one step. Optional fields, `Any`, `Choice`, and `Repeated` cover real-world modules.

</li>

<li>

#### Every tag class

Universal, application, context-specific, and private tags, with explicit and implicit tagging, and constructed or primitive encoding.

</li>

<li>

#### Safe parsing of untrusted input

Limits on nesting depth, node count, and content length stop malicious input before it exhausts memory or the call stack.

</li>

<li>

#### Tested against the ASN.1:2008 test suite

Checked against the freely available [ASN.1:2008 test suite](https://github.com/YuryStrozhevsky/asn1-test-suite), and used in production through [PKIjs](https://pkijs.org).

</li>
