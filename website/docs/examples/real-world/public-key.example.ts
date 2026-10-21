import * as asn1js from "asn1js";

// An ECDSA P-256 public key in SubjectPublicKeyInfo format
const pem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEhPb8k1NeDJXYVFNOSY8/NlUxaUaW
GeBIT2H4h3Zcc2T9QTrD6euoojttnbITYaQVr/IAxHvMlNPabT06gXtFaA==
-----END PUBLIC KEY-----`;

const base64 = pem.replace(/-----[^-]+-----|\s/g, "");
const der = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

// SubjectPublicKeyInfo ::= SEQUENCE {
//   algorithm         AlgorithmIdentifier,
//   subjectPublicKey  BIT STRING }
const spkiSchema = new asn1js.Sequence({
  value: [
    new asn1js.Sequence({
      value: [new asn1js.ObjectIdentifier({ name: "algorithm" }), new asn1js.Any({ name: "parameters", optional: true })],
    }),
    new asn1js.BitString({ name: "publicKey" }),
  ],
});

const { verified, result } = asn1js.verifySchema(der, spkiSchema);
if (!verified) {
  throw new Error("Not a SubjectPublicKeyInfo");
}

const ALGORITHMS: Record<string, string> = {
  "1.2.840.10045.2.1": "EC",
  "1.2.840.113549.1.1.1": "RSA",
  "1.3.101.112": "Ed25519",
};
const CURVES: Record<string, string> = {
  "1.2.840.10045.3.1.7": "P-256",
  "1.3.132.0.34": "P-384",
};

const algorithm = result.algorithm.getValue();
console.log("algorithm:", ALGORITHMS[algorithm] ?? algorithm);

// For EC keys, the parameters hold the curve OID
if (result.parameters instanceof asn1js.ObjectIdentifier) {
  const curve = result.parameters.getValue();
  console.log("curve:", CURVES[curve] ?? curve);
}

// An uncompressed EC point is 0x04 || X || Y
const key: Uint8Array = result.publicKey.valueBlock.valueHexView;
const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
console.log("key length:", key.byteLength);
console.log("x:", toHex(key.subarray(1, 33)));
console.log("y:", toHex(key.subarray(33)));
