import { describe, it, expect } from 'vitest';
import { computeStreakStats, toDateKey, addDays } from './streak';

describe('streak utilities', () => {
  const today = new Date(2026, 4, 20); // 2026-05-20

  it('formats local date as YYYY-MM-DD', () => {
    expect(toDateKey(today)).toBe('2026-05-20');
  });

  it('returns zeroes when no check-ins exist', () => {
    const stats = computeStreakStats(new Set(), today);
    expect(stats).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      checkedInToday: false,
    });
  });

  it('counts consecutive days including today', () => {
    const set = new Set([
      toDateKey(addDays(today, -2)),
      toDateKey(addDays(today, -1)),
      toDateKey(today),
    ]);
    const stats = computeStreakStats(set, today);
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.totalDays).toBe(3);
    expect(stats.checkedInToday).toBe(true);
  });

  it('preserves current streak if yesterday was checked in but today is not yet', () => {
    const set = new Set([
      toDateKey(addDays(today, -2)),
      toDateKey(addDays(today, -1)),
    ]);
    const stats = computeStreakStats(set, today);
    expect(stats.currentStreak).toBe(2);
    expect(stats.checkedInToday).toBe(false);
  });

  it('resets current streak to 0 if both today and yesterday were missed, while keeping longestStreak', () => {
    const set = new Set([
      '2026-05-01',
      '2026-05-02',
      '2026-05-03',
      '2026-05-04',
    ]);
    const stats = computeStreakStats(set, today);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(4);
    expect(stats.totalDays).toBe(4);
  });
});
