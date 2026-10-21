---
sidebar_position: 0
sidebar_label: Overview
---

# Examples

Every example is a complete script that you can copy into your project and run.

## Basics

- [Decode BER and DER](basics/decode.mdx): turn bytes into ASN.1 objects and handle decoding errors.
- [Encode to DER](basics/encode.mdx): build structures and get their bytes or hex.
- [Convert to JavaScript values](basics/values.mdx): integers, BigInt, OIDs, strings, and dates.
- [Explicit and implicit tags](basics/tagging.mdx): encode and decode context-specific tags such as `[0]`.

## Schemas

- [Validate against a schema](schemas/verify-schema.mdx): check structure and read fields by name.
- [CHOICE and SEQUENCE OF](schemas/choice-and-repeated.mdx): alternatives and lists with `Choice` and `Repeated`.
- [Structures inside an OCTET STRING](schemas/embedded-data.mdx): validate encoded data nested in another value.

## Real-world data

- [Read an X.509 certificate](real-world/x509-certificate.mdx): serial number, issuer, subject, and validity from a PEM file.
- [Read a public key](real-world/public-key.mdx): algorithm, curve, and key bytes from a `SubjectPublicKeyInfo`.
- [Parse untrusted input](real-world/untrusted-input.mdx): limit nesting, node count, and content length.
