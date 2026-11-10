/**
 * The behaviour the calendars share, whatever their level shows: days for `<awc-date-calendar>` and
 * `<awc-week-calendar>`, years for `<awc-year-calendar>` (ADR 0016). It is internal: the package's `exports` map doesn't
 * list it. Its public members reach apps, though, through the elements that extend it, so changing those changes the
 * public API.
 *
 * The selection is a date range: a day, a week or a year. The value names it, written as the calendar writes values,
 * and so do `min`, `max` and the methods' arguments. A subclass decides its level, what a cell selects, which cells are
 * disabled, and what `commit` carries.
 *
 * A subclass declares its properties and targets with `@property()` and `@target()`, since impulse reads only a class's
 * own declarations, and renders the markup of `Impulse::Internal::CalendarGridComponent`.
 */
import type { DateRange } from 'src/internal/calendar_date';
import type { CalendarView, Level } from 'src/internal/calendar_grid';
import { ImpulseElement } from '@ambiki/impulse';
import { CalendarDate, rangeEquals, today } from 'src/internal/calendar_date';
import { canMoveView, canShowView, gridRows, headingText } from 'src/internal/calendar_grid';

export default abstract class CalendarGridElement<I> extends ImpulseElement {
  /** The selection, written as the calendar writes values. Anything else selects nothing. */
  abstract value: string;

  /** The earliest the user can commit, written as the value is. */
  abstract min: string;

  /** The latest the user can commit, written as the value is. */
  abstract max: string;

  /** The IANA time zone that decides what today is. Defaults to the browser's. */
  abstract timeZone: string;

  /** The names and patterns the views are rendered with. Defaults to English. */
  abstract i18n: I;

  abstract heading: HTMLElement;
  abstract grid: HTMLTableElement;
  abstract previousButton: HTMLButtonElement;
  abstract nextButton: HTMLButtonElement;

  /** What the grid's cells are. */
  protected abstract readonly level: Level<I>;

  /** The body of the grid, holding its rows of cells. */
  protected abstract get cells(): HTMLTableSectionElement;

  /** The head of the grid, holding its weekday headings, for a level that has them. */
  protected get weekdayHeadings(): HTMLTableSectionElement | null {
    return null;
  }

  /** The range committing `cell` selects, and that a value naming `cell` selects: a day, its week, or a year. */
  protected abstract rangeOf(cell: CalendarDate): DateRange;

  /** Whether the user can move to `cell` but not commit it, given the earliest and latest allowed. */
  protected abstract isDisabledCell(cell: CalendarDate, min: CalendarDate | null, max: CalendarDate | null): boolean;

  /** The detail of `commit`, for the range the user committed. */
  protected abstract commitDetail(range: DateRange): object;

  /** The day each week starts on, `0` being Sunday, for a calendar with weeks. By default, Sunday. */
  protected weekStart(): number {
    return 0;
  }

  /** The cell a value names, or `null` when it names none. By default, a `YYYY-MM-DD` day. */
  protected parseValue(value: string): CalendarDate | null {
    return CalendarDate.parse(value);
  }

  /** The value naming `range`. By default, its first day as `YYYY-MM-DD`. */
  protected formatValue(range: DateRange): string {
    return range.start.toString();
  }

  /** The earliest day `min` allows, or the latest `max` does. By default, the day itself. */
  protected parseLimit(value: string, _limit: 'min' | 'max'): CalendarDate | null {
    return this.parseValue(value);
  }

  /**
   * The view shown, and the cell holding the tab stop, after the user commits `cell`, which selected `range`. By
   * default, `cell`'s view: committing an outside cell moves the view to it.
   */
  protected viewAfterCommit(_view: CalendarView<I>, cell: CalendarDate, _range: DateRange): { displayed: CalendarDate; active: CalendarDate } {
    return { displayed: cell, active: cell };
  }

  /** Whether the value is changing because the user committed a cell, which leaves the view where the user is. */
  private committing = false;

  connected() {
    // The server marked today when it rendered, which a cached page, or one left open past midnight, outlived.
    const view = this.view();
    const marked = this.cells.querySelector<HTMLElement>('[aria-current="date"]')?.dataset.date ?? null;
    const expected = this.button(view.today) ? view.today.toString() : null;
    if (marked !== expected) this.render(view);
  }

  valueChanged() {
    if (!this.committing) this.resetView();
  }

  minChanged() {
    this.refresh();
  }

  maxChanged() {
    this.refresh();
  }

  timeZoneChanged() {
    this.refresh();
  }

  i18nChanged() {
    this.refresh();
  }

  /**
   * Takes the view back to the value: its view becomes the displayed one, and its cell the active one. Without a
   * value, today's. Changes nothing else, and emits nothing.
   */
  resetView() {
    const view = this.view();
    const cell = this.valueCell();
    this.showCell(view, cell ?? view.today);
  }

  /**
   * Shows the view before, as the previous button does: the active cell moves back a view, keeping its place in it.
   * Does nothing at the view holding `min`. Changes no value and emits nothing.
   */
  previousView() {
    this.moveView(-1);
  }

  /** Shows the view after, as the next button does. Does nothing at the view holding `max`. */
  nextView() {
    this.moveView(1);
  }

  /**
   * Shows the view `value` is in and makes its cell the active one, without selecting it. `value` is written as the
   * calendar writes values. Unlike the user, code can go past `min` and `max`. Ignores anything else, and emits nothing.
   */
  goToDate(value: string) {
    const day = this.parseValue(value);
    if (day) this.showCell(this.view(), this.level.cellOf(day));
  }

  /** Shows today's view, in the calendar's time zone, and makes today's cell the active one, without selecting it. */
  goToToday() {
    const view = this.view();
    this.showCell(view, view.today);
  }

  /**
   * Selects nothing, as setting an empty `value` does: the calendar shows today's view. Like any value method called
   * from code, including from a `data-action`, it emits nothing (ADR 0002).
   */
  clear() {
    this.removeAttribute('value');
  }

  /**
   * Whether the user couldn't commit `value`, written as the calendar writes values, given `min`, `max` and the
   * calendar's own limits. Anything else isn't disabled.
   */
  isDateDisabled(value: string): boolean {
    const day = this.parseValue(value);
    return !!day && this.view().isDisabled(this.level.cellOf(day));
  }

  /** Focuses the active cell, the grid's one tab stop. */
  focus(options?: FocusOptions) {
    this.button(this.view().active)?.focus(options);
  }

  handlePreviousClick() {
    this.previousView();
  }

  handleNextClick() {
    this.nextView();
  }

  handleKeydown(event: KeyboardEvent) {
    const from = this.cellOf(event.target);
    if (!from || event.altKey || event.ctrlKey || event.metaKey) return;

    const to = this.level.move(from, event, { firstDayOfWeek: this.weekStart(), displayed: this.view().displayed });
    if (!to) return;

    // The keys move through the grid, so they don't scroll the page, even where the grid stops them.
    event.preventDefault();
    this.moveTo(to);
  }

  /** A cell of the displayed view that gets focus, by pointer for one, takes the tab stop. Outside cells never do. */
  handleFocusin(event: FocusEvent) {
    const cell = this.cellOf(event.target);
    if (cell && this.level.compareViews(cell, this.view().displayed) === 0) this.moveTabStop(cell);
  }

  handleClick(event: MouseEvent) {
    const cell = this.cellOf(event.target);
    if (cell) this.commit(cell);
  }

  /** Renders the grid again for what it shows now, after a setting changed. */
  protected refresh() {
    this.render(this.view());
  }

  /** The cell the value names, or `null`. */
  private valueCell(): CalendarDate | null {
    const day = this.parseValue(this.value);
    return day && this.level.cellOf(day);
  }

  /**
   * Moves by `views` views, moving the active cell as far, keeping its place in its view. Does nothing past the views
   * holding `min` and `max`.
   */
  private moveView(views: number) {
    const view = this.view();
    if (!canMoveView(view, views)) return;

    this.showCell(view, this.level.addViews(view.active, views));
  }

  /**
   * Makes `cell` the active one and focuses it, moving the view when it is in another. Does nothing past the views
   * holding `min` and `max`.
   */
  private moveTo(cell: CalendarDate) {
    const view = this.view();
    if (!canShowView(cell, view)) return;

    if (this.level.compareViews(cell, view.displayed) === 0) {
      this.moveTabStop(cell);
    } else {
      this.showCell(view, cell);
    }
    this.button(cell)?.focus();
  }

  /** Gives the grid's one tab stop to `cell`, a cell of the displayed view. */
  private moveTabStop(cell: CalendarDate) {
    for (const button of this.cells.querySelectorAll<HTMLElement>('button[tabindex="0"]')) {
      button.setAttribute('tabindex', '-1');
    }
    this.button(cell)?.setAttribute('tabindex', '0');
  }

  private button(cell: CalendarDate) {
    return this.cells.querySelector<HTMLButtonElement>(`button[data-date="${cell.toString()}"]`);
  }

  /**
   * Commits `cell` as the user does: selects the range it makes, which the value then names, and emits `commit` when
   * the selection changed.
   */
  private commit(cell: CalendarDate) {
    const view = this.view();
    if (view.isDisabled(cell)) return;

    const range = this.rangeOf(cell);
    this.render({ ...view, ...this.viewAfterCommit(view, cell, range), selected: range });
    if (rangeEquals(range, view.selected)) return;

    // The event reports the range committed, not whatever `value` holds by the time it is read.
    this.committing = true;
    try {
      this.value = this.formatValue(range);
    } finally {
      this.committing = false;
    }
    this.emit('commit', { detail: this.commitDetail(range) });
  }

  /** What the grid shows now. The displayed view and the active cell are read from the DOM, which a morph restores. */
  protected view(): CalendarView<I> {
    const { level } = this;
    const displayed = level.parseView(this.grid.dataset[level.viewAttribute])!;
    const cell = this.valueCell();
    const active = CalendarDate.parse(this.cells.querySelector<HTMLElement>('button[tabindex="0"]')?.dataset.date);
    const min = this.parseLimit(this.min, 'min');
    const max = this.parseLimit(this.max, 'max');
    return {
      level,
      tagName: this.localName,
      displayed,
      active: active ?? cell ?? displayed,
      selected: cell ? this.rangeOf(cell) : null,
      today: level.cellOf(today(this.timeZone)),
      min,
      max,
      isDisabled: (date) => this.isDisabledCell(date, min, max),
      firstDayOfWeek: this.weekStart(),
      i18n: this.i18n,
    };
  }

  /** Shows the view `cell` is in, with `cell` as the active one. */
  private showCell(view: CalendarView<I>, cell: CalendarDate) {
    this.render({ ...view, displayed: cell, active: cell });
  }

  private render(view: CalendarView<I>) {
    const { level } = this;
    // The cells' buttons are replaced, so focus on one moves to the active cell rather than to the page.
    const hadFocus = this.cells.contains(document.activeElement);
    this.grid.dataset[level.viewAttribute] = level.formatView(level.viewOf(view.displayed));
    // The heading is a live region, so it is only written when the view changes, which announces it.
    const heading = headingText(view);
    if (this.heading.textContent !== heading) this.heading.textContent = heading;
    const weekdays = level.weekdayRow?.(view.firstDayOfWeek, view.i18n);
    if (weekdays) this.weekdayHeadings?.replaceChildren(weekdays);
    this.cells.replaceChildren(...gridRows(view));
    if (hadFocus) this.button(view.active)?.focus();
    this.previousButton.setAttribute('aria-disabled', String(!canMoveView(view, -1)));
    this.nextButton.setAttribute('aria-disabled', String(!canMoveView(view, 1)));
  }

  /**
   * The cell a cell of the grid names, or `null` for anything else. A cell's padding, the gap around its button, counts
   * as the cell: a week calendar's band spans it, so a click there is meant for the cell.
   */
  private cellOf(node: EventTarget | null): CalendarDate | null {
    const td = node instanceof Element ? node.closest('td') : null;
    const button = td?.querySelector<HTMLElement>('button[data-date]');
    return button && this.cells.contains(button) ? CalendarDate.parse(button.dataset.date) : null;
  }
}
