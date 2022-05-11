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