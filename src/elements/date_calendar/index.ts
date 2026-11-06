import type { CalendarView, DateCalendarI18n } from './render';
import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';
import { CalendarDate, today } from 'src/internal/calendar_date';
import { canShowMonth, canTurnPage, ENGLISH, headingText, isDisabledDay, weekdayRow, weekRows } from './render';

/** The detail of `awc-date-calendar:commit`, emitted when the user commits a day other than the selected one. */
export interface AwcDateCalendarCommitEvent {
  /** The committed day, as `YYYY-MM-DD`. */
  value: string;
}

@registerElement('awc-date-calendar')
export default class AwcDateCalendarElement extends ImpulseElement {
  /** The selected day, as `YYYY-MM-DD`. Anything else means no day is selected. */
  @property() value = '';

  /** The earliest day the user can commit, as `YYYY-MM-DD`. */
  @property() min = '';

  /** The latest day the user can commit, as `YYYY-MM-DD`. */
  @property() max = '';

  /** The days of the week the user can't commit, `0` being Sunday. */
  @property({ type: Array }) disabledDaysOfWeek: number[] = [];

  /** The day each week starts on, `0` being Sunday. */
  @property({ type: Number }) firstDayOfWeek = 0;

  /** The IANA time zone that decides which day is today. Defaults to the browser's. */
  @property() timeZone = '';

  /** The names and patterns the months are rendered with. Defaults to English. */
  @property({ type: Object }) i18n: DateCalendarI18n = ENGLISH;

  @target() heading: HTMLElement;
  @target() grid: HTMLTableElement;
  @target() weekdays: HTMLTableSectionElement;
  @target() days: HTMLTableSectionElement;
  @target() previousButton: HTMLButtonElement;
  @target() nextButton: HTMLButtonElement;

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
    this.render(this.view());
  }

  maxChanged() {
    this.render(this.view());
  }

  disabledDaysOfWeekChanged() {
    this.render(this.view());
  }

  timeZoneChanged() {
    this.render(this.view());
  }

  i18nChanged() {
    this.render(this.view());
  }

  firstDayOfWeekChanged() {
    this.render(this.view());
  }

  /**
   * Takes the view back to the selected day: its month becomes the displayed month, and it becomes the active day.
   * Without a selected day, today's. Changes nothing else, and emits nothing.
   */
  resetView() {
    const view = this.view();
    this.showDay(view, view.selected ?? view.today);
  }

  /**
   * Turns to the page before, the month before, as the previous button does: the active day moves back a month, kept
   * within the month's length. Does nothing at the month holding `min`. Changes no value and emits nothing.
   */
  previousPage() {
    this.turnPage(-1);
  }

  /** Turns to the page after, as the next button does. Does nothing at the month holding `max`. */
  nextPage() {
    this.turnPage(1);
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
   * Selects no day, as setting an empty `value` does: the calendar shows today's month. Like any value method called
   * from code, including from a `data-action`, it emits nothing (ADR 0002).
   */
  clear() {
    this.removeAttribute('value');
  }

  /**
   * Whether the user couldn't commit `date`, a `YYYY-MM-DD` day: it is before `min`, after `max`, or on a disabled day of
   * the week. Anything that isn't a calendar date isn't disabled.
   */
  isDateDisabled(date: string): boolean {
    const day = CalendarDate.parse(date);
    return !!day && isDisabledDay(day, this.view());
  }

  /** Focuses the active day, the grid's one tab stop. Call it when a popover holding the calendar opens. */
  focus(options?: FocusOptions) {
    this.button(this.view().active)?.focus(options);
  }

  handlePreviousClick() {
    this.previousPage();
  }

  handleNextClick() {
    this.nextPage();
  }

  /**
   * Turns the page by `months`, moving the active day by as many months, kept within the month's length. Does nothing
   * past the months holding `min` and `max`.
   */
  private turnPage(months: number) {
    const view = this.view();
    if (!canTurnPage(view, months)) return;

    this.showDay(view, view.active.add({ months }));
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

  /** A day of the displayed month that gets focus, by pointer for one, takes the tab stop. Outside days never do. */
  handleFocusin(event: FocusEvent) {
    const date = this.dayOf(event.target);
    if (date && date.isSameMonth(this.view().displayed)) this.moveTabStop(date);
  }

  handleClick(event: MouseEvent) {
    const date = this.dayOf(event.target);
    if (date) this.commit(date);
  }

  /** Commits `date` as the user does: makes it the value, and emits `commit` when the value changed. */
  private commit(date: CalendarDate) {
    const view = this.view();
    if (isDisabledDay(date, view)) return;

    // Committing an outside day turns the page to its month, so the selected day is in the displayed month.
    this.render({ ...view, displayed: date, active: date, selected: date });
    if (this.value === date.toString()) return;

    this.committing = true;
    try {
      this.value = date.toString();
    } finally {
      this.committing = false;
    }
    this.emit<AwcDateCalendarCommitEvent>('commit', { detail: { value: this.value } });
  }

  /** What the grid shows now. The displayed month and the active day are read from the DOM, which a morph restores. */
  private view(): CalendarView {
    const displayed = CalendarDate.parse(`${this.grid.dataset.month}-01`)!;
    const selected = CalendarDate.parse(this.value);
    const active = CalendarDate.parse(this.days.querySelector<HTMLElement>('button[tabindex="0"]')?.dataset.date);
    return {
      displayed,
      active: active ?? selected ?? displayed,
      selected,
      today: today(this.timeZone),
      min: CalendarDate.parse(this.min),
      max: CalendarDate.parse(this.max),
      disabledDaysOfWeek: this.disabledDaysOfWeek,
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
    this.previousButton.setAttribute('aria-disabled', String(!canTurnPage(view, -1)));
    this.nextButton.setAttribute('aria-disabled', String(!canTurnPage(view, 1)));
  }

  /** The day a day button in the grid names, or `null` for anything else. */
  private dayOf(node: EventTarget | null): CalendarDate | null {
    const button = node instanceof Element ? node.closest<HTMLElement>('button[data-date]') : null;
    return button && this.days.contains(button) ? CalendarDate.parse(button.dataset.date) : null;
  }
}

export { AwcDateCalendarElement };
export type { DateCalendarI18n };

declare global {
  interface Window {
    AwcDateCalendarElement: typeof AwcDateCalendarElement;
  }
  interface HTMLElementTagNameMap {
    'awc-date-calendar': AwcDateCalendarElement;
  }
  interface GlobalEventHandlersEventMap {
    'awc-date-calendar:commit': CustomEvent<AwcDateCalendarCommitEvent>;
  }
}
