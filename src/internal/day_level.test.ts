import { expect } from '@open-wc/testing';
import { CalendarDate } from './calendar_date';
import { DAY_ENGLISH, DAY_LEVEL, weekdayRow } from './day_level';

/** The calendar date `value` names, as `YYYY-MM-DD`. */
const date = (value: string) => CalendarDate.parse(value)!;
/** `cell` as `YYYY-MM-DD`, so that a failed assertion shows a date. */
const written = (cell: CalendarDate | null) => cell?.toString() ?? null;
/** What a move is reckoned in: the week's first day, and the displayed view. */
const context = { firstDayOfWeek: 0, displayed: date('2026-11-01') };

/** Where `key` moves to from Wednesday, November 18, 2026. */
function move(key: string, { shiftKey = false, firstDayOfWeek = 0 } = {}) {
  return written(DAY_LEVEL.move(date('2026-11-18'), { key, shiftKey }, { ...context, firstDayOfWeek }));
}

describe('DAY_LEVEL', () => {
  it('reads and writes a cell as `YYYY-MM-DD`, and a view as `YYYY-MM`', () => {
    expect(written(DAY_LEVEL.parse('2026-11-18'))).to.equal('2026-11-18');
    expect(DAY_LEVEL.parse('2026-11')).to.equal(null);
    expect(DAY_LEVEL.parse(undefined)).to.equal(null);
    expect(DAY_LEVEL.format(date('2026-11-18'))).to.equal('2026-11-18');
    expect(DAY_LEVEL.formatView(date('2026-11-18'))).to.equal('2026-11');
    expect(written(DAY_LEVEL.parseView('2026-11'))).to.equal('2026-11-01');
    expect(DAY_LEVEL.parseView('2026-13')).to.equal(null);
  });

  it('takes a day for its own cell, and its month for its view', () => {
    expect(written(DAY_LEVEL.cellOf(date('2026-11-18')))).to.equal('2026-11-18');
    expect(written(DAY_LEVEL.viewOf(date('2026-11-18')))).to.equal('2026-11-01');
    expect(DAY_LEVEL.compareViews(date('2026-11-01'), date('2026-11-30'))).to.equal(0);
    expect(DAY_LEVEL.compareViews(date('2026-10-31'), date('2026-11-01'))).to.be.below(0);
    expect(DAY_LEVEL.compareViews(date('2027-01-01'), date('2026-12-31'))).to.be.above(0);
  });

  it('covers one day with a cell', () => {
    const range = DAY_LEVEL.range(date('2026-11-18'));

    expect([written(range.start), written(range.end)]).to.eql(['2026-11-18', '2026-11-18']);
  });

  it('moves a cell by months, keeping its day where the month has it', () => {
    expect(written(DAY_LEVEL.addViews(date('2026-11-18'), 2))).to.equal('2027-01-18');
    expect(written(DAY_LEVEL.addViews(date('2026-01-31'), 1))).to.equal('2026-02-28');
    expect(written(DAY_LEVEL.placeIn!(date('2026-01-31'), date('2024-02-01')))).to.equal('2024-02-29');
  });

  it('shows a month as six weeks from the first day of the week', () => {
    const fromSunday = DAY_LEVEL.rows(date('2026-11-18'), 0);
    const fromMonday = DAY_LEVEL.rows(date('2026-11-18'), 1);

    expect(fromSunday.map((row) => row.length)).to.eql([7, 7, 7, 7, 7, 7]);
    expect([written(fromSunday[0][0]), written(fromSunday[5][6])]).to.eql(['2026-11-01', '2026-12-12']);
    expect([written(fromMonday[0][0]), written(fromMonday[5][6])]).to.eql(['2026-10-26', '2026-12-06']);
  });

  it('moves by a day, a week, to the week\'s ends, by a month, and with Shift by a year', () => {
    expect(move('ArrowLeft')).to.equal('2026-11-17');
    expect(move('ArrowRight')).to.equal('2026-11-19');
    expect(move('ArrowUp')).to.equal('2026-11-11');
    expect(move('ArrowDown')).to.equal('2026-11-25');
    expect(move('Home')).to.equal('2026-11-15');
    expect(move('End')).to.equal('2026-11-21');
    expect(move('Home', { firstDayOfWeek: 1 })).to.equal('2026-11-16');
    expect(move('End', { firstDayOfWeek: 1 })).to.equal('2026-11-22');
    expect(move('PageUp')).to.equal('2026-10-18');
    expect(move('PageDown')).to.equal('2026-12-18');
    expect(move('PageUp', { shiftKey: true })).to.equal('2025-11-18');
    expect(move('PageDown', { shiftKey: true })).to.equal('2027-11-18');
    expect(move('Enter')).to.equal(null);
  });

  it('cuts a move by a month or a year to the length of the month it lands in', () => {
    const from = (day: string, key: string, shiftKey = false) =>
      written(DAY_LEVEL.move(date(day), { key, shiftKey }, context));

    expect(from('2026-01-31', 'PageDown')).to.equal('2026-02-28');
    expect(from('2026-03-31', 'PageUp')).to.equal('2026-02-28');
    expect(from('2028-02-29', 'PageDown', true)).to.equal('2029-02-28');
  });

  it('names a month and a day with the names and patterns it is given', () => {
    const french = {
      ...DAY_ENGLISH,
      monthNames: [
        'janvier',
        'février',
        'mars',
        'avril',
        'mai',
        'juin',
        'juillet',
        'août',
        'septembre',
        'octobre',
        'novembre',
        'décembre',
      ],
      dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
      abbrDayNames: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
      formats: { monthHeading: '%B %Y', day: '%A %-d %B %Y' },
    };

    expect(DAY_LEVEL.heading(date('2026-11-18'), french)).to.equal('novembre 2026');
    expect(DAY_LEVEL.label(date('2026-11-18'), french)).to.equal('mercredi 18 novembre 2026');
    expect(weekdayRow(1, french).firstElementChild!.textContent).to.equal('lun');
  });

  it('names a month, a day\'s number and a day in full', () => {
    expect(DAY_LEVEL.heading(date('2026-11-18'), DAY_ENGLISH)).to.equal('November 2026');
    expect(DAY_LEVEL.text(date('2026-11-08'), DAY_ENGLISH)).to.equal('8');
    expect(DAY_LEVEL.label(date('2026-11-18'), DAY_ENGLISH)).to.equal('Wednesday, November 18, 2026');
  });

  it('heads its columns with the weekdays, from the first day of the week', () => {
    const headings = [...weekdayRow(1, DAY_ENGLISH).children];

    expect(headings.map((heading) => heading.textContent)).to.eql(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(headings[0].getAttribute('abbr')).to.equal('Monday');
    expect(headings[0].getAttribute('scope')).to.equal('col');
  });
});
