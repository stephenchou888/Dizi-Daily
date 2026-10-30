import { useCallback, useSyncExternalStore } from 'react';
import { DiziKey } from '../types/music';
import { DIZI_KEYS } from '../data/scales';

let sharedAudioContext: AudioContext | null = null;
let masterOutput: GainNode | null = null;
let muted = false;
const muteListeners = new Set<() => void>();

function subscribeMuted(listener: () => void) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

export function useAudioMuted(): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(subscribeMuted, () => muted, () => false);
  return [value, setAudioMuted];
}

function setAudioMuted(next: boolean) {
  muted = next;
  if (sharedAudioContext && masterOutput) {
    masterOutput.gain.setTargetAtTime(
      next ? 0 : 1,
      sharedAudioContext.currentTime,
      0.01
    );
  }
  muteListeners.forEach((listener) => listener());
}

function getSharedContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioContextClass();
    masterOutput = sharedAudioContext.createGain();
    masterOutput.gain.value = muted ? 0 : 1;
    masterOutput.connect(sharedAudioContext.destination);
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

function getOutput(ctx: AudioContext): AudioNode {
  return masterOutput ?? ctx.destination;
}

/**
 * Convert the written reference pitch (where 第三孔 C5 = 523.25 Hz, 筒音 G4 = 392.00 Hz)
 * into the actual sounding frequency of the selected Chinese Bamboo Flute (曲笛 / 梆笛).
 * - C调曲笛 (qudi_c): 0 semitones (1 = C5)
 * - D调曲笛 (qudi_d): +2 semitones (1 = D5)
 * - F调梆笛 (bangdi_f): +5 semitones (1 = F5)
 * - G调梆笛 (bangdi_g): +7 semitones (1 = G5)
 */
export function getDiziSoundingPitch(writtenFreq: number, diziKey: DiziKey): number {
  const offset = DIZI_KEYS[diziKey]?.semitoneOffset ?? 2;
  return writtenFreq * Math.pow(2, offset / 12);
}

export function useSoundEngine() {
  const getContext = useCallback(() => {
    return getSharedContext();
  }, []);

  /**
   * Synthesize an authentic Chinese Bamboo Flute (中国竹笛) tone:
   * 1. Bamboo tube fundamental + 2nd harmonic (sine + triangle)
   * 2. Dimo (笛膜) reed-membrane acoustic buzz (sawtooth through high-Q bandpass at ~3.5x freq)
   * 3. Breath chiff transient & gentle bamboo air stream
   * 4. Expressive diaphragm vibrato (腹震音 ~5.5 Hz)
   */
  const playDiziNote = useCallback(
    (freq: number, duration = 0.65, startTime?: number) => {
      try {
        const ctx = getContext();
        const now = startTime ?? ctx.currentTime;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.0001, now);
        masterGain.gain.linearRampToValueAtTime(0.28, now + 0.032);
        masterGain.gain.exponentialRampToValueAtTime(0.21, now + 0.14);
        masterGain.gain.setValueAtTime(0.21, now + Math.max(0.15, duration - 0.09));
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        masterGain.connect(getOutput(ctx));

        // 1. Primary bamboo air-column oscillator (Triangle + Sine blend)
        const fundOsc = ctx.createOscillator();
        fundOsc.type = 'triangle';
        fundOsc.frequency.setValueAtTime(freq, now);

        const bodyFilter = ctx.createBiquadFilter();
        bodyFilter.type = 'lowpass';
        bodyFilter.frequency.setValueAtTime(Math.min(freq * 3.2, 6500), now);
        bodyFilter.Q.setValueAtTime(1.4, now);

        // 2. Dimo (笛膜) harmonic buzz oscillator
        const dimoOsc = ctx.createOscillator();
        dimoOsc.type = 'sawtooth';
        dimoOsc.frequency.setValueAtTime(freq, now);

        const dimoFilter = ctx.createBiquadFilter();
        dimoFilter.type = 'bandpass';
        // Dimo resonance emphasizes bright upper harmonics (3x - 4.5x fundamental)
        dimoFilter.frequency.setValueAtTime(Math.min(freq * 3.8, 7800), now);
        dimoFilter.Q.setValueAtTime(3.2, now);

        const dimoGain = ctx.createGain();
        // Higher notes excite the dimo slightly more brightly
        const dimoLevel = freq > 900 ? 0.14 : 0.11;
        dimoGain.gain.setValueAtTime(dimoLevel, now);

        // 3. Natural diaphragm vibrato (腹震音 ~5.5 Hz)
        const vibOsc = ctx.createOscillator();
        const vibGain = ctx.createGain();
        vibOsc.frequency.setValueAtTime(5.5, now);
        vibGain.gain.setValueAtTime(0, now);
        if (duration > 0.25) {
          vibGain.gain.linearRampToValueAtTime(freq * 0.0075, now + 0.22);
        }
        vibOsc.connect(vibGain);
        vibGain.connect(fundOsc.frequency);
        vibGain.connect(dimoOsc.frequency);

        // 4. Blow-hole breath chiff transient (吹孔气声)
        const noiseLen = Math.max(1, Math.floor(ctx.sampleRate * Math.min(duration, 0.18)));
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;

        const chiffFilter = ctx.createBiquadFilter();
        chiffFilter.type = 'bandpass';
        chiffFilter.frequency.setValueAtTime(Math.min(freq * 2.2, 4800), now);
        chiffFilter.Q.setValueAtTime(2.5, now);

        const chiffGain = ctx.createGain();
        chiffGain.gain.setValueAtTime(0.09, now);
        chiffGain.gain.exponentialRampToValueAtTime(0.008, now + 0.07);
        chiffGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(duration, 0.18));

        // Connect graph
        fundOsc.connect(bodyFilter);
        bodyFilter.connect(masterGain);

        dimoOsc.connect(dimoFilter);
        dimoFilter.connect(dimoGain);
        dimoGain.connect(masterGain);

        noiseSrc.connect(chiffFilter);
        chiffFilter.connect(chiffGain);
        chiffGain.connect(masterGain);

        fundOsc.start(now);
        dimoOsc.start(now);
        vibOsc.start(now);
        noiseSrc.start(now);

        fundOsc.stop(now + duration);
        dimoOsc.stop(now + duration);
        vibOsc.stop(now + duration);
      } catch (e) {
        console.warn('Audio playback failed:', e);
      }
    },
    [getContext]
  );

  /**
   * Synthesize the percussive hollow bamboo finger-hole slap ("按孔打音/啪声")
   */
  const playHoleTap = useCallback(
    (isClosing = true, startTime?: number) => {
      try {
        const ctx = getContext();
        const now = startTime ?? ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const baseFreq = isClosing ? 320 : 420;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.038);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);

        osc.connect(gain);
        gain.connect(getOutput(ctx));

        osc.start(now);
        osc.stop(now + 0.045);
      } catch (e) {
        console.warn('Hole tap sound failed:', e);
      }
    },
    [getContext]
  );

  /**
   * Synthesize a Chinese woodblock (梆子 / 木鱼) metronome click
   */
  const playClick = useCallback(
    (isDownbeat: boolean, startTime?: number) => {
      try {
        const ctx = getContext();
        const now = startTime ?? ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const pitch = isDownbeat ? 1320 : 880;
        osc.frequency.setValueAtTime(pitch, now);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.65, now + 0.04);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(isDownbeat ? 0.35 : 0.2, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

        osc.connect(gain);
        gain.connect(getOutput(ctx));

        osc.start(now);
        osc.stop(now + 0.06);
      } catch (e) {
        console.warn('Metronome click failed:', e);
      }
    },
    [getContext]
  );

  return {
    getContext,
    playDiziNote,
    playHoleTap,
    playClick,
  };
}
