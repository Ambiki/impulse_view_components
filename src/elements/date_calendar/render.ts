import type { CalendarDate, DateNames } from 'src/internal/calendar_date';
import { formatDate } from 'src/internal/calendar_date';

/** The names and patterns a date calendar formats its text with, as `Impulse::DateCalendarComponent` renders them. */
export interface DateCalendarI18n extends DateNames {
  formats: {
    /** Names the displayed month, above the grid. */
    heading: string;
    /** Each day's accessible name. */
    day: string;
  };
}

/** Rails' English, used only when the component's `i18n` attribute is missing (ADR 0014). */
export const ENGLISH: DateCalendarI18n = {
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
  formats: { heading: '%B %Y', day: '%A, %B %-d, %Y' },
};

/** What a date calendar shows: everything its grid is rendered from. */
export interface CalendarView {
  /** A day of the displayed month. */
  displayed: CalendarDate;
  /** The day holding the grid's one tab stop. */
  active: CalendarDate;
  selected: CalendarDate | null;
  today: CalendarDate;
  min: CalendarDate | null;
  max: CalendarDate | null;
  disabledDaysOfWeek: number[];
  firstDayOfWeek: number;
  i18n: DateCalendarI18n;
}

/** Whether the user can move to `date` but not commit it. */
export function isDisabledDay(date: CalendarDate, view: CalendarView): boolean {
  return (
    (!!view.min && date.compare(view.min) < 0) ||
    (!!view.max && date.compare(view.max) > 0) ||
    view.disabledDaysOfWeek.includes(date.dayOfWeek)
  );
}

/**
 * Whether the user can move to the month `date` is in. Paging stops at the months holding `min` and `max`, and never goes
 * further from them than the displayed month, which may itself be outside them when the value is.
 */
export function canShowMonth(date: CalendarDate, view: CalendarView): boolean {
  const beforeMin = !!view.min && date.compareMonth(view.min) < 0 && date.compareMonth(view.displayed) < 0;
  const afterMax = !!view.max && date.compareMonth(view.max) > 0 && date.compareMonth(view.displayed) > 0;
  return !beforeMin && !afterMax;
}

/** Whether the user can turn the page by `months`, `-1` being back a month. */
export function canTurnPage(view: CalendarView, months: number): boolean {
  return canShowMonth(view.displayed.add({ months }), view);
}

export function headingText(view: CalendarView): string {
  return formatDate(view.displayed, view.i18n.formats.heading, view.i18n);
}

/** The row of weekday headings, from the first day of the week. */
export function weekdayRow(view: Pick<CalendarView, 'firstDayOfWeek' | 'i18n'>): HTMLTableRowElement {
  const row = document.createElement('tr');
  for (let offset = 0; offset < 7; offset++) {
    const dayOfWeek = (view.firstDayOfWeek + offset) % 7;
    const heading = document.createElement('th');
    heading.setAttribute('scope', 'col');
    heading.setAttribute('abbr', view.i18n.dayNames[dayOfWeek] ?? '');
    heading.textContent = view.i18n.abbrDayNames[dayOfWeek] ?? '';
    row.append(heading);
  }
  return row;
}

/** The displayed month's six weeks, marked up as `Impulse::DateCalendarComponent` renders them. */
export function weekRows(view: CalendarView): HTMLTableRowElement[] {
  return view.displayed.monthGrid(view.firstDayOfWeek).map((week) => {
    const row = document.createElement('tr');
    row.append(...week.map((date) => dayCell(date, view)));
    return row;
  });
}

function dayCell(date: CalendarDate, view: CalendarView) {
  const button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.className = date.isSameMonth(view.displayed) ?
    'awc-date-calendar-day' :
    'awc-date-calendar-day awc-date-calendar-day--outside';
  button.setAttribute('tabindex', date.equals(view.active) ? '0' : '-1');
  button.dataset.date = date.toString();
  button.setAttribute('aria-label', formatDate(date, view.i18n.formats.day, view.i18n));
  if (date.equals(view.today)) button.setAttribute('aria-current', 'date');
  if (isDisabledDay(date, view)) button.setAttribute('aria-disabled', 'true');
  button.textContent = String(date.day);

  const cell = document.createElement('td');
  if (date.equals(view.selected)) cell.setAttribute('aria-selected', 'true');
  cell.append(button);
  return cell;
}
