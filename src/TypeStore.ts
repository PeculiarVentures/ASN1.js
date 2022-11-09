import type { BaseBlock } from "./BaseBlock";
import type { BitString } from "./BitString";
import type { BmpString } from "./BmpString";
import type { Boolean as AsnBoolean } from "./Boolean";
import type { CharacterString } from "./CharacterString";
import type { Constructed } from "./Constructed";
import type { DATE } from "./DATE";
import type { DateTime } from "./DateTime";
import type { Duration } from "./Duration";
import type { EndOfContent } from "./EndOfContent";
import type { Enumerated } from "./Enumerated";
import type { GeneralizedTime } from "./GeneralizedTime";
import type { GeneralString } from "./GeneralString";
import type { GraphicString } from "./GraphicString";
import type { IA5String } from "./IA5String";
import type { Integer } from "./Integer";
import type { Real } from "./Real";
import type { Null } from "./Null";
import type { NumericString } from "./NumericString";
import type { ObjectIdentifier } from "./ObjectIdentifier";
import type { OctetString } from "./OctetString";
import type { Primitive } from "./Primitive";
import type { PrintableString } from "./PrintableString";
import type { RelativeObjectIdentifier } from "./RelativeObjectIdentifier";
import type { Sequence } from "./Sequence";
import type { Set } from "./Set";
import type { TeletexString } from "./TeletexString";
import type { TIME } from "./TIME";
import type { TimeOfDay } from "./TimeOfDay";
import type { UniversalString } from "./UniversalString";
import type { UTCTime } from "./UTCTime";
import type { Utf8String } from "./Utf8String";
import type { VideotexString } from "./VideotexString";
import type { VisibleString } from "./VisibleString";

export type AsnType = BaseBlock | EndOfContent | AsnBoolean | Integer | Real | BitString | OctetString | Null | ObjectIdentifier | Enumerated | Utf8String | RelativeObjectIdentifier | TIME | Sequence | Set | NumericString | PrintableString | TeletexString | VideotexString | IA5String | UTCTime | GeneralizedTime | GraphicString | VisibleString | GeneralString | UniversalString | CharacterString | BmpString | DATE | TimeOfDay | DateTime | Duration | Constructed | Primitive;

export interface TypeStore {
  BitString: typeof BitString;
  BmpString: typeof BmpString;
  Boolean: typeof AsnBoolean;
  CharacterString: typeof CharacterString;
  Constructed: typeof Constructed;
  DATE: typeof DATE;
  DateTime: typeof DateTime;
  Duration: typeof Duration;
  EndOfContent: typeof EndOfContent;
  Enumerated: typeof Enumerated;
  GeneralizedTime: typeof GeneralizedTime;
  GeneralString: typeof GeneralString;
  GraphicString: typeof GraphicString;
  IA5String: typeof IA5String;
  Integer: typeof Integer;
  Null: typeof Null;
  NumericString: typeof NumericString;
  ObjectIdentifier: typeof ObjectIdentifier;
  OctetString: typeof OctetString;
  Primitive: typeof Primitive;
  PrintableString: typeof PrintableString;
  Real: typeof Real;
  RelativeObjectIdentifier: typeof RelativeObjectIdentifier;
  Sequence: typeof Sequence;
  Set: typeof Set;
  TeletexString: typeof TeletexString;
  TIME: typeof TIME;
  TimeOfDay: typeof TimeOfDay;
  UniversalString: typeof UniversalString;
  UTCTime: typeof UTCTime;
  Utf8String: typeof Utf8String;
  VideotexString: typeof VideotexString;
  VisibleString: typeof VisibleString;
}

export enum ETagClass {
  UNIVERSAL = 1,
  APPLICATION = 2,
  CONTEXT_SPECIFIC = 3,
  PRIVATE = 4
}

export enum EUniversalTagNumber {
  EndOfContent = 0,
  Boolean = 1,
  Integer = 2,
  BitString = 3,
  OctetString = 4,
  Null = 5,
  ObjectIdentifier = 6,
  // 7 - ObjectDescriptor
  // 8 - INSTANCE OF, EXTERNAL
  Real = 9,
  Enumerated = 10,
  // 11 - EMBEDDED PDV
  Utf8String = 12,
  RelativeObjectIdentifier = 13,
  TIME = 14,
  // 15
  Sequence = 16,
  Set = 17,
  NumericString = 18,
  PrintableString = 19,
  TeletexString = 20,
  VideotexString = 21,
  IA5String = 22,
  UTCTime = 23,
  GeneralizedTime = 24,
  GraphicString = 25,
  VisibleString = 26,
  GeneralString = 27,
  UniversalString = 28,
  CharacterString = 29,
  BmpString = 30,
  DATE = 31,
  TimeOfDay = 32,
  DateTime = 33,
  Duration = 34
}

export const typeStore = {} as TypeStore;
