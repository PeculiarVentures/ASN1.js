export * from "./types";

// basic
export { ViewWriter } from "./ViewWriter";
export * from "./HexBlock";
export * from "./ValueBlock";
export {
  BaseBlock,
  IBaseBlock,
  BaseBlockParams,
  ValueBlockConstructor,
  BaseBlockJson,
  StringEncoding
} from "./BaseBlock";
export * from "./BaseStringBlock";

export * from "./Primitive";
export * from "./Constructed";
export * from "./EndOfContent";

// common
export * from "./Null";
export * from "./Boolean";
export * from "./OctetString";
export * from "./BitString";
export * from "./Integer";
export * from "./Enumerated";
export * from "./ObjectIdentifier";
export * from "./RelativeObjectIdentifier";
export * from "./Sequence";
export * from "./Set";

// strings
export * from "./Utf8String";
export * from "./BmpString";
export * from "./UniversalString";
export * from "./NumericString";
export * from "./PrintableString";
export * from "./TeletexString";
export * from "./VideotexString";
export * from "./IA5String";
export * from "./GraphicString";
export * from "./VisibleString";
export * from "./GeneralString";
export * from "./CharacterString";

// date and time
export * from "./UTCTime";
export * from "./GeneralizedTime";
export * from "./DATE";
export * from "./TimeOfDay";
export * from "./DateTime";
export * from "./Duration";
export * from "./TIME";

// schema types
export * from "./Any";
export * from "./Choice";
export * from "./Repeated";

// special
export * from "./RawData";

export {
  DEFAULT_MAX_CONTENT_LENGTH,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_NODES,
  FromBerOptions,
  FromBerResult,
  fromBER
} from "./parser";
export * from "./schema";
export { AsnType } from "./TypeStore";

import { registerBuiltinEncoder } from "./internals/BEREncoder";
import { registerFastParser } from "./parser";
import { BaseBlock, ORIGINAL_BASE_BLOCK_TO_BER } from "./BaseBlock";
import { BitString } from "./BitString";
import { Constructed } from "./Constructed";
import { Integer } from "./Integer";
import { Null } from "./Null";
import { OctetString } from "./OctetString";
import { Primitive } from "./Primitive";
import { Sequence } from "./Sequence";
import { Set } from "./Set";
import { ORIGINAL_VIEW_WRITER_FINAL, ORIGINAL_VIEW_WRITER_WRITE, ViewWriter } from "./ViewWriter";
import { LocalConstructedValueBlock, ORIGINAL_LOCAL_CONSTRUCTED_TO_BER } from "./internals/LocalConstructedValueBlock";
import { LocalIdentificationBlock, ORIGINAL_LOCAL_IDENTIFICATION_TO_BER } from "./internals/LocalIdentificationBlock";
import { LocalBitStringValueBlock, ORIGINAL_LOCAL_BIT_STRING_TO_BER } from "./internals/LocalBitStringValueBlock";
import { LocalIntegerValueBlock, ORIGINAL_LOCAL_INTEGER_TO_BER } from "./internals/LocalIntegerValueBlock";
import { LocalLengthBlock, ORIGINAL_LOCAL_LENGTH_TO_BER } from "./internals/LocalLengthBlock";
import { LocalOctetStringValueBlock, ORIGINAL_LOCAL_OCTET_STRING_TO_BER } from "./internals/LocalOctetStringValueBlock";
import { LocalPrimitiveValueBlock, ORIGINAL_LOCAL_PRIMITIVE_TO_BER } from "./internals/LocalPrimitiveValueBlock";

registerBuiltinEncoder(
  { BitString, Integer, OctetString, Primitive, Constructed, Sequence, Set },
  {
    BaseBlock,
    ViewWriter,
    LocalIdentificationBlock,
    LocalLengthBlock,
    LocalIntegerValueBlock,
    LocalOctetStringValueBlock,
    LocalConstructedValueBlock,
    LocalBitStringValueBlock,
    LocalPrimitiveValueBlock,
    originalBaseBlockToBER: ORIGINAL_BASE_BLOCK_TO_BER,
    originalWriterWrite: ORIGINAL_VIEW_WRITER_WRITE,
    originalWriterFinal: ORIGINAL_VIEW_WRITER_FINAL,
    originalIdentificationToBER: ORIGINAL_LOCAL_IDENTIFICATION_TO_BER,
    originalLengthToBER: ORIGINAL_LOCAL_LENGTH_TO_BER,
    originalIntegerToBER: ORIGINAL_LOCAL_INTEGER_TO_BER,
    originalOctetStringToBER: ORIGINAL_LOCAL_OCTET_STRING_TO_BER,
    originalBitStringToBER: ORIGINAL_LOCAL_BIT_STRING_TO_BER,
    originalConstructedToBER: ORIGINAL_LOCAL_CONSTRUCTED_TO_BER,
    originalPrimitiveToBER: ORIGINAL_LOCAL_PRIMITIVE_TO_BER
  }
);
registerFastParser({ Integer, Null, Sequence });
