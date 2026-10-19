import { describe, it, expect } from 'vitest';
import { SCALES, FINGERINGS, DIZI_KEYS } from './scales';

describe('Dizi scales and fingerings data integrity', () => {
  it('defines all 5 standard Dizi keys in C-D-E-F-G order', () => {
    expect(Object.keys(DIZI_KEYS)).toEqual([
      'qudi_c',
      'qudi_d',
      'qudi_e',
      'bangdi_f',
      'bangdi_g',
    ]);
  });

  it('has valid FINGERINGS entries for every note in every scale', () => {
    for (const scale of SCALES) {
      expect(scale.notes.length).toBeGreaterThan(0);
      for (const note of scale.notes) {
        expect(
          FINGERINGS[note],
          `Scale "${scale.id}" references undefined note "${note}"`
        ).toBeDefined();
      }
    }
  });

  it('has valid hole keys for every fingering', () => {
    const validKeyPattern = /^hole_[1-6](_half)?$/;
    for (const [note, fingering] of Object.entries(FINGERINGS)) {
      expect(fingering.freq).toBeGreaterThan(200);
      for (const k of fingering.keys) {
        expect(k, `Invalid hole key "${k}" in note "${note}"`).toMatch(
          validKeyPattern
        );
      }
    }
  });
});
