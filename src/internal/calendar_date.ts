const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The number of days in `month` (1 to 12) of `year`. */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * A day with no time or offset, so it names the same day in every time zone. Immutable: every method returns a new
 * one. Months count from 1, as in `YYYY-MM-DD`.
 */
export class CalendarDate {
  constructor(
    readonly year: number,
    readonly month: number,
    readonly day: number,
  ) {}

  /** The calendar date `value` names as `YYYY-MM-DD`, or `null` when it names none, such as `2026-02-30`. */
  static parse(value: string | null | undefined): CalendarDate | null {
    const match = ISO_DATE.exec(value ?? '');
    if (!match) return null;

    const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
    return new CalendarDate(year, month, day);
  }

  /**
   * The date moved by `years` and `months`, keeping the day within the month it lands in (January 31 plus a month is
   * February 28, or 29), then by `days`.
   */
  add({ years = 0, months = 0, days = 0 }: { years?: number; months?: number; days?: number }): CalendarDate {
    const monthIndex = this.year * 12 + (this.month - 1) + years * 12 + months;
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex - year * 12 + 1;
    const day = Math.min(this.day, daysInMonth(year, month));
    if (!days) return new CalendarDate(year, month, day);

    // A UTC day is always 24 hours long, so day arithmetic in UTC can't drift across a daylight saving change.
    const moved = new Date(Date.UTC(year, month - 1, day + days));
    return new CalendarDate(moved.getUTCFullYear(), moved.getUTCMonth() + 1, moved.getUTCDate());
  }

  /** The day of the week, `0` being Sunday, as `Date#getDay()` and Ruby's `Date#wday` count. */
  get dayOfWeek(): number {
    return new Date(Date.UTC(this.year, this.month - 1, this.day)).getUTCDay();
  }

  /** The first day of the week the date is in, a week starting on `firstDayOfWeek` (`0` being Sunday). */
  startOfWeek(firstDayOfWeek: number): CalendarDate {
    return this.add({ days: -((this.dayOfWeek - firstDayOfWeek + 7) % 7) });
  }

  /** The last day of the week the date is in, a week starting on `firstDayOfWeek`. */
  endOfWeek(firstDayOfWeek: number): CalendarDate {
    return this.startOfWeek(firstDayOfWeek).add({ days: 6 });
  }

  /** The first day of the date's month. */
  startOfMonth(): CalendarDate {
    return new CalendarDate(this.year, this.month, 1);
  }

  /** The last day of the date's month. */
  endOfMonth(): CalendarDate {
    return new CalendarDate(this.year, this.month, daysInMonth(this.year, this.month));
  }

  /**
   * The date's month as six weeks starting on `firstDayOfWeek`, filled with days of the months before and after, so a
   * grid of it has the same height for every month.
   */
  monthGrid(firstDayOfWeek: number): CalendarDate[][] {
    const first = this.startOfMonth().startOfWeek(firstDayOfWeek);
    return Array.from({ length: 6 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => first.add({ days: week * 7 + day })));
  }

  /** Negative when the date comes before `other`, positive when after, `0` when they are the same day. */
  compare(other: CalendarDate): number {
    return this.year - other.year || this.month - other.month || this.day - other.day;
  }

  /** Whether `other` is the same day. */
  equals(other: CalendarDate | null): boolean {
    return !!other && this.compare(other) === 0;
  }

  /** Negative when the date's month comes before `other`'s, positive when after, `0` when they are the same month. */
  compareMonth(other: CalendarDate): number {
    return this.year - other.year || this.month - other.month;
  }

  /** Whether `other` falls in the same month of the same year. */
  isSameMonth(other: CalendarDate): boolean {
    return this.compareMonth(other) === 0;
  }

  /** The date as `YYYY-MM-DD`. */
  toString(): string {
    return `${String(this.year).padStart(4, '0')}-${pad(this.month)}-${pad(this.day)}`;
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

/** Two calendar dates and every day from one to the other, both included. A week is one, and a single day is too. */
export interface DateRange {
  start: CalendarDate;
  end: CalendarDate;
}

/** Whether `date` falls in `range`, its start and end included. */
export function rangeIncludes(range: DateRange | null, date: CalendarDate): boolean {
  return !!range && date.compare(range.start) >= 0 && date.compare(range.end) <= 0;
}

/** Whether `a` and `b` share a day. */
export function rangesOverlap(a: DateRange | null, b: DateRange | null): boolean {
  return !!a && !!b && a.start.compare(b.end) <= 0 && b.start.compare(a.end) <= 0;
}

/** Whether `a` and `b` are the same range of days. */
export function rangeEquals(a: DateRange | null, b: DateRange | null): boolean {
  return !!a && !!b && a.start.equals(b.start) && a.end.equals(b.end);
}

const DATE_PARTS = { year: 'numeric', month: 'numeric', day: 'numeric' } as const;

/**
 * The calendar date it is at `now` in `timeZone`, an IANA name such as `America/New_York`. A missing or unknown zone
 * falls back to the browser's.
 */
export function today(timeZone?: string, now = new Date()): CalendarDate {
  let format: Intl.DateTimeFormat;
  try {
    format = new Intl.DateTimeFormat('en-US', { timeZone: timeZone || undefined, ...DATE_PARTS });
  } catch {
    format = new Intl.DateTimeFormat('en-US', DATE_PARTS);
  }
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of format.formatToParts(now)) parts[part.type] = part.value;
  return new CalendarDate(Number(parts.year), Number(parts.month), Number(parts.day));
}

/** Month and weekday names, as Rails' `date.*` translations give them. Months start with January, weekdays with Sunday. */
export interface DateNames {
  monthNames: string[];
  abbrMonthNames: string[];
  dayNames: string[];
  abbrDayNames: string[];
}

/** Rails' English month and weekday names. */
export const ENGLISH_DATE_NAMES: DateNames = {
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  abbrMonthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  abbrDayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

/**
 * Formats `date` with a `strftime` pattern the way Ruby's `I18n.l` does, so a page turn reads exactly like the month
 * the server rendered. Only the directives a date needs are known (`%A %a %B %b %d %-d %e %m %Y %%`); any other is
 * kept as it is.
 */
export function formatDate(date: CalendarDate, pattern: string, names: DateNames): string {
  return pattern.replace(/%(-?)([%AaBbdemY])/g, (directive, flag: string, letter: string) => {
    switch (letter) {
      case '%':
        return flag ? directive : '%';
      case 'A':
        return names.dayNames[date.dayOfWeek] ?? '';
      case 'a':
        return names.abbrDayNames[date.dayOfWeek] ?? '';
      case 'B':
        return names.monthNames[date.month - 1] ?? '';
      case 'b':
        return names.abbrMonthNames[date.month - 1] ?? '';
      case 'd':
        return flag ? String(date.day) : pad(date.day);
      case 'e':
        return flag ? String(date.day) : String(date.day).padStart(2, ' ');
      case 'm':
        return flag ? String(date.month) : pad(date.month);
      default:
        return String(date.year);
    }
  });
}
