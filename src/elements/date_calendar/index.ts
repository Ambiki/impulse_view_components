import type { CalendarDate, DateRange } from 'src/internal/calendar_date';
import type { CalendarI18n } from 'src/internal/day_grid';
import { property, registerElement, target } from '@ambiki/impulse';
import { ENGLISH } from 'src/internal/day_grid';
import DayGridElement from 'src/internal/day_grid_element';

/** The names and patterns a date calendar formats its text with, as `Impulse::DateCalendarComponent` renders them. */
export type DateCalendarI18n = CalendarI18n;

/** The detail of `awc-date-calendar:commit`, emitted when the user commits a day other than the selected one. */
export interface AwcDateCalendarCommitEvent {
  /** The committed day, as `YYYY-MM-DD`. */
  value: string;
}

@registerElement('awc-date-calendar')
export default class AwcDateCalendarElement extends DayGridElement {
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

  disabledDaysOfWeekChanged() {
    this.refresh();
  }

  /** A day selects itself. */
  protected rangeOf(date: CalendarDate): DateRange {
    return { start: date, end: date };
  }

  /** A day is disabled before `min`, after `max`, or on a disabled day of the week. */
  protected isDisabledDay(date: CalendarDate, min: CalendarDate | null, max: CalendarDate | null): boolean {
    return (
      (!!min && date.compare(min) < 0) ||
      (!!max && date.compare(max) > 0) ||
      this.disabledDaysOfWeek.includes(date.dayOfWeek)
    );
  }

  protected commitDetail(range: DateRange): AwcDateCalendarCommitEvent {
    return { value: range.start.toString() };
  }
}

export { AwcDateCalendarElement };

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
