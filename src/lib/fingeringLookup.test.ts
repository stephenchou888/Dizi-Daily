import { describe, it, expect } from 'vitest';
import { matchFingering } from './fingeringLookup';

describe('matchFingering for Chinese Dizi', () => {
  it('matches all 6 holes closed (筒音) to G4 in slow breath', () => {
    const res = matchFingering(
      new Set(['hole_6', 'hole_5', 'hole_4', 'hole_3', 'hole_2', 'hole_1']),
      'slow'
    );
    expect(res).not.toBeNull();
    expect(res?.note).toBe('G4');
    expect(res?.exact).toBe(true);
    expect(res?.jianpu).toContain('5̣');
  });

  it('matches holes 4, 5, 6 closed to C5 (中音1) in moderate breath and C6 (高音1̇) in fast breath', () => {
    const holes = new Set(['hole_6', 'hole_5', 'hole_4']);
    const mod = matchFingering(holes, 'moderate');
    expect(mod?.note).toBe('C5');
    expect(mod?.exact).toBe(true);
    expect(mod?.sameHoleNotes.map((n) => n.note)).toEqual(['C5', 'C6']);

    const fast = matchFingering(holes, 'fast');
    expect(fast?.note).toBe('C6');
    expect(fast?.exact).toBe(true);
  });

  it('matches all 6 holes open (empty set) to F#5 (#4 变徵)', () => {
    const res = matchFingering(new Set(), 'moderate');
    expect(res?.note).toBe('F#5');
    expect(res?.exact).toBe(true);
  });

  it('matches half-hole fingerings accurately', () => {
    const res = matchFingering(
      new Set(['hole_6', 'hole_5', 'hole_4', 'hole_3', 'hole_2_half']),
      'slow'
    );
    expect(res?.note).toBe('Bb4');
    expect(res?.exact).toBe(true);
    expect(res?.displayName).toBe('B♭4 / A♯4');
  });
});
