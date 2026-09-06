import * as pvtsutils from "pvtsutils";

export function bytesToSignedBigInt(view: Uint8Array): bigint {
  if (!view.byteLength) return BigInt(0);

  const value = BigInt(`0x${pvtsutils.Convert.ToHex(view)}`);

  if (view[0] & 0x80) return value - (BigInt(1) << BigInt(view.byteLength * 8));

  return value;
}

export function bytesToSignedDecimal(view: Uint8Array): string {
  if (typeof BigInt !== "undefined") return bytesToSignedBigInt(view).toString(10);

  const BASE = 10000000;
  const DECIMAL_DIGITS = 7;
  if (!view.byteLength) return "0";

  const negative = !!(view[0] & 0x80);
  let magnitude = view;
  if (negative) {
    magnitude = new Uint8Array(view.length);
    let carry = 1;
    for (let i = view.length - 1; i >= 0; i--) {
      const value = (view[i] ^ 0xff) + carry;
      magnitude[i] = value & 0xff;
      carry = value >> 8;
    }
  }

  const limbs = [0];
  for (let index = 0; index < magnitude.length; index++) {
    let carry = magnitude[index];
    for (let i = 0; i < limbs.length; i++) {
      const value = limbs[i] * 256 + carry;
      limbs[i] = value % BASE;
      carry = Math.floor(value / BASE);
    }
    if (carry) limbs.push(carry);
  }

  let top = limbs.length - 1;
  while (top > 0 && limbs[top] === 0) top--;

  let result = String(limbs[top]);
  for (let i = top - 1; i >= 0; i--) result += String(limbs[i]).padStart(DECIMAL_DIGITS, "0");

  return negative && result !== "0" ? `-${result}` : result;
}
