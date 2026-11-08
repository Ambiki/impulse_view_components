import type AwcYearCalendarElement from './index';
import type { AwcYearCalendarCommitEvent } from './index';
import { whenInitialized } from '@ambiki/impulse';
import { expect, fixture } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { Idiomorph } from 'idiomorph';
import { CalendarDate, today } from '../../internal/calendar_date';
import { canMoveView, gridRows, headingText } from '../../internal/calendar_grid';
import { YEAR_ENGLISH, YEAR_LEVEL } from '../../internal/year_level';
// Registers `awc-year-calendar`. Kept separate from the type imports above, which the bundler elides.
import './index';

interface CalendarOptions {
  value?: string;
  min?: string;
  max?: string;
  timeZone?: string;
}

/** January 1 of the year `value` names, or `null`. */
function yearOf(value: string | undefined) {
  return value && /^\d{4}$/.test(value) ? new CalendarDate(Number(value), 1, 1) : null;
}

/**
 * The markup `Impulse::YearCalendarComponent` renders, without the whitespace between tags. Its first decade comes from
 * the element's own renderer; the system test checks that it matches the component's.
 */
function yearCalendarHtml(options: CalendarOptions = {}) {
  const { value, min, max, timeZone = 'UTC' } = options;
  const selected = yearOf(value);
  const now = YEAR_LEVEL.cellOf(today(timeZone));
  const shown = selected ?? now;
  const minYear = yearOf(min);
  const maxYear = yearOf(max);
  const view = {
    level: YEAR_LEVEL,
    tagName: 'awc-year-calendar',
    displayed: shown,
    active: shown,
    selected: selected && { start: selected, end: new CalendarDate(selected.year, 12, 31) },
    today: now,
    min: minYear,
    max: maxYear && new CalendarDate(maxYear.year, 12, 31),
    isDisabled: (cell: CalendarDate) => (!!minYear && cell.year < minYear.year) || (!!maxYear && cell.year > maxYear.year),
    firstDayOfWeek: 0,
    i18n: YEAR_ENGLISH,
  };
  const attributes = [
    value !== undefined && `value="${value}"`,
    min && `min="${min}"`,
    max && `max="${max}"`,
    `time-zone="${timeZone}"`,
  ].filter(Boolean);
  const html = (rows: Element[]) => rows.map((row) => row.outerHTML).join('');

  return `<awc-year-calendar class="awc-year-calendar" ${attributes.join(' ')}>
    <div class="awc-year-calendar-header">
      <button type="button" class="awc-year-calendar-nav" aria-label="Previous decade" aria-disabled="${!canMoveView(view, -1)}" data-target="awc-year-calendar.previousButton" data-action="click->awc-year-calendar#handlePreviousClick"></button>
      <div id="heading" class="awc-year-calendar-heading" aria-live="polite" data-target="awc-year-calendar.heading">${headingText(view)}</div>
      <button type="button" class="awc-year-calendar-nav" aria-label="Next decade" aria-disabled="${!canMoveView(view, 1)}" data-target="awc-year-calendar.nextButton" data-action="click->awc-year-calendar#handleNextClick"></button>
    </div>
    <table class="awc-year-calendar-grid" role="grid" aria-labelledby="heading" data-decade="${YEAR_LEVEL.formatView(YEAR_LEVEL.viewOf(shown))}" data-target="awc-year-calendar.grid" data-action="click->awc-year-calendar#handleClick keydown->awc-year-calendar#handleKeydown focusin->awc-year-calendar#handleFocusin">
      <tbody data-target="awc-year-calendar.years">${html(gridRows(view))}</tbody>
    </table>
  </awc-year-calendar>`;
}

async function yearCalendarFixture(options?: CalendarOptions) {
  const el = await fixture<AwcYearCalendarElement>(yearCalendarHtml(options));
  await whenInitialized(el);
  return el;
}

/** The button of the year `value` names, in the grid shown. */
function year(el: Element, value: string) {
  return el.querySelector<HTMLButtonElement>(`tbody button[data-date="${value}-01-01"]`)!;
}

function selectedYear(el: Element) {
  return el.querySelector<HTMLElement>('td[aria-selected="true"] button')?.textContent ?? null;
}

function focusedYear() {
  return (document.activeElement as HTMLElement | null)?.textContent ?? null;
}

let recording: AbortController | undefined;

/** Records the details of the `commit` events, in the order they reach the document. */
function recordCommits() {
  recording = new AbortController();
  const details: AwcYearCalendarCommitEvent[] = [];
  document.addEventListener(
    'awc-year-calendar:commit',
    (event) => details.push((event as CustomEvent<AwcYearCalendarCommitEvent>).detail),
    { signal: recording.signal },
  );
  return details;
}

describe('awc-year-calendar', () => {
  afterEach(() => recording?.abort());

  describe('committing a year', () => {
    it('makes it the value, and emits commit with it', async () => {
      const el = await yearCalendarFixture({ value: '2026' });
      const commits = recordCommits();

      year(el, '2023').click();

      expect(el.value).to.equal('2023');
      expect(selectedYear(el)).to.equal('2023');
      expect(commits).to.eql([{ value: '2023' }]);
    });

    it('emits nothing for the year already selected', async () => {
      const el = await yearCalendarFixture({ value: '2026' });
      const commits = recordCommits();

      year(el, '2026').click();

      expect(commits).to.eql([]);
    });
  });

  describe('the keyboard', () => {
    it('moves by a year, a row of three, to the row\'s ends, and by a decade', async () => {
      const el = await yearCalendarFixture({ value: '2026' });
      year(el, '2026').focus();

      // The 2020s grid runs 2019 to 2030, three to a row: 2025, 2026 and 2027 share a row.
      await sendKeys({ press: 'Home' });
      expect(focusedYear()).to.equal('2025');
      await sendKeys({ press: 'End' });
      expect(focusedYear()).to.equal('2027');
      await sendKeys({ press: 'ArrowUp' });
      expect(focusedYear()).to.equal('2024');
      await sendKeys({ press: 'ArrowLeft' });
      expect(focusedYear()).to.equal('2023');
      await sendKeys({ press: 'ArrowDown' });
      expect(focusedYear()).to.equal('2026');
      await sendKeys({ press: 'PageDown' });
      expect(focusedYear()).to.equal('2036');
      expect(el.heading.textContent).to.equal('2030 – 2039');
      await sendKeys({ press: 'Shift+PageUp' });
      expect(focusedYear()).to.equal('2026');
    });

    it('turns the page when it moves onto an outside year', async () => {
      const el = await yearCalendarFixture({ value: '2029' });

      year(el, '2029').focus();
      await sendKeys({ press: 'ArrowRight' });

      expect(focusedYear()).to.equal('2030');
      expect(el.grid.dataset.decade).to.equal('2030');
    });

    it('commits the focused year with Enter and Space', async () => {
      const el = await yearCalendarFixture({ value: '2026' });
      const commits = recordCommits();

      year(el, '2027').focus();
      await sendKeys({ press: 'Enter' });
      await sendKeys({ press: 'ArrowRight' });
      await sendKeys({ press: ' ' });

      expect(commits).to.eql([{ value: '2027' }, { value: '2028' }]);
    });
  });

  describe('outside years', () => {
    it('commit when clicked, turning the page to their decade', async () => {
      const el = await yearCalendarFixture({ value: '2026' });
      const commits = recordCommits();

      year(el, '2019').click();

      expect(commits).to.eql([{ value: '2019' }]);
      expect(el.grid.dataset.decade).to.equal('2010');
      expect(year(el, '2019').tabIndex).to.equal(0);
    });
  });

  describe('the page buttons', () => {
    it('move by a decade, keeping the year\'s place', async () => {
      const el = await yearCalendarFixture({ value: '2026' });

      el.nextButton.click();

      expect(el.heading.textContent).to.equal('2030 – 2039');
      expect(year(el, '2036').tabIndex).to.equal(0);
    });
  });

  describe('min and max', () => {
    it('disable the years outside them, which can be reached but not committed, and stop paging at their decades', async () => {
      const el = await yearCalendarFixture({ value: '2026', min: '2022', max: '2028' });
      const commits = recordCommits();

      expect(year(el, '2021').getAttribute('aria-disabled')).to.equal('true');
      expect(year(el, '2022').hasAttribute('aria-disabled')).to.equal(false);
      expect(year(el, '2029').getAttribute('aria-disabled')).to.equal('true');
      year(el, '2021').click();
      expect(commits).to.eql([]);

      el.previousView();
      el.nextView();
      expect(el.grid.dataset.decade).to.equal('2020');
      expect(el.isDateDisabled('2028')).to.equal(false);
      expect(el.isDateDisabled('2029')).to.equal(true);
    });
  });

  describe('changes made by code', () => {
    it('take years, and emit nothing: the value, the view methods, clear and a morph', async () => {
      const el = await yearCalendarFixture({ value: '2026' });
      const commits = recordCommits();

      el.value = '2041';
      expect(el.grid.dataset.decade).to.equal('2040');
      expect(selectedYear(el)).to.equal('2041');

      el.goToDate('1999');
      expect(el.grid.dataset.decade).to.equal('1990');
      expect(year(el, '1999').tabIndex).to.equal(0);
      expect(selectedYear(el)).to.equal(null);

      el.resetView();
      expect(el.grid.dataset.decade).to.equal('2040');

      el.previousView();
      el.nextView();
      el.goToToday();
      el.clear();
      Idiomorph.morph(el, yearCalendarHtml({ value: '2012' }));

      expect(commits).to.eql([]);
      expect(el.value).to.equal('2012');
      expect(el.grid.dataset.decade).to.equal('2010');
      expect(selectedYear(el)).to.equal('2012');
    });

    it('ignore what isn\'t a year', async () => {
      const el = await yearCalendarFixture({ value: '2026' });

      el.goToDate('2026-05-01');

      expect(el.grid.dataset.decade).to.equal('2020');
      expect(el.isDateDisabled('soon')).to.equal(false);
    });
  });

  describe('today\'s year', () => {
    it('is the year today falls in in the calendar\'s time zone, and holds the tab stop without a value', async () => {
      const el = await yearCalendarFixture({ timeZone: 'Pacific/Kiritimati' });
      const now = String(today('Pacific/Kiritimati').year);

      el.goToToday();

      expect(el.querySelector('[aria-current="date"]')!.textContent).to.equal(now);
      expect(year(el, now).tabIndex).to.equal(0);
    });
  });

  describe('crossing decades by keyboard', () => {
    it('moves onto the outside years at the grid\'s corners, and on into their decades', async () => {
      const el = await yearCalendarFixture({ value: '2026' });

      // The first row is 2019, 2020 and 2021: Home from 2020 is 2019, in the 2010s.
      year(el, '2020').focus();
      await sendKeys({ press: 'Home' });
      expect(focusedYear()).to.equal('2019');
      expect(el.grid.dataset.decade).to.equal('2010');

      el.goToDate('2029');
      year(el, '2029').focus();
      // The last row is 2028, 2029 and 2030: End from 2029 is 2030, in the 2030s.
      await sendKeys({ press: 'End' });
      expect(focusedYear()).to.equal('2030');
      expect(el.grid.dataset.decade).to.equal('2030');

      // Up from 2030 is 2027, back in the 2020s.
      await sendKeys({ press: 'ArrowUp' });
      expect(focusedYear()).to.equal('2027');
      expect(el.grid.dataset.decade).to.equal('2020');
    });

    it('reckons Home and End from an outside year in the row it sits in on screen', async () => {
      const el = await yearCalendarFixture({ value: '2026' });

      // 2019 sits in the 2020s grid's first row, with 2020 and 2021.
      year(el, '2019').focus();
      await sendKeys({ press: 'End' });
      expect(focusedYear()).to.equal('2021');

      // 2030 sits in its last row, with 2028 and 2029.
      year(el, '2030').focus();
      await sendKeys({ press: 'Home' });
      expect(focusedYear()).to.equal('2028');
    });

    it('stops at the decades holding min and max', async () => {
      const el = await yearCalendarFixture({ value: '2022', min: '2021', max: '2028' });

      year(el, '2022').focus();
      await sendKeys({ press: 'PageUp' });
      expect(el.grid.dataset.decade).to.equal('2020');
      await sendKeys({ press: 'PageDown' });
      expect(el.grid.dataset.decade).to.equal('2020');
    });

    it('emits nothing while moving, by keys or the decade buttons', async () => {
      const el = await yearCalendarFixture({ value: '2026' });
      const commits = recordCommits();

      year(el, '2026').focus();
      await sendKeys({ press: 'ArrowRight' });
      await sendKeys({ press: 'PageDown' });
      el.previousButton.click();
      el.min = '2000';
      el.max = '2040';

      expect(commits).to.eql([]);
      expect(el.value).to.equal('2026');
    });
  });

  describe('a value set by code that names no year', () => {
    it('selects no year and shows today\'s decade, kept as given', async () => {
      const el = await yearCalendarFixture({ value: '2026', timeZone: 'UTC' });

      for (const value of ['soon', '20', '0999', '12345']) {
        el.value = value;

        expect(el.value, value).to.equal(value);
        expect(selectedYear(el), value).to.equal(null);
        expect(el.grid.dataset.decade, value).to.equal(String(Math.floor(today('UTC').year / 10) * 10));
      }
    });
  });
});
