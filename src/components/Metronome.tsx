import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Square, Volume2, Music, Disc } from 'lucide-react';
import { useSoundEngine, getDiziSoundingPitch } from '../hooks/useSoundEngine';
import { useBeatClock } from '../hooks/useBeatClock';
import { FINGERINGS, DIZI_KEYS } from '../data/scales';
import { DiziKey } from '../types/music';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface MetronomeProps {
  scaleNotes: string[];
  diziKey: DiziKey;
  onStepNote: (index: number) => void;
  isPlayingScale: boolean;
  setIsPlayingScale: (playing: boolean) => void;
}

export const Metronome: React.FC<MetronomeProps> = ({
  scaleNotes,
  diziKey,
  onStepNote,
  isPlayingScale,
  setIsPlayingScale,
}) => {
  const [bpm, setBpm] = useState<number>(76);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<number>(4);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [playNoteAudio, setPlayNoteAudio] = useState<boolean>(true);

  const { getContext, playClick, playDiziNote } = useSoundEngine();

  const noteStepRef = useRef<number>(0);
  const scaleNotesRef = useRef(scaleNotes);
  const diziKeyRef = useRef(diziKey);
  const isPlayingScaleRef = useRef(isPlayingScale);
  const playNoteAudioRef = useRef(playNoteAudio);
  const onStepNoteRef = useRef(onStepNote);

  useEffect(() => {
    scaleNotesRef.current = scaleNotes;
    noteStepRef.current = 0;
  }, [scaleNotes]);

  useEffect(() => {
    diziKeyRef.current = diziKey;
  }, [diziKey]);

  useEffect(() => {
    isPlayingScaleRef.current = isPlayingScale;
  }, [isPlayingScale]);

  useEffect(() => {
    playNoteAudioRef.current = playNoteAudio;
  }, [playNoteAudio]);

  useEffect(() => {
    onStepNoteRef.current = onStepNote;
  }, [onStepNote]);

  const handleAudioBeat = useCallback(
    (_beatIndex: number, isDownbeat: boolean, time: number) => {
      playClick(isDownbeat, time);

      if (isPlayingScaleRef.current && scaleNotesRef.current.length > 0) {
        const noteIdx = noteStepRef.current % scaleNotesRef.current.length;
        const noteName = scaleNotesRef.current[noteIdx];
        const fingering = FINGERINGS[noteName];
        if (fingering && playNoteAudioRef.current) {
          const duration = Math.min(0.85, (60 / bpm) * 0.88);
          const soundingFreq = getDiziSoundingPitch(
            fingering.freq,
            diziKeyRef.current
          );
          playDiziNote(soundingFreq, duration, time);
        }
      }
    },
    [playClick, playDiziNote, bpm]
  );

  const handleVisualBeat = useCallback((beatIndex: number) => {
    setActiveBeat(beatIndex);
    if (isPlayingScaleRef.current && scaleNotesRef.current.length > 0) {
      const idx = noteStepRef.current % scaleNotesRef.current.length;
      onStepNoteRef.current(idx);
      noteStepRef.current = (noteStepRef.current + 1) % scaleNotesRef.current.length;
    }
  }, []);

  useBeatClock({
    isPlaying: isRunning,
    bpm,
    beatsPerMeasure,
    getAudioContext: getContext,
    onAudioBeat: handleAudioBeat,
    onVisualBeat: handleVisualBeat,
  });

  const togglePlay = () => {
    if (isRunning) {
      setIsRunning(false);
      setActiveBeat(-1);
    } else {
      noteStepRef.current = 0;
      setIsRunning(true);
    }
  };

  const adjustBpm = (delta: number) => {
    setBpm((prev) => Math.min(208, Math.max(40, prev + delta)));
  };

  const keyMeta = DIZI_KEYS[diziKey];

  return (
    <Card className="p-5 flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Disc
            className={`w-4 h-4 text-primary ${isRunning ? 'animate-spin' : ''}`}
          />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            竹笛节拍器 & 自动跟吹
          </h3>
        </div>

        <ToggleGroup
          type="single"
          value={String(beatsPerMeasure)}
          onValueChange={(v) => v && setBeatsPerMeasure(Number(v))}
          variant="pill"
          size="sm"
          className="bg-muted p-0.5 rounded-lg border border-border"
        >
          <ToggleGroupItem value="4" className="h-6 px-2.5 text-xs font-mono">
            4/4 拍
          </ToggleGroupItem>
          <ToggleGroupItem value="3" className="h-6 px-2.5 text-xs font-mono">
            3/4 拍
          </ToggleGroupItem>
          <ToggleGroupItem value="2" className="h-6 px-2.5 text-xs font-mono">
            2/4 拍
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* BPM Display & Controls */}
      <div className="flex items-center justify-between gap-4 my-1">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold font-mono tracking-tight text-foreground">
              {bpm}
            </span>
            <span className="text-xs font-mono text-muted-foreground uppercase">
              BPM
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {bpm < 65
              ? '慢练长音 · 听辨笛膜共鸣与音准'
              : bpm < 108
                ? '中速行腔 · 练习指孔起落弹性'
                : '快速吐音/历音 · 锻炼指舌同步'}
          </span>
        </div>

        {/* Beat Visual Indicators */}
        <div className="flex items-center gap-2">
          {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
            const isActive = isRunning && activeBeat === idx;
            const isFirst = idx === 0;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-100 ${
                  isActive
                    ? isFirst
                      ? 'bg-primary scale-125 shadow-[0_0_12px_rgba(16,185,129,0.85)]'
                      : 'bg-emerald-400 scale-110 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : 'bg-muted border border-border'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* BPM Slider */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustBpm(-5)}
          className="h-7 px-2 font-mono text-xs"
        >
          -5
        </Button>
        <Slider
          min={40}
          max={208}
          step={1}
          value={[bpm]}
          onValueChange={(vals) => setBpm(vals[0])}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustBpm(5)}
          className="h-7 px-2 font-mono text-xs"
        >
          +5
        </Button>
      </div>

      {/* Auto-Step Scale & Dizi Sound Switches */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="auto-step-scale"
            className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <Music className="w-3.5 h-3.5 text-primary" />
            随节拍自动推进音阶指法
          </Label>
          <Switch
            id="auto-step-scale"
            checked={isPlayingScale}
            onCheckedChange={setIsPlayingScale}
          />
        </div>

        {isPlayingScale && (
          <div className="flex items-center justify-between">
            <Label
              htmlFor="play-dizi-audio"
              className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-primary" />
              同步播放竹笛示范音 ({keyMeta.shortLabel})
            </Label>
            <Switch
              id="play-dizi-audio"
              checked={playNoteAudio}
              onCheckedChange={setPlayNoteAudio}
            />
          </div>
        )}
      </div>

      {/* Start / Stop Button */}
      <div className="flex items-center gap-2">
        <Button
          onClick={togglePlay}
          variant={isRunning ? 'destructive' : 'default'}
          className="w-full font-semibold gap-2 cursor-pointer"
        >
          {isRunning ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              停止节拍跟练
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              开始节拍器跟练
            </>
          )}
        </Button>
        <Badge
          variant="outline"
          className="h-9 px-2.5 text-[11px] font-mono shrink-0 hidden sm:flex items-center"
          title={keyMeta.fullLabel}
        >
          {keyMeta.shortLabel}
        </Badge>
      </div>
    </Card>
  );
};
