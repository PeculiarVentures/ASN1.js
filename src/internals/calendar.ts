type InvalidTimeField = "month" | "day" | "hour" | "minute" | "second";

/** Returns the first invalid calendar or clock field in date-time order. @internal */
export function checkCalendarTime(year: number, month: number, day: number, hour: number, minute: number, second: number, allowLeapSecond = false): InvalidTimeField | undefined {
  if (month < 1 || month > 12) return "month";
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = month === 2 ? (leapYear ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
  if (day < 1 || day > monthDays) return "day";
  if (hour > 23) return "hour";
  if (minute > 59) return "minute";
  // GeneralizedTime follows ISO 8601, where a positive leap second ends a UTC month.
  const leapSecond = allowLeapSecond && second === 60 && hour === 23 && minute === 59 && day === monthDays;
  if (second > 59 && !leapSecond) return "second";

  return undefined;
}
