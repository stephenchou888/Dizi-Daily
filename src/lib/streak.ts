const STORAGE_KEY = 'dizi_daily_checkins_v1';

/** Format a Date into local YYYY-MM-DD */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Shift a date by N days (local calendar) */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

/** Load checked-in date keys from localStorage */
export function loadCheckIns(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

/** Save checked-in date keys to localStorage */
export function saveCheckIns(checkIns: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(checkIns).sort()));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export interface StreakStats {
  /** Consecutive days up to today (or yesterday if today isn't checked yet) */
  currentStreak: number;
  /** All-time longest consecutive streak */
  longestStreak: number;
  /** Total days checked in */
  totalDays: number;
  /** Whether today is checked in */
  checkedInToday: boolean;
}

/** Compute streak statistics given a set of YYYY-MM-DD keys and a reference "today" */
export function computeStreakStats(
  checkIns: Set<string>,
  today: Date = new Date()
): StreakStats {
  const todayKey = toDateKey(today);
  const checkedInToday = checkIns.has(todayKey);

  // Current streak: start at today if checked, otherwise start at yesterday
  let currentStreak = 0;
  let cursor = checkedInToday ? today : addDays(today, -1);
  while (checkIns.has(toDateKey(cursor))) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  // Longest streak: sort all valid keys chronologically and scan
  const sorted = Array.from(checkIns).sort();
  let longestStreak = 0;
  let run = 0;
  let prevDate: Date | null = null;

  for (const key of sorted) {
    const [y, m, d] = key.split('-').map(Number);
    if (!y || !m || !d) continue;
    const curDate = new Date(y, m - 1, d);
    if (prevDate && toDateKey(addDays(prevDate, 1)) === key) {
      run++;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
    prevDate = curDate;
  }

  return {
    currentStreak,
    longestStreak,
    totalDays: checkIns.size,
    checkedInToday,
  };
}
