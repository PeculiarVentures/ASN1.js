/** Decodes one character per octet without exceeding engine argument limits. @internal */
export function bytesToString(view: Uint8Array): string {
  const chunkSize = 0x2000;
  if (view.length <= chunkSize) return String.fromCharCode.apply(null, view as unknown as number[]);

  const chunks: string[] = [];
  for (let offset = 0; offset < view.length; offset += chunkSize) {
    chunks.push(String.fromCharCode.apply(null, view.subarray(offset, offset + chunkSize) as unknown as number[]));
  }

  return chunks.join("");
}
