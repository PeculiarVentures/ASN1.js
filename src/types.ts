
export interface IBerConvertible {

  /**
   * Base function for converting block from BER encoded array of bytes
   * @param inputBuffer ASN.1 BER encoded array
   * @param inputOffset Offset in ASN.1 BER encoded array where decoding should be started
   * @param inputLength Maximum length of array of bytes which can be using in this function
   * @returns Offset after least decoded byte
   */
  fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number;
  /**
   * Encoding of current ASN.1 block into ASN.1 encoded array (BER rules)
   * @param sizeOnly Flag that we need only a size of encoding, not a real array of bytes
   * @returns ASN.1 BER encoded array
   */
  toBER(sizeOnly?: boolean): ArrayBuffer;
}

export interface IDerConvertible {
  /**
   * Base function for converting block from DER encoded array of bytes
   * @param inputBuffer ASN.1 DER encoded array
   * @param inputOffset Offset in ASN.1 DER encoded array where decoding should be started
   * @param inputLength Maximum length of array of bytes which can be using in this function
   * @param expectedLength Expected length of converted VALUE_HEX buffer
   * @returns Offset after least decoded byte
   */
  fromDER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number, expectedLength?: number): number;
  /**
   * Encoding of current ASN.1 block into ASN.1 encoded array (DER rules)
   * @param sizeOnly Flag that we need only a size of encoding, not a real array of bytes
   * @returns ASN.1 DER encoded array
   */
  toDER(sizeOnly?: boolean): ArrayBuffer;
}

export interface IStringConvertible {
  /**
   * Returns a string representation of an object
   * @returns String representation of the class object
   */
  toString(): string;
  /**
   * Creates a class object from the string
   * @param data Input string to convert from
   */
  fromString(data: string): void;
}

export interface IDateConvertible {
  /**
   * Converts a class object into the JavaScrip Date Object
   * @returns Date object
   */
  toDate(): Date;
  /**
   * Creates a class object from the JavaScript Date object
   * @param date Date object
   */
  fromDate(date: Date): void;
}