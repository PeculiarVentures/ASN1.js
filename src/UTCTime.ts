import { toUint8Array } from "@peculiar/utils";
import type { BaseBlockJson, StringEncoding } from "./BaseBlock";
import type { LocalSimpleStringValueBlockJson } from "./internals/LocalSimpleStringValueBlock";
import type { IDateConvertible } from "./types";
import { typeStore } from "./TypeStore";
import { type VisibleStringParams, VisibleString } from "./VisibleString";
import { bytesToString } from "./internals/stringUtils";

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
export interface UTCTimeJson extends BaseBlockJson<LocalSimpleStringValueBlockJson>, IUTCTime {}

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

  constructor({ value, valueDate, ...parameters }: UTCTimeParams = {}) {
    super(parameters);

    this.year = 0;
    this.month = 0;
    this.day = 0;
    this.hour = 0;
    this.minute = 0;
    this.second = 0;

    // #region Create UTCTime from ASN.1 UTC string value
    if (value) {
      this.fromString(value);

      this.valueBlock.valueHexView = new Uint8Array(value.length);

      for (let i = 0; i < value.length; i++) this.valueBlock.valueHexView[i] = value.charCodeAt(i);
    }
    // #endregion
    // #region Create GeneralizedTime from JavaScript Date type
    if (valueDate) {
      this.fromDate(valueDate);
      this.valueBlock.valueHexView = new Uint8Array(this.toBuffer());
    }
    // #endregion
    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 23; // UTCTime
  }

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    this.fromString(bytesToString(toUint8Array(inputBuffer)));
  }

  /**
   * Function converting ASN.1 internal string into ArrayBuffer
   * @returns
   */
  public toBuffer(): ArrayBuffer {
    this.checkYear();

    const str = this.toString(); // TODO use this.valueBlock.value and update toString

    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i);

    return buffer;
  }

  /**
   * Throws if the year cannot be encoded
   */
  protected checkYear(): void {
    // UTCTime has a two-digit year, so 1950-2049 is all it can represent (RFC 5280 4.1.2.5.1)
    if (!(this.year >= 1950 && this.year <= 2049)) {
      throw new RangeError(`UTCTime year must be between 1950 and 2049, got ${this.year}; use GeneralizedTime instead`);
    }
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
    return new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second));
  }

  public override fromString(inputString: string): void {
    // #region Parse input string
    // Keep the legacy tolerance for canonical values while accepting the other BER forms.
    const parserArray = /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z/i.exec(inputString) ?? /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?(Z|([+-])(\d{2})(\d{2}))$/i.exec(inputString);
    if (parserArray === null) {
      this.error = "Wrong input string for conversion";

      return;
    }

    const offsetHour = parseInt(parserArray[9] ?? "0", 10);
    const offsetMinute = parseInt(parserArray[10] ?? "0", 10);
    if (offsetHour > 23 || offsetMinute > 59) {
      this.error = "Wrong input string for conversion";

      return;
    }
    // #endregion
    // #region Store parsed values
    const year = parseInt(parserArray[1], 10);
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;
    const month = parseInt(parserArray[2], 10);
    const day = parseInt(parserArray[3], 10);
    const hour = parseInt(parserArray[4], 10);
    const minute = parseInt(parserArray[5], 10);
    const second = parseInt(parserArray[6] ?? "0", 10);

    if (parserArray[8]) {
      // Validate only the new signed-offset form before UTC normalization.
      const leapYear = fullYear % 4 === 0 && (fullYear % 100 !== 0 || fullYear % 400 === 0);
      const monthDays = month === 2 ? (leapYear ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
      if (month < 1 || month > 12 || day < 1 || day > monthDays || hour > 23 || minute > 59 || second > 59) {
        this.error = "Wrong input string for conversion";

        return;
      }
    }

    this.year = fullYear;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.minute = minute;
    this.second = second;

    if (parserArray[8]) {
      // X.680 defines the signed zone as local time minus UTC.
      const offset = (offsetHour * 60 + offsetMinute) * (parserArray[8] === "+" ? 1 : -1);
      this.fromDate(new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute - offset, this.second)));
    }

    this.error = "";
    // #endregion
  }

  public override toString(encoding: DateStringEncoding = "iso"): string {
    if (encoding === "iso") {
      const outputArray = Array.from<string>({ length: 7 });

      outputArray[0] = String(this.year % 100).padStart(2, "0");
      outputArray[1] = String(this.month).padStart(2, "0");
      outputArray[2] = String(this.day).padStart(2, "0");
      outputArray[3] = String(this.hour).padStart(2, "0");
      outputArray[4] = String(this.minute).padStart(2, "0");
      outputArray[5] = String(this.second).padStart(2, "0");
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
