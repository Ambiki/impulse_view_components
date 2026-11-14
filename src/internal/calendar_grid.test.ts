import type { CalendarView } from './calendar_grid';
import type { MonthLevelI18n } from './month_level';
import type { YearLevelI18n } from './year_level';
import { expect } from '@open-wc/testing';
import { CalendarDate } from './calendar_date';
import {
  canMoveView,
  canShowView,
  gridRows,
  headingText,
  isOutsideLimits,
  isPastFourDigitYears,
} from './calendar_grid';
import { MONTH_ENGLISH, MONTH_LEVEL } from './month_level';
import { YEAR_ENGLISH, YEAR_LEVEL } from './year_level';

/** The calendar date `value` names, as `YYYY-MM-DD`. */
const date = (value: string) => CalendarDate.parse(value)!;

/** A month calendar's view of 2026, with November holding the tab stop, changed by `overrides`. */
function monthView(overrides: Partial<CalendarView<MonthLevelI18n>> = {}): CalendarView<MonthLevelI18n> {
  return {
    level: MONTH_LEVEL,
    tagName: 'awc-month-calendar',
    displayed: date('2026-11-01'),
    active: date('2026-11-01'),
    selected: null,
    today: date('2026-05-01'),
    min: null,
    max: null,
    isDisabled: () => false,
    disabled: false,
    firstDayOfWeek: 0,
    i18n: MONTH_ENGLISH,
    ...overrides,
  };
}

/** The buttons of the grid `view` renders, by the first day of the cell each stands for. */
function buttons<I>(view: CalendarView<I>) {
  const cells = gridRows(view).flatMap((row) => [...row.querySelectorAll('button')]);
  return new Map(cells.map((button) => [button.dataset.date!, button]));
}

/** The first days of the cells that `matches` holds for, in the grid `view` renders. */
function cellsWhere<I>(view: CalendarView<I>, matches: (button: HTMLButtonElement) => boolean) {
  return [...buttons(view)].filter(([, button]) => matches(button)).map(([cell]) => cell);
}

describe('the calendar grid', () => {
  describe('moving between views', () => {
    it('moves to any view when there is no `min` or `max`', () => {
      expect(canMoveView(monthView(), -1)).to.equal(true);
      expect(canMoveView(monthView(), 1)).to.equal(true);
    });

    it('stops at the views holding `min` and `max`', () => {
      const limits = { min: date('2025-03-01'), max: date('2027-08-31') };

      expect(canMoveView(monthView(limits), -1)).to.equal(true);
      expect(canMoveView(monthView(limits), 1)).to.equal(true);
      expect(canMoveView(monthView({ ...limits, displayed: date('2025-06-01') }), -1)).to.equal(false);
      expect(canMoveView(monthView({ ...limits, displayed: date('2027-06-01') }), 1)).to.equal(false);
    });

    it('moves back toward the limits from a view outside them, and no further from them', () => {
      const outside = monthView({ min: date('2025-03-01'), max: date('2027-08-31'), displayed: date('2023-06-01') });

      expect(canMoveView(outside, 1)).to.equal(true);
      expect(canMoveView(outside, -1)).to.equal(false);
      expect(canShowView(date('2023-01-01'), outside)).to.equal(true);
    });
  });

  describe('limits', () => {
    it('takes a range for outside the limits only when none of its days is between them', () => {
      const november = { start: date('2026-11-01'), end: date('2026-11-30') };

      expect(isOutsideLimits(november, date('2026-11-30'), null)).to.equal(false);
      expect(isOutsideLimits(november, date('2026-12-01'), null)).to.equal(true);
      expect(isOutsideLimits(november, null, date('2026-11-01'))).to.equal(false);
      expect(isOutsideLimits(november, null, date('2026-10-31'))).to.equal(true);
      expect(isOutsideLimits(november, null, null)).to.equal(false);
    });

    it('takes a range for past the four-digit years when any of its days is', () => {
      const lastWeek = { start: date('9999-12-26'), end: new CalendarDate(10000, 1, 1) };
      const firstWeek = { start: new CalendarDate(999, 12, 29), end: date('1000-01-04') };

      expect(isPastFourDigitYears(lastWeek)).to.equal(true);
      expect(isPastFourDigitYears(firstWeek)).to.equal(true);
      expect(isPastFourDigitYears({ start: date('1000-01-01'), end: date('9999-12-31') })).to.equal(false);
    });
  });

  describe('the cells it renders', () => {
    it('renders a button for each cell of the view, named and classed by its level', () => {
      const cells = buttons(monthView());
      const november = cells.get('2026-11-01')!;

      expect(cells.size).to.equal(12);
      expect(november.className).to.equal('awc-month-calendar-month');
      expect(november.textContent).to.equal('Nov');
      expect(november.getAttribute('aria-label')).to.equal('November 2026');
      expect(november.getAttribute('type')).to.equal('button');
    });

    it('names the displayed view as its level does', () => {
      expect(headingText(monthView())).to.equal('2026');
    });

    it('gives the tab stop to the active cell alone', () => {
      expect(cellsWhere(monthView(), (button) => button.tabIndex === 0)).to.eql(['2026-11-01']);
    });

    it('marks today\'s cell', () => {
      const current = cellsWhere(monthView(), (button) => button.getAttribute('aria-current') === 'date');

      expect(current).to.eql(['2026-05-01']);
    });

    it('selects every cell with a day of the selected range, so a week across two months selects both', () => {
      const view = monthView({ selected: { start: date('2026-10-28'), end: date('2026-11-03') } });

      const selected = cellsWhere(view, (button) => button.closest('td')!.getAttribute('aria-selected') === 'true');

      expect(selected).to.eql(['2026-10-01', '2026-11-01']);
    });

    it('marks the cells the view disables, which keep their buttons', () => {
      const view = monthView({ isDisabled: (cell) => cell.month <= 2 });

      expect(cellsWhere(view, (button) => button.getAttribute('aria-disabled') === 'true')).to.eql([
        '2026-01-01',
        '2026-02-01',
      ]);
      expect(cellsWhere(view, (button) => button.disabled)).to.eql([]);
    });

    it('disables every button of a disabled calendar', () => {
      expect(cellsWhere(monthView({ disabled: true }), (button) => !button.disabled)).to.eql([]);
    });

    it('marks the cells of the views before and after as outside', () => {
      const view: CalendarView<YearLevelI18n> = {
        ...monthView(),
        level: YEAR_LEVEL,
        tagName: 'awc-year-calendar',
        displayed: date('2026-01-01'),
        active: date('2026-01-01'),
        i18n: YEAR_ENGLISH,
      };

      expect(cellsWhere(view, (button) => button.classList.contains('awc-year-calendar-year--outside'))).to.eql([
        '2019-01-01',
        '2030-01-01',
      ]);
    });
  });
});
