/**
 * The grid the calendars share, driven by a level: days, months or years (ADR 0016). What a calendar shows, and the
 * markup its component renders, which the element renders again for the views the user moves to (ADR 0014). It is
 * internal: the package's `exports` map doesn't list it.
 */
import type { CalendarDate, DateRange } from 'src/internal/calendar_date';
import { rangeIncludes } from 'src/internal/calendar_date';

/** What a key's move depends on besides the cell it moves from. */
export interface MoveContext {
  /** The day each week starts on, `0` being Sunday. */
  firstDayOfWeek: number;
  /** A cell of the displayed view, which an outside cell's row is reckoned in. */
  displayed: CalendarDate;
}

/**
 * What a calendar's cells are: days, months or years. A cell is named by its first day, and a view, what the grid
 * shows at once, by its first cell.
 */
export interface Level<I> {
  /** The word after the tag in a cell's class name: `day` gives `awc-date-calendar-day`. */
  readonly cell: string;
  /** The grid's data attribute naming the displayed view, such as `month` for `data-month="2026-11"`. */
  readonly viewAttribute: string;
  /** The row of weekday headings above the cells, for a level that has one. */
  readonly weekdayRow?: (firstDayOfWeek: number, i18n: I) => HTMLTableRowElement;
  formatView: (view: CalendarDate) => string;
  parseView: (value: string | undefined) => CalendarDate | null;
  /** The cell `date` falls in. */
  cellOf: (date: CalendarDate) => CalendarDate;
  /** The first cell of the view `date` is in. */
  viewOf: (date: CalendarDate) => CalendarDate;
  /** Negative when `a`'s view comes before `b`'s, positive when after, `0` when they are in the same view. */
  compareViews: (a: CalendarDate, b: CalendarDate) => number;
  /** `cell` moved by `views` views, keeping its place in its view. */
  addViews: (cell: CalendarDate, views: number) => CalendarDate;
  /** The view's cells in rows, the cells of the views before and after it included. `view` may be any of its cells. */
  rows: (view: CalendarDate, firstDayOfWeek: number) => CalendarDate[][];
  /** The cell `event`'s key moves to from `cell`, or `null` when it isn't one that moves. */
  move: (cell: CalendarDate, event: Pick<KeyboardEvent, 'key' | 'shiftKey'>, context: MoveContext) => CalendarDate | null;
  /** Names the view, above the grid. `view` may be any of its cells. */
  heading: (view: CalendarDate, i18n: I) => string;
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
  /** A cell of the displayed view. */
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
  /** The day each week starts on, `0` being Sunday, for a level with weeks. */
  firstDayOfWeek: number;
  i18n: I;
}

/**
 * Whether the user can move to the view `cell` is in. Moving stops at the views holding `min` and `max`, and never goes
 * further from them than the displayed view, which may itself be outside them when the value is.
 */
export function canShowView<I>(cell: CalendarDate, view: CalendarView<I>): boolean {
  const { level } = view;
  const beforeMin = !!view.min && level.compareViews(cell, view.min) < 0 && level.compareViews(cell, view.displayed) < 0;
  const afterMax = !!view.max && level.compareViews(cell, view.max) > 0 && level.compareViews(cell, view.displayed) > 0;
  return !beforeMin && !afterMax;
}

/** Whether the user can move by `views` views, `-1` being back one. */
export function canMoveView<I>(view: CalendarView<I>, views: number): boolean {
  return canShowView(view.level.addViews(view.displayed, views), view);
}

export function headingText<I>(view: CalendarView<I>): string {
  return view.level.heading(view.displayed, view.i18n);
}

/** The displayed view's rows of cells, marked up as the calendar's component renders them. */
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
  button.className = level.compareViews(cell, view.displayed) === 0 ? block : `${block} ${block}--outside`;
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
