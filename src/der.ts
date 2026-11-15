import type { DerIssue } from "./diagnostics";

type DerForm = "primitive" | "constructed";

const UNIVERSAL_DER_FORMS: Readonly<Partial<Record<number, DerForm>>> = {
  1: "primitive",
  2: "primitive",
  3: "primitive",
  4: "primitive",
  5: "primitive",
  6: "primitive",
  10: "primitive",
  12: "primitive",
  13: "primitive",
  16: "constructed",
  17: "constructed",
  18: "primitive",
  19: "primitive",
  20: "primitive",
  21: "primitive",
  22: "primitive",
  23: "primitive",
  24: "primitive",
  25: "primitive",
  26: "primitive",
  27: "primitive",
  28: "primitive",
  30: "primitive",
};

function unsupported(universalTag: number): DerIssue {
  return { code: "UNSUPPORTED_DER_TYPE", message: `DER validation is not supported for UNIVERSAL tag ${universalTag}` };
}

/**
 * Checks canonical identifier and length octets after their structural decoding.
 * The slices must each contain one complete header field.
 * @internal
 */
export function checkDerHeader(identifier: Uint8Array, length: Uint8Array): DerIssue | undefined {
  if ((identifier[0] & 0x1f) === 0x1f && (identifier[1] === 0x80 || (identifier.length === 2 && identifier[1] < 31))) {
    return { code: "NON_MINIMAL_TAG", message: "DER requires a minimally encoded tag" };
  }

  if (length[0] === 0x80) {
    return { code: "INDEFINITE_LENGTH", message: "DER requires a definite length" };
  }

  if ((length[0] & 0x80) !== 0 && (length[1] === 0 || (length.length === 2 && length[1] < 128))) {
    return { code: "NON_MINIMAL_LENGTH", message: "DER requires a minimally encoded length" };
  }

  return undefined;
}

/** Checks whether a UNIVERSAL tag has a supported DER primitive/constructed form. @internal */
export function checkDerForm(universalTag: number, isConstructed: boolean): DerIssue | undefined {
  if (universalTag === 0) {
    return { code: "UNEXPECTED_EOC", message: "End-of-contents is not permitted in DER" };
  }

  if (universalTag === 15 || universalTag >= 37) {
    return { code: "INVALID_FORM", message: `UNIVERSAL tag ${universalTag} is reserved` };
  }

  const form = UNIVERSAL_DER_FORMS[universalTag];
  if (!form) return unsupported(universalTag);
  if (isConstructed !== (form === "constructed")) {
    return { code: "INVALID_FORM", message: `DER requires ${form} encoding for UNIVERSAL tag ${universalTag}` };
  }

  return undefined;
}

function checkInteger(content: Uint8Array): DerIssue | undefined {
  if (content.length === 0) return { code: "EMPTY_VALUE", message: "INTEGER and ENUMERATED contents must not be empty", contentOffset: 0 };
  if (content.length > 1 && ((content[0] === 0 && (content[1] & 0x80) === 0) || (content[0] === 0xff && (content[1] & 0x80) !== 0))) {
    return { code: "NON_MINIMAL_INTEGER", message: "INTEGER and ENUMERATED require a minimal two's complement encoding", contentOffset: 0 };
  }

  return undefined;
}

function checkBitString(content: Uint8Array): DerIssue | undefined {
  if (content.length === 0) return { code: "EMPTY_VALUE", message: "BIT STRING contents must include the unused-bits octet", contentOffset: 0 };

  const unused = content[0];
  if (unused > 7 || (unused !== 0 && content.length === 1)) {
    return { code: "BIT_STRING_UNUSED_BITS", message: "BIT STRING has an invalid unused-bit count", contentOffset: 0 };
  }
  if (unused !== 0 && (content[content.length - 1] & ((1 << unused) - 1)) !== 0) {
    return { code: "BIT_STRING_PADDING", message: "DER requires BIT STRING padding bits to be zero", contentOffset: content.length - 1 };
  }

  return undefined;
}

function checkOid(content: Uint8Array): DerIssue | undefined {
  if (content.length === 0) return { code: "EMPTY_VALUE", message: "OBJECT IDENTIFIER and RELATIVE-OID contents must not be empty", contentOffset: 0 };

  let start = true;
  for (let i = 0; i < content.length; i++) {
    const octet = content[i];
    if (start && octet === 0x80) {
      return { code: "INVALID_OID", message: "OID subidentifiers must use minimal base-128 encoding", contentOffset: i };
    }
    start = (octet & 0x80) === 0;
  }
  if (!start) return { code: "INVALID_OID", message: "OID subidentifier is not terminated", contentOffset: content.length - 1 };

  return undefined;
}

function invalidString(contentOffset: number): DerIssue {
  return { code: "INVALID_STRING", message: "String contents are invalid for the declared UNIVERSAL type", contentOffset };
}

function checkUtf8(content: Uint8Array): DerIssue | undefined {
  for (let i = 0; i < content.length;) {
    const start = i;
    const lead = content[i++];
    if (lead <= 0x7f) continue;

    let count: number;
    let secondMin = 0x80;
    let secondMax = 0xbf;
    if (lead >= 0xc2 && lead <= 0xdf) count = 1;
    else if (lead >= 0xe0 && lead <= 0xef) {
      count = 2;
      if (lead === 0xe0) secondMin = 0xa0;
      if (lead === 0xed) secondMax = 0x9f;
    } else if (lead >= 0xf0 && lead <= 0xf4) {
      count = 3;
      if (lead === 0xf0) secondMin = 0x90;
      if (lead === 0xf4) secondMax = 0x8f;
    } else return invalidString(start);

    if (i + count > content.length) return invalidString(start);
    if (content[i] < secondMin || content[i] > secondMax) return invalidString(i);
    i++;
    for (let j = 1; j < count; j++, i++) {
      if (content[i] < 0x80 || content[i] > 0xbf) return invalidString(i);
    }
  }

  return undefined;
}

function checkAlphabet(universalTag: number, content: Uint8Array): DerIssue | undefined {
  for (let i = 0; i < content.length; i++) {
    const octet = content[i];
    let valid: boolean;
    switch (universalTag) {
      case 18:
        valid = octet === 0x20 || (octet >= 0x30 && octet <= 0x39);
        break;
      case 19:
        valid = (octet >= 0x41 && octet <= 0x5a) || (octet >= 0x61 && octet <= 0x7a) || (octet >= 0x30 && octet <= 0x39) || " '()+,-./:=?".includes(String.fromCharCode(octet));
        break;
      case 22:
        valid = octet <= 0x7f;
        break;
      default:
        valid = octet >= 0x20 && octet <= 0x7e;
    }
    if (!valid) return invalidString(i);
  }

  return undefined;
}

function checkWideString(content: Uint8Array, width: 2 | 4): DerIssue | undefined {
  if (content.length % width !== 0) return invalidString(content.length - (content.length % width));

  for (let i = 0; i < content.length; i += width) {
    let codePoint = 0;
    for (let j = 0; j < width; j++) codePoint = codePoint * 256 + content[i + j];
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) return invalidString(i);
  }

  return undefined;
}

function invalidTime(message: string, contentOffset?: number): DerIssue {
  return { code: "INVALID_TIME", message, ...(contentOffset === undefined ? {} : { contentOffset }) };
}

function digits(content: Uint8Array, start: number, count: number): number {
  let result = 0;
  for (let i = start; i < start + count; i++) result = result * 10 + content[i] - 0x30;
  return result;
}

function checkTime(content: Uint8Array, generalized: boolean): DerIssue | undefined {
  const wholeLength = generalized ? 14 : 12;
  if (content.length < wholeLength + 1 || (!generalized && content.length !== wholeLength + 1)) {
    return invalidTime("DER time requires the complete date, hours, minutes, seconds and uppercase Z");
  }

  for (let i = 0; i < wholeLength; i++) {
    if (content[i] < 0x30 || content[i] > 0x39) return invalidTime("DER time must contain decimal date and time digits", i);
  }
  if (content[content.length - 1] !== 0x5a) return invalidTime("DER time must end in uppercase Z", content.length - 1);

  if (content.length !== wholeLength + 1) {
    if (content[wholeLength] !== 0x2e) return invalidTime("DER fractional seconds require a decimal point", wholeLength);
    if (content.length === wholeLength + 2) return invalidTime("DER fractional seconds must contain digits", wholeLength);
    for (let i = wholeLength + 1; i < content.length - 1; i++) {
      if (content[i] < 0x30 || content[i] > 0x39) return invalidTime("DER fractional seconds must contain decimal digits", i);
    }
    if (content[content.length - 2] === 0x30) return invalidTime("DER fractional seconds must omit trailing zeros", content.length - 2);
  }

  const yearLength = generalized ? 4 : 2;
  let year = digits(content, 0, yearLength);
  if (!generalized) year += year < 50 ? 2000 : 1900;
  const month = digits(content, yearLength, 2);
  const day = digits(content, yearLength + 2, 2);
  const hour = digits(content, yearLength + 4, 2);
  const minute = digits(content, yearLength + 6, 2);
  const second = digits(content, yearLength + 8, 2);

  if (month < 1 || month > 12) return invalidTime("Time contains an invalid calendar month", yearLength);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = month === 2 ? (leapYear ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
  if (day < 1 || day > monthDays) return invalidTime("Time contains an invalid calendar day", yearLength + 2);
  if (hour > 23) return invalidTime("Time contains an invalid hour", yearLength + 4);
  if (minute > 59) return invalidTime("Time contains an invalid minute", yearLength + 6);
  // GeneralizedTime follows ISO 8601, where a positive leap second ends a UTC month.
  const leapSecond = generalized && second === 60 && hour === 23 && minute === 59 && day === monthDays;
  if (second > 59 && !leapSecond) return invalidTime("Time contains an invalid second", yearLength + 8);

  return undefined;
}

/**
 * Checks the form and contents of a primitive UNIVERSAL value using DER rules.
 * Returns undefined for a supported, valid value, or UNSUPPORTED_DER_TYPE when
 * the type cannot be checked, including SEQUENCE and SET. Containers are not parsed.
 * TeletexString, VideotexString, GraphicString and GeneralString contents are opaque;
 * only their primitive form is checked.
 */
export function checkPrimitiveEncoding(universalTag: number, isConstructed: boolean, content: Uint8Array): DerIssue | undefined {
  if (universalTag === 16 || universalTag === 17) return unsupported(universalTag);

  const formIssue = checkDerForm(universalTag, isConstructed);
  if (formIssue) return formIssue;

  switch (universalTag) {
    case 1:
      if (content.length !== 1 || (content[0] !== 0 && content[0] !== 0xff)) {
        return { code: "INVALID_BOOLEAN", message: "DER BOOLEAN requires exactly one octet, either 00 or FF", contentOffset: 0 };
      }
      return undefined;
    case 2:
    case 10:
      return checkInteger(content);
    case 3:
      return checkBitString(content);
    case 5:
      return content.length === 0 ? undefined : { code: "INVALID_NULL", message: "NULL contents must be empty", contentOffset: 0 };
    case 6:
    case 13:
      return checkOid(content);
    case 12:
      return checkUtf8(content);
    case 18:
    case 19:
    case 22:
    case 26:
      return checkAlphabet(universalTag, content);
    case 23:
      return checkTime(content, false);
    case 24:
      return checkTime(content, true);
    case 28:
      return checkWideString(content, 4);
    case 30:
      return checkWideString(content, 2);
    case 4:
    case 20:
    case 21:
    case 25:
    case 27:
      return undefined;
    default:
      return unsupported(universalTag);
  }
}

/**
 * Compares complete DER element encodings for SET OF ordering (X.690 11.6).
 * The shorter input is conceptually padded with trailing zero octets.
 * A negative, zero or positive result indicates less than, equal to or greater than.
 * This comparison does not validate either encoding.
 */
export function compareSetOfElements(a: Uint8Array, b: Uint8Array): number {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

/**
 * Checks SET OF ordering (X.690 11.6) of complete, already validated DER encodings.
 * Ordering alone does not establish the validity of the supplied elements.
 */
export function checkSetOfOrder(encodings: readonly Uint8Array[]): DerIssue | undefined {
  for (let i = 1; i < encodings.length; i++) {
    if (compareSetOfElements(encodings[i - 1], encodings[i]) > 0) {
      return { code: "SET_OF_ORDER", message: "SET OF elements are not in ascending DER encoding order", elementIndex: i };
    }
  }

  return undefined;
}

function compareIdentifiers(a: Uint8Array, b: Uint8Array): number {
  const classDifference = (a[0] & 0xc0) - (b[0] & 0xc0);
  if (classDifference !== 0) return classDifference;

  const aShort = (a[0] & 0x1f) !== 0x1f;
  const bShort = (b[0] & 0x1f) !== 0x1f;
  if (aShort && bShort) return (a[0] & 0x1f) - (b[0] & 0x1f);
  if (aShort !== bShort) return aShort ? -1 : 1;

  // Minimal base-128 tags sort first by group count, then by their raw groups.
  // No numeric conversion is needed, even for tags exceeding Number.MAX_SAFE_INTEGER.
  if (a.length !== b.length) return a.length - b.length;
  for (let i = 1; i < a.length; i++) {
    const difference = (a[i] & 0x7f) - (b[i] & 0x7f);
    if (difference !== 0) return difference;
  }

  return 0;
}

/**
 * Checks SET ordering (X.690 10.3) by actual component tag class and tag number.
 * Supply complete, already validated, minimally encoded identifier octets.
 * The constructed flag is ignored and arbitrarily large tag numbers are supported.
 * For an untagged CHOICE, supply the identifier of the encoded alternative.
 */
export function checkSetOrder(identifiers: readonly Uint8Array[]): DerIssue | undefined {
  for (let i = 1; i < identifiers.length; i++) {
    if (compareIdentifiers(identifiers[i - 1], identifiers[i]) > 0) {
      return { code: "SET_ORDER", message: "SET components are not in ascending tag order", elementIndex: i };
    }
  }

  return undefined;
}
