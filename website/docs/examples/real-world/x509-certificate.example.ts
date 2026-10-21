import * as asn1js from "asn1js";

// A self-signed Ed25519 certificate for example.com
const pem = `-----BEGIN CERTIFICATE-----
MIIBdzCCASmgAwIBAgIEEjSrzTAFBgMrZXAwOTELMAkGA1UEBhMCVVMxFDASBgNV
BAoMC0V4YW1wbGUgT3JnMRQwEgYDVQQDDAtleGFtcGxlLmNvbTAeFw0yNjEwMjEw
ODU2MzVaFw0zNjEwMTgwODU2MzVaMDkxCzAJBgNVBAYTAlVTMRQwEgYDVQQKDAtF
eGFtcGxlIE9yZzEUMBIGA1UEAwwLZXhhbXBsZS5jb20wKjAFBgMrZXADIQCI2RrW
/vEl4XAm8QJPjyx2A2rzo+Mx/sFKubTT6ufcQaNTMFEwHQYDVR0OBBYEFF7Rc4b3
lfcoRDNKjvkNVNH8BCbyMB8GA1UdIwQYMBaAFF7Rc4b3lfcoRDNKjvkNVNH8BCby
MA8GA1UdEwEB/wQFMAMBAf8wBQYDK2VwA0EAfm6ItMcurZixTay2H1sXLKqvur2I
IRuSqDRX5K0nAsqmSa2BE1zUChX5xpAYfDSda6LBd3HfkWwPArMupm0aAw==
-----END CERTIFICATE-----`;

// PEM is base64-encoded DER between the header and footer lines
const base64 = pem.replace(/-----[^-]+-----|\s/g, "");
const der = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

// The parts of RFC 5280 we need. Fields we don't read are matched with Any.
const time = (name: string) =>
  new asn1js.Choice({
    value: [new asn1js.UTCTime({ name }), new asn1js.GeneralizedTime({ name })],
  });

const certificateSchema = new asn1js.Sequence({
  value: [
    new asn1js.Sequence({
      value: [
        new asn1js.Constructed({
          optional: true,
          idBlock: { tagClass: 3, tagNumber: 0 },
          value: [new asn1js.Integer({ name: "version" })],
        }),
        new asn1js.Integer({ name: "serialNumber" }),
        new asn1js.Any(), // signature
        new asn1js.Sequence({ name: "issuer", value: [new asn1js.Repeated({ value: new asn1js.Set() })] }),
        new asn1js.Sequence({ value: [time("notBefore"), time("notAfter")] }),
        new asn1js.Sequence({ name: "subject", value: [new asn1js.Repeated({ value: new asn1js.Set() })] }),
        new asn1js.Any(), // subjectPublicKeyInfo
        new asn1js.Repeated({ value: new asn1js.Any() }), // optional fields and extensions
      ],
    }),
    new asn1js.Any(), // signatureAlgorithm
    new asn1js.BitString(), // signatureValue
  ],
});

const { verified, result } = asn1js.verifySchema(der, certificateSchema);
if (!verified) {
  throw new Error("Not an X.509 certificate");
}

// Name ::= SEQUENCE OF SET OF SEQUENCE { type OBJECT IDENTIFIER, value ANY }
const ATTRIBUTE_NAMES: Record<string, string> = { "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.10": "O" };

function formatName(name: asn1js.Sequence): string {
  const parts: string[] = [];
  for (const rdn of name.valueBlock.value as asn1js.Set[]) {
    for (const attribute of rdn.valueBlock.value as asn1js.Sequence[]) {
      const [type, value] = attribute.valueBlock.value;
      if (type instanceof asn1js.ObjectIdentifier && value instanceof asn1js.BaseStringBlock) {
        const oid = type.getValue();
        parts.push(`${ATTRIBUTE_NAMES[oid] ?? oid}=${value.getValue()}`);
      }
    }
  }
  return parts.join(", ");
}

// The version field is zero-based and omitted for v1
console.log("version:", result.version ? result.version.valueBlock.valueDec + 1 : 1);
console.log("serial:", result.serialNumber.toBigInt().toString(16));
console.log("issuer:", formatName(result.issuer));
console.log("subject:", formatName(result.subject));
console.log("valid from:", result.notBefore.toDate().toISOString());
console.log("valid to:", result.notAfter.toDate().toISOString());
