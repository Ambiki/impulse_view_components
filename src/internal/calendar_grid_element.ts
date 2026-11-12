/**
 * The behaviour the calendars share, whatever their level shows: days for `<awc-date-calendar>` and
 * `<awc-week-calendar>`, months for `<awc-month-calendar>`, years for `<awc-year-calendar>` (ADR 0016). It is internal:
 * the package's `exports` map doesn't list it. Its public members reach apps, though, through the elements that extend
 * it, so changing those changes the public API.
 *
 * The selection is a date range: a day, a week, a month or a year. The value names it, written as the calendar writes
 * values, and so do `min`, `max` and the methods' arguments. A subclass decides its level, what a cell selects, which
 * cells are disabled, and what `commit` carries.
 *
 * A calendar with levels above its base level, the one its value is a cell of, drills up to them through its heading,
 * in the same grid, and back down by choosing a cell (ADR 0017). The level shown is read from the grid's markup, like
 * the displayed view, so a morph putting the server's markup back takes the calendar back to its base level. Its
 * `i18n` then names the page buttons on each level, under `paging`, or the level's English without it.
 *
 * A subclass declares its properties and targets with `@property()` and `@target()`, since impulse reads only a class's
 * own declarations, and renders the markup of `Impulse::Internal::CalendarGridComponent`.
 */
import type { DateRange } from 'src/internal/calendar_date';
import type { CalendarView, Level, PagingI18n } from 'src/internal/calendar_grid';
import { ImpulseElement } from '@ambiki/impulse';
import { CalendarDate, rangeEquals, today } from 'src/internal/calendar_date';
import {
  canMoveView,
  canShowView,
  gridRows,
  headingContent,
  headingText,
  isOutsideLimits,
} from 'src/internal/calendar_grid';

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
  /** The grid's head, holding its weekday headings, on a calendar of days. */
  weekdays?: HTMLTableSectionElement;
  /** The grid's body, holding its rows of cells, whatever level they are. */
  abstract cells: HTMLTableSectionElement;
  abstract previousButton: HTMLButtonElement;
  abstract nextButton: HTMLButtonElement;

  /** What the grid's cells are: the calendar's base level, the one its value is a cell of. */
  protected abstract readonly level: Level<I>;

  /** The levels the calendar drills up to from its base level, nearest first. By default, none. */
  protected readonly levelsAbove: readonly Level<I>[] = [];

  /** The range committing `cell` selects, and that a value naming `cell` selects: a day, its week, a month or a year. */
  protected abstract rangeOf(cell: CalendarDate): DateRange;

  /**
   * Whether the user can move to `cell` but not commit it, given the earliest and latest allowed. By default, when none
   * of the days it selects falls between them.
   */
  protected isDisabledCell(cell: CalendarDate, min: CalendarDate | null, max: CalendarDate | null): boolean {
    return isOutsideLimits(this.rangeOf(cell), min, max);
  }

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

  /** The active cell of each level below the one shown, from the base level up, which drilling down goes back to. */
  private drilledFrom: CalendarDate[] = [];

  /** The grid's description, which tells what committing a base level's cell does, kept while a level above is shown. */
  private gridDescription: string | null = null;

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
   * Takes the view back to the value: its view becomes the displayed one, and its cell the active one, on the base
   * level. Without a value, today's. Changes nothing else, and emits nothing.
   */
  resetView() {
    this.showBaseCell(this.valueCell() ?? this.baseLevelView().today);
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
    if (day) this.showBaseCell(this.level.cellOf(day));
  }

  /** Shows today's view, in the calendar's time zone, and makes today's cell the active one, without selecting it. */
  goToToday() {
    this.showBaseCell(this.baseLevelView().today);
  }

  /**
   * Selects nothing, as setting an empty `value` does: the calendar shows today's view. Like any value method called
   * from code, including from a `data-action`, it emits nothing (ADR 0002).
   */
  clear() {
    this.removeAttribute('value');
    // Without a value already, removing it changes nothing, so it doesn't show today's view by itself.
    this.resetView();
  }

  /**
   * Whether the user couldn't commit `value`, written as the calendar writes values, given `min`, `max` and the
   * calendar's own limits. Anything else isn't disabled.
   */
  isDateDisabled(value: string): boolean {
    const day = this.parseValue(value);
    return !!day && this.baseLevelView().isDisabled(this.level.cellOf(day));
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

  /**
   * A click on the heading's button drills up to the level above the one shown, onto the cell holding the displayed
   * view, which gets focus. The header listens, as the button is replaced on every drill.
   */
  handleHeadingClick(event: MouseEvent) {
    const button = this.heading.querySelector('button');
    if (!button || !(event.target instanceof Node) || !button.contains(event.target)) return;

    const view = this.view();
    const above = this.levelAbove(view.level);
    if (!above) return;

    this.drilledFrom = [...this.drilledFrom.slice(0, this.levels.indexOf(view.level)), view.active];
    const cell = above.cellOf(view.displayed);
    this.render(this.levelView(above, cell, cell));
    this.button(cell)?.focus();
  }

  handleKeydown(event: KeyboardEvent) {
    const from = this.cellOf(event.target);
    if (!from || event.altKey || event.ctrlKey || event.metaKey) return;

    const view = this.view();
    const to = view.level.move(from, event, { firstDayOfWeek: this.weekStart(), displayed: view.displayed });
    if (!to) return;

    // The keys move through the grid, so they don't scroll the page, even where the grid stops them.
    event.preventDefault();
    this.moveTo(to);
  }

  /** A cell of the displayed view that gets focus, by pointer for one, takes the tab stop. Outside cells never do. */
  handleFocusin(event: FocusEvent) {
    const cell = this.cellOf(event.target);
    const view = this.view();
    if (cell && view.level.compareViews(cell, view.displayed) === 0) this.moveTabStop(cell);
  }

  handleClick(event: MouseEvent) {
    const cell = this.cellOf(event.target);
    if (cell) this.commit(cell);
  }

  /** Renders the grid again for what it shows now, after a setting changed. */
  protected refresh() {
    this.render(this.view());
  }

  /** The base level, then the levels above it. */
  private get levels(): readonly Level<I>[] {
    return [this.level, ...this.levelsAbove];
  }

  private levelAbove(level: Level<I>): Level<I> | null {
    return this.levels[this.levels.indexOf(level) + 1] ?? null;
  }

  private levelBelow(level: Level<I>): Level<I> | null {
    return this.levels[this.levels.indexOf(level) - 1] ?? null;
  }

  /** The level the grid shows, the one whose view it names. */
  private shownLevel(): Level<I> {
    return this.levels.find((level) => this.grid.dataset[level.viewAttribute] !== undefined) ?? this.level;
  }

  /** The cell the value names, on the base level, or `null`. */
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

    this.showCell(view, view.level.addViews(view.active, views));
  }

  /**
   * Makes `cell` the active one and focuses it, moving the view when it is in another. Does nothing past the views
   * holding `min` and `max`.
   */
  private moveTo(cell: CalendarDate) {
    const view = this.view();
    if (!canShowView(cell, view)) return;

    if (view.level.compareViews(cell, view.displayed) === 0) {
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
   * the selection changed. A cell of a level above the base level isn't committed but drilled down into.
   */
  private commit(cell: CalendarDate) {
    const view = this.view();
    if (view.isDisabled(cell)) return;
    if (view.level !== this.level) {
      this.drillDown(view, cell);
      return;
    }

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

  /**
   * Shows the level below the one shown, on the view `cell` names, and focuses the cell drilled up from placed in it,
   * or the nearest allowed when `min` or `max` rules it out. Choosing the cell drilled up from leaves that level as it
   * was.
   */
  private drillDown(view: CalendarView<I>, cell: CalendarDate) {
    const below = this.levelBelow(view.level)!;
    const from = this.drilledFrom[this.levels.indexOf(below)];
    const active = from && view.level.cellOf(from).equals(cell) ? from : this.drillTarget(below, from, view, cell);
    this.render(this.levelView(below, active, active));
    this.button(active)?.focus();
  }

  /**
   * The cell of `below` that drilling down into `cell` focuses: `from`, the cell drilled up from, placed in `cell`, or
   * `cell`'s first without one, and the nearest allowed when `min` or `max` rules it out.
   */
  private drillTarget(below: Level<I>, from: CalendarDate | undefined, view: CalendarView<I>, cell: CalendarDate) {
    const placed = (from && below.placeIn?.(from, cell)) ?? below.cellOf(cell);
    if (view.min && placed.compare(view.min) < 0) return below.cellOf(view.min);
    if (view.max && placed.compare(view.max) > 0) return below.cellOf(view.max);
    return placed;
  }

  /** What the grid shows now. The level, the displayed view and the active cell are read from the DOM, which a morph restores. */
  protected view(): CalendarView<I> {
    const level = this.shownLevel();
    const displayed = level.parseView(this.grid.dataset[level.viewAttribute])!;
    const active = CalendarDate.parse(this.cells.querySelector<HTMLElement>('button[tabindex="0"]')?.dataset.date);
    return this.levelView(level, displayed, active);
  }

  /** What the base level shows, whatever level is shown, for what only its cells answer. */
  private baseLevelView(): CalendarView<I> {
    return this.levelView(this.level, this.level.cellOf(today(this.timeZone)), null);
  }

  /**
   * What `level` shows with `displayed` as a cell of its view and `active` holding the tab stop, or, without `active`,
   * the selected cell or the displayed one. On a level above the base level, a cell with any day of the selection is
   * selected, and one with none of its days between `min` and `max` is disabled, except the one drilled up from, which
   * always takes the user back.
   */
  private levelView(level: Level<I>, displayed: CalendarDate, active: CalendarDate | null): CalendarView<I> {
    const value = this.valueCell();
    const cell = value && level.cellOf(value);
    const min = this.parseLimit(this.min, 'min');
    const max = this.parseLimit(this.max, 'max');
    const base = level === this.level;
    const from = this.drilledFrom[this.levels.indexOf(level) - 1];
    const back = from && level.cellOf(from);
    return {
      level,
      tagName: this.localName,
      displayed,
      active: active ?? cell ?? displayed,
      selected: value && this.rangeOf(value),
      today: level.cellOf(today(this.timeZone)),
      min,
      max,
      isDisabled: base ?
        (date) => this.isDisabledCell(date, min, max) :
        (date) => !date.equals(back ?? null) && isOutsideLimits(level.range(date), min, max),
      firstDayOfWeek: this.weekStart(),
      i18n: this.i18n,
    };
  }

  /** Shows the view `cell` is in, with `cell` as the active one, on the level `view` shows. */
  private showCell(view: CalendarView<I>, cell: CalendarDate) {
    this.render({ ...view, displayed: cell, active: cell });
  }

  /** Shows the view `cell`, a cell of the base level, is in, with `cell` as the active one. */
  private showBaseCell(cell: CalendarDate) {
    this.render(this.levelView(this.level, cell, cell));
  }

  private render(view: CalendarView<I>) {
    const { level } = view;
    const drilled = level !== this.shownLevel();
    // The cells' buttons are replaced, so focus on one moves to the active cell rather than to the page.
    const hadFocus = this.cells.contains(document.activeElement);
    for (const other of this.levels) {
      if (other !== level) delete this.grid.dataset[other.viewAttribute];
    }
    this.grid.dataset[level.viewAttribute] = level.formatView(level.viewOf(view.displayed));
    this.renderHeading(view, drilled);
    const weekdays = level.weekdayRow?.(view.firstDayOfWeek, view.i18n);
    this.weekdays?.replaceChildren(...(weekdays ? [weekdays] : []));
    this.cells.replaceChildren(...gridRows(view));
    if (hadFocus) this.button(view.active)?.focus();
    // A calendar that drills pages by another view on each level, so its buttons are renamed on each.
    if (this.levelsAbove.length) {
      const labels = (this.i18n as PagingI18n).paging?.[level.cell] ?? level.paging;
      this.previousButton.setAttribute('aria-label', labels.previous);
      this.nextButton.setAttribute('aria-label', labels.next);
    }
    this.previousButton.setAttribute('aria-disabled', String(!canMoveView(view, -1)));
    this.nextButton.setAttribute('aria-disabled', String(!canMoveView(view, 1)));
    this.renderDescription(level);
    if (level === this.level) this.drilledFrom = [];
  }

  /**
   * A grid's description, such as the week calendar's, tells what committing a day does, so only the base level has
   * one. The markup's own description wins, as a morph may bring the server's, under a new id.
   */
  private renderDescription(level: Level<I>) {
    const description = this.grid.getAttribute('aria-describedby');
    if (description) this.gridDescription = description;
    if (level !== this.level) {
      this.grid.removeAttribute('aria-describedby');
    } else if (!description && this.gridDescription) {
      this.grid.setAttribute('aria-describedby', this.gridDescription);
    }
  }

  /**
   * The heading is a live region, so it is only written when the view changes, which announces it. Below the top level
   * its text is in the button that drills up. A drill replaces the region instead, as a new region's content isn't
   * announced: focus moving into the new level already announces it, with the grid's name.
   */
  private renderHeading(view: CalendarView<I>, drilled: boolean) {
    if (drilled) {
      const above = this.levelAbove(view.level);
      const heading = this.heading.cloneNode(false) as HTMLElement;
      heading.append(headingContent(view, above && `${heading.id}-${above.cell}`));
      this.heading.replaceWith(heading);
      return;
    }

    const text = headingText(view);
    if (this.heading.textContent !== text) {
      (this.heading.querySelector('button') ?? this.heading).textContent = text;
    }
  }

  /**
   * The cell a cell of the grid names, or `null` for anything else. A cell's padding, the gap around its button, counts
   * as the cell: a week calendar's band spans it, so a click there is meant for the cell.
   */
  private cellOf(node: EventTarget | null): CalendarDate | null {
    // `closest` can leave the grid, for a cell of an app's table the calendar sits in.
    const td = node instanceof Element ? node.closest('td') : null;
    if (!td || !this.cells.contains(td)) return null;

    const button = td.querySelector<HTMLElement>(':scope > button[data-date]');
    return button ? CalendarDate.parse(button.dataset.date) : null;
  }
}
