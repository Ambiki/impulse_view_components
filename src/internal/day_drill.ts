/**
 * The drill up from days that the date and week calendars share: the levels above the day level, months then years
 * (ADR 0017), and the names and patterns of all three. It is internal: the package's `exports` map doesn't list it.
 */
import type { PagingI18n } from 'src/internal/calendar_grid';
import type { DayLevelI18n } from 'src/internal/day_level';
import type { MonthLevelI18n } from 'src/internal/month_level';
import type { YearLevelI18n } from 'src/internal/year_level';
import { DAY_ENGLISH } from 'src/internal/day_level';
import { MONTH_ENGLISH, MONTH_LEVEL } from 'src/internal/month_level';
import { YEAR_ENGLISH, YEAR_LEVEL } from 'src/internal/year_level';

/**
 * The names and patterns a calendar that drills up from days renders its days, months and years with, and its page
 * buttons' names on each, as its component renders them.
 */
export type DayDrillI18n = DayLevelI18n & MonthLevelI18n & YearLevelI18n & PagingI18n;

/** The levels a calendar drills up to from days, nearest first. */
export const LEVELS_ABOVE_DAYS = [MONTH_LEVEL, YEAR_LEVEL];

/** Rails' English, used only when the component's `i18n` attribute is missing (ADR 0015). */
export const DAY_DRILL_ENGLISH: DayDrillI18n = {
  ...DAY_ENGLISH,
  formats: { ...DAY_ENGLISH.formats, ...MONTH_ENGLISH.formats, ...YEAR_ENGLISH.formats },
};
