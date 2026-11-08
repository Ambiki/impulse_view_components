import type AwcWeekCalendarElement from './index';
import type { AwcWeekCalendarCommitEvent } from './index';
import { whenInitialized } from '@ambiki/impulse';
import { expect, fixture } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { Idiomorph } from 'idiomorph';
import { CalendarDate, today } from '../../internal/calendar_date';
import { canMoveView, ENGLISH, gridRows, headingText, weekdayRow } from '../../internal/calendar_grid';
import { DAY_LEVEL } from '../../internal/day_level';
// Registers `awc-week-calendar`. Kept separate from the type imports above, which the bundler elides.
import './index';

interface CalendarOptions {
  value?: string;
  min?: string;
  max?: string;
  firstDayOfWeek?: number;
  timeZone?: string;
}

/** The week `date` falls in, with weeks starting on `firstDayOfWeek`. */
function weekOf(date: CalendarDate, firstDayOfWeek: number) {
  return { start: date.startOfWeek(firstDayOfWeek), end: date.endOfWeek(firstDayOfWeek) };
}

/**
 * The markup `Impulse::WeekCalendarComponent` renders, without the whitespace between tags. Its first month comes from
 * the element's own renderer; the system test checks that it matches the component's.
 */
function weekCalendarHtml(options: CalendarOptions = {}) {
  const { value, min, max, firstDayOfWeek = 0, timeZone = 'UTC' } = options;
  const day = CalendarDate.parse(value);
  const selected = day && weekOf(day, firstDayOfWeek);
  const shown = selected?.start ?? today(timeZone);
  const minDay = CalendarDate.parse(min);
  const maxDay = CalendarDate.parse(max);
  const view = {
    level: DAY_LEVEL,
    tagName: 'awc-week-calendar',
    displayed: shown,
    active: shown,
    selected,
    today: today(timeZone),
    min: minDay,
    max: maxDay,
    isDisabled: (date: CalendarDate) => {
      const week = weekOf(date, firstDayOfWeek);
      return (!!minDay && week.end.compare(minDay) < 0) || (!!maxDay && week.start.compare(maxDay) > 0);
    },
    firstDayOfWeek,
    i18n: ENGLISH,
  };
  const attributes = [
    value !== undefined && `value="${value}"`,
    min && `min="${min}"`,
    max && `max="${max}"`,
    `time-zone="${timeZone}"`,
    `first-day-of-week="${firstDayOfWeek}"`,
  ].filter(Boolean);
  const month = shown.toString().slice(0, 7);
  const html = (rows: Element[]) => rows.map((row) => row.outerHTML).join('');

  return `<awc-week-calendar class="awc-week-calendar" ${attributes.join(' ')}>
    <div class="awc-week-calendar-header">
      <button type="button" class="awc-week-calendar-nav" aria-label="Previous month" aria-disabled="${!canMoveView(view, -1)}" data-target="awc-week-calendar.previousButton" data-action="click->awc-week-calendar#handlePreviousClick"></button>
      <div id="heading" class="awc-week-calendar-heading" aria-live="polite" data-target="awc-week-calendar.heading">${headingText(view)}</div>
      <button type="button" class="awc-week-calendar-nav" aria-label="Next month" aria-disabled="${!canMoveView(view, 1)}" data-target="awc-week-calendar.nextButton" data-action="click->awc-week-calendar#handleNextClick"></button>
    </div>
    <span id="hint" class="sr-only">Choosing a day chooses its week.</span>
    <table class="awc-week-calendar-grid" role="grid" aria-labelledby="heading" aria-describedby="hint" data-month="${month}" data-target="awc-week-calendar.grid" data-action="click->awc-week-calendar#handleClick keydown->awc-week-calendar#handleKeydown focusin->awc-week-calendar#handleFocusin">
      <thead data-target="awc-week-calendar.weekdays">${html([weekdayRow(firstDayOfWeek, ENGLISH)])}</thead>
      <tbody data-target="awc-week-calendar.days">${html(gridRows(view))}</tbody>
    </table>
  </awc-week-calendar>`;
}

async function weekCalendarFixture(options?: CalendarOptions) {
  const el = await fixture<AwcWeekCalendarElement>(weekCalendarHtml(options));
  await whenInitialized(el);
  return el;
}

/** The button of the day `date` names, in the grid shown. */
function day(el: Element, date: string) {
  return el.querySelector<HTMLButtonElement>(`tbody button[data-date="${date}"]`)!;
}

/** The days the grid marks as selected. */
function selectedDays(el: Element) {
  return [...el.querySelectorAll<HTMLElement>('td[aria-selected="true"] button')].map((button) => button.dataset.date);
}

let recording: AbortController | undefined;

/** Records the details of the `commit` events, in the order they reach the document. */
function recordCommits() {
  recording = new AbortController();
  const details: AwcWeekCalendarCommitEvent[] = [];
  document.addEventListener(
    'awc-week-calendar:commit',
    (event) => details.push((event as CustomEvent<AwcWeekCalendarCommitEvent>).detail),
    { signal: recording.signal },
  );
  return details;
}

describe('awc-week-calendar', () => {
  afterEach(() => recording?.abort());

  describe('committing a day', () => {
    it('selects its week, makes its first day the value, and emits commit with the week', async () => {
      const el = await weekCalendarFixture({ value: '2026-11-01' });
      const commits = recordCommits();

      day(el, '2026-11-18').click();

      expect(el.value).to.equal('2026-11-15');
      expect(selectedDays(el)).to.eql([
        '2026-11-15',
        '2026-11-16',
        '2026-11-17',
        '2026-11-18',
        '2026-11-19',
        '2026-11-20',
        '2026-11-21',
      ]);
      expect(commits).to.eql([{ value: '2026-11-15', start: '2026-11-15', end: '2026-11-21' }]);
    });

    it('happens on a click in the gap around the day, its cell', async () => {
      const el = await weekCalendarFixture({ value: '2026-11-01' });
      const commits = recordCommits();

      day(el, '2026-11-18').closest('td')!.click();

      expect(commits).to.eql([{ value: '2026-11-15', start: '2026-11-15', end: '2026-11-21' }]);
    });

    it('emits nothing for another day of the selected week', async () => {
      const el = await weekCalendarFixture({ value: '2026-11-15' });
      const commits = recordCommits();

      day(el, '2026-11-19').click();

      expect(el.value).to.equal('2026-11-15');
      expect(commits).to.eql([]);
    });
  });

  describe('a value set by code', () => {
    it('selects the week its day falls in, kept as given', async () => {
      const el = await weekCalendarFixture({ value: '2026-11-01' });
      const commits = recordCommits();

      el.value = '2026-12-02';

      expect(el.value).to.equal('2026-12-02');
      expect(selectedDays(el)[0]).to.equal('2026-11-29');
      expect(selectedDays(el)).to.have.length(7);
      expect(commits).to.eql([]);

      // Another day of that week, committed, changes nothing.
      day(el, '2026-12-04').click();
      expect(el.value).to.equal('2026-12-02');
      expect(commits).to.eql([]);
    });

    it('reads the same day in the new weeks when the first day of the week changes', async () => {
      // Sunday, November 1, is the last day of the week of Monday, October 26.
      const el = await weekCalendarFixture({ value: '2026-11-01', firstDayOfWeek: 0 });

      el.firstDayOfWeek = 1;

      expect(selectedDays(el)).to.include('2026-11-01');
      expect(el.querySelector('td[aria-selected="true"] button[data-date="2026-10-26"]')).to.not.equal(null);
    });
  });

  describe('min and max', () => {
    // With weeks from Sunday: min is Wednesday, November 11, and max is Wednesday, November 18.
    const limits = { value: '2026-11-15', min: '2026-11-11', max: '2026-11-18' };

    it('let the user commit a week with any day between them, as a whole week', async () => {
      const el = await weekCalendarFixture(limits);
      const commits = recordCommits();

      // November 8 is before min, but its week holds November 11.
      expect(day(el, '2026-11-08').hasAttribute('aria-disabled')).to.equal(false);
      day(el, '2026-11-08').click();

      expect(commits).to.eql([{ value: '2026-11-08', start: '2026-11-08', end: '2026-11-14' }]);
    });

    it('disable the weeks with no day between them, which can\'t be committed', async () => {
      const el = await weekCalendarFixture(limits);
      const commits = recordCommits();

      for (const date of ['2026-11-01', '2026-11-07', '2026-11-22', '2026-11-28']) {
        expect(day(el, date).getAttribute('aria-disabled'), date).to.equal('true');
      }
      day(el, '2026-11-25').click();

      expect(commits).to.eql([]);
      expect(el.value).to.equal('2026-11-15');
    });

    it('answer isDateDisabled for the week a day falls in', async () => {
      const el = await weekCalendarFixture(limits);

      expect(el.isDateDisabled('2026-11-08')).to.equal(false);
      expect(el.isDateDisabled('2026-11-21')).to.equal(false);
      expect(el.isDateDisabled('2026-11-07')).to.equal(true);
      expect(el.isDateDisabled('2026-11-22')).to.equal(true);
    });
  });

  describe('outside days', () => {
    it('commit a week with a day in the displayed month without turning the page, the tab stop on its nearest day there', async () => {
      // With weeks from Monday, November's first row is October 26 to November 1.
      const el = await weekCalendarFixture({ value: '2026-11-18', firstDayOfWeek: 1 });
      const commits = recordCommits();

      day(el, '2026-10-26').click();

      expect(commits).to.eql([{ value: '2026-10-26', start: '2026-10-26', end: '2026-11-01' }]);
      expect(el.grid.dataset.month).to.equal('2026-11');
      expect(day(el, '2026-11-01').tabIndex).to.equal(0);
      expect(el.querySelectorAll('tbody [tabindex="0"]')).to.have.length(1);
    });

    it('keep the tab stop on the nearest day of the displayed month at the end of the month too', async () => {
      // With weeks from Sunday, November's fifth row is November 29 to December 5.
      const el = await weekCalendarFixture({ value: '2026-11-18' });

      day(el, '2026-12-02').click();

      expect(el.grid.dataset.month).to.equal('2026-11');
      expect(day(el, '2026-11-30').tabIndex).to.equal(0);
    });

    it('turn the page to a week with no day in the displayed month', async () => {
      // With weeks from Sunday, November's last row is December 6 to 12.
      const el = await weekCalendarFixture({ value: '2026-11-18' });
      const commits = recordCommits();

      day(el, '2026-12-08').click();

      expect(commits).to.eql([{ value: '2026-12-06', start: '2026-12-06', end: '2026-12-12' }]);
      expect(el.grid.dataset.month).to.equal('2026-12');
      expect(day(el, '2026-12-08').tabIndex).to.equal(0);
    });
  });

  describe('the keyboard', () => {
    it('moves by day, emitting nothing, and commits the week of the day Enter is pressed on', async () => {
      const el = await weekCalendarFixture({ value: '2026-11-01' });
      const commits = recordCommits();

      day(el, '2026-11-01').focus();
      await sendKeys({ press: 'ArrowDown' });
      await sendKeys({ press: 'ArrowRight' });
      expect(commits).to.eql([]);

      await sendKeys({ press: 'Enter' });

      expect(commits).to.eql([{ value: '2026-11-08', start: '2026-11-08', end: '2026-11-14' }]);
      expect((document.activeElement as HTMLElement).dataset.date).to.equal('2026-11-09');
    });

    it('commits the week of the day Space is pressed on', async () => {
      const el = await weekCalendarFixture({ value: '2026-11-01' });
      const commits = recordCommits();

      day(el, '2026-11-24').focus();
      await sendKeys({ press: ' ' });

      expect(commits).to.eql([{ value: '2026-11-22', start: '2026-11-22', end: '2026-11-28' }]);
    });
  });

  describe('changes made by code', () => {
    it('emit nothing: the view methods, clear and a morph', async () => {
      const el = await weekCalendarFixture({ value: '2026-11-15' });
      const commits = recordCommits();

      el.nextView();
      el.previousView();
      el.goToDate('2027-01-10');
      el.goToToday();
      el.resetView();
      el.min = '2026-11-01';
      el.max = '2027-01-31';
      el.firstDayOfWeek = 1;
      el.clear();
      Idiomorph.morph(el, weekCalendarHtml({ value: '2026-12-06' }));

      expect(commits).to.eql([]);
      expect(el.value).to.equal('2026-12-06');
      expect(selectedDays(el)[0]).to.equal('2026-12-06');
    });

    it('resetView shows the month of the value\'s day', async () => {
      // The week of Sunday, November 29 runs into December.
      const el = await weekCalendarFixture({ value: '2026-11-29' });
      el.nextView();

      el.resetView();

      expect(el.grid.dataset.month).to.equal('2026-11');
      expect(day(el, '2026-11-29').tabIndex).to.equal(0);
    });

    it('resetView shows the month of a day set by code, even when its week starts in the month before', async () => {
      const el = await weekCalendarFixture({ value: '2026-11-15' });
      // Wednesday, December 2 is in the week of Sunday, November 29.
      el.value = '2026-12-02';
      el.previousView();

      el.resetView();

      expect(el.grid.dataset.month).to.equal('2026-12');
      expect(day(el, '2026-12-02').tabIndex).to.equal(0);
      expect(selectedDays(el)[0]).to.equal('2026-11-29');
    });
  });
});
