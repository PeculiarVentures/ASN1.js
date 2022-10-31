// Utility functions

import type { LocalBaseBlock } from "./LocalBaseBlock";

/**
 * Throws an exception if BigInt is not supported
 * @throws Throws Error if BigInt is not supported
 */
export function assertBigInt(): void {
  if (typeof BigInt === "undefined") {
    throw new Error("BigInt is not defined. Your environment doesn't implement BigInt.");
  }
}

/**
 * Concatenates buffers from the list
 * @param buffers List of buffers
 * @returns Concatenated buffer
 */
export function concat(buffers: ArrayBuffer[]): ArrayBuffer {
  let outputLength = 0;
  let prevLength = 0;

  // Calculate output length
  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    outputLength += buffer.byteLength;
  }

  const retView = new Uint8Array(outputLength);

  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    retView.set(new Uint8Array(buffer), prevLength);
    prevLength += buffer.byteLength;
  }

  return retView.buffer;
}

/**
 * Check input "Uint8Array" for common functions
 * @param baseBlock
 * @param inputBuffer
 * @param inputOffset
 * @param inputLength
 * @returns
 */
export function checkBufferParams(baseBlock: LocalBaseBlock, inputBuffer: Uint8Array, inputOffset: number, inputLength: number): boolean {
  if (!(inputBuffer instanceof Uint8Array)) {
    baseBlock.error = "Wrong parameter: inputBuffer must be 'Uint8Array'";

    return false;
  }

  if (!inputBuffer.byteLength) {
    baseBlock.error = "Wrong parameter: inputBuffer has zero length";

    return false;
  }

  if (inputOffset < 0) {
    baseBlock.error = "Wrong parameter: inputOffset less than zero";

    return false;
  }

  if (inputLength < 0) {
    baseBlock.error = "Wrong parameter: inputLength less than zero";

    return false;
  }

  if ((inputBuffer.byteLength - inputOffset - inputLength) < 0) {
    baseBlock.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";

    return false;
  }

  return true;
}

enum ESpecialNumber {
  nan = 1,
  infinite = 2
}

interface INumberParts {
  sign: 1 | -1,
  exponent: number,
  mantissa: number,
  special?: ESpecialNumber
}

/**
 * Retrieves the mantissa, exponent and sign of a number value
 *
 * Taken from:
 * https://stackoverflow.com/questions/9383593/extracting-the-exponent-and-mantissa-of-a-javascript-number
 *
 * @param x - the number to get the values from
 * @returns - the structs containing the extracted values
 */
export function getNumberParts(x: number): INumberParts
{
  if(isNaN(x)) {
    return {
      mantissa: -6755399441055744,
      exponent: 972,
      sign: 1,
      special: ESpecialNumber.nan
    };
  }

  const float = new Float64Array(1);
  const bytes = new Uint8Array(float.buffer);
  float[0] = x;
  const msb = bytes[7] >> 7;
  const sign = msb ? -1 : 1;

  if(!isFinite(x)) {
    return {
      mantissa: 4503599627370496,
      exponent: 972,
      sign,
      special: ESpecialNumber.infinite
    };
  }

  let exponent = ((bytes[7] & 0x7f) << 4 | bytes[6] >> 4) - 0x3ff;

  bytes[7] = 0x3f;
  bytes[6] |= 0xf0;

  // Return mantissa lower than 1
  let mantissa = float[0];
  while (mantissa >= 1) {
    mantissa /= 2;
    exponent++;
  }

  return {
      sign,
      exponent,
      mantissa,
  };
}

/**
 * Converts an unsigned number to a signed one
 *
 * @param x - the unsigned number to get the signed from
 * @returns - the signed number value
 */
export function getSignedFromUnsigned(x: number): number
{
  return x << 24 >> 24;
}
