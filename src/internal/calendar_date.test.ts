import { expect } from '@open-wc/testing';
import { CalendarDate, formatDate, today } from './calendar_date';

describe('CalendarDate', () => {
  describe('parse', () => {
    it('reads a YYYY-MM-DD calendar date', () => {
      const date = CalendarDate.parse('2026-11-06')!;

      expect([date.year, date.month, date.day]).to.eql([2026, 11, 6]);
      expect(date.toString()).to.equal('2026-11-06');
    });

    it('reads February 29 in a leap year', () => {
      expect(CalendarDate.parse('2024-02-29')?.toString()).to.equal('2024-02-29');
    });

    it('rejects a day the month does not have, rather than rolling it over', () => {
      expect(CalendarDate.parse('2026-02-29')).to.equal(null);
      expect(CalendarDate.parse('2026-02-30')).to.equal(null);
      expect(CalendarDate.parse('2026-04-31')).to.equal(null);
    });

    it('rejects anything else', () => {
      for (const value of ['', 'foo', '2026-13-01', '2026-00-10', '2026-11-00', '2026-1-6', '2026-11-06T00:00:00Z']) {
        expect(CalendarDate.parse(value), value).to.equal(null);
      }
      expect(CalendarDate.parse(null)).to.equal(null);
    });
  });

  describe('weeks', () => {
    it('knows its day of the week, 0 being Sunday', () => {
      expect(CalendarDate.parse('2026-11-01')!.dayOfWeek).to.equal(0);
      expect(CalendarDate.parse('2026-11-06')!.dayOfWeek).to.equal(5);
      expect(CalendarDate.parse('2026-11-07')!.dayOfWeek).to.equal(6);
    });

    it('finds the start of its week from the first day of the week', () => {
      const friday = CalendarDate.parse('2026-11-06')!;
      const sunday = CalendarDate.parse('2026-11-01')!;

      expect(friday.startOfWeek(0).toString()).to.equal('2026-11-01');
      expect(friday.startOfWeek(1).toString()).to.equal('2026-11-02');
      expect(friday.startOfWeek(6).toString()).to.equal('2026-10-31');
      expect(sunday.startOfWeek(0).toString()).to.equal('2026-11-01');
      expect(sunday.startOfWeek(1).toString()).to.equal('2026-10-26');
    });

    it('lays out its month as six weeks from the first day of the week', () => {
      const weeks = CalendarDate.parse('2026-11-18')!.monthGrid(0);

      expect(weeks).to.have.length(6);
      expect(weeks.every((week) => week.length === 7)).to.equal(true);
      // November 2026 starts on a Sunday, so the grid ends with the first two weeks of December.
      expect(weeks[0]!.map(String)).to.eql([
        '2026-11-01',
        '2026-11-02',
        '2026-11-03',
        '2026-11-04',
        '2026-11-05',
        '2026-11-06',
        '2026-11-07',
      ]);
      expect(weeks[5]![6]!.toString()).to.equal('2026-12-12');
    });

    it('fills the first week with days of the month before', () => {
      const weeks = CalendarDate.parse('2026-11-18')!.monthGrid(1);

      expect(weeks[0]!.map(String)).to.eql([
        '2026-10-26',
        '2026-10-27',
        '2026-10-28',
        '2026-10-29',
        '2026-10-30',
        '2026-10-31',
        '2026-11-01',
      ]);
      expect(weeks[5]![6]!.toString()).to.equal('2026-12-06');
    });
  });

  describe('compare', () => {
    it('orders dates, and tells when two fall in the same month', () => {
      const date = CalendarDate.parse('2026-11-06')!;

      expect(date.compare(CalendarDate.parse('2026-11-07')!)).to.be.below(0);
      expect(date.compare(CalendarDate.parse('2026-10-30')!)).to.be.above(0);
      expect(date.compare(CalendarDate.parse('2026-11-06')!)).to.equal(0);
      expect(date.isSameMonth(CalendarDate.parse('2026-11-30')!)).to.equal(true);
      expect(date.isSameMonth(CalendarDate.parse('2025-11-06')!)).to.equal(false);
      expect(date.compareMonth(CalendarDate.parse('2026-12-01')!)).to.be.below(0);
      expect(date.compareMonth(CalendarDate.parse('2026-11-30')!)).to.equal(0);
      expect(date.equals(CalendarDate.parse('2026-11-06'))).to.equal(true);
      expect(date.equals(null)).to.equal(false);
    });
  });

  describe('add', () => {
    const add = (value: string, duration: Parameters<CalendarDate['add']>[0]) =>
      CalendarDate.parse(value)!.add(duration).toString();

    it('moves by days across months and years', () => {
      expect(add('2026-11-06', { days: 1 })).to.equal('2026-11-07');
      expect(add('2026-11-30', { days: 1 })).to.equal('2026-12-01');
      expect(add('2026-12-31', { days: 1 })).to.equal('2027-01-01');
      expect(add('2026-03-01', { days: -1 })).to.equal('2026-02-28');
      expect(add('2026-11-06', { days: -7 })).to.equal('2026-10-30');
    });

    it('moves by months, keeping the day within the month', () => {
      expect(add('2026-11-06', { months: 1 })).to.equal('2026-12-06');
      expect(add('2026-12-15', { months: 1 })).to.equal('2027-01-15');
      expect(add('2026-01-31', { months: 1 })).to.equal('2026-02-28');
      expect(add('2024-01-31', { months: 1 })).to.equal('2024-02-29');
      expect(add('2026-03-31', { months: -1 })).to.equal('2026-02-28');
      expect(add('2026-01-15', { months: -1 })).to.equal('2025-12-15');
    });

    it('moves by years, keeping February 29 within February', () => {
      expect(add('2026-11-06', { years: 1 })).to.equal('2027-11-06');
      expect(add('2024-02-29', { years: 1 })).to.equal('2025-02-28');
      expect(add('2024-02-29', { years: -4 })).to.equal('2020-02-29');
    });

    it('leaves the date itself unchanged', () => {
      const date = CalendarDate.parse('2026-11-06')!;
      date.add({ months: 1 });

      expect(date.toString()).to.equal('2026-11-06');
    });
  });

  describe('today', () => {
    // 13:22 UTC on November 6, 2026: already November 7 in Kiritimati, still November 6 in New York and Pago Pago.
    const now = new Date('2026-11-06T13:22:00Z');

    it('is the calendar date it is now in a time zone', () => {
      expect(today('Pacific/Kiritimati', now).toString()).to.equal('2026-11-07');
      expect(today('America/New_York', now).toString()).to.equal('2026-11-06');
      expect(today('Pacific/Pago_Pago', now).toString()).to.equal('2026-11-06');
    });

    it('falls back to the browser\'s zone for a missing or unknown one', () => {
      const browsers = today(undefined, now).toString();

      expect(today('', now).toString()).to.equal(browsers);
      expect(today('Eastern Time (US & Canada)', now).toString()).to.equal(browsers);
    });
  });

  describe('formatDate', () => {
    const names = {
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      abbrMonthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      abbrDayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    };
    const date = CalendarDate.parse('2026-11-06')!;

    // The expected strings are what Ruby's `I18n.l(Date.new(2026, 11, 6), format:)` gives with Rails' English names.
    it('formats the way Ruby\'s I18n.l does', () => {
      expect(formatDate(date, '%A, %B %-d, %Y', names)).to.equal('Friday, November 6, 2026');
      expect(formatDate(date, '%B %Y', names)).to.equal('November 2026');
      expect(formatDate(date, '%a %b %d|%e|%m', names)).to.equal('Fri Nov 06| 6|11');
      expect(formatDate(CalendarDate.parse('2026-11-16')!, '%-d %e', names)).to.equal('16 16');
    });

    it('uses the names it is given', () => {
      const spanish = { ...names, monthNames: names.monthNames.map((_, i) => (i === 10 ? 'noviembre' : '')) };

      expect(formatDate(date, '%-d de %B de %Y', spanish)).to.equal('6 de noviembre de 2026');
    });

    it('keeps %% and directives it does not know as they are', () => {
      expect(formatDate(date, '100%% %Q %j', names)).to.equal('100% %Q %j');
    });
  });
});
