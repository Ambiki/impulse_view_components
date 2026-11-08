/**
 * The grid the calendars share, driven by a level: days, months or years (ADR 0015). What a calendar shows, and the
 * markup its component renders, which the element renders again for the pages the user moves to (ADR 0013). It is
 * internal: the package's `exports` map doesn't list it.
 */
import type { CalendarDate, DateNames, DateRange } from 'src/internal/calendar_date';
import { rangeIncludes } from 'src/internal/calendar_date';

/** The names and patterns a day-level calendar formats its text with, as its component renders them. */
export interface CalendarI18n extends DateNames {
  formats: {
    /** Names the displayed month, above the grid. */
    heading: string;
    /** Each day's accessible name. */
    day: string;
  };
}

/** Rails' English, used only when the component's `i18n` attribute is missing (ADR 0014). */
export const ENGLISH: CalendarI18n = {
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

/**
 * What a calendar's cells are: days, months or years. A cell is named by its first day, and a page, what the grid
 * shows at once, by its first cell.
 */
export interface Level<I> {
  /** The word after the tag in a cell's class name: `day` gives `awc-date-calendar-day`. */
  readonly cell: string;
  /** The grid's data attribute naming the displayed page, such as `month` for `data-month="2026-11"`. */
  readonly pageAttribute: string;
  /** The row of weekday headings above the cells, for a level that has one. */
  readonly weekdayRow?: (firstDayOfWeek: number, i18n: I) => HTMLTableRowElement;
  formatPage: (page: CalendarDate) => string;
  parsePage: (value: string | undefined) => CalendarDate | null;
  /** The cell `date` falls in. */
  cellOf: (date: CalendarDate) => CalendarDate;
  /** The first cell of the page `date` is on. */
  pageOf: (date: CalendarDate) => CalendarDate;
  /** Negative when `a`'s page comes before `b`'s, positive when after, `0` when they are on the same page. */
  comparePages: (a: CalendarDate, b: CalendarDate) => number;
  /** `cell` moved by `pages` pages, keeping its place in its page. */
  addPages: (cell: CalendarDate, pages: number) => CalendarDate;
  /** The page's cells in rows, the cells of the pages before and after included. */
  rows: (page: CalendarDate, firstDayOfWeek: number) => CalendarDate[][];
  /** The cell `event`'s key moves to from `cell`, or `null` when it isn't one that moves. */
  move: (cell: CalendarDate, event: Pick<KeyboardEvent, 'key' | 'shiftKey'>, firstDayOfWeek: number) => CalendarDate | null;
  /** Names the page, above the grid. */
  heading: (page: CalendarDate, i18n: I) => string;
  /** A cell's text. */
  text: (cell: CalendarDate) => string;
  /** A cell's accessible name, or `null` when its text names it. */
  label: (cell: CalendarDate, i18n: I) => string | null;
}

/** What a calendar shows: everything its grid is rendered from. */
export interface CalendarView<I> {
  level: Level<I>;
  /** The element's tag, which prefixes the grid's class names, such as `awc-date-calendar-day`. */
  tagName: string;
  /** The first cell of the displayed page. */
  displayed: CalendarDate;
  /** The cell holding the grid's one tab stop. */
  active: CalendarDate;
  /** The selected range: a day, a week or a year. */
  selected: DateRange | null;
  /** The cell today falls in. */
  today: CalendarDate;
  min: CalendarDate | null;
  max: CalendarDate | null;
  /** Whether the user can move to `cell` but not commit it. */
  isDisabled: (cell: CalendarDate) => boolean;
  firstDayOfWeek: number;
  i18n: I;
}

/**
 * Whether the user can move to the page `cell` is on. Paging stops at the pages holding `min` and `max`, and never goes
 * further from them than the displayed page, which may itself be outside them when the value is.
 */
export function canShowPage<I>(cell: CalendarDate, view: CalendarView<I>): boolean {
  const { level } = view;
  const beforeMin = !!view.min && level.comparePages(cell, view.min) < 0 && level.comparePages(cell, view.displayed) < 0;
  const afterMax = !!view.max && level.comparePages(cell, view.max) > 0 && level.comparePages(cell, view.displayed) > 0;
  return !beforeMin && !afterMax;
}

/** Whether the user can move the view by `pages`, `-1` being back a page. */
export function canMoveView<I>(view: CalendarView<I>, pages: number): boolean {
  return canShowPage(view.level.addPages(view.displayed, pages), view);
}

export function headingText<I>(view: CalendarView<I>): string {
  return view.level.heading(view.displayed, view.i18n);
}

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

/** The displayed page's rows of cells, marked up as the calendar's component renders them. */
export function gridRows<I>(view: CalendarView<I>): HTMLTableRowElement[] {
  return view.level.rows(view.displayed, view.firstDayOfWeek).map((cells) => {
    const row = document.createElement('tr');
    row.append(...cells.map((cell) => gridCell(cell, view)));
    return row;
  });
}

function gridCell<I>(cell: CalendarDate, view: CalendarView<I>) {
  const { level, tagName } = view;
  const block = `${tagName}-${level.cell}`;
  const button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.className = level.comparePages(cell, view.displayed) === 0 ? block : `${block} ${block}--outside`;
  button.setAttribute('tabindex', cell.equals(view.active) ? '0' : '-1');
  button.dataset.date = cell.toString();
  const label = level.label(cell, view.i18n);
  if (label) button.setAttribute('aria-label', label);
  if (cell.equals(view.today)) button.setAttribute('aria-current', 'date');
  if (view.isDisabled(cell)) button.setAttribute('aria-disabled', 'true');
  button.textContent = level.text(cell);

  const td = document.createElement('td');
  if (rangeIncludes(view.selected, cell)) td.setAttribute('aria-selected', 'true');
  td.append(button);
  return td;
}
