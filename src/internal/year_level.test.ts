import { expect } from '@open-wc/testing';
import { CalendarDate } from './calendar_date';
import { YEAR_ENGLISH, YEAR_LEVEL } from './year_level';

const date = (value: string) => CalendarDate.parse(value)!;
const written = (cell: CalendarDate | null) => cell?.toString() ?? null;

/** The year `key` moves to from `year`, in the grid of the decade `displayed` is in: the 2020s by default. */
function move(key: string, year = 2026, displayed = 2026) {
  const context = { firstDayOfWeek: 0, displayed: date(`${displayed}-01-01`) };
  return YEAR_LEVEL.move(date(`${year}-01-01`), { key, shiftKey: false }, context)?.year ?? null;
}

describe('the year level', () => {
  it('reads and writes a cell as `YYYY`, and a view as its decade\'s first year', () => {
    expect(written(YEAR_LEVEL.parse('2026'))).to.equal('2026-01-01');
    expect(YEAR_LEVEL.parse('999')).to.equal(null);
    expect(YEAR_LEVEL.parse('10000')).to.equal(null);
    expect(YEAR_LEVEL.parse('2026-11')).to.equal(null);
    expect(YEAR_LEVEL.parse(undefined)).to.equal(null);
    expect(YEAR_LEVEL.format(date('2026-01-01'))).to.equal('2026');
    expect(YEAR_LEVEL.formatView(date('2026-01-01'))).to.equal('2020');
    expect(written(YEAR_LEVEL.parseView('2020'))).to.equal('2020-01-01');
  });

  it('takes a day for its year, and a decade for its view', () => {
    expect(written(YEAR_LEVEL.cellOf(date('2026-11-18')))).to.equal('2026-01-01');
    expect(written(YEAR_LEVEL.viewOf(date('2026-11-18')))).to.equal('2020-01-01');
    expect(YEAR_LEVEL.compareViews(date('2020-01-01'), date('2029-01-01'))).to.equal(0);
    expect(YEAR_LEVEL.compareViews(date('2019-01-01'), date('2020-01-01'))).to.be.below(0);
  });

  it('covers its year\'s days with a cell', () => {
    const range = YEAR_LEVEL.range(date('2026-06-15'));

    expect([written(range.start), written(range.end)]).to.eql(['2026-01-01', '2026-12-31']);
  });

  it('moves a cell by decades', () => {
    expect(written(YEAR_LEVEL.addViews(date('2026-01-01'), 1))).to.equal('2036-01-01');
    expect(written(YEAR_LEVEL.addViews(date('2026-01-01'), -2))).to.equal('2006-01-01');
  });

  it('shows a decade with the year before and after it, as four rows of three years', () => {
    const rows = YEAR_LEVEL.rows(date('2026-01-01'), 0);

    expect(rows.map((row) => row.map((cell) => cell.year))).to.eql([
      [2019, 2020, 2021],
      [2022, 2023, 2024],
      [2025, 2026, 2027],
      [2028, 2029, 2030],
    ]);
  });

  it('moves by a year, a row of three, to the row\'s ends, and by a decade', () => {
    expect(move('ArrowLeft')).to.equal(2025);
    expect(move('ArrowRight')).to.equal(2027);
    expect(move('ArrowUp')).to.equal(2023);
    expect(move('ArrowDown')).to.equal(2029);
    expect(move('Home')).to.equal(2025);
    expect(move('End')).to.equal(2027);
    expect(move('PageUp')).to.equal(2016);
    expect(move('PageDown')).to.equal(2036);
    expect(move('Enter')).to.equal(null);
  });

  it('reckons a row\'s ends in the displayed decade\'s grid, for the outside years too', () => {
    expect(move('End', 2019)).to.equal(2021);
    expect(move('Home', 2030)).to.equal(2028);
    // The 2030s' grid runs from 2029 to 2040, so its rows start a year later than the 2020s' do.
    expect(move('Home', 2036, 2036)).to.equal(2035);
    expect(move('End', 2029, 2036)).to.equal(2031);
    expect(move('Home', 2040, 2036)).to.equal(2038);
  });

  it('names a decade by its first and last years, and a year by its number alone', () => {
    expect(YEAR_LEVEL.heading(date('2026-01-01'), YEAR_ENGLISH)).to.equal('2020 – 2029');
    expect(YEAR_LEVEL.text(date('2026-01-01'), YEAR_ENGLISH)).to.equal('2026');
    expect(YEAR_LEVEL.label(date('2026-01-01'), YEAR_ENGLISH)).to.equal(null);
  });
});
