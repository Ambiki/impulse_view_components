/**
 * The day level: a month's days, in six weeks, under a row of weekday headings. The date and week calendars show it.
 * It is internal: the package's `exports` map doesn't list it.
 */
import type { CalendarI18n, Level } from 'src/internal/calendar_grid';
import { CalendarDate, formatDate } from 'src/internal/calendar_date';
import { weekdayRow } from 'src/internal/calendar_grid';

export const DAY_LEVEL: Level<CalendarI18n> = {
  cell: 'day',
  pageAttribute: 'month',
  weekdayRow,
  formatPage: (page) => page.toString().slice(0, 7),
  parsePage: (value) => CalendarDate.parse(`${value}-01`),
  cellOf: (date) => date,
  pageOf: (date) => date.startOfMonth(),
  comparePages: (a, b) => a.compareMonth(b),
  addPages: (cell, pages) => cell.add({ months: pages }),
  rows: (page, firstDayOfWeek) => page.monthGrid(firstDayOfWeek),
  // Per the APG date picker: a day, a week, the week's ends, a month, and with Shift a year.
  move: (cell, event, firstDayOfWeek) => {
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
  heading: (page, i18n) => formatDate(page, i18n.formats.heading, i18n),
  text: (cell) => String(cell.day),
  label: (cell, i18n) => formatDate(cell, i18n.formats.day, i18n),
};
