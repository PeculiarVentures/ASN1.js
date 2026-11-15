# Strict DER fixtures

These are synthetic test artifacts generated locally on 2026-11-15 with
`/usr/bin/openssl` (LibreSSL 3.3.6). They contain no private keys or production data.

- `legacy-ca.der` is a 1,993-byte RSA-4096 self-signed CA certificate signed with
  SHA-256. Its issuer and subject include `CN=Legacy Téletex CA` encoded as
  TeletexString, and it has 15 DNS subject alternative names. The request used
  UTF-8 input with `string_mask=nombstr` to exercise legacy T61 names.
- `revoked.crl.der` is a 105,558-byte SHA-256/RSA CRL signed by that CA and contains
  5,000 revoked entries, with serial numbers 1 through 5,000. The source index used
  expiry `360101000000Z` and revocation time `261101000000Z`.

The CRL signature was checked with OpenSSL before DER conversion. To inspect the committed fixtures:

```sh
openssl x509 -inform DER -in src/fixtures/strict-der/legacy-ca.der -noout -text
openssl crl -inform DER -in src/fixtures/strict-der/revoked.crl.der -noout -text
```

To verify the CRL signature, convert the fixture certificate to PEM and pass it to
`openssl crl -inform DER -in src/fixtures/strict-der/revoked.crl.der -CAfile ca.pem -noout`.
Private keys are deliberately excluded from this repository.
