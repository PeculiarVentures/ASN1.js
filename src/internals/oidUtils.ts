import { hex } from "@peculiar/utils";
import { EMPTY_VIEW } from "./constants";
import { encodeBase128 } from "./integerUtils";

export const MAX_SAFE_SID = BigInt(Number.MAX_SAFE_INTEGER);

// The native getter identifies typed arrays across realms without trusting an
// instance's constructor or an overridden Symbol.toStringTag.
const typedArrayName = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag)!.get!;

interface SidValue {
  valueDec: number;
  isHexOnly: boolean;
  valueHexView: Uint8Array;
  blockLength: number;
  error: string;
  warnings: string[];
}

/** Records a value error and optionally aborts the operation. */
export function setOidError(block: { error: string; strict: boolean }, error: string): void {
  block.error = error;
  if (block.strict) throw new Error(error);
}

/** Checks the active representation that the SID encoder will actually write. */
export function validateOidSids(sids: SidValue[]): string {
  if (!Array.isArray(sids) || !sids.length) return "Object identifier value is empty";
  for (const sid of sids) {
    if (!sid || typeof sid.isHexOnly !== "boolean") return "Invalid object identifier SID";
    if (sid.error) return sid.error;
    if (!sid.isHexOnly) {
      if (!Number.isSafeInteger(sid.valueDec) || sid.valueDec < 0) return "SID value must be a non-negative safe integer";
      continue;
    }

    const digits = sid.valueHexView;
    if (typedArrayName.call(digits) !== "Uint8Array" || !digits.length || sid.blockLength !== digits.length) return "Invalid hex-only SID length";
    if (digits.length > 1 && digits[0] === 0) return "Non-minimal hex-only SID encoding";
    for (const digit of digits) {
      if (digit > 0x7f) return "Invalid base-128 SID digit";
    }
  }

  return "";
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
