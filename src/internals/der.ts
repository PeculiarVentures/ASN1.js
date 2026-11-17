import type { DerIssue } from "../diagnostics";
import type { FromBerContext } from "../parser";

/** Converts a local DER issue into the first diagnostic for the current node. @internal */
export function report(context: FromBerContext | undefined, issue: DerIssue): string {
  if (context?.encodingRules !== "DER") return "";

  const node = context.node;
  context.diagnostic ??= {
    code: issue.code,
    message: issue.message,
    offset: node?.tlvOffset ?? context.baseOffset ?? 0,
    depth: node?.depth ?? context.depth,
    ...(node && issue.contentOffset !== undefined ? { byteOffset: node.contentOffset + issue.contentOffset } : {}),
  };

  return issue.message;
}
