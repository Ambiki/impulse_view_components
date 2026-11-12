/**
 * The month level: a year's twelve months, three to a row. The month calendar shows it. A cell is a month, named by its
 * first day, and a view a year. It is internal: the package's `exports` map doesn't list it.
 */
import type { DateNames, DateRange } from 'src/internal/calendar_date';
import type { Level } from 'src/internal/calendar_grid';
import { CalendarDate, formatDate } from 'src/internal/calendar_date';

/** The names and pattern a month-level calendar formats its months with, as its component renders them. */
export interface MonthLevelI18n extends Pick<DateNames, 'monthNames' | 'abbrMonthNames'> {
  formats: {
    /** Each month's accessible name. */
    month: string;
  };
}

/** Rails' English, used only when the component's `i18n` attribute is missing (ADR 0015). */
export const MONTH_ENGLISH: MonthLevelI18n = {
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
  formats: { month: '%B %Y' },
};

/** A month, `YYYY-MM`, of a four-digit year from 1000 to 9999, which is all a calendar date can name. */
const MONTH = /^([1-9]\d{3})-(0[1-9]|1[0-2])$/;

const monthOf = (year: number, month: number) => new CalendarDate(year, month, 1);

/** The first day of the month `value` names, as `YYYY-MM`, or `null` when it names none. */
export function parseMonth(value: string | undefined): CalendarDate | null {
  const match = MONTH.exec(value ?? '');
  return match ? monthOf(Number(match[1]), Number(match[2])) : null;
}

/** The month `cell` names as `YYYY-MM`. */
export function formatMonth(cell: CalendarDate): string {
  return cell.toString().slice(0, 7);
}

/** The days of `cell`'s month, from its first to its last. */
export function monthRange(cell: CalendarDate): DateRange {
  return { start: monthOf(cell.year, cell.month), end: cell.endOfMonth() };
}

/** `cell` moved by `months` months. */
const addMonths = (cell: CalendarDate, months: number) => monthOf(cell.year, cell.month).add({ months });

export const MONTH_LEVEL: Level<MonthLevelI18n> = {
  cell: 'month',
  viewAttribute: 'year',
  formatView: (view) => String(view.year),
  parseView: (value) => (value && /^[1-9]\d{3}$/.test(value) ? monthOf(Number(value), 1) : null),
  cellOf: (date) => monthOf(date.year, date.month),
  viewOf: (date) => monthOf(date.year, 1),
  compareViews: (a, b) => a.year - b.year,
  addViews: (cell, views) => monthOf(cell.year + views, cell.month),
  range: monthRange,
  rows: (view) =>
    Array.from({ length: 4 }, (_, row) => Array.from({ length: 3 }, (_, column) => monthOf(view.year, row * 3 + column + 1))),
  // A month, three (a row), the row's ends, and a year, with or without Shift.
  move: (cell, event) => {
    const rowStart = cell.month - ((cell.month - 1) % 3);
    switch (event.key) {
      case 'ArrowLeft':
        return addMonths(cell, -1);
      case 'ArrowRight':
        return addMonths(cell, 1);
      case 'ArrowUp':
        return addMonths(cell, -3);
      case 'ArrowDown':
        return addMonths(cell, 3);
      case 'Home':
        return monthOf(cell.year, rowStart);
      case 'End':
        return monthOf(cell.year, rowStart + 2);
      case 'PageUp':
        return addMonths(cell, -12);
      case 'PageDown':
        return addMonths(cell, 12);
      default:
        return null;
    }
  },
  // The month drilled down to keeps its place in its year.
  placeIn: (cell, view) => monthOf(view.year, cell.month),
  heading: (view) => String(view.year),
  text: (cell, i18n) => i18n.abbrMonthNames[cell.month - 1] ?? '',
  // A month's text has no year, which its name gives. Its pattern only needs the month names.
  label: (cell, i18n) => formatDate(cell, i18n.formats.month, { dayNames: [], abbrDayNames: [], ...i18n }),
};
