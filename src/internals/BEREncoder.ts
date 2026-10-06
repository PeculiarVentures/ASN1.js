import type { BaseBlock } from "../BaseBlock";
import type { ViewWriter } from "../ViewWriter";
import type { BitString } from "../BitString";
import type { Constructed } from "../Constructed";
import type { Integer } from "../Integer";
import type { OctetString } from "../OctetString";
import type { Primitive } from "../Primitive";
import type { Sequence } from "../Sequence";
import type { Set } from "../Set";
import type { LocalConstructedValueBlock } from "./LocalConstructedValueBlock";
import type { LocalIdentificationBlock } from "./LocalIdentificationBlock";
import type { LocalBitStringValueBlock } from "./LocalBitStringValueBlock";
import type { LocalIntegerValueBlock } from "./LocalIntegerValueBlock";
import type { LocalLengthBlock } from "./LocalLengthBlock";
import type { LocalOctetStringValueBlock } from "./LocalOctetStringValueBlock";
import type { LocalPrimitiveValueBlock } from "./LocalPrimitiveValueBlock";

type PrimitiveBlock = BaseBlock & {
  idBlock: LocalIdentificationBlock;
  lenBlock: LocalLengthBlock;
  valueBlock: LocalBitStringValueBlock | LocalIntegerValueBlock | LocalOctetStringValueBlock | LocalPrimitiveValueBlock;
};

type ConstructedBlock = BaseBlock & {
  idBlock: LocalIdentificationBlock;
  lenBlock: LocalLengthBlock;
  valueBlock: LocalConstructedValueBlock;
};

interface EncoderNode {
  id: ArrayBuffer;
  len: ArrayBuffer;
  payload: Uint8Array | EncoderNode;
  length: number;
  total: number;
  indefinite: boolean;
  prefix?: Uint8Array;
}

type BuiltinKind = "bit" | "integer" | "octet" | "primitive" | "constructed";

interface ValidatedNode {
  block: BaseBlock;
  kind: BuiltinKind;
  idBlock: LocalIdentificationBlock;
  lenBlock: LocalLengthBlock;
  indefinite: boolean;
  payload?: Uint8Array;
  child?: ValidatedNode;
  prefix?: Uint8Array;
}

interface BuiltinConstructors {
  BitString: typeof BitString;
  Integer: typeof Integer;
  OctetString: typeof OctetString;
  Primitive: typeof Primitive;
  Constructed: typeof Constructed;
  Sequence: typeof Sequence;
  Set: typeof Set;
}

interface BuiltinInternals {
  BaseBlock: typeof BaseBlock;
  ViewWriter: typeof ViewWriter;
  LocalIdentificationBlock: typeof LocalIdentificationBlock;
  LocalLengthBlock: typeof LocalLengthBlock;
  LocalIntegerValueBlock: typeof LocalIntegerValueBlock;
  LocalOctetStringValueBlock: typeof LocalOctetStringValueBlock;
  LocalConstructedValueBlock: typeof LocalConstructedValueBlock;
  LocalBitStringValueBlock: typeof LocalBitStringValueBlock;
  LocalPrimitiveValueBlock: typeof LocalPrimitiveValueBlock;
  originalBaseBlockToBER: BaseBlock["toBER"];
  originalWriterWrite: ViewWriter["write"];
  originalWriterFinal: ViewWriter["final"];
  originalIdentificationToBER: LocalIdentificationBlock["toBER"];
  originalLengthToBER: LocalLengthBlock["toBER"];
  originalIntegerToBER: LocalIntegerValueBlock["toBER"];
  originalOctetStringToBER: LocalOctetStringValueBlock["toBER"];
  originalBitStringToBER: LocalBitStringValueBlock["toBER"];
  originalConstructedToBER: LocalConstructedValueBlock["toBER"];
  originalPrimitiveToBER: Function;
}

interface BuiltinRegistry extends BuiltinConstructors, BuiltinInternals {}

const originalUint8ArraySliceInfo = findMethod(Uint8Array.prototype, "slice");
const originalUint8ArrayConstructor = Object.getOwnPropertyDescriptor(Uint8Array.prototype, "constructor")?.value;
const originalArrayIterator = Object.getOwnPropertyDescriptor(Array.prototype, Symbol.iterator)?.value;
const intrinsicTypedArrayByteLength = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype),
  "byteLength"
)?.get;
// Small payloads do not amortize full validation; this only gates that validator.
const BUILTIN_DISPATCH_PAYLOAD_THRESHOLD = 16384;
const BUILTIN_DISPATCH_MAX_DEPTH = 64;

let builtinRegistry: BuiltinRegistry | undefined;

/** @internal */
export function registerBuiltinEncoder(builtinConstructors: BuiltinConstructors, internals?: BuiltinInternals): void {
  const current = builtinRegistry;
  const nextInternals = internals || current;
  if (!nextInternals) {
    builtinRegistry = undefined;
    return;
  }

  builtinRegistry = { ...nextInternals, ...builtinConstructors };
}

function dataProperty<T>(object: object, name: string): T | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(object, name);
  if (!descriptor || !("value" in descriptor)) return undefined;

  return descriptor.value as T;
}

function intrinsicPayloadByteLength(value: unknown): number | undefined {
  if (!intrinsicTypedArrayByteLength || !value || typeof value !== "object") return undefined;

  try {
    const byteLength = intrinsicTypedArrayByteLength.call(value);
    return typeof byteLength === "number" ? byteLength : undefined;
  } catch {
    return undefined;
  }
}

function largePayloadOrChain(block: unknown, depth: number): boolean {
  if (depth > BUILTIN_DISPATCH_MAX_DEPTH || !block || typeof block !== "object") return false;

  const valueBlockDescriptor = Object.getOwnPropertyDescriptor(block, "valueBlock");
  if (!valueBlockDescriptor || !("value" in valueBlockDescriptor)) return false;
  const valueBlock = valueBlockDescriptor.value;
  if (!valueBlock || typeof valueBlock !== "object") return false;

  const payloadDescriptor = Object.getOwnPropertyDescriptor(valueBlock, "valueHexView");
  if (payloadDescriptor) {
    if (!("value" in payloadDescriptor)) return false;
    const byteLength = intrinsicPayloadByteLength(payloadDescriptor.value);
    return byteLength !== undefined && byteLength >= BUILTIN_DISPATCH_PAYLOAD_THRESHOLD;
  }

  const valuesDescriptor = Object.getOwnPropertyDescriptor(valueBlock, "value");
  if (!valuesDescriptor || !("value" in valuesDescriptor) || !Array.isArray(valuesDescriptor.value)) return false;
  const values = valuesDescriptor.value;
  const lengthDescriptor = Object.getOwnPropertyDescriptor(values, "length");
  if (!lengthDescriptor || !("value" in lengthDescriptor) || lengthDescriptor.value !== 1) return false;
  const indexDescriptor = Object.getOwnPropertyDescriptor(values, "0");
  if (!indexDescriptor || !("value" in indexDescriptor)) return false;

  return largePayloadOrChain(indexDescriptor.value, depth + 1);
}

/** @internal */
export function shouldUseBuiltinEncoder(block: BaseBlock): boolean {
  try {
    return largePayloadOrChain(block, 0);
  } catch {
    return false;
  }
}

function sameDataMethod(current: PropertyDescriptor | undefined, original: Function): current is PropertyDescriptor {
  return (
    !!current &&
    "value" in current &&
    current.value === original &&
    current.writable === true &&
    current.enumerable === false &&
    current.configurable === true
  );
}

function writerMethodsStable(registry: BuiltinRegistry): boolean {
  return (
    sameDataMethod(
      Object.getOwnPropertyDescriptor(registry.ViewWriter.prototype, "write"),
      registry.originalWriterWrite
    ) &&
    sameDataMethod(
      Object.getOwnPropertyDescriptor(registry.ViewWriter.prototype, "final"),
      registry.originalWriterFinal
    )
  );
}

function findMethod(prototype: object, name: string): { declaringPrototype: object; method: Function } | undefined {
  let current: object | null = prototype;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, name);
    if (descriptor) {
      if ("value" in descriptor && typeof descriptor.value === "function") {
        return { declaringPrototype: current, method: descriptor.value };
      }
      return undefined;
    }
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

function stableInheritedMethod(
  prototype: object,
  name: string,
  original: { declaringPrototype: object; method: Function } | undefined
): boolean {
  if (!original) return false;
  let current: object | null = prototype;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, name);
    if (current === original.declaringPrototype) {
      return !!descriptor && "value" in descriptor && descriptor.value === original.method;
    }
    if (descriptor) return false;
    current = Object.getPrototypeOf(current);
  }
  return false;
}

function prototypeMethod(object: object, prototype: object, name: string, expected: Function): boolean {
  if (Object.prototype.hasOwnProperty.call(object, name)) return false;
  if (Object.getPrototypeOf(object) !== prototype) return false;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
  return !!descriptor && "value" in descriptor && descriptor.value === expected;
}

function inheritedMethod(
  object: object,
  name: string,
  expected: Function,
  primitiveConstructor: typeof LocalPrimitiveValueBlock
): boolean {
  if (Object.prototype.hasOwnProperty.call(object, name)) return false;
  const prototype = Object.getPrototypeOf(object);
  const originalPrimitiveValuePrototype = Object.getPrototypeOf(primitiveConstructor.prototype) as object;
  if (
    prototype !== primitiveConstructor.prototype ||
    Object.getPrototypeOf(prototype) !== originalPrimitiveValuePrototype
  ) {
    return false;
  }
  const descriptor = prototype && Object.getOwnPropertyDescriptor(prototype, name);
  if (descriptor) return false;
  const parentDescriptor = Object.getOwnPropertyDescriptor(originalPrimitiveValuePrototype, name);
  return !!parentDescriptor && "value" in parentDescriptor && parentDescriptor.value === expected;
}

function plainPayload(value: unknown, allowEmpty = false): Uint8Array | undefined {
  if (!(value instanceof Uint8Array) || Object.getPrototypeOf(value) !== Uint8Array.prototype) return undefined;

  // A caller can install an own accessor on a typed-array instance. Check only
  // the metadata used below; never enumerate the indexed payload properties.
  for (const name of ["buffer", "byteOffset", "byteLength", "length", "slice", "constructor"]) {
    if (Object.prototype.hasOwnProperty.call(value, name)) return undefined;
  }
  const constructorDescriptor = Object.getOwnPropertyDescriptor(Uint8Array.prototype, "constructor");
  if (
    !constructorDescriptor ||
    !("value" in constructorDescriptor) ||
    constructorDescriptor.value !== originalUint8ArrayConstructor
  )
    return undefined;
  if (!stableInheritedMethod(Uint8Array.prototype, "slice", originalUint8ArraySliceInfo)) return undefined;

  try {
    const buffer = value.buffer;
    if (!(buffer instanceof ArrayBuffer) || Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype) return undefined;
    // Avoid invoking caller-defined backing-buffer byteLength accessors.
    if (Object.prototype.hasOwnProperty.call(buffer, "byteLength")) return undefined;
    if (value.byteLength !== value.length || (!allowEmpty && value.byteLength === 0)) return undefined;
    if (value.byteOffset < 0 || value.byteOffset + value.byteLength > buffer.byteLength) return undefined;
  } catch {
    return undefined;
  }

  return value;
}

function validIdBlock(block: LocalIdentificationBlock, constructed: boolean, registry: BuiltinRegistry): boolean {
  if (Object.getPrototypeOf(block) !== registry.LocalIdentificationBlock.prototype) return false;
  if (
    !prototypeMethod(block, registry.LocalIdentificationBlock.prototype, "toBER", registry.originalIdentificationToBER)
  )
    return false;

  const tagClass = dataProperty<number>(block, "tagClass");
  const tagNumber = dataProperty<number>(block, "tagNumber");
  const isConstructed = dataProperty<boolean>(block, "isConstructed");
  const isHexOnly = dataProperty<boolean>(block, "isHexOnly");
  const valueHexView = dataProperty<Uint8Array>(block, "valueHexView");
  if (typeof tagClass !== "number" || !Number.isInteger(tagClass) || tagClass < 1 || tagClass > 4) return false;
  if (typeof tagNumber !== "number" || !Number.isInteger(tagNumber) || tagNumber < 0) return false;
  if (isConstructed !== constructed || typeof isHexOnly !== "boolean") return false;

  if (isHexOnly) return !!plainPayload(valueHexView);
  return Number.isSafeInteger(tagNumber);
}

function validLengthBlock(block: LocalLengthBlock, allowIndefinite: boolean, registry: BuiltinRegistry): boolean {
  if (Object.getPrototypeOf(block) !== registry.LocalLengthBlock.prototype) return false;
  if (!prototypeMethod(block, registry.LocalLengthBlock.prototype, "toBER", registry.originalLengthToBER)) return false;

  const indefinite = dataProperty<boolean>(block, "isIndefiniteForm");
  const longForm = dataProperty<boolean>(block, "longFormUsed");
  const lengthDescriptor = Object.getOwnPropertyDescriptor(block, "length");
  const length = lengthDescriptor && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
  const longFormDescriptor = Object.getOwnPropertyDescriptor(block, "longFormUsed");
  return (
    typeof indefinite === "boolean" &&
    (indefinite === false || allowIndefinite) &&
    typeof longForm === "boolean" &&
    !!longFormDescriptor &&
    "value" in longFormDescriptor &&
    longFormDescriptor.writable === true &&
    !!lengthDescriptor &&
    "value" in lengthDescriptor &&
    lengthDescriptor.writable === true &&
    typeof length === "number" &&
    Number.isSafeInteger(length) &&
    length >= 0
  );
}

function validBaseBlock(block: BaseBlock, isConstructed: boolean, registry: BuiltinRegistry): boolean {
  const idBlock = dataProperty<LocalIdentificationBlock>(block, "idBlock");
  const lenBlock = dataProperty<LocalLengthBlock>(block, "lenBlock");
  return (
    !!idBlock &&
    !!lenBlock &&
    validIdBlock(idBlock, isConstructed, registry) &&
    validLengthBlock(lenBlock, isConstructed, registry)
  );
}

function constructedChild(block: ConstructedBlock, registry: BuiltinRegistry): BaseBlock | undefined {
  const valueBlock = dataProperty<LocalConstructedValueBlock>(block, "valueBlock");
  if (!valueBlock || Object.getPrototypeOf(valueBlock) !== registry.LocalConstructedValueBlock.prototype)
    return undefined;
  if (
    !prototypeMethod(
      valueBlock,
      registry.LocalConstructedValueBlock.prototype,
      "toBER",
      registry.originalConstructedToBER
    )
  )
    return undefined;

  const values = dataProperty<unknown>(valueBlock, "value");
  if (!Array.isArray(values) || Object.getPrototypeOf(values) !== Array.prototype) return undefined;
  const lengthDescriptor = Object.getOwnPropertyDescriptor(values, "length");
  if (!lengthDescriptor || !("value" in lengthDescriptor) || lengthDescriptor.value !== 1) return undefined;
  if (Object.prototype.hasOwnProperty.call(values, Symbol.iterator)) return undefined;
  const iteratorDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, Symbol.iterator);
  if (!iteratorDescriptor || !("value" in iteratorDescriptor) || iteratorDescriptor.value !== originalArrayIterator)
    return undefined;
  const indexDescriptor = Object.getOwnPropertyDescriptor(values, "0");
  if (!indexDescriptor || !("value" in indexDescriptor)) return undefined;
  if (Object.getOwnPropertyNames(values).length !== 2) return undefined;

  return indexDescriptor.value as BaseBlock;
}

function bitPayload(
  block: PrimitiveBlock,
  registry: BuiltinRegistry
): { payload: Uint8Array; prefix: Uint8Array } | undefined {
  const valueBlock = dataProperty<LocalBitStringValueBlock>(block, "valueBlock");
  if (!valueBlock || Object.getPrototypeOf(valueBlock) !== registry.LocalBitStringValueBlock.prototype)
    return undefined;
  if (
    !prototypeMethod(valueBlock, registry.LocalBitStringValueBlock.prototype, "toBER", registry.originalBitStringToBER)
  )
    return undefined;
  if (dataProperty<boolean>(valueBlock, "isConstructed") !== false) return undefined;

  const unusedBits = dataProperty<number>(valueBlock, "unusedBits");
  if (typeof unusedBits !== "number" || !Number.isInteger(unusedBits) || unusedBits < 0 || unusedBits > 7)
    return undefined;
  const payload = plainPayload(dataProperty<Uint8Array>(valueBlock, "valueHexView"), true);
  if (!payload) return undefined;
  return { payload, prefix: Uint8Array.of(payload.byteLength ? unusedBits : 0) };
}

function primitivePayload(
  block: PrimitiveBlock,
  kind: "integer" | "octet" | "primitive",
  registry: BuiltinRegistry
): Uint8Array | undefined {
  const valueBlock = dataProperty<PrimitiveBlock["valueBlock"]>(block, "valueBlock");
  if (!valueBlock) return undefined;

  if (kind === "integer") {
    if (Object.getPrototypeOf(valueBlock) !== registry.LocalIntegerValueBlock.prototype) return undefined;
    if (!prototypeMethod(valueBlock, registry.LocalIntegerValueBlock.prototype, "toBER", registry.originalIntegerToBER))
      return undefined;
  } else if (kind === "octet") {
    if (Object.getPrototypeOf(valueBlock) !== registry.LocalOctetStringValueBlock.prototype) return undefined;
    if (
      !prototypeMethod(
        valueBlock,
        registry.LocalOctetStringValueBlock.prototype,
        "toBER",
        registry.originalOctetStringToBER
      )
    )
      return undefined;
    if (dataProperty<boolean>(valueBlock, "isConstructed") !== false) return undefined;
  } else {
    if (Object.getPrototypeOf(valueBlock) !== registry.LocalPrimitiveValueBlock.prototype) return undefined;
    if (!inheritedMethod(valueBlock, "toBER", registry.originalPrimitiveToBER, registry.LocalPrimitiveValueBlock))
      return undefined;
  }

  if (kind === "primitive" && dataProperty<boolean>(valueBlock, "isHexOnly") !== true) return undefined;
  if (typeof dataProperty<boolean>(valueBlock, "isHexOnly") !== "boolean") return undefined;
  return plainPayload(dataProperty<Uint8Array>(valueBlock, "valueHexView"));
}

function validOuterMethod(block: BaseBlock, registry: BuiltinRegistry): boolean {
  if (Object.prototype.hasOwnProperty.call(block, "toBER")) return false;

  let prototype: object | null = block;
  while (prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "toBER");
    if (descriptor) return "value" in descriptor && descriptor.value === registry.originalBaseBlockToBER;
    prototype = Object.getPrototypeOf(prototype);
  }
  return false;
}

function isPrimitive(
  block: BaseBlock,
  type: keyof Pick<BuiltinConstructors, "BitString" | "Integer" | "OctetString" | "Primitive">,
  registry: BuiltinRegistry
): boolean {
  const constructor = registry[type];
  return !!constructor && Object.getPrototypeOf(block) === constructor.prototype;
}

function isConstructed(block: BaseBlock, registry: BuiltinRegistry): boolean {
  return (
    Object.getPrototypeOf(block) === registry.Sequence.prototype ||
    Object.getPrototypeOf(block) === registry.Set.prototype ||
    Object.getPrototypeOf(block) === registry.Constructed.prototype
  );
}

function inspectNode(block: BaseBlock, depth: number, registry: BuiltinRegistry): ValidatedNode | undefined {
  if (depth > 64 || !block || typeof block !== "object") return undefined;

  try {
    if (!validOuterMethod(block, registry)) return undefined;
    const primitiveKind = isPrimitive(block, "BitString", registry)
      ? "bit"
      : isPrimitive(block, "Integer", registry)
        ? "integer"
        : isPrimitive(block, "OctetString", registry)
          ? "octet"
          : isPrimitive(block, "Primitive", registry)
            ? "primitive"
            : undefined;
    const constructed = primitiveKind === undefined && isConstructed(block, registry);
    if (!primitiveKind && !constructed) return undefined;
    if (!validBaseBlock(block, constructed, registry)) return undefined;
    const idBlock = dataProperty<LocalIdentificationBlock>(block, "idBlock");
    const lenBlock = dataProperty<LocalLengthBlock>(block, "lenBlock");
    if (!idBlock || !lenBlock) return undefined;

    if (primitiveKind) {
      const bit = primitiveKind === "bit" ? bitPayload(block as PrimitiveBlock, registry) : undefined;
      const payload =
        primitiveKind === "bit" ? bit?.payload : primitivePayload(block as PrimitiveBlock, primitiveKind, registry);
      return payload
        ? { block, kind: primitiveKind, idBlock, lenBlock, indefinite: false, payload, prefix: bit?.prefix }
        : undefined;
    }

    const child = constructedChild(block as ConstructedBlock, registry);
    const validatedChild = child && inspectNode(child, depth + 1, registry);
    const indefinite = dataProperty<boolean>(lenBlock, "isIndefiniteForm");
    return validatedChild
      ? { block, kind: "constructed", idBlock, lenBlock, indefinite: indefinite === true, child: validatedChild }
      : undefined;
  } catch {
    return undefined;
  }
}

function buildNode(node: ValidatedNode, sizeOnly: boolean, registry: BuiltinRegistry): EncoderNode {
  // Match BaseBlock's observable ordering: the identifier is encoded before
  // any child/value serializer can run.
  const id = Reflect.apply(registry.originalIdentificationToBER, node.idBlock, [sizeOnly]);
  if (!(id instanceof ArrayBuffer) || id.byteLength === 0) throw TypeError("Built-in identifier encoding failed");

  let payload: Uint8Array | EncoderNode;
  if (node.kind === "constructed") {
    payload = buildNode(node.child as ValidatedNode, sizeOnly, registry);
  } else {
    payload = node.payload as Uint8Array;
  }

  const length = (payload instanceof Uint8Array ? payload.byteLength : payload.total) + (node.prefix?.byteLength ?? 0);
  let len: ArrayBuffer;
  if (node.indefinite) {
    len = Uint8Array.of(0x80).buffer;
  } else {
    node.lenBlock.length = length;
    len = Reflect.apply(registry.originalLengthToBER, node.lenBlock, [sizeOnly]);
    if (!(len instanceof ArrayBuffer) || len.byteLength === 0) throw TypeError("Built-in length encoding failed");
  }

  const total = id.byteLength + len.byteLength + length + (node.indefinite ? 2 : 0);
  if (!Number.isSafeInteger(total)) throw RangeError("Built-in encoding is too large");
  return { id, len, payload, length, total, indefinite: node.indefinite, prefix: node.prefix };
}

function flatten(node: EncoderNode, output: Uint8Array, offset: number, sizeOnly: boolean): number {
  output.set(new Uint8Array(node.id), offset);
  offset += node.id.byteLength;
  output.set(new Uint8Array(node.len), offset);
  offset += node.len.byteLength;
  if (node.prefix) {
    if (!sizeOnly) output.set(node.prefix, offset);
    offset += node.prefix.byteLength;
  }
  if (node.payload instanceof Uint8Array) {
    if (!sizeOnly) output.set(node.payload, offset);
    offset += node.payload.byteLength;
  } else {
    offset = flatten(node.payload, output, offset, sizeOnly);
  }

  if (node.indefinite) offset += 2;
  return offset;
}

/** @internal */
export function tryEncodeBuiltin(block: BaseBlock, sizeOnly = false): ArrayBuffer | undefined {
  // Keep the discovery pass free of serializer calls and mutations. This is
  // what makes an unsupported child fall back to the original whole-tree path.
  const registry = builtinRegistry;
  if (!registry || !writerMethodsStable(registry)) return undefined;

  const validated = inspectNode(block, 0, registry);
  if (!validated) return undefined;

  const node = buildNode(validated, sizeOnly, registry);

  const output = new Uint8Array(node.total);
  flatten(node, output, 0, sizeOnly);
  return output.buffer;
}
