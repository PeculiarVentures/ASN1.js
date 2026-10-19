import { hex, uint } from "@peculiar/utils";

/** Decodes base-128 digits, or returns `undefined` when the value is not a safe integer. */
export function decodeBase128(view: Uint8Array): number | undefined {
  try {
    return uint.decode(view, { bitsPerByte: 7 });
  } catch {
    return undefined;
  }
}

/** Encodes a non-negative safe integer as base-128 digits, or returns `undefined` when it cannot. */
export function encodeBase128(value: number): Uint8Array | undefined {
  try {
    return uint.encode(value, { bitsPerByte: 7 });
  } catch {
    return undefined;
  }
}

/** Decodes big-endian two's complement bytes, treating empty input as zero. */
export function bytesToSignedBigInt(view: Uint8Array): bigint {
  // Parsing a hex string is linear; int.decodeBigInt shifts per byte and is quadratic on large values
  if (!view.byteLength) return BigInt(0);

  const value = BigInt(`0x${hex.encode(view)}`);

  if (view[0] & 0x80) return value - (BigInt(1) << BigInt(view.byteLength * 8));

  return value;
}

/** Encodes a bigint as minimal big-endian two's complement bytes. */
export function signedBigIntToBytes(value: bigint): Uint8Array {
  // A negative value -n needs as many bits as n - 1, so -128 fits in one byte
  const magnitude = value < 0 ? -value - BigInt(1) : value;
  const byteLength = (magnitude.toString(2).length >> 3) + 1;
  const unsigned = value < 0 ? value + (BigInt(1) << BigInt(byteLength * 8)) : value;

  return hex.decode(unsigned.toString(16).padStart(byteLength * 2, "0"));
}
