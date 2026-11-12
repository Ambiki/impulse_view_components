/**
 * The day level: a month's days, in six weeks, under a row of weekday headings. The date and week calendars show it.
 * A cell is a day, and a view a month. It is internal: the package's `exports` map doesn't list it.
 */
import type { DateNames } from 'src/internal/calendar_date';
import type { Level } from 'src/internal/calendar_grid';
import { CalendarDate, daysInMonth, ENGLISH_DATE_NAMES, formatDate } from 'src/internal/calendar_date';

/** The names and patterns a day-level calendar formats its text with, as its component renders them. */
export interface DayLevelI18n extends DateNames {
  formats: {
    /** Names the displayed month, above the grid. */
    monthHeading: string;
    /** Each day's accessible name. */
    day: string;
  };
}

/** Rails' English, used only when the component's `i18n` attribute is missing (ADR 0015). */
export const DAY_ENGLISH: DayLevelI18n = {
  ...ENGLISH_DATE_NAMES,
  formats: { monthHeading: '%B %Y', day: '%A, %B %-d, %Y' },
};

/** The row of weekday headings, from the first day of the week. */
export function weekdayRow(firstDayOfWeek: number, i18n: DateNames): HTMLTableRowElement {
  const row = document.createElement('tr');
  for (let offset = 0; offset < 7; offset++) {
    const dayOfWeek = (firstDayOfWeek + offset) % 7;
    const heading = document.createElement('th');
    heading.setAttribute('scope', 'col');
    heading.setAttribute('abbr', i18n.dayNames[dayOfWeek] ?? '');
    heading.textContent = i18n.abbrDayNames[dayOfWeek] ?? '';
    row.append(heading);
  }
  return row;
}

export const DAY_LEVEL: Level<DayLevelI18n> = {
  cell: 'day',
  viewAttribute: 'month',
  parse: (value) => CalendarDate.parse(value),
  format: (cell) => cell.toString(),
  paging: { previous: 'Previous month', next: 'Next month' },
  weekdayRow,
  formatView: (view) => view.toString().slice(0, 7),
  parseView: (value) => CalendarDate.parse(`${value}-01`),
  cellOf: (date) => date,
  viewOf: (date) => date.startOfMonth(),
  compareViews: (a, b) => a.compareMonth(b),
  addViews: (cell, views) => cell.add({ months: views }),
  range: (cell) => ({ start: cell, end: cell }),
  // The day drilled down to keeps its number, cut to the month's length: January 31 placed in February is its last day.
  placeIn: (cell, view) => new CalendarDate(view.year, view.month, Math.min(cell.day, daysInMonth(view.year, view.month))),
  rows: (view, firstDayOfWeek) => view.monthGrid(firstDayOfWeek),
  // Per the APG date picker: a day, a week, the week's ends, a month, and with Shift a year.
  move: (cell, event, { firstDayOfWeek }) => {
    switch (event.key) {
      case 'ArrowLeft':
        return cell.add({ days: -1 });
      case 'ArrowRight':
        return cell.add({ days: 1 });
      case 'ArrowUp':
        return cell.add({ days: -7 });
      case 'ArrowDown':
        return cell.add({ days: 7 });
      case 'Home':
        return cell.startOfWeek(firstDayOfWeek);
      case 'End':
        return cell.endOfWeek(firstDayOfWeek);
      case 'PageUp':
        return event.shiftKey ? cell.add({ years: -1 }) : cell.add({ months: -1 });
      case 'PageDown':
        return event.shiftKey ? cell.add({ years: 1 }) : cell.add({ months: 1 });
      default:
        return null;
    }
  },
  heading: (view, i18n) => formatDate(view, i18n.formats.monthHeading, i18n),
  text: (cell) => String(cell.day),
  label: (cell, i18n) => formatDate(cell, i18n.formats.day, i18n),
};
