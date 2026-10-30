import { useEffect, useMemo, useRef, useState } from 'react';
import { getTodayScale } from './lib/dailyScale';
import { FINGERINGS, SCALES, DIZI_KEYS } from './data/scales';
import { BreathLevel, DiziKey, ScaleCategory } from './types/music';
import { DiziDiagram, SoundMode } from './components/DiziDiagram';
import { SheetMusicView } from './components/SheetMusicView';
import { Metronome } from './components/Metronome';
import { ScalePicker } from './components/ScalePicker';
import { StreakCard } from './components/StreakCard';
import { PracticeTipsCard } from './components/PracticeTipsCard';
import { useSoundEngine, useAudioMuted, getDiziSoundingPitch } from './hooks/useSoundEngine';
import { useTheme } from './hooks/useTheme';
import { matchFingering } from './lib/fingeringLookup';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Moon,
  Repeat,
  Repeat1,
  Square,
  Play,
  Sun,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const CATEGORY_LABEL: Record<ScaleCategory, string> = {
  tongyin: '筒音转调',
  special: '特色练习',
  pentatonic: '传统调式',
  major: '自然大调',
  minor: '自然小调',
};

const DIZI_KEY_OPTIONS: { value: DiziKey; label: string; title: string }[] = [
  { value: 'qudi_c', label: 'C 曲笛', title: '大曲笛 C 调（第三孔作 1=C5）' },
  { value: 'qudi_d', label: 'D 曲笛', title: '曲笛 D 调（第三孔作 1=D5）' },
  { value: 'qudi_e', label: 'E 笛', title: '中音笛 E 调（第三孔作 1=E5）' },
  { value: 'bangdi_f', label: 'F 梆笛', title: '中音梆笛 F 调（第三孔作 1=F5）' },
  { value: 'bangdi_g', label: 'G 梆笛', title: '北派梆笛 G 调（第三孔作 1=G5）' },
];

const prettyNote = (note: string) => note.replace('#', '♯').replace('b', '♭');

export default function App() {
  const { scale: todayScale, dayOfYear, dateStr } = useMemo(
    () => getTodayScale(),
    []
  );
  const [selectedScaleId, setSelectedScaleId] = useState(todayScale.id);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [diziKey, setDiziKey] = useState<DiziKey>('qudi_d');
  const [isPlayingScale, setIsPlayingScale] = useState(true);
  const [exploreMode, setExploreMode] = useState(false);
  const [customKeys, setCustomKeys] = useState<Set<string>>(new Set());
  const [exploreBreath, setExploreBreath] = useState<BreathLevel | 'all'>('all');
  const [soundMode, setSoundMode] = useState<SoundMode>('both');

  const { playDiziNote, playHoleTap } = useSoundEngine();
  const { theme, toggleTheme } = useTheme();
  const [isMuted, setIsMuted] = useAudioMuted();

  const scale = useMemo(
    () => SCALES.find((item) => item.id === selectedScaleId) ?? todayScale,
    [selectedScaleId, todayScale]
  );
  const isTodayScale = scale.id === todayScale.id;
  const currentNote = scale.notes[activeNoteIndex] ?? scale.notes[0];
  const currentFingering = FINGERINGS[currentNote] ?? {
    desc: '标准指法',
    jianpu: '1',
    breath: 'moderate' as BreathLevel,
    keys: [],
    freq: 523.25,
  };
  const exploreMatch = useMemo(
    () => (exploreMode ? matchFingering(customKeys, exploreBreath) : null),
    [exploreMode, customKeys, exploreBreath]
  );

  const handleSelectScale = (newScaleId: string) => {
    setIsAuditionPlaying(false);
    setSelectedScaleId(newScaleId);
    setActiveNoteIndex(0);
    setExploreMode(false);
  };

  const handleSelectNote = (index: number, playAudio = true) => {
    if (index < 0 || index >= scale.notes.length) return;
    setExploreMode(false);
    setActiveNoteIndex(index);
    if (playAudio) {
      const fingering = FINGERINGS[scale.notes[index]];
      if (fingering) {
        playDiziNote(getDiziSoundingPitch(fingering.freq, diziKey), 0.65);
      }
    }
  };

  const handleToggleExploreMode = () => {
    setExploreMode((previous) => {
      const next = !previous;
      if (next) {
        setCustomKeys(new Set(currentFingering.keys));
        setExploreBreath(currentFingering.breath);
      }
      return next;
    });
  };

  const handleToggleHole = (holeNum: number, forceHalf = false) => {
    const fullKey = `hole_${holeNum}`;
    const halfKey = `hole_${holeNum}_half`;
    const hasFull = customKeys.has(fullKey);
    const hasHalf = customKeys.has(halfKey);
    const next = new Set(customKeys);
    next.delete(fullKey);
    next.delete(halfKey);

    let isClosing = false;
    if (forceHalf) {
      if (!hasHalf) {
        next.add(halfKey);
        isClosing = true;
      }
    } else if (hasFull) {
      next.add(halfKey);
    } else if (!hasHalf) {
      next.add(fullKey);
      isClosing = true;
    }

    if (soundMode === 'both' || soundMode === 'tap') {
      playHoleTap(isClosing);
    }
    if (soundMode === 'both' || soundMode === 'dizi') {
      const matched = matchFingering(next, exploreBreath);
      if (matched) {
        playDiziNote(getDiziSoundingPitch(matched.freq, diziKey), 0.55);
      }
    }
    setCustomKeys(next);
  };

  const handleChangeExploreBreath = (breath: BreathLevel | 'all') => {
    setExploreBreath(breath);
    const matched = matchFingering(customKeys, breath);
    if (matched && (soundMode === 'both' || soundMode === 'dizi')) {
      playDiziNote(getDiziSoundingPitch(matched.freq, diziKey), 0.6);
    }
  };

  const handleSelectSameHoleNote = (note: string, breath: BreathLevel) => {
    setExploreBreath(breath);
    const fingering = FINGERINGS[note];
    if (fingering) {
      setCustomKeys(new Set(fingering.keys));
      if (soundMode === 'both' || soundMode === 'dizi') {
        playDiziNote(getDiziSoundingPitch(fingering.freq, diziKey), 0.65);
      }
    }
  };

  const handleResetCustomKeys = () => {
    setCustomKeys(new Set());
    if (soundMode === 'both' || soundMode === 'tap') {
      playHoleTap(false);
    }
  };

  const handlePrevNote = () => {
    handleSelectNote((activeNoteIndex - 1 + scale.notes.length) % scale.notes.length);
  };

  const handleNextNote = () => {
    handleSelectNote((activeNoteIndex + 1) % scale.notes.length);
  };

  const displayedNote = exploreMode ? exploreMatch?.note ?? currentNote : currentNote;
  const displayedJianpu = exploreMode
    ? exploreMatch?.jianpu ?? currentFingering.jianpu
    : currentFingering.jianpu;
  const displayedBreath = exploreMode
    ? exploreMatch?.breath ?? currentFingering.breath
    : currentFingering.breath;
  const displayedKeys = exploreMode ? Array.from(customKeys) : currentFingering.keys;
  const displayedDesc = exploreMode
    ? exploreMatch
      ? `${exploreMatch.exact ? '精准匹配' : '近似指法'}：${exploreMatch.desc}`
      : '自定义按孔组合'
    : currentFingering.desc;
  const currentDiziMeta = DIZI_KEYS[diziKey];
  const [isAuditionPlaying, setIsAuditionPlaying] = useState(false);
  const [demoLoop, setDemoLoop] = useState(true);
  const [bpm, setBpm] = useState(80);
  const auditionStepRef = useRef({ activeNoteIndex, notes: scale.notes, diziKey, demoLoop });
  auditionStepRef.current = { activeNoteIndex, notes: scale.notes, diziKey, demoLoop };

  // 慢速指法演示：每拍前进一个音，BPM 与节拍器共用；单次模式到最后一个音后自动停止
  useEffect(() => {
    if (!isAuditionPlaying) return;

    const timer = window.setInterval(() => {
      const { activeNoteIndex: currentIndex, notes, diziKey: currentKey, demoLoop: loop } =
        auditionStepRef.current;
      if (notes.length === 0) return;
      if (!loop && currentIndex >= notes.length - 1) {
        setIsAuditionPlaying(false);
        return;
      }

      const nextIndex = (currentIndex + 1) % notes.length;
      const fingering = FINGERINGS[notes[nextIndex]];
      if (fingering) {
        playDiziNote(getDiziSoundingPitch(fingering.freq, currentKey), Math.min(0.85, (60 / bpm) * 0.88));
      }
      auditionStepRef.current.activeNoteIndex = nextIndex;
      setActiveNoteIndex(nextIndex);
    }, 60000 / bpm);

    return () => window.clearInterval(timer);
  }, [isAuditionPlaying, playDiziNote, bpm]);

  const handleAudition = () => {
    if (isAuditionPlaying) {
      setIsAuditionPlaying(false);
      return;
    }

    let startIndex = activeNoteIndex;
    if (!demoLoop && activeNoteIndex >= scale.notes.length - 1) {
      startIndex = 0;
      setActiveNoteIndex(0);
    }
    setExploreMode(false);
    // 避免与节拍器“自动推进音阶”同时推进造成跳音
    setIsPlayingScale(false);
    const fingering = FINGERINGS[scale.notes[startIndex]];
    if (fingering) playDiziNote(getDiziSoundingPitch(fingering.freq, diziKey), 0.65);
    setIsAuditionPlaying(true);
  };

  const soundingFreq = getDiziSoundingPitch(
    exploreMode && exploreMatch ? exploreMatch.freq : currentFingering.freq,
    diziKey
  );
  const progressPct = ((activeNoteIndex + 1) / scale.notes.length) * 100;

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground touch-manipulation lg:pb-0">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wind className="size-4" />
            </span>
            <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight">
              Dizi Daily
            </span>
            <Badge variant="outline" className="hidden text-muted-foreground sm:inline-flex">
              竹笛基本功
            </Badge>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <div className="-mx-1 min-w-0 overflow-x-auto px-1">
              <ToggleGroup
                type="single"
                variant="pill"
                size="sm"
                value={diziKey}
                onValueChange={(value) => value && setDiziKey(value as DiziKey)}
                aria-label="选择竹笛调性"
              >
                {DIZI_KEY_OPTIONS.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    title={option.title}
                    className="h-8 whitespace-nowrap px-2 text-[12px] font-medium sm:px-2.5"
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Toggle
                variant="outline"
                pressed={isMuted}
                onPressedChange={setIsMuted}
                aria-label={isMuted ? '取消静音' : '静音'}
                title={isMuted ? '取消静音' : '静音（试听、按孔音与节拍器）'}
                className="size-9 min-w-0 px-0 data-[state=on]:border-destructive/40 data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive"
              >
                {isMuted ? <VolumeX /> : <Volume2 />}
              </Toggle>
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
                title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
              >
                {theme === 'dark' ? <Sun /> : <Moon />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pt-4 sm:px-8 lg:gap-3 lg:pt-3">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2 lg:flex lg:flex-wrap lg:items-center lg:gap-x-3 lg:gap-y-1 lg:space-y-0">
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground lg:hidden">
              <Calendar className="size-3.5" />
              {dateStr} · 年度第 {dayOfYear} 天
            </div>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl lg:text-2xl">
              {scale.name}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={isTodayScale ? 'secondary' : 'outline'}>
                {isTodayScale ? '今日推荐' : '自选练习'}
              </Badge>
              {scale.category && (
                <Badge variant="outline">{CATEGORY_LABEL[scale.category]}</Badge>
              )}
              <Badge variant="outline" className="font-mono">
                {scale.tongyinSystem}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {scale.accidentals}
              </Badge>
              <span className="ml-1 hidden items-center gap-1.5 text-[13px] text-muted-foreground lg:inline-flex">
                <Calendar className="size-3.5" />
                {dateStr} · 年度第 {dayOfYear} 天
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto sm:shrink-0">
            <ScalePicker
              selectedScaleId={selectedScaleId}
              todayScaleId={todayScale.id}
              onSelectScale={handleSelectScale}
            />
          </div>
        </section>

        <Card className="top-14 z-20 gap-3 py-3 sm:py-5 lg:py-4">
          <CardContent className="flex flex-col gap-3 px-3 sm:gap-4 sm:px-6 lg:gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">五线谱视奏</h2>
                <p className="text-xs text-muted-foreground sm:text-[13px]">
                  点击谱上音符或音名切换指法 · 简谱与半孔提示同步显示
                </p>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                第 <span className="font-mono font-semibold text-foreground">{activeNoteIndex + 1} / {scale.notes.length}</span> 音
              </div>
            </div>

            <SheetMusicView
              abc={scale.abc}
              notes={scale.notes}
              activeNoteIndex={activeNoteIndex}
              onSelectNote={(index) => handleSelectNote(index)}
            />

            <div className="relative -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
              {scale.notes.map((note, index) => {
                const fingering = FINGERINGS[note];
                const active = !exploreMode && index === activeNoteIndex;
                const hasHalfHole = fingering?.keys.some((key) => key.endsWith('_half'));
                return (
                  <Button
                    key={`${note}-${index}`}
                    size="sm"
                    variant={active ? 'brand' : 'outline'}
                    aria-label={`跳转到 ${prettyNote(note)}`}
                    aria-current={active ? 'step' : undefined}
                    className={`min-w-12 shrink-0 font-mono ${hasHalfHole && !active ? 'border-brand/40 bg-brand/5' : ''}`}
                    onClick={() => handleSelectNote(index)}
                    title={`${note} · ${fingering?.jianpu ?? ''} · ${fingering?.desc ?? ''}`}
                  >
                    <span>{prettyNote(note)}</span>
                    {hasHalfHole && <span className="text-brand">◐</span>}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
          <Card className="gap-0 py-3 sm:py-6 lg:col-span-5 lg:col-start-1 lg:row-start-1">
            <CardContent className="space-y-3 px-4 sm:space-y-5 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground sm:text-[13px]">
                    当前音符<span className="lg:hidden"> · {activeNoteIndex + 1} / {scale.notes.length}</span>
                  </div>
                  <div className="mt-1 text-4xl leading-none font-semibold tracking-tighter sm:text-6xl">
                    {prettyNote(displayedNote)}
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground sm:text-[15px]">
                    {displayedDesc}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="outline" className="h-6 rounded-full px-2.5">
                    <span className="size-1.5 rounded-full bg-success" />
                    实际音高 {currentDiziMeta.shortLabel}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {Math.round(soundingFreq)} Hz · {currentDiziMeta.tongyinNote}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>音阶进度</span>
                  <span className="font-mono">{activeNoteIndex + 1} / {scale.notes.length}</span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="音阶练习进度"
                  aria-valuemin={0}
                  aria-valuemax={scale.notes.length}
                  aria-valuenow={activeNoteIndex + 1}
                >
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between max-sm:hidden">
                  <span className="text-[13px] font-medium">按孔组合</span>
                  <span className="text-xs text-muted-foreground">
                    {displayedKeys.length > 0 ? `${displayedKeys.length} 个音孔闭合` : '全开音孔'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {displayedKeys.length === 0 ? (
                    <Badge variant="outline" className="text-muted-foreground">全开音孔（不按任何音孔）</Badge>
                  ) : (
                    displayedKeys.map((key) => (
                      <Badge key={key} variant="secondary" className="h-[26px] rounded-md px-2.5 text-xs">
                        <span className="size-2 rounded-full bg-brand" />
                        {key.replace('hole_', '音孔 ').replace('_half', ' 半孔')}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="上一个音"
                  onClick={handlePrevNote}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant={isAuditionPlaying ? 'destructive' : 'default'}
                  className="h-11 flex-1"
                  onClick={handleAudition}
                  aria-label={isAuditionPlaying ? '停止演示' : '慢速指法演示'}
                >
                  {isAuditionPlaying ? <Square className="fill-current" /> : <Play className="fill-current" />}
                  {isAuditionPlaying ? '停止演示' : '慢速指法演示'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="下一个音"
                  onClick={handleNextNote}
                >
                  <ChevronRight />
                </Button>
                <Toggle
                  variant="outline"
                  className="size-11 p-0"
                  pressed={demoLoop}
                  onPressedChange={setDemoLoop}
                  aria-label={demoLoop ? '循环演示（点击改为单次）' : '单次演示（点击改为循环）'}
                  title={demoLoop ? '循环演示' : '单次演示：到最后一个音自动停止'}
                >
                  {demoLoop ? <Repeat /> : <Repeat1 />}
                </Toggle>
              </div>
              <p className="text-xs text-muted-foreground">
                演示速度：<span className="font-mono">{bpm} BPM</span>，每拍一个音{demoLoop ? '，循环播放' : '，播放一遍后停止'}。
              </p>
            </CardContent>
          </Card>

          <Card className="py-4 sm:py-5 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:py-4">
            <CardContent className="flex flex-col items-center justify-center px-3 sm:px-6">
              <DiziDiagram
                activeKeys={displayedKeys}
                activeNote={displayedNote}
                activeJianpu={displayedJianpu}
                activeBreath={displayedBreath}
                fingeringDesc={displayedDesc}
                exploreMode={exploreMode}
                onToggleExploreMode={handleToggleExploreMode}
                onToggleHole={handleToggleHole}
                onResetCustomKeys={handleResetCustomKeys}
                exploreBreath={exploreBreath}
                onChangeExploreBreath={handleChangeExploreBreath}
                exploreMatch={exploreMatch}
                onSelectSameHoleNote={handleSelectSameHoleNote}
                soundMode={soundMode}
                onChangeSoundMode={setSoundMode}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:col-span-5 lg:col-start-1 lg:row-start-2">
            <Metronome
              bpm={bpm}
              onBpmChange={setBpm}
              scaleNotes={scale.notes}
              diziKey={diziKey}
              onStepNote={(index) => setActiveNoteIndex(index)}
              isPlayingScale={isPlayingScale}
              setIsPlayingScale={setIsPlayingScale}
            />
            <StreakCard />
          </div>
        </div>

        <PracticeTipsCard
          activeNote={displayedNote}
          activeJianpu={displayedJianpu}
          scaleTip={scale.tip}
          tongyinSystem={scale.tongyinSystem}
        />

        <footer className="flex flex-wrap justify-between gap-2 border-t py-6 text-xs text-muted-foreground">
          <span>Dizi Daily · 曲笛与梆笛每日指法、气息与视奏练习</span>
          <span>坚持练习，笛韵自见</span>
        </footer>
      </main>

      <nav
        aria-label="练习控制"
        className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur lg:hidden"
      >
        <Button variant="outline" size="icon" className="size-11" aria-label="上一个音" onClick={handlePrevNote}>
          <ChevronLeft />
        </Button>
        <Button variant={isAuditionPlaying ? 'destructive' : 'default'} className="h-11 flex-1 font-semibold" onClick={handleAudition}>
          {isAuditionPlaying ? <Square className="fill-current" /> : <Play className="fill-current" />}
          {isAuditionPlaying ? '停止演示' : '慢速指法演示'}
        </Button>
        <Button variant="outline" size="icon" className="size-11" aria-label="下一个音" onClick={handleNextNote}>
          <ChevronRight />
        </Button>
        <Toggle
          variant="outline"
          className="size-11 p-0"
          pressed={demoLoop}
          onPressedChange={setDemoLoop}
          aria-label={demoLoop ? '循环演示（点击改为单次）' : '单次演示（点击改为循环）'}
        >
          {demoLoop ? <Repeat /> : <Repeat1 />}
        </Toggle>
      </nav>
    </div>
  );
}
