/**
 * The behaviour the calendars share: `<awc-date-calendar>`, `<awc-week-calendar>`, and a range calendar later. It is
 * internal: the package's `exports` map doesn't list it. Its public members reach apps, though, through the elements
 * that extend it, so changing those changes the public API.
 *
 * The selection is a date range: one day for a date calendar, a week for a week calendar. The value is always the
 * selection's first day. A subclass decides what a day selects, which days are disabled, and what `commit` carries.
 *
 * A subclass declares the properties and targets below with `@property()` and `@target()`, since impulse reads only a
 * class's own declarations, and renders the markup of `Impulse::Internal::DayGridComponent`.
 */
import type { DateRange } from 'src/internal/calendar_date';
import type { CalendarI18n, CalendarView } from 'src/internal/day_grid';
import { ImpulseElement } from '@ambiki/impulse';
import { CalendarDate, rangeEquals, today } from 'src/internal/calendar_date';
import { canMoveView, canShowMonth, headingText, weekdayRow, weekRows } from 'src/internal/day_grid';

export default abstract class DayGridElement extends ImpulseElement {
  /** The selection's first day, as `YYYY-MM-DD`. Any day of the selection names it; anything else selects nothing. */
  abstract value: string;

  /** The earliest day the user can commit, as `YYYY-MM-DD`. */
  abstract min: string;

  /** The latest day the user can commit, as `YYYY-MM-DD`. */
  abstract max: string;

  /** The day each week starts on, `0` being Sunday. */
  abstract firstDayOfWeek: number;

  /** The IANA time zone that decides which day is today. Defaults to the browser's. */
  abstract timeZone: string;

  /** The names and patterns the months are rendered with. Defaults to English. */
  abstract i18n: CalendarI18n;

  abstract heading: HTMLElement;
  abstract grid: HTMLTableElement;
  abstract weekdays: HTMLTableSectionElement;
  abstract days: HTMLTableSectionElement;
  abstract previousButton: HTMLButtonElement;
  abstract nextButton: HTMLButtonElement;

  /** The range committing `date` selects, and that a value of `date` names: the day itself, or its week. */
  protected abstract rangeOf(date: CalendarDate): DateRange;

  /** Whether the user can move to `date` but not commit it, given the earliest and latest days allowed. */
  protected abstract isDisabledDay(date: CalendarDate, min: CalendarDate | null, max: CalendarDate | null): boolean;

  /** The detail of `commit`, for the range the user committed. */
  protected abstract commitDetail(range: DateRange): object;

  /**
   * The month shown, and the day holding the tab stop, after the user commits `date`, which selected `range`. By
   * default, `date`'s month: committing an outside day turns the page to it.
   */
  protected afterCommit(_view: CalendarView, date: CalendarDate, _range: DateRange): { displayed: CalendarDate; active: CalendarDate } {
    return { displayed: date, active: date };
  }

  /** Whether the value is changing because the user committed a day, which leaves the view where the user is. */
  private committing = false;

  connected() {
    // The server marked today when it rendered, which a cached page, or one left open past midnight, outlived.
    const view = this.view();
    const marked = this.days.querySelector<HTMLElement>('[aria-current="date"]')?.dataset.date ?? null;
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

  firstDayOfWeekChanged() {
    this.refresh();
  }

  /**
   * Takes the view back to the value's day: its month becomes the displayed month, and it becomes the active day.
   * Without a value, today's. Changes nothing else, and emits nothing.
   */
  resetView() {
    const view = this.view();
    this.showDay(view, CalendarDate.parse(this.value) ?? view.today);
  }

  /**
   * Shows the view before, the month before, as the previous button does: the active day moves back a month, kept
   * within the month's length. Does nothing at the month holding `min`. Changes no value and emits nothing.
   */
  previousView() {
    this.moveView(-1);
  }

  /** Shows the view after, as the next button does. Does nothing at the month holding `max`. */
  nextView() {
    this.moveView(1);
  }

  /**
   * Shows the month `date` is in and makes `date` the active day, without selecting it. Unlike the user, code can go
   * past `min` and `max`. Ignores anything that isn't a `YYYY-MM-DD` calendar date, and emits nothing.
   */
  goToDate(date: string) {
    const day = CalendarDate.parse(date);
    if (day) this.showDay(this.view(), day);
  }

  /** Shows today's month, in the calendar's time zone, and makes today the active day, without selecting it. */
  goToToday() {
    const view = this.view();
    this.showDay(view, view.today);
  }

  /**
   * Selects nothing, as setting an empty `value` does: the calendar shows today's month. Like any value method called
   * from code, including from a `data-action`, it emits nothing (ADR 0002).
   */
  clear() {
    this.removeAttribute('value');
  }

  /**
   * Whether the user couldn't commit `date`, a `YYYY-MM-DD` day, given `min`, `max` and the calendar's own limits.
   * Anything that isn't a calendar date isn't disabled.
   */
  isDateDisabled(date: string): boolean {
    const day = CalendarDate.parse(date);
    return !!day && this.view().isDisabled(day);
  }

  /** Focuses the active day, the grid's one tab stop. */
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
    const from = this.dayOf(event.target);
    if (!from || event.altKey || event.ctrlKey || event.metaKey) return;

    const to = this.dayForKey(event, from);
    if (!to) return;

    // The keys move through the grid, so they don't scroll the page, even where the grid stops them.
    event.preventDefault();
    this.moveTo(to);
  }

  /** A day of the displayed month that gets focus, by pointer for one, takes the tab stop. Outside days never do. */
  handleFocusin(event: FocusEvent) {
    const date = this.dayOf(event.target);
    if (date && date.isSameMonth(this.view().displayed)) this.moveTabStop(date);
  }

  handleClick(event: MouseEvent) {
    const date = this.dayOf(event.target);
    if (date) this.commit(date);
  }

  /** Renders the grid again for what it shows now, after a setting changed. */
  protected refresh() {
    this.render(this.view());
  }

  /**
   * Moves the view by `months`, moving the active day by as many months, kept within the month's length. Does nothing
   * past the months holding `min` and `max`.
   */
  private moveView(months: number) {
    const view = this.view();
    if (!canMoveView(view, months)) return;

    this.showDay(view, view.active.add({ months }));
  }

  /** The day `event`'s key moves to from `from`, per the APG date picker, or `null` when it isn't one that moves. */
  private dayForKey(event: KeyboardEvent, from: CalendarDate): CalendarDate | null {
    switch (event.key) {
      case 'ArrowLeft':
        return from.add({ days: -1 });
      case 'ArrowRight':
        return from.add({ days: 1 });
      case 'ArrowUp':
        return from.add({ days: -7 });
      case 'ArrowDown':
        return from.add({ days: 7 });
      case 'Home':
        return from.startOfWeek(this.firstDayOfWeek);
      case 'End':
        return from.startOfWeek(this.firstDayOfWeek).add({ days: 6 });
      case 'PageUp':
        return event.shiftKey ? from.add({ years: -1 }) : from.add({ months: -1 });
      case 'PageDown':
        return event.shiftKey ? from.add({ years: 1 }) : from.add({ months: 1 });
      default:
        return null;
    }
  }

  /**
   * Makes `date` the active day and focuses it, turning the page when it is in another month. Does nothing past the
   * months holding `min` and `max`.
   */
  private moveTo(date: CalendarDate) {
    const view = this.view();
    if (!canShowMonth(date, view)) return;

    if (date.isSameMonth(view.displayed)) {
      this.moveTabStop(date);
    } else {
      this.showDay(view, date);
    }
    this.button(date)?.focus();
  }

  /** Gives the grid's one tab stop to `date`, a day of the displayed month. */
  private moveTabStop(date: CalendarDate) {
    for (const button of this.days.querySelectorAll<HTMLElement>('button[tabindex="0"]')) {
      button.setAttribute('tabindex', '-1');
    }
    this.button(date)?.setAttribute('tabindex', '0');
  }

  private button(date: CalendarDate) {
    return this.days.querySelector<HTMLButtonElement>(`button[data-date="${date.toString()}"]`);
  }

  /**
   * Commits `date` as the user does: selects the range it makes, its first day becomes the value, and `commit` is
   * emitted when the selection changed.
   */
  private commit(date: CalendarDate) {
    const view = this.view();
    if (view.isDisabled(date)) return;

    const range = this.rangeOf(date);
    this.render({ ...view, ...this.afterCommit(view, date, range), selected: range });
    if (rangeEquals(range, view.selected)) return;

    // The event reports the range committed, not whatever `value` holds by the time it is read.
    this.committing = true;
    try {
      this.value = range.start.toString();
    } finally {
      this.committing = false;
    }
    this.emit('commit', { detail: this.commitDetail(range) });
  }

  /** What the grid shows now. The displayed month and the active day are read from the DOM, which a morph restores. */
  protected view(): CalendarView {
    const displayed = CalendarDate.parse(`${this.grid.dataset.month}-01`)!;
    const day = CalendarDate.parse(this.value);
    const active = CalendarDate.parse(this.days.querySelector<HTMLElement>('button[tabindex="0"]')?.dataset.date);
    const min = CalendarDate.parse(this.min);
    const max = CalendarDate.parse(this.max);
    return {
      block: this.localName,
      displayed,
      active: active ?? day ?? displayed,
      selected: day ? this.rangeOf(day) : null,
      today: today(this.timeZone),
      min,
      max,
      isDisabled: (date) => this.isDisabledDay(date, min, max),
      firstDayOfWeek: this.firstDayOfWeek,
      i18n: this.i18n,
    };
  }

  /** Shows the month `date` is in, with `date` as the active day. */
  private showDay(view: CalendarView, date: CalendarDate) {
    this.render({ ...view, displayed: date, active: date });
  }

  private render(view: CalendarView) {
    // The day buttons are replaced, so focus on one moves to the active day rather than to the page.
    const hadFocus = this.days.contains(document.activeElement);
    this.grid.dataset.month = view.displayed.toString().slice(0, 7);
    // The heading is a live region, so it is only written when the month changes, which announces it.
    const heading = headingText(view);
    if (this.heading.textContent !== heading) this.heading.textContent = heading;
    this.weekdays.replaceChildren(weekdayRow(view));
    this.days.replaceChildren(...weekRows(view));
    if (hadFocus) this.button(view.active)?.focus();
    this.previousButton.setAttribute('aria-disabled', String(!canMoveView(view, -1)));
    this.nextButton.setAttribute('aria-disabled', String(!canMoveView(view, 1)));
  }

  /** The day a day button in the grid names, or `null` for anything else. */
  private dayOf(node: EventTarget | null): CalendarDate | null {
    const button = node instanceof Element ? node.closest<HTMLElement>('button[data-date]') : null;
    return button && this.days.contains(button) ? CalendarDate.parse(button.dataset.date) : null;
  }
}
