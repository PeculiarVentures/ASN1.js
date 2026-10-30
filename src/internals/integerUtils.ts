import { hex, uint } from "@peculiar/utils";

/** Decodes base-128 digits, or returns `undefined` when the value is not a safe integer. */
export function decodeBase128(view: Uint8Array): number | undefined {
  try {
    return uint.decode(view, { bitsPerByte: 7 });
  } catch {
    return undefined;
  }
}

/** Encodes a non-negative safe integer or bigint as base-128 digits, or returns `undefined` when it cannot. */
export function encodeBase128(value: number | bigint): Uint8Array | undefined {
  try {
    if (typeof value !== "bigint") return uint.encode(value, { bitsPerByte: 7 });
    if (value < 0n) return undefined;

    // Convert once: repeatedly shifting the entire BigInt makes large SIDs quadratic.
    const hexadecimal = value.toString(16);
    const bitLength = (hexadecimal.length - 1) * 4 + 32 - Math.clz32(parseInt(hexadecimal[0], 16));
    const result = new Uint8Array(Math.max(1, Math.ceil(bitLength / 7)));
    let offset = result.length;

    // Seven hex digits fit in 28 bits and yield exactly four base-128 digits.
    // Work from the right so only the most significant chunk needs trimming.
    for (let end = hexadecimal.length; end > 0; end -= 7) {
      let chunk = parseInt(hexadecimal.slice(Math.max(0, end - 7), end), 16);
      for (let digit = 0; digit < 4 && offset > 0; digit++) {
        result[--offset] = chunk & 0x7f;
        chunk >>>= 7;
      }
    }

    return result;
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
