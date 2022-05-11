import * as pvtsutils from "pvtsutils";
import * as pvutils from "pvutils";
import { BaseBlockJson, StringEncoding } from "./BaseBlock";
import { LocalSimpleStringValueBlockJson } from "./internals/LocalSimpleStringValueBlock";
import { IDateConvertible } from "./types";
import { typeStore } from "./TypeStore";
import { VisibleStringParams, VisibleString } from "./VisibleString";

export interface IUTCTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface UTCTimeParams extends VisibleStringParams {
  value?: string;
  valueDate?: Date;
}
export interface UTCTimeJson extends BaseBlockJson<LocalSimpleStringValueBlockJson>, IUTCTime { }

export type DateStringEncoding = StringEncoding | "iso";

export class UTCTime extends VisibleString implements IUTCTime, IDateConvertible {

  static {
    typeStore.UTCTime = this;
  }

  public static override NAME = "UTCTime";

  public year: number;
  public month: number;
  public day: number;
  public hour: number;
  public minute: number;
  public second: number;

  constructor({
    value,
    valueDate,
    ...parameters
  }: UTCTimeParams = {}) {
    super(parameters);

    this.year = 0;
    this.month = 0;
    this.day = 0;
    this.hour = 0;
    this.minute = 0;
    this.second = 0;

    //#region Create UTCTime from ASN.1 UTC string value
    if (value) {
      this.fromString(value);

      this.valueBlock.valueHexView = new Uint8Array(value.length);

      for (let i = 0; i < value.length; i++)
        this.valueBlock.valueHexView[i] = value.charCodeAt(i);
    }
    //#endregion
    //#region Create GeneralizedTime from JavaScript Date type
    if (valueDate) {
      this.fromDate(valueDate);
      this.valueBlock.valueHexView = new Uint8Array(this.toBuffer());
    }
    //#endregion
    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 23; // UTCTime
  }

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    this.fromString(String.fromCharCode.apply(null, pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer) as unknown as number[]));
  }

  /**
   * Function converting ASN.1 internal string into ArrayBuffer
   * @returns
   */
  public toBuffer(): ArrayBuffer {
    const str = this.toString(); // TODO use this.valueBlock.value and update toString

    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < str.length; i++)
      view[i] = str.charCodeAt(i);

    return buffer;
  }

  /**
   * Function converting "Date" object into ASN.1 internal string
   * @param {!Date} inputDate JavaScript "Date" object
   */
  public fromDate(inputDate: Date): void {
    this.year = inputDate.getUTCFullYear();
    this.month = inputDate.getUTCMonth() + 1;
    this.day = inputDate.getUTCDate();
    this.hour = inputDate.getUTCHours();
    this.minute = inputDate.getUTCMinutes();
    this.second = inputDate.getUTCSeconds();
  }

  public toDate(): Date {
    return (new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second)));
  }

  public override fromString(inputString: string): void {
    //#region Parse input string
    const parser = /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z/ig;
    const parserArray = parser.exec(inputString);
    if (parserArray === null) {
      this.error = "Wrong input string for conversion";

      return;
    }
    //#endregion
    //#region Store parsed values
    const year = parseInt(parserArray[1], 10);
    if (year >= 50)
      this.year = 1900 + year;

    else
      this.year = 2000 + year;

    this.month = parseInt(parserArray[2], 10);
    this.day = parseInt(parserArray[3], 10);
    this.hour = parseInt(parserArray[4], 10);
    this.minute = parseInt(parserArray[5], 10);
    this.second = parseInt(parserArray[6], 10);
    //#endregion
  }

  public override toString(encoding: DateStringEncoding = "iso"): string {
    if (encoding === "iso") {
      const outputArray = new Array(7);

      outputArray[0] = pvutils.padNumber(((this.year < 2000) ? (this.year - 1900) : (this.year - 2000)), 2);
      outputArray[1] = pvutils.padNumber(this.month, 2);
      outputArray[2] = pvutils.padNumber(this.day, 2);
      outputArray[3] = pvutils.padNumber(this.hour, 2);
      outputArray[4] = pvutils.padNumber(this.minute, 2);
      outputArray[5] = pvutils.padNumber(this.second, 2);
      outputArray[6] = "Z";

      return outputArray.join("");
    }

    return super.toString(encoding);
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof UTCTime).NAME} : ${this.toDate().toISOString()}`;
  }

  public override toJSON(): UTCTimeJson {
    return {
      ...super.toJSON(),
      year: this.year,
      month: this.month,
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      second: this.second,
    };
  }

}
