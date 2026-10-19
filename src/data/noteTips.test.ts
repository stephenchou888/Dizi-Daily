import { describe, it, expect } from 'vitest';
import { FINGERINGS } from './scales';
import { getNoteTip, NOTE_TIPS } from './noteTips';

describe('noteTips', () => {
  it('provides a specific tip entry for every note in FINGERINGS', () => {
    for (const note of Object.keys(FINGERINGS)) {
      expect(NOTE_TIPS[note], `Missing NOTE_TIPS entry for ${note}`).toBeDefined();
      const tip = getNoteTip(note);
      expect(tip.register.length).toBeGreaterThan(0);
      expect(tip.embouchure.length).toBeGreaterThan(0);
      expect(tip.pitfall.length).toBeGreaterThan(0);
      expect(tip.proTip.length).toBeGreaterThan(0);
    }
  });

  it('returns fallback tip for unknown note names', () => {
    const fallback = getNoteTip('Z9');
    expect(fallback.register).toContain('标准音区');
  });
});
