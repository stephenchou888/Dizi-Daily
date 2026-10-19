import { FINGERINGS } from '../data/scales';
import { BreathLevel } from '../types/music';

// Canonical natural & standard notes (preferring standard sharps/flats used in Dizi pedagogy)
const CANONICAL_NOTES = [
  'G4', 'G#4', 'A4', 'Bb4', 'B4',
  'C5', 'C#5', 'D5', 'Eb5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'Bb5', 'B5',
  'C6', 'C#6', 'D6', 'Eb6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'Bb6', 'B6',
  'C7',
];

const ENHARMONIC_PAIRS: Record<string, string> = {
  'G#4': 'Ab4',
  'Bb4': 'A#4',
  'C#5': 'Db5',
  'Eb5': 'D#5',
  'F#5': 'Gb5',
  'G#5': 'Ab5',
  'Bb5': 'A#5',
  'C#6': 'Db6',
  'Eb6': 'D#6',
  'F#6': 'Gb6',
  'G#6': 'Ab6',
  'Bb6': 'A#6',
};

export interface FingeringMatch {
  /** Primary canonical note name (e.g. 'C5' or 'Bb4') */
  note: string;
  /** Formatted label including enharmonic equivalent if any (e.g. 'B♭4 / A♯4') */
  displayName: string;
  /** Jianpu notation in 筒音作5 */
  jianpu: string;
  /** Breath level required */
  breath: BreathLevel;
  /** Chinese description of the fingering */
  desc: string;
  /** Reference frequency in Hz */
  freq: number;
  /** Canonical keys of the matched note */
  keys: string[];
  /** Whether the user's selected keys exactly match this note's keys */
  exact: boolean;
  /** All canonical notes across registers that share this exact hole combination */
  sameHoleNotes: { note: string; jianpu: string; breath: BreathLevel; freq: number }[];
}

export function formatNoteDisplay(note: string): string {
  const pretty = (n: string) => n.replace('#', '♯').replace('b', '♭');
  const alt = ENHARMONIC_PAIRS[note];
  return alt ? `${pretty(note)} / ${pretty(alt)}` : pretty(note);
}

/**
 * Given a set of active hole keys (e.g. 'hole_6', 'hole_5', 'hole_4_half') and an optional
 * preferred breath register, find the best matching note in FINGERINGS.
 * Because Chinese bamboo flute uses the same 6 holes across 2.5+ octaves via breath speed
 * (缓吹 / 平吹 / 急吹 / 超吹), `sameHoleNotes` also returns all octave harmonics for that hole pattern!
 */
export function matchFingering(
  activeKeys: Set<string>,
  preferredBreath?: BreathLevel | 'all'
): FingeringMatch | null {
  let bestNote: string | null = null;
  let bestScore = -1;
  let isExact = false;

  const candidates =
    preferredBreath && preferredBreath !== 'all'
      ? CANONICAL_NOTES.filter((n) => FINGERINGS[n]?.breath === preferredBreath)
      : CANONICAL_NOTES;

  const pool = candidates.length > 0 ? candidates : CANONICAL_NOTES;

  // First check exact match (including 0-key match for F#5 / F#6 when all 6 holes are open!)
  for (const note of pool) {
    const f = FINGERINGS[note];
    if (!f) continue;
    const fSet = new Set(f.keys);
    if (
      fSet.size === activeKeys.size &&
      [...fSet].every((k) => activeKeys.has(k))
    ) {
      bestNote = note;
      bestScore = 1;
      isExact = true;
      break;
    }
  }

  // If no exact match in preferredBreath pool, check all canonical notes for exact match
  if (!isExact) {
    for (const note of CANONICAL_NOTES) {
      const f = FINGERINGS[note];
      if (!f) continue;
      const fSet = new Set(f.keys);
      if (
        fSet.size === activeKeys.size &&
        [...fSet].every((k) => activeKeys.has(k))
      ) {
        bestNote = note;
        bestScore = 1;
        isExact = true;
        break;
      }
    }
  }

  // If still not exact, find closest match by Jaccard similarity (with half-hole proximity bonus)
  if (!isExact) {
    for (const note of pool) {
      const f = FINGERINGS[note];
      if (!f) continue;
      const fSet = new Set(f.keys);
      let intersection = 0;
      for (const k of activeKeys) {
        if (fSet.has(k)) {
          intersection += 1;
        } else {
          const baseHole = k.replace('_half', '');
          if (fSet.has(baseHole) || fSet.has(`${baseHole}_half`)) {
            intersection += 0.5;
          }
        }
      }
      const union = new Set([...activeKeys, ...fSet]).size;
      const score = union === 0 ? 1 : intersection / union;
      if (score > bestScore) {
        bestScore = score;
        bestNote = note;
      }
    }
  }

  if (!bestNote) return null;
  const matched = FINGERINGS[bestNote];
  const matchedKeySet = new Set(matched.keys);

  // Collect all notes that share the exact same hole pattern (e.g. A4 低音6̣ and A5 中音6)
  const sameHoleNotes = CANONICAL_NOTES.filter((n) => {
    const nf = FINGERINGS[n];
    if (!nf) return false;
    return (
      nf.keys.length === matchedKeySet.size &&
      nf.keys.every((k) => matchedKeySet.has(k))
    );
  }).map((n) => ({
    note: n,
    jianpu: FINGERINGS[n].jianpu,
    breath: FINGERINGS[n].breath,
    freq: FINGERINGS[n].freq,
  }));

  return {
    note: bestNote,
    displayName: formatNoteDisplay(bestNote),
    jianpu: matched.jianpu,
    breath: matched.breath,
    desc: matched.desc,
    freq: matched.freq,
    keys: matched.keys,
    exact: isExact,
    sameHoleNotes,
  };
}
