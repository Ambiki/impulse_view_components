/**
 * The year level: a decade's years, and the year before and after it, three to a row. The year calendar shows it. A
 * cell is a year, named by its January 1, and a view a decade. It is internal: the package's `exports` map doesn't
 * list it.
 */
import type { DateRange } from 'src/internal/calendar_date';
import type { Level } from 'src/internal/calendar_grid';
import { CalendarDate } from 'src/internal/calendar_date';

/** The pattern a year-level calendar names its decades with, as its component renders it. */
export interface YearLevelI18n {
  formats: {
    /** Names the displayed decade, with `%{start}` and `%{end}` its first and last years. */
    decade: string;
  };
}

/** Rails' English, used only when the component's `i18n` attribute is missing (ADR 0014). */
export const YEAR_ENGLISH: YearLevelI18n = { formats: { decade: '%{start} – %{end}' } };

/** A four-digit year, from 1000 to 9999, which is all a calendar date can name. */
const YEAR = /^[1-9]\d{3}$/;

const yearOf = (year: number) => new CalendarDate(year, 1, 1);
const decadeOf = (year: number) => Math.floor(year / 10) * 10;

/** The January 1 of the year `value` names, as `YYYY`, or `null` when it names none. */
export function parseYear(value: string | undefined): CalendarDate | null {
  return value && YEAR.test(value) ? yearOf(Number(value)) : null;
}

/** The days of `cell`'s year, from January 1 to December 31. */
export function yearRange(cell: CalendarDate): DateRange {
  return { start: yearOf(cell.year), end: new CalendarDate(cell.year, 12, 31) };
}

export const YEAR_LEVEL: Level<YearLevelI18n> = {
  cell: 'year',
  viewAttribute: 'decade',
  formatView: (view) => String(decadeOf(view.year)),
  parseView: parseYear,
  cellOf: (date) => yearOf(date.year),
  viewOf: (date) => yearOf(decadeOf(date.year)),
  compareViews: (a, b) => decadeOf(a.year) - decadeOf(b.year),
  addViews: (cell, views) => yearOf(cell.year + views * 10),
  rows: (view) => {
    const first = decadeOf(view.year) - 1;
    return Array.from({ length: 4 }, (_, row) => Array.from({ length: 3 }, (_, column) => yearOf(first + row * 3 + column)));
  },
  // A year, three (a row), the row's ends, and a decade, with or without Shift. A row is reckoned in the displayed
  // decade's grid, which an outside year sits at an end of.
  move: (cell, event, { displayed }) => {
    const { year } = cell;
    const index = year - (decadeOf(displayed.year) - 1);
    const rowStart = year - (((index % 3) + 3) % 3);
    switch (event.key) {
      case 'ArrowLeft':
        return yearOf(year - 1);
      case 'ArrowRight':
        return yearOf(year + 1);
      case 'ArrowUp':
        return yearOf(year - 3);
      case 'ArrowDown':
        return yearOf(year + 3);
      case 'Home':
        return yearOf(rowStart);
      case 'End':
        return yearOf(rowStart + 2);
      case 'PageUp':
        return yearOf(year - 10);
      case 'PageDown':
        return yearOf(year + 10);
      default:
        return null;
    }
  },
  heading: (view, i18n) => {
    const start = decadeOf(view.year);
    return i18n.formats.decade.replace('%{start}', String(start)).replace('%{end}', String(start + 9));
  },
  text: (cell) => String(cell.year),
  label: () => null,
};
