/** Stable codes for DER violations and input completeness failures. */
export type DerViolationCode =
  | "TRAILING_DATA"
  | "INDEFINITE_LENGTH"
  | "NON_MINIMAL_LENGTH"
  | "NON_MINIMAL_TAG"
  | "INVALID_FORM"
  | "UNEXPECTED_EOC"
  | "EMPTY_VALUE"
  | "NON_MINIMAL_INTEGER"
  | "INVALID_BOOLEAN"
  | "INVALID_NULL"
  | "BIT_STRING_UNUSED_BITS"
  | "BIT_STRING_PADDING"
  | "INVALID_OID"
  | "INVALID_STRING"
  | "INVALID_TIME"
  | "SET_ORDER"
  | "SET_OF_ORDER"
  | "UNSUPPORTED_DER_TYPE";

/** A violation local to the bytes passed to a pure DER validator. */
export interface DerIssue {
  code: DerViolationCode;
  message: string;
  /** Byte within the supplied content, when the offending byte is known. */
  contentOffset?: number;
  /** Index of the SET or SET OF element that violates the ordering. */
  elementIndex?: number;
}

/** A validation failure located within the original parser input. */
export interface ParseDiagnostic {
  code: DerViolationCode;
  message: string;
  /** Start of the element's TLV relative to the root input. */
  offset: number;
  /** Exact offending byte relative to the root input, when known. */
  byteOffset?: number;
  /** Nesting depth, with the root element at depth zero. */
  depth: number;
}
