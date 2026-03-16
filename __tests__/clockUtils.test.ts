import { formatCurrentTime } from '../utils/clockUtils';

describe('formatCurrentTime', () => {
  it('formats midnight as 12:00 AM', () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    expect(formatCurrentTime(d)).toBe('12:00 AM');
  });

  it('formats noon as 12:00 PM', () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    expect(formatCurrentTime(d)).toBe('12:00 PM');
  });

  it('pads single-digit minutes', () => {
    const d = new Date();
    d.setHours(9, 5, 0, 0);
    expect(formatCurrentTime(d)).toBe('9:05 AM');
  });

  it('formats 23:59 as 11:59 PM', () => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    expect(formatCurrentTime(d)).toBe('11:59 PM');
  });

  it('formats 13:00 as 1:00 PM', () => {
    const d = new Date();
    d.setHours(13, 0, 0, 0);
    expect(formatCurrentTime(d)).toBe('1:00 PM');
  });
});
