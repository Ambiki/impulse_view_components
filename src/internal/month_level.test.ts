import { expect } from '@open-wc/testing';
import { CalendarDate } from './calendar_date';
import { MONTH_ENGLISH, MONTH_LEVEL } from './month_level';

/** The calendar date `value` names, as `YYYY-MM-DD`. */
const date = (value: string) => CalendarDate.parse(value)!;
/** `cell` as `YYYY-MM-DD`, so that a failed assertion shows a date. */
const written = (cell: CalendarDate | null) => cell?.toString() ?? null;
/** What a move is reckoned in: the week's first day, and the displayed view. */
const context = { firstDayOfWeek: 0, displayed: date('2026-01-01') };

/** Where `key` moves to from November 2026. */
function move(key: string, { shiftKey = false } = {}) {
  return written(MONTH_LEVEL.move(date('2026-11-01'), { key, shiftKey }, context));
}

describe('MONTH_LEVEL', () => {
  it('reads and writes a cell as `YYYY-MM`, and a view as `YYYY`', () => {
    expect(written(MONTH_LEVEL.parse('2026-11'))).to.equal('2026-11-01');
    expect(MONTH_LEVEL.parse('2026-13')).to.equal(null);
    expect(MONTH_LEVEL.parse('2026-11-18')).to.equal(null);
    expect(MONTH_LEVEL.parse('0999-01')).to.equal(null);
    expect(MONTH_LEVEL.parse(undefined)).to.equal(null);
    expect(MONTH_LEVEL.format(date('2026-11-01'))).to.equal('2026-11');
    expect(MONTH_LEVEL.formatView(date('2026-11-01'))).to.equal('2026');
    expect(written(MONTH_LEVEL.parseView('2026'))).to.equal('2026-01-01');
    expect(MONTH_LEVEL.parseView('999')).to.equal(null);
  });

  it('takes a day for its month, and a year for its view', () => {
    expect(written(MONTH_LEVEL.cellOf(date('2026-11-18')))).to.equal('2026-11-01');
    expect(written(MONTH_LEVEL.viewOf(date('2026-11-18')))).to.equal('2026-01-01');
    expect(MONTH_LEVEL.compareViews(date('2026-01-01'), date('2026-12-01'))).to.equal(0);
    expect(MONTH_LEVEL.compareViews(date('2025-12-01'), date('2026-01-01'))).to.be.below(0);
  });

  it('covers its month\'s days with a cell', () => {
    const range = MONTH_LEVEL.range(date('2028-02-01'));

    expect([written(range.start), written(range.end)]).to.eql(['2028-02-01', '2028-02-29']);
  });

  it('moves a cell by years, keeping its month', () => {
    expect(written(MONTH_LEVEL.addViews(date('2026-11-01'), -2))).to.equal('2024-11-01');
    expect(written(MONTH_LEVEL.placeIn!(date('2026-11-01'), date('2031-01-01')))).to.equal('2031-11-01');
  });

  it('shows a year as four rows of three months', () => {
    const rows = MONTH_LEVEL.rows(date('2026-11-01'), 0);

    expect(rows.map((row) => row.map(written))).to.eql([
      ['2026-01-01', '2026-02-01', '2026-03-01'],
      ['2026-04-01', '2026-05-01', '2026-06-01'],
      ['2026-07-01', '2026-08-01', '2026-09-01'],
      ['2026-10-01', '2026-11-01', '2026-12-01'],
    ]);
  });

  it('moves by a month, a row of three, to the row\'s ends, and by a year with or without Shift', () => {
    expect(move('ArrowLeft')).to.equal('2026-10-01');
    expect(move('ArrowRight')).to.equal('2026-12-01');
    expect(move('ArrowUp')).to.equal('2026-08-01');
    expect(move('ArrowDown')).to.equal('2027-02-01');
    expect(move('Home')).to.equal('2026-10-01');
    expect(move('End')).to.equal('2026-12-01');
    expect(move('PageUp')).to.equal('2025-11-01');
    expect(move('PageDown')).to.equal('2027-11-01');
    expect(move('PageUp', { shiftKey: true })).to.equal('2025-11-01');
    expect(move('Enter')).to.equal(null);
  });

  it('names a month with the names and pattern it is given', () => {
    const french = {
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
      abbrMonthNames: [
        'janv.',
        'févr.',
        'mars',
        'avr.',
        'mai',
        'juin',
        'juil.',
        'août',
        'sept.',
        'oct.',
        'nov.',
        'déc.',
      ],
      formats: { month: '%B %Y' },
    };

    expect(MONTH_LEVEL.text(date('2026-11-01'), french)).to.equal('nov.');
    expect(MONTH_LEVEL.label(date('2026-11-01'), french)).to.equal('novembre 2026');
  });

  it('names a year, a month in short and a month in full', () => {
    expect(MONTH_LEVEL.heading(date('2026-11-01'), MONTH_ENGLISH)).to.equal('2026');
    expect(MONTH_LEVEL.text(date('2026-11-01'), MONTH_ENGLISH)).to.equal('Nov');
    expect(MONTH_LEVEL.label(date('2026-11-01'), MONTH_ENGLISH)).to.equal('November 2026');
  });
});
