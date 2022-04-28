// Utility functions

/**
 * Throws an exception if BigInt is not supported
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
