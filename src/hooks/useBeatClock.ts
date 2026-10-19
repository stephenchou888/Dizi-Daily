import { useEffect, useRef } from 'react';

interface BeatClockOptions {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure: number;
  getAudioContext: () => AudioContext;
  onAudioBeat: (beatIndex: number, isDownbeat: boolean, time: number) => void;
  onVisualBeat: (beatIndex: number, isDownbeat: boolean) => void;
}

export function useBeatClock({
  isPlaying,
  bpm,
  beatsPerMeasure,
  getAudioContext,
  onAudioBeat,
  onVisualBeat,
}: BeatClockOptions) {
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const rafIDRef = useRef<number | null>(null);
  const visualQueueRef = useRef<{ beat: number; isDownbeat: boolean; time: number }[]>([]);

  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const onAudioBeatRef = useRef(onAudioBeat);
  const onVisualBeatRef = useRef(onVisualBeat);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;
  }, [beatsPerMeasure]);

  useEffect(() => {
    onAudioBeatRef.current = onAudioBeat;
  }, [onAudioBeat]);

  useEffect(() => {
    onVisualBeatRef.current = onVisualBeat;
  }, [onVisualBeat]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
      if (rafIDRef.current) window.cancelAnimationFrame(rafIDRef.current);
      visualQueueRef.current = [];
      return;
    }

    const ctx = getAudioContext();
    currentBeatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    visualQueueRef.current = [];

    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // s

    const scheduler = () => {
      while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
        const beat = currentBeatRef.current;
        const isDownbeat = beat === 0;
        const time = nextNoteTimeRef.current;

        onAudioBeatRef.current(beat, isDownbeat, time);
        visualQueueRef.current.push({ beat, isDownbeat, time });

        const secondsPerBeat = 60.0 / bpmRef.current;
        nextNoteTimeRef.current += secondsPerBeat;
        currentBeatRef.current = (beat + 1) % beatsPerMeasureRef.current;
      }
      timerIDRef.current = window.setTimeout(scheduler, lookahead);
    };

    const updateVisuals = () => {
      const currentTime = ctx.currentTime;
      while (
        visualQueueRef.current.length > 0 &&
        visualQueueRef.current[0].time <= currentTime
      ) {
        const event = visualQueueRef.current.shift()!;
        onVisualBeatRef.current(event.beat, event.isDownbeat);
      }
      rafIDRef.current = window.requestAnimationFrame(updateVisuals);
    };

    scheduler();
    rafIDRef.current = window.requestAnimationFrame(updateVisuals);

    return () => {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
      if (rafIDRef.current) window.cancelAnimationFrame(rafIDRef.current);
    };
  }, [isPlaying, getAudioContext]);
}
