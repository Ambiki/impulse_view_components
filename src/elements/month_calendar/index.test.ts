import type AwcMonthCalendarElement from './index';
import type { AwcMonthCalendarCommitEvent } from './index';
import { whenInitialized } from '@ambiki/impulse';
import { expect, fixture } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { Idiomorph } from 'idiomorph';
import { CalendarDate, today } from '../../internal/calendar_date';
import { canMoveView, gridRows, headingText } from '../../internal/calendar_grid';
import { MONTH_ENGLISH, MONTH_LEVEL } from '../../internal/month_level';
// Registers `awc-month-calendar`. Kept separate from the type imports above, which the bundler elides.
import './index';

interface CalendarOptions {
  value?: string;
  min?: string;
  max?: string;
  timeZone?: string;
}

/** The first day of the month `value` names, as `YYYY-MM`, or `null`. */
function monthOf(value: string | undefined) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  return match ? new CalendarDate(Number(match[1]), Number(match[2]), 1) : null;
}

/**
 * The markup `Impulse::MonthCalendarComponent` renders, without the whitespace between tags. Its first year comes from
 * the element's own renderer; the system test checks that it matches the component's.
 */
function monthCalendarHtml(options: CalendarOptions = {}) {
  const { value, min, max, timeZone = 'UTC' } = options;
  const selected = monthOf(value);
  const now = MONTH_LEVEL.cellOf(today(timeZone));
  const shown = selected ?? now;
  const minMonth = monthOf(min);
  const maxMonth = monthOf(max);
  const view = {
    level: MONTH_LEVEL,
    tagName: 'awc-month-calendar',
    displayed: shown,
    active: shown,
    selected: selected && { start: selected, end: selected.endOfMonth() },
    today: now,
    min: minMonth,
    max: maxMonth && maxMonth.endOfMonth(),
    isDisabled: (cell: CalendarDate) =>
      (!!minMonth && cell.compareMonth(minMonth) < 0) || (!!maxMonth && cell.compareMonth(maxMonth) > 0),
    firstDayOfWeek: 0,
    i18n: MONTH_ENGLISH,
  };
  const attributes = [
    value !== undefined && `value="${value}"`,
    min && `min="${min}"`,
    max && `max="${max}"`,
    `time-zone="${timeZone}"`,
  ].filter(Boolean);
  const html = (rows: Element[]) => rows.map((row) => row.outerHTML).join('');

  return `<awc-month-calendar class="awc-month-calendar" ${attributes.join(' ')}>
    <div class="awc-month-calendar-header" data-action="click->awc-month-calendar#handleHeadingClick">
      <button type="button" class="awc-month-calendar-nav" aria-label="Previous year" aria-disabled="${!canMoveView(view, -1)}" data-target="awc-month-calendar.previousButton" data-action="click->awc-month-calendar#handlePreviousClick"></button>
      <div id="heading" class="awc-month-calendar-heading" aria-live="polite" data-target="awc-month-calendar.heading"><button type="button" class="btn btn-sm btn-light awc-month-calendar-heading-button" aria-describedby="heading-year"><span>${headingText(view)}</span><i class="bi bi-chevron-down" aria-hidden="true"></i></button></div>
      <button type="button" class="awc-month-calendar-nav" aria-label="Next year" aria-disabled="${!canMoveView(view, 1)}" data-target="awc-month-calendar.nextButton" data-action="click->awc-month-calendar#handleNextClick"></button>
    </div>
    <span id="heading-year" class="sr-only">Choose a year</span>
    <table class="awc-month-calendar-grid" role="grid" aria-labelledby="heading" data-year="${MONTH_LEVEL.formatView(MONTH_LEVEL.viewOf(shown))}" data-target="awc-month-calendar.grid" data-action="click->awc-month-calendar#handleClick keydown->awc-month-calendar#handleKeydown focusin->awc-month-calendar#handleFocusin">
      <tbody data-target="awc-month-calendar.months">${html(gridRows(view))}</tbody>
    </table>
  </awc-month-calendar>`;
}

async function monthCalendarFixture(options?: CalendarOptions) {
  const el = await fixture<AwcMonthCalendarElement>(monthCalendarHtml(options));
  await whenInitialized(el);
  return el;
}

/** The button of the month `value` names, as `YYYY-MM`, in the grid shown. */
function month(el: Element, value: string) {
  return el.querySelector<HTMLButtonElement>(`tbody button[data-date="${value}-01"]`)!;
}

/** The button of the year `value` names, as `YYYY`, in the grid shown. */
function year(el: Element, value: string) {
  return el.querySelector<HTMLButtonElement>(`tbody button[data-date="${value}-01-01"]`)!;
}

/** Presses the heading, which drills up a level. */
function drillUp(el: Element) {
  el.querySelector<HTMLButtonElement>('[data-target$=".heading"] button')!.click();
}

function selectedCell(el: Element) {
  return el.querySelector<HTMLElement>('td[aria-selected="true"] button')?.dataset.date ?? null;
}

function focusedCell() {
  return (document.activeElement as HTMLElement | null)?.dataset.date ?? null;
}

let recording: AbortController | undefined;

/** Records the details of the `commit` events, in the order they reach the document. */
function recordCommits() {
  recording = new AbortController();
  const details: AwcMonthCalendarCommitEvent[] = [];
  document.addEventListener(
    'awc-month-calendar:commit',
    (event) => details.push((event as CustomEvent<AwcMonthCalendarCommitEvent>).detail),
    { signal: recording.signal },
  );
  return details;
}

describe('awc-month-calendar', () => {
  afterEach(() => recording?.abort());

  describe('committing a month', () => {
    it('makes it the value, and emits commit with it', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });
      const commits = recordCommits();

      month(el, '2026-03').click();

      expect(el.value).to.equal('2026-03');
      expect(selectedCell(el)).to.equal('2026-03-01');
      expect(commits).to.eql([{ value: '2026-03' }]);
    });

    it('emits nothing for the month already selected', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });
      const commits = recordCommits();

      month(el, '2026-11').click();

      expect(commits).to.eql([]);
    });

    it('names each month by its abbreviation, and by its month and year to screen readers', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });

      expect([...el.querySelectorAll('tbody button')].map((button) => button.textContent)).to.eql([
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]);
      expect(month(el, '2026-11').getAttribute('aria-label')).to.equal('November 2026');
    });
  });

  describe('the keyboard', () => {
    it('moves by a month, a row of three, to the row\'s ends, and by a year', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });
      month(el, '2026-11').focus();

      // October, November and December share a row.
      await sendKeys({ press: 'Home' });
      expect(focusedCell()).to.equal('2026-10-01');
      await sendKeys({ press: 'End' });
      expect(focusedCell()).to.equal('2026-12-01');
      await sendKeys({ press: 'ArrowUp' });
      expect(focusedCell()).to.equal('2026-09-01');
      await sendKeys({ press: 'ArrowLeft' });
      expect(focusedCell()).to.equal('2026-08-01');
      await sendKeys({ press: 'ArrowDown' });
      expect(focusedCell()).to.equal('2026-11-01');
      await sendKeys({ press: 'PageDown' });
      expect(focusedCell()).to.equal('2027-11-01');
      expect(el.heading.textContent).to.equal('2027');
      await sendKeys({ press: 'Shift+PageUp' });
      expect(focusedCell()).to.equal('2026-11-01');
    });

    it('moves on into the year before or after past the grid\'s first and last months', async () => {
      const el = await monthCalendarFixture({ value: '2026-12' });

      month(el, '2026-12').focus();
      await sendKeys({ press: 'ArrowRight' });
      expect(focusedCell()).to.equal('2027-01-01');
      expect(el.grid.dataset.year).to.equal('2027');

      await sendKeys({ press: 'ArrowUp' });
      expect(focusedCell()).to.equal('2026-10-01');
      expect(el.grid.dataset.year).to.equal('2026');
    });

    it('commits the focused month with Enter and Space', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });
      const commits = recordCommits();

      month(el, '2026-05').focus();
      await sendKeys({ press: 'Enter' });
      await sendKeys({ press: 'ArrowRight' });
      await sendKeys({ press: ' ' });

      expect(commits).to.eql([{ value: '2026-05' }, { value: '2026-06' }]);
    });
  });

  describe('min and max', () => {
    it('disable the months outside them, which can be reached but not committed, and stop paging at their years', async () => {
      const el = await monthCalendarFixture({ value: '2026-11', min: '2026-03', max: '2026-11' });
      const commits = recordCommits();

      expect(month(el, '2026-02').getAttribute('aria-disabled')).to.equal('true');
      expect(month(el, '2026-03').hasAttribute('aria-disabled')).to.equal(false);
      expect(month(el, '2026-11').hasAttribute('aria-disabled')).to.equal(false);
      expect(month(el, '2026-12').getAttribute('aria-disabled')).to.equal('true');
      month(el, '2026-12').click();
      expect(commits).to.eql([]);

      el.previousView();
      el.nextView();
      expect(el.grid.dataset.year).to.equal('2026');
      expect(el.previousButton.getAttribute('aria-disabled')).to.equal('true');
      expect(el.nextButton.getAttribute('aria-disabled')).to.equal('true');
      expect(el.isDateDisabled('2026-11')).to.equal(false);
      expect(el.isDateDisabled('2026-12')).to.equal(true);
    });
  });

  describe('drilling up', () => {
    it('shows the displayed year\'s decade in the same grid, and focuses the displayed year', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });
      const commits = recordCommits();

      el.nextButton.click();
      drillUp(el);

      expect(el.grid.dataset.decade).to.equal('2020');
      expect(el.grid.dataset.year).to.equal(undefined);
      expect(el.heading.textContent).to.equal('2020 – 2029');
      expect(focusedCell()).to.equal('2027-01-01');
      expect(el.previousButton.getAttribute('aria-label')).to.equal('Previous decade');
      expect(el.nextButton.getAttribute('aria-label')).to.equal('Next decade');
      expect(commits).to.eql([]);
    });

    it('stops at the top level, whose heading is its text', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });

      drillUp(el);

      expect(el.heading.querySelector('button')).to.equal(null);
      expect(el.heading.id).to.equal('heading');
    });

    it('marks the year holding the selected month, and today\'s year', async () => {
      const el = await monthCalendarFixture({ value: '2023-11', timeZone: 'Pacific/Kiritimati' });
      const now = today('Pacific/Kiritimati').year;

      drillUp(el);

      expect(selectedCell(el)).to.equal('2023-01-01');
      expect(el.querySelector('[aria-current="date"]')?.textContent).to.equal(String(now));
    });

    it('moves through the years with the year calendar\'s keys', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });

      drillUp(el);
      await sendKeys({ press: 'ArrowRight' });
      await sendKeys({ press: 'PageDown' });

      expect(focusedCell()).to.equal('2037-01-01');
      expect(el.grid.dataset.decade).to.equal('2030');
    });

    it('announces the change by focus alone, writing nothing to the live region a page turn writes to', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });
      const region = el.heading;
      const observer = new MutationObserver(() => {});
      observer.observe(region, { subtree: true, childList: true, characterData: true });

      el.nextButton.click();
      expect(observer.takeRecords()).to.not.be.empty;

      drillUp(el);
      expect(observer.takeRecords()).to.be.empty;
      observer.disconnect();
    });
  });

  describe('drilling down', () => {
    it('shows the chosen year\'s months, and focuses the month drilled up from, in that year', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });
      const commits = recordCommits();

      drillUp(el);
      year(el, '2024').click();

      expect(el.grid.dataset.year).to.equal('2024');
      expect(el.grid.dataset.decade).to.equal(undefined);
      expect(el.heading.querySelector('button')!.textContent).to.equal('2024');
      expect(el.heading.id).to.equal('heading');
      expect(focusedCell()).to.equal('2024-11-01');
      expect(month(el, '2024-11').tabIndex).to.equal(0);
      expect(el.previousButton.getAttribute('aria-label')).to.equal('Previous year');
      expect(el.value).to.equal('2026-11');
      expect(commits).to.eql([]);
    });

    it('leaves the months as they were when the user chooses the year they drilled up from', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });
      el.goToDate('2026-05');

      drillUp(el);
      await sendKeys({ press: 'Enter' });

      expect(el.grid.dataset.year).to.equal('2026');
      expect(focusedCell()).to.equal('2026-05-01');
      expect(selectedCell(el)).to.equal('2026-11-01');
    });

    it('focuses the nearest allowed month when min or max rules out the month drilled up from', async () => {
      const el = await monthCalendarFixture({ value: '2026-11', min: '2025-12', max: '2027-03' });

      drillUp(el);
      year(el, '2025').click();
      expect(focusedCell()).to.equal('2025-12-01');

      drillUp(el);
      year(el, '2027').click();
      expect(focusedCell()).to.equal('2027-03-01');
    });

    it('leaves a month min or max rules out as it was when the user chooses the year they drilled up from', async () => {
      const el = await monthCalendarFixture({ value: '2026-11', min: '2026-05' });
      el.goToDate('2026-03');

      drillUp(el);
      await sendKeys({ press: 'Enter' });

      expect(focusedCell()).to.equal('2026-03-01');
    });

    it('takes the user back to the year they drilled up from, even one with no month between min and max', async () => {
      const el = await monthCalendarFixture({ value: '2030-05', max: '2026-12' });

      drillUp(el);
      expect(year(el, '2030').hasAttribute('aria-disabled')).to.equal(false);
      expect(year(el, '2031').getAttribute('aria-disabled')).to.equal('true');
      year(el, '2030').click();

      expect(el.grid.dataset.year).to.equal('2030');
      expect(focusedCell()).to.equal('2030-05-01');
    });

    it('disables the years with no month between min and max, which can\'t be chosen, and stops paging at their decades', async () => {
      const el = await monthCalendarFixture({ value: '2026-11', min: '2026-12', max: '2028-01' });

      drillUp(el);

      expect(year(el, '2025').getAttribute('aria-disabled')).to.equal('true');
      expect(year(el, '2026').hasAttribute('aria-disabled')).to.equal(false);
      expect(year(el, '2028').hasAttribute('aria-disabled')).to.equal(false);
      expect(year(el, '2029').getAttribute('aria-disabled')).to.equal('true');
      year(el, '2025').click();
      expect(el.grid.dataset.decade).to.equal('2020');

      el.previousView();
      el.nextView();
      expect(el.grid.dataset.decade).to.equal('2020');
    });
  });

  describe('changes made by code', () => {
    it('take months, and emit nothing: the value, the view methods, clear and a morph', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });
      const commits = recordCommits();

      el.value = '2041-02';
      expect(el.grid.dataset.year).to.equal('2041');
      expect(selectedCell(el)).to.equal('2041-02-01');

      el.goToDate('1999-07');
      expect(el.grid.dataset.year).to.equal('1999');
      expect(month(el, '1999-07').tabIndex).to.equal(0);
      expect(selectedCell(el)).to.equal(null);

      el.resetView();
      expect(el.grid.dataset.year).to.equal('2041');

      el.previousView();
      el.nextView();
      el.goToToday();
      el.clear();
      Idiomorph.morph(el, monthCalendarHtml({ value: '2012-06' }));

      expect(commits).to.eql([]);
      expect(el.value).to.equal('2012-06');
      expect(el.grid.dataset.year).to.equal('2012');
      expect(selectedCell(el)).to.equal('2012-06-01');
    });

    it('page the years while drilled up, and go back to the months for whatever names a month', async () => {
      const el = await monthCalendarFixture({ value: '2026-11', timeZone: 'UTC' });
      const now = today('UTC');

      drillUp(el);
      el.nextView();
      expect(el.grid.dataset.decade).to.equal('2030');
      el.previousView();
      expect(el.grid.dataset.decade).to.equal('2020');

      el.goToDate('2031-04');
      expect(el.grid.dataset.year).to.equal('2031');
      expect(month(el, '2031-04').tabIndex).to.equal(0);
      expect(el.heading.querySelector('button')!.textContent).to.equal('2031');
      expect(el.previousButton.getAttribute('aria-label')).to.equal('Previous year');

      drillUp(el);
      el.goToToday();
      expect(el.grid.dataset.year).to.equal(String(now.year));

      drillUp(el);
      el.value = '2040-02';
      expect(el.grid.dataset.year).to.equal('2040');
      expect(selectedCell(el)).to.equal('2040-02-01');

      drillUp(el);
      el.resetView();
      expect(el.grid.dataset.year).to.equal('2040');

      drillUp(el);
      el.clear();
      expect(el.grid.dataset.year).to.equal(String(now.year));
      expect(selectedCell(el)).to.equal(null);
    });

    it('go back to the months on clear, even without a value', async () => {
      const el = await monthCalendarFixture({ timeZone: 'UTC' });

      drillUp(el);
      el.clear();

      expect(el.grid.dataset.year).to.equal(String(today('UTC').year));
      expect(el.grid.dataset.decade).to.equal(undefined);
    });

    it('focus the level shown, keep it when min or max change, and check months while drilled up', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });

      drillUp(el);
      el.min = '2026-05';
      el.focus();

      expect(el.grid.dataset.decade).to.equal('2020');
      expect(focusedCell()).to.equal('2026-01-01');
      expect(year(el, '2025').getAttribute('aria-disabled')).to.equal('true');
      expect(el.isDateDisabled('2026-04')).to.equal(true);
      expect(el.isDateDisabled('2026-05')).to.equal(false);
      expect(el.isDateDisabled('2026')).to.equal(false);
    });

    it('are put back to the months by a morph while drilled up, which can drill up again', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });

      drillUp(el);
      Idiomorph.morph(el, monthCalendarHtml({ value: '2012-06' }));

      expect(el.grid.dataset.year).to.equal('2012');
      expect(el.grid.dataset.decade).to.equal(undefined);
      expect(selectedCell(el)).to.equal('2012-06-01');

      drillUp(el);
      expect(el.grid.dataset.decade).to.equal('2010');
    });

    it('ignore what isn\'t a month', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });

      el.goToDate('2026-05-01');
      el.goToDate('2026');

      expect(el.grid.dataset.year).to.equal('2026');
      expect(el.isDateDisabled('soon')).to.equal(false);
    });
  });

  describe('a value set by code that names no month', () => {
    it('selects no month and shows today\'s year, kept as given', async () => {
      const el = await monthCalendarFixture({ value: '2026-11', timeZone: 'UTC' });

      for (const value of ['soon', '2026-13', '2026-00', '2026-11-18', '0999-01', '2026']) {
        el.value = value;

        expect(el.value, value).to.equal(value);
        expect(selectedCell(el), value).to.equal(null);
        expect(el.grid.dataset.year, value).to.equal(String(today('UTC').year));
      }
    });
  });

  describe('today\'s month', () => {
    it('is the month today falls in in the calendar\'s time zone, and holds the tab stop without a value', async () => {
      const el = await monthCalendarFixture({ timeZone: 'Pacific/Kiritimati' });
      const now = MONTH_LEVEL.cellOf(today('Pacific/Kiritimati')).toString();

      expect(el.querySelector<HTMLElement>('[aria-current="date"]')!.dataset.date).to.equal(now);
      expect(el.querySelector<HTMLElement>('tbody button[tabindex="0"]')!.dataset.date).to.equal(now);
    });
  });

  describe('the page buttons', () => {
    it('move by a year, keeping the month\'s place, and rename the heading\'s button', async () => {
      const el = await monthCalendarFixture({ value: '2026-11' });

      el.nextButton.click();

      expect(el.heading.textContent).to.equal('2027');
      expect(el.heading.querySelector('button')!.textContent).to.equal('2027');
      expect(month(el, '2027-11').tabIndex).to.equal(0);
    });
  });
});
