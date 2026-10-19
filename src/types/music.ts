export type BreathLevel = 'slow' | 'moderate' | 'fast' | 'overblow';

export interface NoteFingering {
  /** Chinese description of hole combination & breath technique */
  desc: string;
  /** Jianpu (numbered musical notation) in standard 筒音作5 reference */
  jianpu: string;
  /** Breath pressure / speed level: 缓吹 (slow), 平吹 (moderate), 急吹 (fast), 超吹 (overblow) */
  breath: BreathLevel;
  /**
   * Active finger holes:
   * - 'hole_1' .. 'hole_6' = fully closed hole (●)
   * - 'hole_1_half' .. 'hole_6_half' = half-closed hole (◐)
   * Note: In standard Chinese Dizi convention, Hole 1 is at the distal (bottom/right) end
   * (right-hand ring finger) and Hole 6 is at the proximal (top/left) end (left-hand index finger).
   */
  keys: string[];
  /** Reference frequency in Hz (written pitch where 筒音 = G4, 第三孔 = C5) */
  freq: number;
}

export type ScaleCategory = 'tongyin' | 'special' | 'pentatonic' | 'major' | 'minor';

export interface ScaleDefinition {
  id: string;
  name: string;
  keySig: string;
  /** Traditional Dizi fingering system label, e.g., "筒音作 5" */
  tongyinSystem: string;
  accidentals: string;
  tip: string;
  notes: string[];
  abc: string;
  category?: ScaleCategory;
}

export type DiziKey = 'qudi_c' | 'qudi_d' | 'qudi_e' | 'bangdi_f' | 'bangdi_g';

export interface DiziKeyMeta {
  id: DiziKey;
  shortLabel: string;
  fullLabel: string;
  styleTag: string;
  thirdHoleNote: string;
  tongyinNote: string;
  semitoneOffset: number;
  timbreDesc: string;
}
