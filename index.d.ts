/*!
 Copyright (c) Peculiar Ventures, LLC
*/

interface LocalBaseBlockParams {
  blockLength?: number | undefined;
  error?: string | undefined;
  warnings?: string[] | undefined;
  valueBeforeDecode?: ArrayBuffer | undefined;
}

interface JsonLocalBaseBlock {
  blockName: string;
  blockLength: number;
  error: string;
  warnings: string[];
  valueBeforeDecode: ArrayBuffer;
}

declare class HexBlock { }
declare class ValueBlock { }

type LocalBaseBlockType = typeof LocalBaseBlock;

declare class LocalBaseBlock {
  blockLength: number;
  error: string;
  warnings: string[];
  valueBeforeDecode: ArrayBuffer;

  constructor(params?: LocalBaseBlockParams);
  /**
   * Aux function, need to get a block name. Need to have it here for inheritance
   *
   * @static
   * @returns
   *
   * @memberOf LocalBaseBlock
   */
  static blockName(): string;
  /**
   * Conversion for the block to JSON object
   *
   * @returns
   *
   * @memberOf LocalBaseBlock
   */
  toJSON(): JsonLocalBaseBlock;
}

interface LocalHexBlockParams extends LocalBaseBlockParams {
  isHexOnly?: boolean | undefined;
  valueHex?: ArrayBuffer | undefined;
}

interface ILocalHexBlock {
  isHexOnly: boolean;
  valueHex: ArrayBuffer;
  /**
   * Base function for converting block from BER encoded array of bytes
   *
   * @param inputBuffer ASN.1 BER encoded array
   * @param inputOffset Offset in ASN.1 BER encoded array where decoding should be started
   * @param inputLength Maximum length of array of bytes which can be using in this function
   * @returns Offset after least decoded byte
   *
   * @memberOf LocalHexBlockMixin
   */
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  /**
   * Encoding of current ASN.1 block into ASN.1 encoded array (BER rules)
   *
   * @param [sizeOnly=false] Flag that we need only a size of encoding, not a real array of bytes
   * @returns
   *
   * @memberOf LocalHexBlockMixin
   */
  toBER(sizeOnly?: boolean): ArrayBuffer;
  /**
   * Conversion for the block to JSON object
   * @returns
   */
  toJSON(): any;
}

declare class LocalHexBlock implements ILocalHexBlock {
  isHexOnly: boolean;
  valueHex: ArrayBuffer;
  constructor(params: any);
  /**
   * Aux function, need to get a block name. Need to have it here for inheritance
   *
   * @static
   * @returns
   *
   * @memberOf LocalHexBlockMixin
   */
  static blockName(): string;
  /**
   * Base function for converting block from BER encoded array of bytes
   *
   * @param inputBuffer ASN.1 BER encoded array
   * @param inputOffset Offset in ASN.1 BER encoded array where decoding should be started
   * @param inputLength Maximum length of array of bytes which can be using in this function
   * @returns Offset after least decoded byte
   *
   * @memberOf LocalHexBlockMixin
   */
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  /**
   * Encoding of current ASN.1 block into ASN.1 encoded array (BER rules)
   *
   * @param [sizeOnly=false] Flag that we need only a size of encoding, not a real array of bytes
   * @returns
   *
   * @memberOf LocalHexBlockMixin
   */
  toBER(sizeOnly?: boolean): ArrayBuffer;
  /**
   * Conversion for the block to JSON object
   * @returns
   */
  toJSON(): any;
}

interface LocalIdentificationBlockParams {
  idBlock?: LocalHexBlockParams & {
      isConstructed?: boolean | undefined;
      tagClass?: number | undefined;
      tagNumber?: number | undefined;
  } | undefined;
}

declare class LocalIdentificationBlock extends LocalBaseBlock implements ILocalHexBlock {
  isConstructed: boolean;
  tagClass: number;
  tagNumber: number;

  constructor(params?: LocalIdentificationBlockParams);

  // ILocalHexBlock implementation
  isHexOnly: boolean;
  valueHex: ArrayBuffer;
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

interface LocalLengthBlockParams {
  lenBlock?: {
      isIndefiniteForm?: boolean | undefined;
      longFormUsed?: boolean | undefined;
      length: number;
  } | undefined;
}

declare class LocalLengthBlock extends LocalBaseBlock {
  isIndefiniteForm: boolean;
  longFormUsed: boolean;
  length: number;
  constructor(params?: LocalLengthBlockParams);
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): void;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

declare class LocalValueBlock extends LocalBaseBlock {
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): void;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

interface BaseBlockParams extends LocalBaseBlockParams {
  name?: string;
  optional?: boolean;
  primitiveSchema?: Object;
  idBlock?: {
      tagClass: number;
      tagNumber: number;
  };
  isHexOnly?: boolean;
  valueHex?: ArrayBuffer;
}

declare class BaseBlock<T extends LocalValueBlock> extends LocalBaseBlock {
  constructor(parameters?: BaseBlockParams, valueBlockType?: typeof LocalValueBlock);
  idBlock: LocalIdentificationBlock;
  lenBlock: LocalLengthBlock;
  valueBlock: T;
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

interface LocalPrimitiveValueBlockParams extends LocalBaseBlockParams {
  valueHex?: ArrayBuffer | undefined;
  isHexOnly?: boolean | undefined;
}
declare class LocalPrimitiveValueBlock extends LocalValueBlock {
  valueHex: ArrayBuffer;
  isHexOnly: boolean;
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

interface PrimitiveParams extends BaseBlockParams {
  lenBlockLength?: number;
  lenBlock?: { length?: number; };
  value?: any;
}

declare class Primitive extends BaseBlock<LocalPrimitiveValueBlock> {
  constructor(params?: PrimitiveParams);
}

interface LocalConstructedValueBlockParams extends LocalBaseBlockParams {
  value?: LocalValueBlock | undefined;
  isIndefiniteForm?: boolean | undefined;
}

declare class LocalConstructedValueBlock extends LocalValueBlock {
  value: any[];
  isIndefiniteForm: boolean;
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

interface ConstructedParams extends BaseBlockParams {
  lenBlock?: {
      isIndefiniteForm?: boolean;
  };
  value?: any[];
}

declare class Constructed extends BaseBlock<LocalConstructedValueBlock> {
  constructor(params?: ConstructedParams);
}

interface LocalEndOfContentValueBlockParams extends LocalBaseBlockParams { }

declare class LocalEndOfContentValueBlock extends LocalValueBlock {
  constructor(params?: LocalEndOfContentValueBlockParams);
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

declare class EndOfContent extends BaseBlock<LocalEndOfContentValueBlock> { }

interface LocalBooleanValueBlockParams extends LocalBaseBlockParams {
  value?: boolean | undefined;
  isHexOnly?: boolean | undefined;
  valueHex?: ArrayBuffer | undefined;
}
declare class LocalBooleanValueBlock extends LocalValueBlock {
  value: boolean;
  isHexOnly: boolean;
  valueHex: ArrayBuffer;
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

interface BooleanParams {
  value?: boolean;
  optional?: boolean;
  name?: string;
  valueHex?: ArrayBuffer;
}

declare class Boolean extends BaseBlock<LocalBooleanValueBlock> {
  constructor(params: BooleanParams);
}

declare class Sequence extends Constructed { }
declare class Set extends Constructed { }
declare class Null extends BaseBlock<LocalValueBlock> { }

interface LocalOctetStringValueBlockParams extends LocalConstructedValueBlockParams, LocalHexBlockParams {
  isConstructed?: boolean | undefined;
}

declare class LocalOctetStringValueBlock extends LocalConstructedValueBlock implements ILocalHexBlock {
  isConstructed: boolean;
  isHexOnly: boolean;
  valueHex: ArrayBuffer;

  constructor(params?: LocalOctetStringValueBlockParams);
}

interface OctetStringParams extends LocalOctetStringValueBlockParams {
  idBlock?: {
      isConstructed?: boolean;
  };
  name?: string;
  optional?: boolean;
}

declare class OctetString extends BaseBlock<LocalOctetStringValueBlock> {
  constructor(params?: OctetStringParams);
  /**
   * Checking that two OCTET STRINGs are equal
   * @param octetString
   */
  isEqual(octetString: OctetString): boolean;
}

interface LocalBitStringValueBlockParams extends LocalConstructedValueBlockParams, LocalHexBlockParams {
  unusedBits?: number | undefined;
  isConstructed?: boolean | undefined;
  blockLength?: number | undefined;
}

declare class LocalBitStringValueBlock extends LocalConstructedValueBlock implements LocalHexBlock {
  unusedBits: number;
  isConstructed: boolean;
  blockLength: number;
  isHexOnly: boolean;
  valueHex: ArrayBuffer;
  constructor(params?: LocalBitStringValueBlockParams);
}

interface BitStringParams extends LocalBitStringValueBlockParams {
  name?: string;
  optional?: boolean;
}

declare class BitString extends BaseBlock<LocalBitStringValueBlock> {
  constructor(params?: BitStringParams);
  /**
   * Checking that two BIT STRINGs are equal
   * @param bitString
   */
  isEqual(bitString: BitString): boolean;
}

interface LocalIntegerValueBlockParams extends LocalBaseBlockParams, LocalHexBlockParams {
}

declare class LocalIntegerValueBlock extends LocalValueBlock implements LocalHexBlock {
  valueDec: number;
  isHexOnly: boolean;
  valueHex: ArrayBuffer;
  constructor(params?: LocalIntegerValueBlockParams);
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
  /**
   * Base function for converting block from DER encoded array of bytes
   *
   * @param inputBuffer ASN.1 DER encoded array
   * @param inputOffset Offset in ASN.1 DER encoded array where decoding should be started
   * @param inputLength Maximum length of array of bytes which can be using in this function
   * @param [expectedLength=0] Expected length of converted "valueHex" buffer
   * @returns Offset after least decoded byte
   */
  fromDER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number, expectedLength?: number): number;
  /**
   * Encoding of current ASN.1 block into ASN.1 encoded array (DER rules)
   *
   * @param [sizeOnly=false] Flag that we need only a size of encoding, not a real array of bytes
   * @returns
   */
  toDER(sizeOnly?: boolean): ArrayBuffer;
}

interface IntegerParams {
  value?: number;
  optional?: boolean;
  name?: string;
  valueHex?: ArrayBuffer;
}
declare class Integer extends BaseBlock<LocalIntegerValueBlock> {
  constructor(params?: IntegerParams);
  /**
   * Compare two Integer object, or Integer and ArrayBuffer objects
   *
   * @param otherValue
   * @returns
   *
   * @memberOf Integer
   */
  isEqual(otherValue: Integer | ArrayBuffer): boolean;
  /**
   * Convert current Integer value from BER into DER format
   *
   * @returns
   */
  convertToDER(): Integer;
  /**
   * Convert current Integer value from DER to BER format
   * @returns
   */
  convertFromDER(): Integer;
}

declare class Enumerated extends Integer { }

interface LocalSidValueBlockParams extends LocalBaseBlockParams, LocalHexBlockParams {
  valueDec?: number | undefined;
  isFirstSid?: boolean | undefined;
}

declare class LocalSidValueBlock extends LocalBaseBlock implements LocalHexBlock {
  valueDec: number;
  isFirstSid: boolean;
  isHexOnly: boolean;
  valueHex: ArrayBuffer;
  constructor(params?: LocalSidValueBlockParams);
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
  toString(): string;
}

interface LocalObjectIdentifierValueBlockParams extends LocalBaseBlockParams {
  value?: string | undefined;
  name?: string;
}

declare class LocalObjectIdentifierValueBlock extends LocalValueBlock {
  constructor(params?: LocalObjectIdentifierValueBlockParams);

  /**
   * Create "LocalObjectIdentifierValueBlock" declare class from string
   *
   * @param string Input string to convert from
   * @returns
   */
  fromString(data: string): boolean;
  /**
   * Converts "LocalObjectIdentifierValueBlock" declare class to string
   *
   * @returns
   *
   * @memberOf LocalObjectIdentifierValueBlock
   */
  toString(): string;
}

declare class RelativeObjectIdentifier { }

interface ObjectIdentifierParams extends LocalObjectIdentifierValueBlockParams {
  optional?: boolean;
}

declare class ObjectIdentifier extends BaseBlock<LocalObjectIdentifierValueBlock> {
  constructor(params?: ObjectIdentifierParams);
}

interface LocalUtf8StringValueBlockParams extends LocalBaseBlockParams, LocalHexBlock {
}

declare class LocalUtf8StringValueBlock extends LocalBaseBlock implements LocalHexBlock {
  value: string;
  isHexOnly: boolean;
  valueHex: ArrayBuffer;
  constructor(params?: LocalSidValueBlockParams);
  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
  toString(): string;
}

interface Utf8StringParams {
  value?: string | undefined;
}

declare class Utf8String extends BaseBlock<LocalUtf8StringValueBlock> {
  constructor(params?: Utf8StringParams);
  /**
   * Function converting ArrayBuffer into ASN.1 internal string
   *
   * @param inputBuffer ASN.1 BER encoded array
   *
   * @memberOf Utf8String
   */
  fromBuffer(inputBuffer: ArrayBuffer): void;
  /**
   * Function converting JavaScript string into ASN.1 internal declare class
   *
   * @param inputString ASN.1 BER encoded array
   *
   * @memberOf Utf8String
   */
  fromString(inputString: string): void;
}

interface LocalBmpStringValueBlockParams extends LocalHexBlockParams, LocalBaseBlockParams {
}

declare class LocalBmpStringValueBlock extends LocalBaseBlock implements LocalHexBlock {
  value: string;
  isHexOnly: boolean;
  valueHex: ArrayBuffer;

  constructor(params?: LocalBmpStringValueBlockParams);

  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

interface BmpStringParams {
  value?: string | undefined;
}

declare class BmpString extends BaseBlock<LocalBmpStringValueBlock> {
  constructor(params?: BmpStringParams);
  /**
   * Function converting ArrayBuffer into ASN.1 internal string
   *
   * @param inputBuffer ASN.1 BER encoded array
   *
   * @memberOf BmpString
   */
  fromBuffer(inputBuffer: ArrayBuffer): void;
  /**
   * Function converting JavaScript string into ASN.1 internal declare class
   *
   * @param inputString ASN.1 BER encoded array
   *
   * @memberOf BmpString
   */
  fromString(inputString: string): void;
}

interface LocalUniversalStringValueParams extends LocalHexBlockParams, LocalBaseBlockParams {
}

declare class LocalUniversalStringValueBlock extends LocalBaseBlock implements LocalHexBlock {
  value: string;
  isHexOnly: boolean;
  valueHex: ArrayBuffer;

  constructor(params?: LocalUniversalStringValueParams);

  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

interface UniversalStringParams {
  value?: string | undefined;
}

declare class UniversalString extends BaseBlock<LocalUniversalStringValueBlock> {
  constructor(params?: UniversalStringParams);
  /**
   * Function converting ArrayBuffer into ASN.1 internal string
   *
   * @param inputBuffer ASN.1 BER encoded array
   *
   * @memberOf UniversalString
   */
  fromBuffer(inputBuffer: ArrayBuffer): void;
  /**
   * Function converting JavaScript string into ASN.1 internal declare class
   *
   * @param inputString ASN.1 BER encoded array
   *
   * @memberOf UniversalString
   */
  fromString(inputString: string): void;
}
interface LocalSimpleLocalSimpleStringValueBlockParams extends LocalHexBlockParams, LocalBaseBlockParams {
}

declare class LocalSimpleLocalSimpleStringValueBlock extends LocalBaseBlock implements LocalHexBlock {
  value: string;
  isHexOnly: boolean;
  valueHex: ArrayBuffer;

  constructor(params?: LocalSimpleLocalSimpleStringValueBlockParams);

  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

interface LocalSimpleStringBlockParams {
  value?: string | undefined;
}
declare class LocalSimpleStringBlock extends BaseBlock<LocalSimpleLocalSimpleStringValueBlock> {
  constructor(params?: LocalSimpleStringBlockParams);
  /**
   * Function converting ArrayBuffer into ASN.1 internal string
   *
   * @param inputBuffer ASN.1 BER encoded array
   *
   * @memberOf LocalSimpleStringBlock
   */
  fromBuffer(inputBuffer: ArrayBuffer): void;
  /**
   * Function converting JavaScript string into ASN.1 internal declare class
   *
   * @param inputString ASN.1 BER encoded array
   *
   * @memberOf LocalSimpleStringBlock
   */
  fromString(inputString: string): void;
}

declare class NumericString extends LocalSimpleStringBlock { }
declare class PrintableString extends LocalSimpleStringBlock { }
declare class TeletexString extends LocalSimpleStringBlock { }
declare class VideotexString extends LocalSimpleStringBlock { }
declare class IA5String extends LocalSimpleStringBlock { }
declare class GraphicString extends LocalSimpleStringBlock { }
declare class VisibleString extends LocalSimpleStringBlock { }
declare class GeneralString extends LocalSimpleStringBlock { }
declare class CharacterString extends LocalSimpleStringBlock { }

interface UTCTimeParams extends LocalSimpleLocalSimpleStringValueBlockParams {
  name?: string;
  value?: string;
  valueDate?: Date;
  optional?: boolean;
}

declare class UTCTime extends VisibleString {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  constructor(params?: UTCTimeParams);
  /**
   * Function converting ASN.1 internal string into ArrayBuffer
   *
   * @returns
   *
   * @memberOf UTCTime
   */
  toBuffer(): ArrayBuffer;
  /**
   * Function converting "Date" object into ASN.1 internal string
   *
   * @param inputDate JavaScript "Date" object
   *
   * @memberOf UTCTime
   */
  fromDate(inputDate: Date): void;
  /**
   * Function converting ASN.1 internal string into "Date" object
   *
   * @returns
   *
   * @memberOf UTCTime
   */
  toDate(): Date;
}

declare class GeneralizedTime extends UTCTime {
  millisecond: number;
}

declare class DATE extends Utf8String { }
declare class TimeOfDay extends Utf8String { }
declare class DateTime extends Utf8String { }
declare class Duration extends Utf8String { }
declare class TIME extends Utf8String { }

interface ChoiceParams {
  value?: LocalValueBlock[] | undefined;
  optional?: boolean | undefined;
}

declare class Choice {
  value: LocalValueBlock[];
  optional: boolean;
  constructor(params?: ChoiceParams);
}

interface AnyParams {
  name?: string | undefined;
  optional?: boolean | undefined;
}
declare class Any {
  name: string;
  optional: boolean;
  constructor(params?: AnyParams);
}

interface RepeatedParams {
  name?: string;
  optional?: boolean;
  value?: any;
  local?: boolean;
}
declare class Repeated {
  name: string;
  optional: boolean;
  value: any;
  local: boolean;
  constructor(params?: RepeatedParams);
}
interface RawDataParams {
  data?: ArrayBuffer | undefined;
}
declare class RawData {
  data: ArrayBuffer;

  constructor(params?: RawDataParams);

  fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number;
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

/**
* Major function for decoding ASN.1 BER array into internal library structures
*
* @param inputBuffer ASN.1 BER encoded array of bytes
* @returns
*/
declare function fromBER(inputBuffer: ArrayBuffer): { offset: number; result: any; };

/**
* Converting from JSON to ASN.1 objects
* @param json JSON string or object to convert to ASN.1 objects
*/
declare function fromJSON(json: string | object): any;

/**
* Compare of two ASN.1 object trees
*
* @param root Root of input ASN.1 object tree
* @param inputData Input ASN.1 object tree
* @param inputSchema Input ASN.1 schema to compare with
* @returns
*/
declare function compareSchema(root: any, inputData: any, inputSchema: any): { verified: boolean, result?: any; };

/**
* ASN.1 schema verification for ArrayBuffer data
*
* @param inputBuffer Input BER-encoded ASN.1 data
* @param inputSchema Input ASN.1 schema to verify against to
* @returns
*/
declare function verifySchema(inputBuffer: ArrayBuffer, inputSchema: any): { verified: boolean, result?: any; };

export {
  LocalBaseBlockType,
  Any,
  BaseBlock,
  BitString,
  BmpString,
  Boolean,
  CharacterString,
  Choice,
  Constructed,
  DATE,
  DateTime,
  Duration,
  EndOfContent,
  Enumerated,
  GeneralString,
  GeneralizedTime,
  GraphicString,
  HexBlock,
  IA5String,
  Integer,
  Null,
  NumericString,
  ObjectIdentifier,
  OctetString,
  Primitive,
  PrintableString,
  RawData,
  RelativeObjectIdentifier,
  Repeated,
  Sequence,
  Set,
  TIME,
  TeletexString,
  TimeOfDay,
  UTCTime,
  UniversalString,
  Utf8String,
  ValueBlock,
  VideotexString,
  VisibleString,
  compareSchema,
  fromBER,
  fromJSON,
  verifySchema,
};
