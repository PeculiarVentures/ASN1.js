import { typeStore } from "./TypeStore";
import { type IUTCTime, type UTCTimeParams, type UTCTimeJson, UTCTime, type DateStringEncoding } from "./UTCTime";

export interface IGeneralizedTime extends IUTCTime {
  millisecond: number;
}

export type GeneralizedTimeParams = UTCTimeParams;

export interface GeneralizedTimeJson extends UTCTimeJson {
  millisecond: number;
}

export class GeneralizedTime extends UTCTime {
  static {
    typeStore.GeneralizedTime = this;
  }

  public static override NAME = "GeneralizedTime";

  public millisecond: number;

  constructor(parameters: GeneralizedTimeParams = {}) {
    super(parameters);

    this.millisecond ??= 0;

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 24; // GeneralizedTime
  }

  protected override checkYear(): void {
    // GeneralizedTime has a four-digit year, so any year is representable
  }

  public override fromDate(inputDate: Date): void {
    super.fromDate(inputDate);
    this.millisecond = inputDate.getUTCMilliseconds();
  }

  public override toDate(): Date {
    // Date.UTC() reads the years 0-99 as 1900-1999, the setters do not
    const date = new Date(0);
    date.setUTCFullYear(this.year, this.month - 1, this.day);
    date.setUTCHours(this.hour, this.minute, this.second, this.millisecond);
    return date;
  }

  public override fromString(inputString: string): void {
    // #region Initial variables
    let isUTC = false;

    let timeString = "";
    let dateTimeString = "";
    let fractionPart = 0;

    let parser;

    let hasTimeDifference = false;
    let hourDifference = 0;
    let minuteDifference = 0;

    // Fields that the input string does not contain are zero, also when an instance is parsed again
    this.hour = 0;
    this.minute = 0;
    this.second = 0;
    this.millisecond = 0;
    // #endregion

    if (inputString[inputString.length - 1] === "Z") {
      // Convert as UTC time
      timeString = inputString.substring(0, inputString.length - 1);

      isUTC = true;
    } else {
      // Convert as local time
      const number = new Number(inputString[inputString.length - 1]);

      if (isNaN(number.valueOf())) throw new Error("Wrong input string for conversion");

      timeString = inputString;
    }

    if (isUTC) {
      // Check that we do not have a "+" and "-" symbols inside UTC time
      if (timeString.indexOf("+") !== -1) throw new Error("Wrong input string for conversion");

      if (timeString.indexOf("-") !== -1) throw new Error("Wrong input string for conversion");
    } else {
      // Convert as local time
      let multiplier = 1;
      let differencePosition = timeString.indexOf("+");
      let differenceString = "";

      if (differencePosition === -1) {
        differencePosition = timeString.indexOf("-");
        multiplier = -1;
      }

      if (differencePosition !== -1) {
        hasTimeDifference = true;
        differenceString = timeString.substring(differencePosition + 1);
        timeString = timeString.substring(0, differencePosition);

        if (!/^\d{2}(\d{2})?$/.test(differenceString)) throw new Error("Wrong input string for conversion");

        const hours = parseInt(differenceString.substring(0, 2), 10);
        const minutes = differenceString.length === 4 ? parseInt(differenceString.substring(2, 4), 10) : 0;

        if (hours > 23 || minutes > 59) throw new Error("Wrong input string for conversion");

        hourDifference = multiplier * hours;
        minuteDifference = multiplier * minutes;
      }
    }

    // #region Get position of fraction point
    let fractionPointPosition = timeString.indexOf("."); // Check for "full stop" symbol
    if (fractionPointPosition === -1) fractionPointPosition = timeString.indexOf(","); // Check for "comma" symbol
    // #endregion

    // #region Get fraction part
    if (fractionPointPosition !== -1) {
      const fractionPartCheck = new Number(`0${timeString.substring(fractionPointPosition)}`);

      if (isNaN(fractionPartCheck.valueOf())) throw new Error("Wrong input string for conversion");

      fractionPart = fractionPartCheck.valueOf();

      dateTimeString = timeString.substring(0, fractionPointPosition);
    } else dateTimeString = timeString;
    // #endregion

    // #region Parse internal date
    switch (true) {
      case dateTimeString.length === 8: // "YYYYMMDD"
        parser = /(\d{4})(\d{2})(\d{2})/gi;
        if (fractionPointPosition !== -1) throw new Error("Wrong input string for conversion"); // Here we should not have a "fraction point"
        break;
      case dateTimeString.length === 10: // "YYYYMMDDHH"
        parser = /(\d{4})(\d{2})(\d{2})(\d{2})/gi;

        if (fractionPointPosition !== -1) {
          let fractionResult = 60 * fractionPart;
          this.minute = Math.floor(fractionResult);

          fractionResult = 60 * (fractionResult - this.minute);
          this.second = Math.floor(fractionResult);

          fractionResult = 1000 * (fractionResult - this.second);
          this.millisecond = Math.floor(fractionResult);
        }
        break;
      case dateTimeString.length === 12: // "YYYYMMDDHHMM"
        parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/gi;

        if (fractionPointPosition !== -1) {
          let fractionResult = 60 * fractionPart;
          this.second = Math.floor(fractionResult);

          fractionResult = 1000 * (fractionResult - this.second);
          this.millisecond = Math.floor(fractionResult);
        }
        break;
      case dateTimeString.length === 14: // "YYYYMMDDHHMMSS"
        parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/gi;

        if (fractionPointPosition !== -1) {
          const fractionResult = 1000 * fractionPart;
          this.millisecond = Math.floor(fractionResult);
        }
        break;
      default:
        throw new Error("Wrong input string for conversion");
    }
    // #endregion

    // #region Put parsed values at right places
    const parserArray = parser.exec(dateTimeString);
    if (parserArray === null) throw new Error("Wrong input string for conversion");

    for (let j = 1; j < parserArray.length; j++) {
      switch (j) {
        case 1:
          this.year = parseInt(parserArray[j], 10);
          break;
        case 2:
          this.month = parseInt(parserArray[j], 10);
          break;
        case 3:
          this.day = parseInt(parserArray[j], 10);
          break;
        case 4:
          this.hour = parseInt(parserArray[j], 10);
          break;
        case 5:
          this.minute = parseInt(parserArray[j], 10);
          break;
        case 6:
          this.second = parseInt(parserArray[j], 10);
          break;
        default:
          throw new Error("Wrong input string for conversion");
      }
    }
    // #endregion

    // #region Check field ranges
    const isLeapYear = (this.year % 4 === 0 && this.year % 100 !== 0) || this.year % 400 === 0;
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][this.month - 1];

    if (this.month < 1 || this.month > 12 || this.day < 1 || this.day > daysInMonth || this.hour > 23 || this.minute > 59 || this.second > 59) {
      throw new Error("Wrong input string for conversion");
    }
    // #endregion

    // #region Get final date
    if (isUTC === false) {
      // With a time difference, UTC is the local time minus the difference.
      // Without one, the time is local time, so the result depends on the time zone of the host.
      // Unlike Date.UTC() and the Date constructor, the setters do not read the years 0-99 as 1900-1999.
      const tempDate = new Date(0);

      if (hasTimeDifference) {
        tempDate.setUTCFullYear(this.year, this.month - 1, this.day);
        tempDate.setUTCHours(this.hour - hourDifference, this.minute - minuteDifference, this.second, this.millisecond);
      } else {
        tempDate.setFullYear(this.year, this.month - 1, this.day);
        tempDate.setHours(this.hour, this.minute, this.second, this.millisecond);
      }

      this.fromDate(tempDate);
    }
    // #endregion
  }

  public override toString(encoding: DateStringEncoding = "iso"): string {
    if (encoding === "iso") {
      const outputArray = [];

      outputArray.push(String(this.year).padStart(4, "0"));
      outputArray.push(String(this.month).padStart(2, "0"));
      outputArray.push(String(this.day).padStart(2, "0"));
      outputArray.push(String(this.hour).padStart(2, "0"));
      outputArray.push(String(this.minute).padStart(2, "0"));
      outputArray.push(String(this.second).padStart(2, "0"));
      if (this.millisecond !== 0) {
        outputArray.push(".");
        // DER (X.690 11.7.3) forbids trailing zeros in the fractional seconds
        outputArray.push(String(this.millisecond).padStart(3, "0").replace(/0+$/, ""));
      }
      outputArray.push("Z");

      return outputArray.join("");
    }

    return super.toString(encoding);
  }

  public override toJSON(): GeneralizedTimeJson {
    return {
      ...super.toJSON(),
      millisecond: this.millisecond,
    };
  }
}
