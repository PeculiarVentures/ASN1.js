import { hex } from "@peculiar/utils";
import { EMPTY_VIEW } from "./constants";
import { encodeBase128 } from "./integerUtils";

export const MAX_SAFE_SID = BigInt(Number.MAX_SAFE_INTEGER);

interface SidValue {
  valueDec: number;
  isHexOnly: boolean;
  valueHexView: Uint8Array;
  blockLength: number;
  error: string;
  warnings: string[];
}

/** Parses complete decimal components, retaining harmless historical normalizations. */
export function parseOidComponents(value: string): bigint[] | undefined {
  const components: bigint[] = [];
  for (const part of value.split(".")) {
    const component = part.trim();
    if (!/^(?:\+?[0-9]+|-0+)$/.test(component)) return undefined;
    components.push(BigInt(component));
  }

  return components;
}

/** Reads masked base-128 digits only when a SID does not fit in a safe number. */
export function getSidValue(sid: SidValue): number | bigint {
  if (!sid.isHexOnly) return sid.valueDec;
  const digits = sid.valueHexView;
  if (!digits.length) return 0n;

  // Pack with a bounded number accumulator, then parse once. Shifting a growing
  // BigInt for every digit makes rendering long SIDs quadratic.
  const packed = new Uint8Array(Math.ceil((digits.length * 7) / 8));
  let bits = packed.length * 8 - digits.length * 7;
  let accumulator = 0;
  let offset = 0;
  for (const digit of digits) {
    if (digit > 0x7f) throw new RangeError("Invalid base-128 SID digit");
    accumulator = (accumulator << 7) | digit;
    bits += 7;
    if (bits >= 8) {
      bits -= 8;
      packed[offset++] = accumulator >> bits;
      accumulator &= (1 << bits) - 1;
    }
  }

  return BigInt(`0x${hex.encode(packed)}`);
}

/** Replaces SID state without invoking the accumulating BER decoder. */
export function setSidValue(sid: SidValue, value: bigint): void {
  const digits = encodeBase128(value);
  sid.valueDec = -1;
  sid.isHexOnly = false;
  sid.valueHexView = digits ?? EMPTY_VIEW;
  sid.blockLength = digits?.length ?? 0;
  sid.error = "";
  sid.warnings = [];

  if (!digits) {
    sid.error = "Error during encoding SID value";
    return;
  }

  if (value <= MAX_SAFE_SID) {
    sid.valueDec = Number(value);
  } else {
    sid.isHexOnly = true;
    sid.warnings.push("Too big SID for decoding, hex only");
  }
}
