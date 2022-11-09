/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as pvutils from "pvutils";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { IDerConvertible } from "../types";
import { ValueBlock, ValueBlockJson, ValueBlockParams } from "../ValueBlock";
import { powers2, digitsString } from "./constants";
import { getNumberParts, getSignedFromUnsigned } from "./utils";

function viewAdd(first: Uint8Array, second: Uint8Array): Uint8Array {
  //#region Initial variables
  const c = new Uint8Array([0]);

  const firstView = new Uint8Array(first);
  const secondView = new Uint8Array(second);

  let firstViewCopy = firstView.slice(0);
  const firstViewCopyLength = firstViewCopy.length - 1;
  const secondViewCopy = secondView.slice(0);
  const secondViewCopyLength = secondViewCopy.length - 1;

  let value = 0;

  const max = (secondViewCopyLength < firstViewCopyLength) ? firstViewCopyLength : secondViewCopyLength;

  let counter = 0;
  //#endregion
  for (let i = max; i >= 0; i--, counter++) {
    switch (true) {
      case (counter < secondViewCopy.length):
        value = firstViewCopy[firstViewCopyLength - counter] + secondViewCopy[secondViewCopyLength - counter] + c[0];
        break;
      default:
        value = firstViewCopy[firstViewCopyLength - counter] + c[0];
    }

    c[0] = value / 10;

    switch (true) {
      case (counter >= firstViewCopy.length):
        firstViewCopy = pvutils.utilConcatView(new Uint8Array([value % 10]), firstViewCopy);
        break;
      default:
        firstViewCopy[firstViewCopyLength - counter] = value % 10;
    }
  }

  if (c[0] > 0)
    firstViewCopy = pvutils.utilConcatView(c, firstViewCopy);

  return firstViewCopy;
}

function power2(n: number): Uint8Array {
  if (n >= powers2.length) {
    for (let p = powers2.length; p <= n; p++) {
      const c = new Uint8Array([0]);
      let digits = (powers2[p - 1]).slice(0);

      for (let i = (digits.length - 1); i >= 0; i--) {
        const newValue = new Uint8Array([(digits[i] << 1) + c[0]]);
        c[0] = newValue[0] / 10;
        digits[i] = newValue[0] % 10;
      }

      if (c[0] > 0)
        digits = pvutils.utilConcatView(c, digits);

      powers2.push(digits);
    }
  }

  return powers2[n];
}

function viewSub(first: Uint8Array, second: Uint8Array): Uint8Array {
  //#region Initial variables
  let b = 0;

  const firstView = new Uint8Array(first);
  const secondView = new Uint8Array(second);

  const firstViewCopy = firstView.slice(0);
  const firstViewCopyLength = firstViewCopy.length - 1;
  const secondViewCopy = secondView.slice(0);
  const secondViewCopyLength = secondViewCopy.length - 1;

  let value;

  let counter = 0;
  //#endregion
  for (let i = secondViewCopyLength; i >= 0; i--, counter++) {
    value = firstViewCopy[firstViewCopyLength - counter] - secondViewCopy[secondViewCopyLength - counter] - b;

    switch (true) {
      case (value < 0):
        b = 1;
        firstViewCopy[firstViewCopyLength - counter] = value + 10;
        break;
      default:
        b = 0;
        firstViewCopy[firstViewCopyLength - counter] = value;
    }
  }

  if (b > 0) {
    for (let i = (firstViewCopyLength - secondViewCopyLength + 1); i >= 0; i--, counter++) {
      value = firstViewCopy[firstViewCopyLength - counter] - b;

      if (value < 0) {
        b = 1;
        firstViewCopy[firstViewCopyLength - counter] = value + 10;
      }
      else {
        b = 0;
        firstViewCopy[firstViewCopyLength - counter] = value;
        break;
      }
    }
  }

  return firstViewCopy.slice();
}

export interface ILocalRealValueBlock {
  value: number;
}

export interface LocalRealValueBlockParams extends HexBlockParams, ValueBlockParams, Partial<ILocalRealValueBlock> { }

export interface LocalRealValueBlockJson extends HexBlockJson, ValueBlockJson {
  valueDec: number;
}

enum ASN1RealBaseType {
  // Encoding X.690 (02/2021) - 8.5.7 binary encoding
  base2 = 0,
  // Encoding X.690 (02/2021) - 8.5.7 binary encoding
  base8 = 1,
  // Encoding X.690 (02/2021) - 8.5.7 binary encoding
  base16 = 2,
  // For future use
  reserved = 3
}

export class LocalRealValueBlock extends HexBlock(ValueBlock) implements IDerConvertible {
  protected setValueHex(): void {
    if (this.valueHexView.length > 0) {
      this._value = 0;

      if (this.valueHexView.length > 0) {
        // Decoding goes here...
        const info = this.valueHexView[0];

        // First octet
        // XSBBFFEE
        // X Encoding, 1 = binary encoding
        // S Sign,0 ) positiv 1 = negativ
        // B base
        // B base
        // F scaling factor high
        // F scaling factor low
        // E Exponent size high
        // E Exponent size low

        // Following octets:
        // Exponent (E value, defined by the exponent size above)
        // Mantissa (N value)

        if ((info & 0x80) === 0x80)
          this.decodeBinary();
        else if ((info & 0xC0) === 0)
          this.decodeDecimal();
        else if ((info & 0xC0) === 0x40)
          this.decodeSpecialRealValue();
        else
          this.warnings.push("Unknown real encoding");
      }
    }
  }

  private decodeBinary(): void {
    const info = this.valueHexView[0];

    const sign = BigInt(info & 0x40 ? -1 : 1);
    let mantissa = BigInt(0);
    let exponent = BigInt(0);
    let value = BigInt(0);

    const baseType: ASN1RealBaseType = (info & 0x30) >> 4;
    const scaling = (info & 0x0C) >> 2;
    let exponentSize = info & 0x03;

    let base = 2;
    switch (baseType) {
      case ASN1RealBaseType.base2:
        base = 2;
        break;
      case ASN1RealBaseType.base8:
        base = 8;
        break;
      case ASN1RealBaseType.base16:
        base = 16;
        break;
      default:
      case ASN1RealBaseType.reserved:
        this.warnings.push("Unknown real base type");
        return;
    }

    let valueOffset = 1;
    if (exponentSize < 3)
      exponentSize += 1;
    else {
      valueOffset++;
      exponentSize = this.valueHexView[1];
    }

    // Read the exponent, if we have more than one value we shift the values to the left and add the next integer
    for (let iPos = 0; iPos < exponentSize; iPos++) {
        if (iPos > 0)
          exponent <<= BigInt(8);
        exponent |= BigInt(getSignedFromUnsigned(this.valueHexView[iPos + valueOffset]));
    }
    valueOffset += exponentSize;

    // Read the mantissa
    const iMax = this.valueHexView.length - valueOffset;
    for (let iPos = 0; iPos < iMax; iPos++) {
        if (iPos > 0)
          value <<= BigInt(8);
        value |= BigInt(this.valueHexView[iPos + valueOffset]);
    }

    mantissa = sign * value * BigInt(Math.pow(2, scaling));
    this._value = Math.pow(base, Number(exponent)) * Number(mantissa);
    this.isHexOnly = false;
  }

  private decodeDecimal(): void {
    this.warnings.push("Decimal encoding is currently not supported");
  }

  private decodeSpecialRealValue(): void {
    if (this.valueHexView.length !== 1)
      this.warnings.push(`Invalid length (${this.valueHexView.length}) for a special real value`);

    const info = this.valueHexView[0];
    if(info === 0x40) {
      this._value = Number.POSITIVE_INFINITY;
      this.isHexOnly = false;
    } else if(info === 0x41) {
      this._value = Number.NEGATIVE_INFINITY;
      this.isHexOnly = false;
    } else if(info === 0x42) {
      this._value = Number.NaN;
      this.isHexOnly = false;
    } else if(info === 0x43) {
      this._value = 0;
      this.isHexOnly = false;
    } else
      this.warnings.push(`Invalid value (${info.toString(16)}) for a special real value`);
  }

  public static override NAME = "RealValueBlock";

  static {
    Object.defineProperty(this.prototype, "valueHex", {
      set: function (this: LocalRealValueBlock, v: ArrayBuffer) {
        this.valueHexView = new Uint8Array(v);

        this.setValueHex();
      },
      get: function (this: LocalRealValueBlock) {
        return this.valueHexView.slice().buffer;
      },
    });
  }

  private _value = 0;

  constructor({
    value,
    ...parameters
  }: LocalRealValueBlockParams = {}) {
    super(parameters);

    if (parameters.valueHex) {
      this.setValueHex();
    }

    if (value !== undefined) {
      this.value = value;
    }
  }

  public set value(v: number) {
    this._value = v;

    if(v === 0) {
      this.isHexOnly = false;
      this.valueHexView = new Uint8Array();
      return;
    } else if(v === Number.POSITIVE_INFINITY) {
      this.isHexOnly = false;
      this.valueHexView = new Uint8Array(0x40);
      return;
    } else if(v === Number.NEGATIVE_INFINITY) {
      this.isHexOnly = false;
      this.valueHexView = new Uint8Array(0x41);
      return;
    } else if(Number.isNaN(v)) {
      this.isHexOnly = false;
      this.valueHexView = new Uint8Array(0x42);
      return;
    }

    // Separate mantissa and exponent
    // We do only encode in base 2 binary notation

    const parts = getNumberParts(v);
    let exponent = parts.exponent;
    const mantissaElements = new Array<number>();

    let tmpMantissa = parts.mantissa;
    /* Convert mantissa into an unsigned integer */
    for(let iCount = 0; iCount < 8; iCount++) {
      /* Normalize, so shift 8 bits worth to the left of the decimal */
      tmpMantissa *= (1<<8);

      /* Grab only (octet sized) the integer part */
      const truncatedMantissa = tmpMantissa & 0xff;

      /* remove part to left of decimal now for next iteration */
      tmpMantissa -= truncatedMantissa;

      /* write into tmp buffer */
      mantissaElements.push(truncatedMantissa);

      /* If we shift the mantissa to the left we need to adopt the exponent accordingly */
      exponent -= 8;

      if (!tmpMantissa)
        break;
    }

    const encodedExponent = new Uint8Array(pvutils.utilEncodeTC(exponent));
    const exponentLength = encodedExponent.length;

    // Binary encoded Real
    let firstOctet = 0x80;
    // Negative value
    if(parts.sign == -1)
        firstOctet |= 0x40;

    // How long is the exponent value?
    switch (exponentLength)
    {
        case 1:
            firstOctet |= 0x00;
            break;
        case 2:
            firstOctet |= 0x01;
            break;
        case 3:
            firstOctet |= 0x02;
            break;
        default:
            firstOctet |= 0x03;
            break;
    }

    let lengthTotal = 1;
    lengthTotal += exponentLength;
    lengthTotal += mantissaElements.length;
    this.valueHexView = new Uint8Array(lengthTotal);
    this.valueHexView[0] = firstOctet;
    for(let iPos = 0; iPos < exponentLength; iPos++)
      this.valueHexView[iPos + 1] = encodedExponent[iPos];
    for(let iPos = 0; iPos < mantissaElements.length; iPos++)
      this.valueHexView[iPos + exponentLength + 1] = mantissaElements[iPos];
    this.isHexOnly = false;
  }

  public get value(): number {
    return this._value;
  }

  public fromDER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number, expectedLength = 0): number {
    const offset = this.fromBER(inputBuffer, inputOffset, inputLength);
    if (offset === -1)
      return offset;

    const view = this.valueHexView;

    if ((view[0] === 0x00) && ((view[1] & 0x80) !== 0)) {
      this.valueHexView = view.subarray(1);
    }
    else {
      if (expectedLength !== 0) {
        if (view.length < expectedLength) {
          if ((expectedLength - view.length) > 1)
            expectedLength = view.length + 1;

          this.valueHexView = view.subarray(expectedLength - view.length);
        }
      }
    }

    return offset;
  }

  public toDER(sizeOnly = false): ArrayBuffer {
    const view = this.valueHexView;

    switch (true) {
      case ((view[0] & 0x80) !== 0):
        {
          const updatedView = new Uint8Array(this.valueHexView.length + 1);

          updatedView[0] = 0x00;
          updatedView.set(view, 1);

          this.valueHexView = updatedView;
        }
        break;
      case ((view[0] === 0x00) && ((view[1] & 0x80) === 0)):
        {
          this.valueHexView = this.valueHexView.subarray(1);
        }
        break;
      default:
    }

    return this.toBER(sizeOnly);
  }

  public override fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number {
    const resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
    if (resultOffset === -1) {
      return resultOffset;
    }

    this.setValueHex();

    return resultOffset;
  }

  public override toBER(sizeOnly?: boolean): ArrayBuffer {
    return sizeOnly
      ? new ArrayBuffer(this.valueHexView.length)
      : this.valueHexView.slice().buffer;
  }

  public override toJSON(): LocalRealValueBlockJson {
    return {
      ...super.toJSON(),
      valueDec: this.value,
    };
  }

  public override toString(): string {
    //#region Initial variables
    const firstBit = (this.valueHexView.length * 8) - 1;

    let digits = new Uint8Array((this.valueHexView.length * 8) / 3);
    let bitNumber = 0;
    let currentByte;

    const asn1View = this.valueHexView;

    let result = "";

    let flag = false;
    //#endregion
    //#region Calculate number
    for (let byteNumber = (asn1View.byteLength - 1); byteNumber >= 0; byteNumber--) {
      currentByte = asn1View[byteNumber];

      for (let i = 0; i < 8; i++) {
        if ((currentByte & 1) === 1) {
          switch (bitNumber) {
            case firstBit:
              digits = viewSub(power2(bitNumber), digits);
              result = "-";
              break;
            default:
              digits = viewAdd(digits, power2(bitNumber));
          }
        }

        bitNumber++;
        currentByte >>= 1;
      }
    }
    //#endregion
    //#region Print number
    for (let i = 0; i < digits.length; i++) {
      if (digits[i])
        flag = true;

      if (flag)
        result += digitsString.charAt(digits[i]);
    }

    if (flag === false)
      result += digitsString.charAt(0);
    //#endregion

    return result;
  }

}

export interface LocalRealValueBlock {
  /**
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueBeforeDecode: ArrayBuffer;
  /**
   * Binary data in ArrayBuffer representation
   *
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueHex: ArrayBuffer;
}
