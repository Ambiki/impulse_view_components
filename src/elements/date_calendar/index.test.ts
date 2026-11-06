import type AwcDateCalendarElement from './index';
import { whenInitialized } from '@ambiki/impulse';
import { expect, fixture } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { Idiomorph } from 'idiomorph';
import { CalendarDate, today } from '../../internal/calendar_date';
import { canTurnPage, ENGLISH, headingText, weekdayRow, weekRows } from './render';
// Registers `awc-date-calendar`. Kept separate from the type import above, which the bundler elides.
import './index';

interface CalendarOptions {
  value?: string;
  min?: string;
  max?: string;
  disabledDaysOfWeek?: number[];
  firstDayOfWeek?: number;
  timeZone?: string;
  /** The day the server marked as today. Defaults to today in `timeZone`. */
  markedToday?: string;
}

/**
 * The markup `Impulse::DateCalendarComponent` renders, without the whitespace between tags. Its first month comes from
 * the element's own renderer; the system test checks that it matches the component's.
 */
function dateCalendarHtml(options: CalendarOptions = {}) {
  const { value, min, max, disabledDaysOfWeek = [], firstDayOfWeek = 0, timeZone = 'UTC' } = options;
  const selected = CalendarDate.parse(value);
  const marked = CalendarDate.parse(options.markedToday) ?? today(timeZone);
  const active = selected ?? marked;
  const view = {
    displayed: active,
    active,
    selected,
    today: marked,
    min: CalendarDate.parse(min),
    max: CalendarDate.parse(max),
    disabledDaysOfWeek,
    firstDayOfWeek,
    i18n: ENGLISH,
  };
  const attributes = [
    value !== undefined && `value="${value}"`,
    min && `min="${min}"`,
    max && `max="${max}"`,
    disabledDaysOfWeek.length && `disabled-days-of-week="${JSON.stringify(disabledDaysOfWeek)}"`,
    `time-zone="${timeZone}"`,
    `first-day-of-week="${firstDayOfWeek}"`,
  ].filter(Boolean);
  const month = `${active.year}-${String(active.month).padStart(2, '0')}`;
  const html = (rows: Element[]) => rows.map((row) => row.outerHTML).join('');

  return `<awc-date-calendar class="awc-date-calendar" ${attributes.join(' ')}>
    <div class="awc-date-calendar-header">
      <button type="button" class="awc-date-calendar-nav" aria-label="Previous month" aria-disabled="${!canTurnPage(view, -1)}" data-target="awc-date-calendar.previousButton" data-action="click->awc-date-calendar#handlePreviousClick"></button>
      <div id="heading" class="awc-date-calendar-heading" aria-live="polite" data-target="awc-date-calendar.heading">${headingText(view)}</div>
      <button type="button" class="awc-date-calendar-nav" aria-label="Next month" aria-disabled="${!canTurnPage(view, 1)}" data-target="awc-date-calendar.nextButton" data-action="click->awc-date-calendar#handleNextClick"></button>
    </div>
    <table class="awc-date-calendar-grid" role="grid" aria-labelledby="heading" data-month="${month}" data-target="awc-date-calendar.grid" data-action="click->awc-date-calendar#handleClick keydown->awc-date-calendar#handleKeydown focusin->awc-date-calendar#handleFocusin">
      <thead data-target="awc-date-calendar.weekdays">${html([weekdayRow(view)])}</thead>
      <tbody data-target="awc-date-calendar.days">${html(weekRows(view))}</tbody>
    </table>
  </awc-date-calendar>`;
}

async function dateCalendarFixture(options?: CalendarOptions) {
  const el = await fixture<AwcDateCalendarElement>(dateCalendarHtml(options));
  await whenInitialized(el);
  return el;
}

/** The button of the day `date` names, in the grid shown. */
function day(el: Element, date: string) {
  return el.querySelector<HTMLButtonElement>(`tbody button[data-date="${date}"]`)!;
}

function previousButton(el: Element) {
  return el.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')!;
}

function nextButton(el: Element) {
  return el.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!;
}

/** The day that has focus, or `null` when none has. */
function focusedDay() {
  return (document.activeElement as HTMLElement | null)?.dataset.date ?? null;
}

/** Focuses the day `date` names, then presses `key` there, as the user would. */
async function press(el: Element, key: string, date?: string) {
  if (date) day(el, date).focus();
  await sendKeys({ press: key });
}

/** The selected day, as the grid marks it. */
function selectedDay(el: Element) {
  return el.querySelector<HTMLElement>('td[aria-selected="true"] button')?.dataset.date ?? null;
}

let recording: AbortController | undefined;

/** Records the values of the `commit` events, in the order they reach the document. */
function recordCommits() {
  recording = new AbortController();
  const values: string[] = [];
  document.addEventListener(
    'awc-date-calendar:commit',
    (event) => values.push((event as CustomEvent<{ value: string }>).detail.value),
    { signal: recording.signal },
  );
  return values;
}

describe('awc-date-calendar', () => {
  afterEach(() => recording?.abort());

  describe('committing a day', () => {
    it('makes it the value, and emits commit', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-06' });
      const commits = recordCommits();

      day(el, '2026-11-18').click();

      expect(el.value).to.equal('2026-11-18');
      expect(el.getAttribute('value')).to.equal('2026-11-18');
      expect(selectedDay(el)).to.equal('2026-11-18');
      expect(commits).to.eql(['2026-11-18']);
    });

    it('emits nothing for the day already selected', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-06' });
      const commits = recordCommits();

      day(el, '2026-11-06').click();

      expect(el.value).to.equal('2026-11-06');
      expect(commits).to.eql([]);
    });
  });

  describe('a value set by code', () => {
    it('moves the view to the value\'s month, without emitting commit', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-06' });
      const commits = recordCommits();

      el.value = '2027-03-15';

      expect(el.grid.dataset.month).to.equal('2027-03');
      expect(el.heading.textContent).to.equal('March 2027');
      expect(selectedDay(el)).to.equal('2027-03-15');
      expect(day(el, '2027-03-15').tabIndex).to.equal(0);
      expect(commits).to.eql([]);
    });

    it('moves the view when set as the attribute', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-06' });

      el.setAttribute('value', '2026-01-31');

      expect(el.grid.dataset.month).to.equal('2026-01');
      expect(selectedDay(el)).to.equal('2026-01-31');
    });

    it('selects no day when it names none, and shows today\'s month', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-06', timeZone: 'Asia/Dubai' });
      const todayThere = today('Asia/Dubai');

      el.value = '2026-02-30';

      expect(el.value).to.equal('2026-02-30');
      expect(selectedDay(el)).to.equal(null);
      expect(el.grid.dataset.month).to.equal(todayThere.toString().slice(0, 7));
      expect(day(el, todayThere.toString()).tabIndex).to.equal(0);
    });

    it('doesn\'t move the view when the user commits a day', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-06' });

      day(el, '2026-11-20').click();

      expect(el.grid.dataset.month).to.equal('2026-11');
      expect(day(el, '2026-11-20').tabIndex).to.equal(0);
    });
  });

  describe('the page buttons', () => {
    it('turn to the next and previous months, moving the active day by a month', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });

      nextButton(el).click();

      expect(el.grid.dataset.month).to.equal('2026-12');
      expect(el.heading.textContent).to.equal('December 2026');
      expect(day(el, '2026-12-18').tabIndex).to.equal(0);
      expect(el.value).to.equal('2026-11-18');

      previousButton(el).click();
      previousButton(el).click();

      expect(el.heading.textContent).to.equal('October 2026');
      expect(day(el, '2026-10-18').tabIndex).to.equal(0);
    });

    it('keep the active day within the month\'s length', async () => {
      const el = await dateCalendarFixture({ value: '2026-01-31' });

      nextButton(el).click();

      expect(day(el, '2026-02-28').tabIndex).to.equal(0);
    });

    it('keep focus on the button pressed', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });
      nextButton(el).focus();

      nextButton(el).click();

      expect(document.activeElement).to.equal(nextButton(el));
    });

    it('stop at the months holding min and max, and stay focusable there', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18', min: '2026-10-05', max: '2026-12-20' });

      nextButton(el).click();
      expect(nextButton(el).getAttribute('aria-disabled')).to.equal('true');
      expect(previousButton(el).getAttribute('aria-disabled')).to.equal('false');

      nextButton(el).click();
      expect(el.grid.dataset.month).to.equal('2026-12');

      previousButton(el).click();
      previousButton(el).click();
      previousButton(el).click();
      expect(el.grid.dataset.month).to.equal('2026-10');
      expect(previousButton(el).getAttribute('aria-disabled')).to.equal('true');
      expect(previousButton(el).disabled).to.equal(false);
    });

    it('page only back toward min from a value outside it', async () => {
      const el = await dateCalendarFixture({ value: '2026-08-01', min: '2026-11-10' });
      expect(previousButton(el).getAttribute('aria-disabled')).to.equal('true');

      previousButton(el).click();
      expect(el.grid.dataset.month).to.equal('2026-08');

      nextButton(el).click();
      expect(el.grid.dataset.month).to.equal('2026-09');
    });
  });

  describe('the keyboard', () => {
    it('moves by a day with the left and right arrows, and by a week with up and down', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });

      await press(el, 'ArrowRight', '2026-11-18');
      expect(focusedDay()).to.equal('2026-11-19');
      await press(el, 'ArrowDown');
      expect(focusedDay()).to.equal('2026-11-26');
      await press(el, 'ArrowLeft');
      expect(focusedDay()).to.equal('2026-11-25');
      await press(el, 'ArrowUp');
      expect(focusedDay()).to.equal('2026-11-18');
    });

    it('keeps the one tab stop on the day moved to', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });

      await press(el, 'ArrowRight', '2026-11-18');

      expect(day(el, '2026-11-19').tabIndex).to.equal(0);
      expect(el.querySelectorAll('tbody [tabindex="0"]')).to.have.length(1);
    });

    it('turns the page when it moves past the edge of the month', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-30' });

      await press(el, 'ArrowRight', '2026-11-30');

      expect(el.grid.dataset.month).to.equal('2026-12');
      expect(focusedDay()).to.equal('2026-12-01');
      expect(el.heading.textContent).to.equal('December 2026');
    });

    it('goes to the start and end of the week with Home and End', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-06', firstDayOfWeek: 1 });

      await press(el, 'Home', '2026-11-06');
      expect(focusedDay()).to.equal('2026-11-02');
      await press(el, 'End');
      expect(focusedDay()).to.equal('2026-11-08');
    });

    it('moves by a month with Page Up and Page Down, keeping the day within the month', async () => {
      const el = await dateCalendarFixture({ value: '2026-01-31' });

      await press(el, 'PageDown', '2026-01-31');
      expect(focusedDay()).to.equal('2026-02-28');
      expect(el.grid.dataset.month).to.equal('2026-02');
      await press(el, 'PageUp');
      expect(focusedDay()).to.equal('2026-01-28');
    });

    it('moves by a year with Shift and Page Up or Page Down', async () => {
      const el = await dateCalendarFixture({ value: '2024-02-29' });

      await press(el, 'Shift+PageDown', '2024-02-29');
      expect(focusedDay()).to.equal('2025-02-28');
      await press(el, 'Shift+PageUp');
      expect(focusedDay()).to.equal('2024-02-28');
    });

    it('commits the focused day with Enter and Space', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });
      const commits = recordCommits();

      await press(el, 'Enter', '2026-11-19');
      await press(el, 'ArrowRight');
      await press(el, ' ');

      expect(commits).to.eql(['2026-11-19', '2026-11-20']);
      expect(el.value).to.equal('2026-11-20');
      expect(focusedDay()).to.equal('2026-11-20');
    });

    it('reaches disabled days, but doesn\'t commit them', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-10', min: '2026-11-10' });
      const commits = recordCommits();

      await press(el, 'ArrowLeft', '2026-11-10');
      expect(focusedDay()).to.equal('2026-11-09');
      await press(el, 'Enter');

      expect(commits).to.eql([]);
      expect(el.value).to.equal('2026-11-10');
    });

    it('does nothing past the months holding min and max', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-01', min: '2026-11-01', max: '2026-11-30' });

      await press(el, 'ArrowLeft', '2026-11-01');
      expect(focusedDay()).to.equal('2026-11-01');
      await press(el, 'PageDown');
      expect(focusedDay()).to.equal('2026-11-01');
      expect(el.grid.dataset.month).to.equal('2026-11');
    });
  });

  describe('outside days', () => {
    it('commit when clicked, turning the page to their month', async () => {
      // With weeks from Sunday, November's grid ends with December 1 to 12.
      const el = await dateCalendarFixture({ value: '2026-11-18' });
      const commits = recordCommits();

      day(el, '2026-12-03').click();

      expect(commits).to.eql(['2026-12-03']);
      expect(el.grid.dataset.month).to.equal('2026-12');
      expect(day(el, '2026-12-03').tabIndex).to.equal(0);
      expect(day(el, '2026-12-03').classList.contains('awc-date-calendar-day--outside')).to.equal(false);
    });

    it('never hold the tab stop', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18', max: '2026-11-30' });

      // December 3 is after max, so the click commits nothing, and the focus it gives doesn't move the tab stop.
      day(el, '2026-12-03').focus();
      day(el, '2026-12-03').click();

      expect(el.grid.dataset.month).to.equal('2026-11');
      expect(day(el, '2026-12-03').tabIndex).to.equal(-1);
      expect(day(el, '2026-11-18').tabIndex).to.equal(0);
    });
  });

  describe('disabled days', () => {
    it('don\'t commit when clicked, but take the tab stop when focused', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18', disabledDaysOfWeek: [0, 6] });
      const commits = recordCommits();

      // Pointer focus comes before the click.
      day(el, '2026-11-21').focus();
      day(el, '2026-11-21').click();

      expect(commits).to.eql([]);
      expect(el.value).to.equal('2026-11-18');
      expect(day(el, '2026-11-21').tabIndex).to.equal(0);
      expect(el.querySelectorAll('tbody [tabindex="0"]')).to.have.length(1);
    });
  });

  describe('resetView()', () => {
    it('goes back to the selected day\'s month, and makes it the active day', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });
      const commits = recordCommits();
      nextButton(el).click();
      nextButton(el).click();

      el.resetView();

      expect(el.grid.dataset.month).to.equal('2026-11');
      expect(day(el, '2026-11-18').tabIndex).to.equal(0);
      expect(el.value).to.equal('2026-11-18');
      expect(commits).to.eql([]);
    });

    it('goes back to today\'s month without a selected day', async () => {
      const el = await dateCalendarFixture({ timeZone: 'Pacific/Kiritimati' });
      const todayThere = today('Pacific/Kiritimati').toString();
      previousButton(el).click();

      el.resetView();

      expect(el.grid.dataset.month).to.equal(todayThere.slice(0, 7));
      expect(day(el, todayThere).tabIndex).to.equal(0);
    });
  });

  describe('today', () => {
    it('is moved when the day the server marked is no longer today', async () => {
      const todayThere = today('UTC');
      // Another day of the same month, as on a page cached since yesterday.
      const stale = new CalendarDate(todayThere.year, todayThere.month, todayThere.day === 1 ? 2 : 1).toString();
      const el = await dateCalendarFixture({ timeZone: 'UTC', markedToday: stale });

      expect(el.querySelectorAll('[aria-current="date"]')).to.have.length(1);
      expect(day(el, todayThere.toString()).getAttribute('aria-current')).to.equal('date');
    });

    it('is marked in the calendar\'s time zone on a page turn', async () => {
      const el = await dateCalendarFixture({ value: '2020-01-15', timeZone: 'Pacific/Kiritimati' });
      const todayThere = today('Pacific/Kiritimati');

      el.value = todayThere.toString();

      expect(day(el, todayThere.toString()).getAttribute('aria-current')).to.equal('date');
    });
  });

  describe('attributes changed after render', () => {
    it('re-mark the disabled days and the paging limits', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });

      el.min = '2026-11-10';
      el.disabledDaysOfWeek = [0];

      expect(day(el, '2026-11-09').getAttribute('aria-disabled')).to.equal('true');
      expect(day(el, '2026-11-10').hasAttribute('aria-disabled')).to.equal(false);
      expect(day(el, '2026-11-15').getAttribute('aria-disabled')).to.equal('true');
      expect(previousButton(el).getAttribute('aria-disabled')).to.equal('true');
    });

    it('don\'t rewrite the heading, a live region, when the month stays the same', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });
      const mutations: MutationRecord[] = [];
      const observer = new MutationObserver((records) => mutations.push(...records));
      observer.observe(el.heading, { childList: true, characterData: true, subtree: true });

      el.min = '2026-11-10';
      el.resetView();
      mutations.push(...observer.takeRecords());
      observer.disconnect();

      expect(mutations).to.have.length(0);
      expect(el.heading.textContent).to.equal('November 2026');
    });

    it('re-lay the weeks from a new first day of the week', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18', firstDayOfWeek: 0 });

      el.firstDayOfWeek = 1;

      expect(el.querySelector('thead th')!.textContent).to.equal('Mon');
      expect(el.querySelector('thead th')!.getAttribute('abbr')).to.equal('Monday');
      expect(el.querySelector<HTMLElement>('tbody button')!.dataset.date).to.equal('2026-10-26');
      expect(day(el, '2026-11-18').tabIndex).to.equal(0);
    });

    it('format the months with the names and patterns given', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

      el.i18n = { ...ENGLISH, monthNames: months, dayNames: days, formats: { heading: '%B de %Y', day: '%A, %-d de %B de %Y' } };
      nextButton(el).click();

      expect(el.heading.textContent).to.equal('diciembre de 2026');
      expect(day(el, '2026-12-04').getAttribute('aria-label')).to.equal('viernes, 4 de diciembre de 2026');
    });
  });

  describe('a morph', () => {
    it('takes the calendar back to the server\'s month, and leaves it working', async () => {
      const options = { value: '2026-11-18' };
      const el = await dateCalendarFixture(options);
      nextButton(el).click();
      nextButton(el).click();

      Idiomorph.morph(el, dateCalendarHtml(options));

      expect(el.grid.dataset.month).to.equal('2026-11');
      await press(el, 'ArrowRight', '2026-11-18');
      expect(focusedDay()).to.equal('2026-11-19');
      day(el, '2026-11-19').click();
      expect(el.value).to.equal('2026-11-19');
    });

    it('shows the server\'s new value', async () => {
      const el = await dateCalendarFixture({ value: '2026-11-18' });

      Idiomorph.morph(el, dateCalendarHtml({ value: '2027-02-03' }));

      expect(el.value).to.equal('2027-02-03');
      expect(el.grid.dataset.month).to.equal('2027-02');
      expect(selectedDay(el)).to.equal('2027-02-03');
      expect(day(el, '2027-02-03').tabIndex).to.equal(0);
    });
  });
});
