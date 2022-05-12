import * as pvutils from "pvutils";
import { typeStore } from "./TypeStore";
import { IUTCTime, UTCTimeParams, UTCTimeJson, UTCTime, DateStringEncoding } from "./UTCTime";

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

  public override fromDate(inputDate: Date): void {
    super.fromDate(inputDate);
    this.millisecond = inputDate.getUTCMilliseconds();
  }

  public override toDate(): Date {
    return (new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second, this.millisecond)));
  }

  public override fromString(inputString: string): void {
    //#region Initial variables
    let isUTC = false;

    let timeString = "";
    let dateTimeString = "";
    let fractionPart = 0;

    let parser;

    let hourDifference = 0;
    let minuteDifference = 0;
    //#endregion

    //#region Convert as UTC time
    if (inputString[inputString.length - 1] === "Z") {
      timeString = inputString.substring(0, inputString.length - 1);

      isUTC = true;
    }
    //#endregion
    //#region Convert as local time
    else {
      const number = new Number(inputString[inputString.length - 1]);

      if (isNaN(number.valueOf()))
        throw new Error("Wrong input string for conversion");

      timeString = inputString;
    }
    //#endregion

    //#region Check that we do not have a "+" and "-" symbols inside UTC time
    if (isUTC) {
      if (timeString.indexOf("+") !== -1)
        throw new Error("Wrong input string for conversion");

      if (timeString.indexOf("-") !== -1)
        throw new Error("Wrong input string for conversion");
    }
    //#endregion
    //#region Get "UTC time difference" in case of local time
    else {
      let multiplier = 1;
      let differencePosition = timeString.indexOf("+");
      let differenceString = "";

      if (differencePosition === -1) {
        differencePosition = timeString.indexOf("-");
        multiplier = -1;
      }

      if (differencePosition !== -1) {
        differenceString = timeString.substring(differencePosition + 1);
        timeString = timeString.substring(0, differencePosition);

        if ((differenceString.length !== 2) && (differenceString.length !== 4))
          throw new Error("Wrong input string for conversion");

        let number = parseInt(differenceString.substring(0, 2), 10);

        if (isNaN(number.valueOf()))
          throw new Error("Wrong input string for conversion");

        hourDifference = multiplier * number;

        if (differenceString.length === 4) {
          number = parseInt(differenceString.substring(2, 4), 10);

          if (isNaN(number.valueOf()))
            throw new Error("Wrong input string for conversion");

          minuteDifference = multiplier * number;
        }
      }
    }
    //#endregion

    //#region Get position of fraction point
    let fractionPointPosition = timeString.indexOf("."); // Check for "full stop" symbol
    if (fractionPointPosition === -1)
      fractionPointPosition = timeString.indexOf(","); // Check for "comma" symbol
    //#endregion

    //#region Get fraction part
    if (fractionPointPosition !== -1) {
      const fractionPartCheck = new Number(`0${timeString.substring(fractionPointPosition)}`);

      if (isNaN(fractionPartCheck.valueOf()))
        throw new Error("Wrong input string for conversion");

      fractionPart = fractionPartCheck.valueOf();

      dateTimeString = timeString.substring(0, fractionPointPosition);
    }
    else
      dateTimeString = timeString;
    //#endregion

    //#region Parse internal date
    switch (true) {
      case (dateTimeString.length === 8): // "YYYYMMDD"
        parser = /(\d{4})(\d{2})(\d{2})/ig;
        if (fractionPointPosition !== -1)
          throw new Error("Wrong input string for conversion"); // Here we should not have a "fraction point"
        break;
      case (dateTimeString.length === 10): // "YYYYMMDDHH"
        parser = /(\d{4})(\d{2})(\d{2})(\d{2})/ig;

        if (fractionPointPosition !== -1) {
          let fractionResult = 60 * fractionPart;
          this.minute = Math.floor(fractionResult);

          fractionResult = 60 * (fractionResult - this.minute);
          this.second = Math.floor(fractionResult);

          fractionResult = 1000 * (fractionResult - this.second);
          this.millisecond = Math.floor(fractionResult);
        }
        break;
      case (dateTimeString.length === 12): // "YYYYMMDDHHMM"
        parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/ig;

        if (fractionPointPosition !== -1) {
          let fractionResult = 60 * fractionPart;
          this.second = Math.floor(fractionResult);

          fractionResult = 1000 * (fractionResult - this.second);
          this.millisecond = Math.floor(fractionResult);
        }
        break;
      case (dateTimeString.length === 14): // "YYYYMMDDHHMMSS"
        parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/ig;

        if (fractionPointPosition !== -1) {
          const fractionResult = 1000 * fractionPart;
          this.millisecond = Math.floor(fractionResult);
        }
        break;
      default:
        throw new Error("Wrong input string for conversion");
    }
    //#endregion

    //#region Put parsed values at right places
    const parserArray = parser.exec(dateTimeString);
    if (parserArray === null)
      throw new Error("Wrong input string for conversion");

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
          this.hour = parseInt(parserArray[j], 10) + hourDifference;
          break;
        case 5:
          this.minute = parseInt(parserArray[j], 10) + minuteDifference;
          break;
        case 6:
          this.second = parseInt(parserArray[j], 10);
          break;
        default:
          throw new Error("Wrong input string for conversion");
      }
    }
    //#endregion

    //#region Get final date
    if (isUTC === false) {
      const tempDate = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second, this.millisecond);

      this.year = tempDate.getUTCFullYear();
      this.month = tempDate.getUTCMonth();
      this.day = tempDate.getUTCDay();
      this.hour = tempDate.getUTCHours();
      this.minute = tempDate.getUTCMinutes();
      this.second = tempDate.getUTCSeconds();
      this.millisecond = tempDate.getUTCMilliseconds();
    }
    //#endregion
  }

  public override toString(encoding: DateStringEncoding = "iso"): string {
    if (encoding === "iso") {
      const outputArray = [];

      outputArray.push(pvutils.padNumber(this.year, 4));
      outputArray.push(pvutils.padNumber(this.month, 2));
      outputArray.push(pvutils.padNumber(this.day, 2));
      outputArray.push(pvutils.padNumber(this.hour, 2));
      outputArray.push(pvutils.padNumber(this.minute, 2));
      outputArray.push(pvutils.padNumber(this.second, 2));
      if (this.millisecond !== 0) {
        outputArray.push(".");
        outputArray.push(pvutils.padNumber(this.millisecond, 3));
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
