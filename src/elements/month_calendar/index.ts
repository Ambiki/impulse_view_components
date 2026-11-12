import type { CalendarDate, DateRange } from 'src/internal/calendar_date';
import type { PagingI18n } from 'src/internal/calendar_grid';
import type { MonthLevelI18n } from 'src/internal/month_level';
import type { YearLevelI18n } from 'src/internal/year_level';
import { property, registerElement, target } from '@ambiki/impulse';
import { englishPaging } from 'src/internal/calendar_grid';
import CalendarGridElement from 'src/internal/calendar_grid_element';
import { formatMonth, MONTH_ENGLISH, MONTH_LEVEL, monthRange, parseMonth } from 'src/internal/month_level';
import { YEAR_ENGLISH, YEAR_LEVEL } from 'src/internal/year_level';

/**
 * The names and patterns a month calendar renders its months and, drilled up, its years with, and the names of its page
 * buttons on each, as `Impulse::MonthCalendarComponent` renders them.
 */
export type MonthCalendarI18n = MonthLevelI18n & YearLevelI18n & PagingI18n;

/** Rails' English, used only when the component's `i18n` attribute is missing (ADR 0015). */
const MONTH_CALENDAR_ENGLISH: MonthCalendarI18n = {
  ...MONTH_ENGLISH,
  paging: englishPaging([MONTH_LEVEL, YEAR_LEVEL]),
  formats: { ...MONTH_ENGLISH.formats, ...YEAR_ENGLISH.formats },
};

/** The detail of `awc-month-calendar:commit`, emitted when the user commits a month other than the selected one. */
export interface AwcMonthCalendarCommitEvent {
  /** The committed month, as `YYYY-MM`. */
  value: string;
}

@registerElement('awc-month-calendar')
export default class AwcMonthCalendarElement extends CalendarGridElement<MonthCalendarI18n> {
  /** The selected month, as `YYYY-MM`. Anything else means no month is selected. */
  @property() value = '';

  /** The earliest month the user can commit, as `YYYY-MM`. */
  @property() min = '';

  /** The latest month the user can commit, as `YYYY-MM`. */
  @property() max = '';

  /** The IANA time zone that decides which month today falls in. Defaults to the browser's. */
  @property() timeZone = '';

  /** The names and patterns the months and years are rendered with. Defaults to English. */
  @property({ type: Object }) i18n: MonthCalendarI18n = MONTH_CALENDAR_ENGLISH;

  @target() heading: HTMLElement;
  @target() grid: HTMLTableElement;
  @target() cells: HTMLTableSectionElement;
  @target() previousButton: HTMLButtonElement;
  @target() nextButton: HTMLButtonElement;

  protected readonly level = MONTH_LEVEL;

  /** Its heading drills up to years (ADR 0017). */
  protected readonly levelsAbove = [YEAR_LEVEL];

  /** A month selects its days, from its first to its last, so it's disabled before `min`'s month or after `max`'s. */
  protected rangeOf(cell: CalendarDate): DateRange {
    return monthRange(cell);
  }

  protected commitDetail(range: DateRange): AwcMonthCalendarCommitEvent {
    return { value: this.formatValue(range) };
  }

  /** A month, `YYYY-MM`, names its first day. */
  protected parseValue(value: string): CalendarDate | null {
    return parseMonth(value);
  }

  protected formatValue(range: DateRange): string {
    return formatMonth(range.start);
  }

  /** `max` allows its whole month. */
  protected parseLimit(value: string, limit: 'min' | 'max'): CalendarDate | null {
    const month = parseMonth(value);
    return month && limit === 'max' ? monthRange(month).end : month;
  }
}

export { AwcMonthCalendarElement };

declare global {
  interface Window {
    AwcMonthCalendarElement: typeof AwcMonthCalendarElement;
  }
  interface HTMLElementTagNameMap {
    'awc-month-calendar': AwcMonthCalendarElement;
  }
  interface GlobalEventHandlersEventMap {
    'awc-month-calendar:commit': CustomEvent<AwcMonthCalendarCommitEvent>;
  }
}
