import type { BufferSource } from "@peculiar/utils";
import { fromBER, type FromBerOptions, type FromBerResult } from "./parser";

/** Resource limits, input ownership and embedded-value options for DER parsing. */
export type FromDerOptions = Omit<FromBerOptions, "encodingRules" | "requireFullInput">;

/**
 * Parses exactly one DER element, validating the supported encoding rules.
 * Primitive embedded-value detection is disabled by default. A validation failure
 * returns offset -1, result.error and, when available, a structured diagnostic.
 * Successful validation describes the input bytes at this call, not later mutations.
 */
export function fromDER(input: BufferSource, options?: FromDerOptions): FromBerResult {
  return fromBER(input, { ...options, encodingRules: "DER", requireFullInput: true });
}
