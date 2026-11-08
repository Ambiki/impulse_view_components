import type { CalendarDate, DateRange } from 'src/internal/calendar_date';
import type { CalendarI18n, CalendarView } from 'src/internal/calendar_grid';
import { property, registerElement, target } from '@ambiki/impulse';
import { rangeIncludes } from 'src/internal/calendar_date';
import { ENGLISH } from 'src/internal/calendar_grid';
import CalendarGridElement from 'src/internal/calendar_grid_element';
import { DAY_LEVEL } from 'src/internal/day_level';

/** The names and patterns a week calendar formats its text with, as `Impulse::WeekCalendarComponent` renders them. */
export type WeekCalendarI18n = CalendarI18n;

/** The detail of `awc-week-calendar:commit`, emitted when the user commits a day of a week other than the selected one. */
export interface AwcWeekCalendarCommitEvent {
  /** The committed week's first day, as `YYYY-MM-DD`: the calendar's new value. */
  value: string;
  /** The committed week's first day, as `YYYY-MM-DD`. */
  start: string;
  /** The committed week's last day, included, as `YYYY-MM-DD`. */
  end: string;
}

@registerElement('awc-week-calendar')
export default class AwcWeekCalendarElement extends CalendarGridElement<CalendarI18n> {
  /** The selected week's first day, as `YYYY-MM-DD`. Any day names the week it falls in; anything else selects none. */
  @property() value = '';

  /** The earliest day the user can commit, as `YYYY-MM-DD`. */
  @property() min = '';

  /** The latest day the user can commit, as `YYYY-MM-DD`. */
  @property() max = '';

  /** The day each week starts on, `0` being Sunday. */
  @property({ type: Number }) firstDayOfWeek = 0;

  /** The IANA time zone that decides which day is today. Defaults to the browser's. */
  @property() timeZone = '';

  /** The names and patterns the months are rendered with. Defaults to English. */
  @property({ type: Object }) i18n: WeekCalendarI18n = ENGLISH;

  @target() heading: HTMLElement;
  @target() grid: HTMLTableElement;
  @target() weekdays: HTMLTableSectionElement;
  @target() days: HTMLTableSectionElement;
  @target() previousButton: HTMLButtonElement;
  @target() nextButton: HTMLButtonElement;

  protected readonly level = DAY_LEVEL;

  protected get cells() {
    return this.days;
  }

  protected get weekdayHeadings() {
    return this.weekdays;
  }

  /** A day selects its week. */
  protected rangeOf(date: CalendarDate): DateRange {
    return { start: date.startOfWeek(this.firstDayOfWeek), end: date.endOfWeek(this.firstDayOfWeek) };
  }

  /**
   * A day is disabled when none of its week's days falls between `min` and `max`: a week can be committed when any of
   * them does, and commits whole.
   */
  protected isDisabledCell(date: CalendarDate, min: CalendarDate | null, max: CalendarDate | null): boolean {
    const week = this.rangeOf(date);
    return (!!min && week.end.compare(min) < 0) || (!!max && week.start.compare(max) > 0);
  }

  /**
   * A week with a day in the displayed month is in view already, so committing one of its outside days doesn't turn the
   * page: the tab stop goes to its day in the month nearest the one committed, since outside days never hold it. A week
   * with no day in the month turns the page to the committed day's month.
   */
  protected viewAfterCommit(view: CalendarView<CalendarI18n>, date: CalendarDate, range: DateRange) {
    if (date.isSameMonth(view.displayed)) return { displayed: view.displayed, active: date };

    const nearest = date.compare(view.displayed) < 0 ? view.displayed.startOfMonth() : view.displayed.endOfMonth();
    if (rangeIncludes(range, nearest)) return { displayed: view.displayed, active: nearest };

    return { displayed: date, active: date };
  }

  protected commitDetail(range: DateRange): AwcWeekCalendarCommitEvent {
    const start = range.start.toString();
    return { value: start, start, end: range.end.toString() };
  }
}

export { AwcWeekCalendarElement };

declare global {
  interface Window {
    AwcWeekCalendarElement: typeof AwcWeekCalendarElement;
  }
  interface HTMLElementTagNameMap {
    'awc-week-calendar': AwcWeekCalendarElement;
  }
  interface GlobalEventHandlersEventMap {
    'awc-week-calendar:commit': CustomEvent<AwcWeekCalendarCommitEvent>;
  }
}
