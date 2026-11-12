import type { DateRange } from 'src/internal/calendar_date';
import type { YearLevelI18n } from 'src/internal/year_level';
import { property, registerElement, target } from '@ambiki/impulse';
import CalendarGridElement from 'src/internal/calendar_grid_element';
import { YEAR_ENGLISH, YEAR_LEVEL } from 'src/internal/year_level';

/** The pattern a year calendar names its decades with, as `Impulse::YearCalendarComponent` renders it. */
export type YearCalendarI18n = YearLevelI18n;

/** The detail of `awc-year-calendar:commit`, emitted when the user commits a year other than the selected one. */
export interface AwcYearCalendarCommitEvent {
  /** The committed year, as `YYYY`. */
  value: string;
}

@registerElement('awc-year-calendar')
export default class AwcYearCalendarElement extends CalendarGridElement<YearCalendarI18n> {
  /** The selected year, as `YYYY`. Anything else means no year is selected. */
  @property() value = '';

  /** The earliest year the user can commit, as `YYYY`. */
  @property() min = '';

  /** The latest year the user can commit, as `YYYY`. */
  @property() max = '';

  /** The IANA time zone that decides which year today falls in. Defaults to the browser's. */
  @property() timeZone = '';

  /** The pattern the decades are named with. Defaults to English. */
  @property({ type: Object }) i18n: YearCalendarI18n = YEAR_ENGLISH;

  @target() heading: HTMLElement;
  @target() grid: HTMLTableElement;
  @target() cells: HTMLTableSectionElement;
  @target() previousButton: HTMLButtonElement;
  @target() nextButton: HTMLButtonElement;

  protected readonly level = YEAR_LEVEL;

  protected commitDetail(range: DateRange): AwcYearCalendarCommitEvent {
    return { value: this.formatValue(range) };
  }
}

export { AwcYearCalendarElement };

declare global {
  interface Window {
    AwcYearCalendarElement: typeof AwcYearCalendarElement;
  }
  interface HTMLElementTagNameMap {
    'awc-year-calendar': AwcYearCalendarElement;
  }
  interface GlobalEventHandlersEventMap {
    'awc-year-calendar:commit': CustomEvent<AwcYearCalendarCommitEvent>;
  }
}
