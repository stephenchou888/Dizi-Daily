import { useState, useMemo } from 'react';
import { getTodayScale } from './lib/dailyScale';
import { FINGERINGS, SCALES, DIZI_KEYS } from './data/scales';
import { BreathLevel, DiziKey } from './types/music';
import { DiziDiagram, SoundMode } from './components/DiziDiagram';
import { SheetMusicView } from './components/SheetMusicView';
import { Metronome } from './components/Metronome';
import { ScalePicker } from './components/ScalePicker';
import { StreakCard } from './components/StreakCard';
import { PracticeTipsCard } from './components/PracticeTipsCard';
import { useSoundEngine, getDiziSoundingPitch } from './hooks/useSoundEngine';
import { useTheme } from './hooks/useTheme';
import { matchFingering } from './lib/fingeringLookup';
import {
  Music2,
  Calendar,
  Volume2,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  Wind,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function App() {
  const { scale: todayScale, dayOfYear, dateStr } = useMemo(
    () => getTodayScale(),
    []
  );
  const [selectedScaleId, setSelectedScaleId] = useState<string>(todayScale.id);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number>(0);
  const [diziKey, setDiziKey] = useState<DiziKey>('qudi_d');
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(true);
  const [exploreMode, setExploreMode] = useState<boolean>(false);
  const [customKeys, setCustomKeys] = useState<Set<string>>(new Set());
  const [exploreBreath, setExploreBreath] = useState<BreathLevel | 'all'>('all');
  const [soundMode, setSoundMode] = useState<SoundMode>('both');

  const { playDiziNote, playHoleTap } = useSoundEngine();
  const { theme, toggleTheme } = useTheme();

  const scale = useMemo(
    () => SCALES.find((s) => s.id === selectedScaleId) || todayScale,
    [selectedScaleId, todayScale]
  );

  const isTodayScale = scale.id === todayScale.id;
  const currentNote = scale.notes[activeNoteIndex] || scale.notes[0];
  const currentFingering = FINGERINGS[currentNote] || {
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
    setSelectedScaleId(newScaleId);
    setActiveNoteIndex(0);
    setExploreMode(false);
  };

  const handleSelectNote = (index: number, playAudio = true) => {
    setExploreMode(false);
    setActiveNoteIndex(index);
    if (playAudio) {
      const noteName = scale.notes[index];
      const f = FINGERINGS[noteName];
      if (f) {
        const soundingFreq = getDiziSoundingPitch(f.freq, diziKey);
        playDiziNote(soundingFreq, 0.65);
      }
    }
  };

  const handleToggleExploreMode = () => {
    setExploreMode((prev) => {
      const next = !prev;
      if (next) {
        setCustomKeys(new Set(currentFingering.keys));
        setExploreBreath(currentFingering.breath);
      }
      return next;
    });
  };

  /**
   * Cycle a hole through:
   * - Normal click: closed (●) -> half (◐) -> open (○) -> closed (●)
   * - Right click (`forceHalf=true`): directly toggle half-hole (◐)
   */
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
    } else {
      if (hasFull) {
        next.add(halfKey);
        isClosing = false;
      } else if (hasHalf) {
        // becomes open
        isClosing = false;
      } else {
        next.add(fullKey);
        isClosing = true;
      }
    }

    if (soundMode === 'both' || soundMode === 'tap') {
      playHoleTap(isClosing);
    }

    if (soundMode === 'both' || soundMode === 'dizi') {
      const matched = matchFingering(next, exploreBreath);
      if (matched) {
        const soundingFreq = getDiziSoundingPitch(matched.freq, diziKey);
        playDiziNote(soundingFreq, 0.55);
      }
    }

    setCustomKeys(next);
  };

  const handleChangeExploreBreath = (breath: BreathLevel | 'all') => {
    setExploreBreath(breath);
    const matched = matchFingering(customKeys, breath);
    if (matched && (soundMode === 'both' || soundMode === 'dizi')) {
      const soundingFreq = getDiziSoundingPitch(matched.freq, diziKey);
      playDiziNote(soundingFreq, 0.6);
    }
  };

  const handleSelectSameHoleNote = (note: string, breath: BreathLevel) => {
    setExploreBreath(breath);
    const f = FINGERINGS[note];
    if (f) {
      setCustomKeys(new Set(f.keys));
      if (soundMode === 'both' || soundMode === 'dizi') {
        const soundingFreq = getDiziSoundingPitch(f.freq, diziKey);
        playDiziNote(soundingFreq, 0.65);
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
    const nextIdx =
      (activeNoteIndex - 1 + scale.notes.length) % scale.notes.length;
    handleSelectNote(nextIdx, true);
  };

  const handleNextNote = () => {
    const nextIdx = (activeNoteIndex + 1) % scale.notes.length;
    handleSelectNote(nextIdx, true);
  };

  const displayedNote = exploreMode
    ? exploreMatch?.note || currentNote
    : currentNote;
  const displayedJianpu = exploreMode
    ? exploreMatch?.jianpu || currentFingering.jianpu
    : currentFingering.jianpu;
  const displayedBreath = exploreMode
    ? exploreMatch?.breath || currentFingering.breath
    : currentFingering.breath;
  const displayedKeys = exploreMode
    ? Array.from(customKeys)
    : currentFingering.keys;
  const displayedDesc = exploreMode
    ? exploreMatch
      ? `${exploreMatch.exact ? '精准匹配' : '近似指法'}：${exploreMatch.desc}`
      : '自定义按孔组合'
    : currentFingering.desc;

  const currentDiziMeta = DIZI_KEYS[diziKey];
  const soundingFreq = getDiziSoundingPitch(
    exploreMode && exploreMatch ? exploreMatch.freq : currentFingering.freq,
    diziKey
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30 transition-colors duration-300">
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-sm">
              <Wind className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  中国竹笛每日练习与指法追踪
                </h1>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-primary/30 text-primary hidden sm:inline-flex"
                >
                  Dizi Daily
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" />
                  {dateStr}
                </span>
                <span>·</span>
                <span className="font-mono text-[11px]">
                  年度第 {dayOfYear} 天
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Flute Key Switcher, Scale Picker, Theme Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Flute Key Switcher (曲笛 D/C · 梆笛 F/G) */}
            <ToggleGroup
              type="single"
              value={diziKey}
              onValueChange={(v) => v && setDiziKey(v as DiziKey)}
              variant="pill"
              size="sm"
              className="bg-muted p-0.5 rounded-lg border border-border"
            >
              <ToggleGroupItem
                value="qudi_d"
                className="h-7 px-2.5 text-xs font-medium"
                title="曲笛 D调（第三孔作1=D5 · 初学与江南丝竹首选）"
              >
                D调曲笛
              </ToggleGroupItem>
              <ToggleGroupItem
                value="qudi_c"
                className="h-7 px-2.5 text-xs font-medium"
                title="大曲笛 C调（第三孔作1=C5 · 浑厚悠远）"
              >
                C调曲笛
              </ToggleGroupItem>
              <ToggleGroupItem
                value="bangdi_f"
                className="h-7 px-2.5 text-xs font-medium"
                title="中音梆笛 F调（第三孔作1=F5 · 南北兼修）"
              >
                F调梆笛
              </ToggleGroupItem>
              <ToggleGroupItem
                value="bangdi_g"
                className="h-7 px-2.5 text-xs font-medium"
                title="北派梆笛 G调（第三孔作1=G5 · 高亢清亮）"
              >
                G调梆笛
              </ToggleGroupItem>
            </ToggleGroup>

            <ScalePicker
              selectedScaleId={selectedScaleId}
              todayScaleId={todayScale.id}
              onSelectScale={handleSelectScale}
            />

            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? '切换为宣纸浅色模式' : '切换为竹韵深色模式'}
              className="h-9 w-9 shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Scale Card, Sheet Music, Note Strip, Streak & Metronome, Tips */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Card className="p-5 flex flex-col gap-4">
              {/* Scale Title & Metadata Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-[11px] bg-primary/10 text-primary border-primary/30 font-semibold"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {isTodayScale ? '今日推荐指法练习' : '自选指法与调式专项'}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] font-mono">
                      {scale.tongyinSystem}
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">
                      {scale.accidentals}
                    </Badge>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
                    {scale.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    当前选用笛子：
                    <strong className="text-foreground font-medium">
                      {currentDiziMeta.fullLabel}
                    </strong>{' '}
                    · 筒音实音 {currentDiziMeta.tongyinNote} · {currentDiziMeta.timbreDesc}
                  </p>
                </div>

                {/* Current Note Quick Audition Card */}
                <div className="flex items-center gap-2 bg-muted/60 px-3 py-2 rounded-xl border border-border">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      当前音高 ({currentDiziMeta.shortLabel})
                    </div>
                    <div className="text-sm font-bold font-mono text-primary">
                      {displayedNote.replace('#', '♯').replace('b', '♭')} ·{' '}
                      {Math.round(soundingFreq)} Hz
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => playDiziNote(soundingFreq, 0.75)}
                    className="h-8 px-2.5 gap-1 text-xs font-semibold cursor-pointer"
                    title="试听当前竹笛音高（含笛膜泛音与腹震音）"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    吹奏试听
                  </Button>
                </div>
              </div>

              {/* Interactive Five-Line Staff + Jianpu Lyrics */}
              <SheetMusicView
                abc={scale.abc}
                notes={scale.notes}
                activeNoteIndex={activeNoteIndex}
                onSelectNote={(idx) => handleSelectNote(idx, true)}
              />

              {/* Stepper Note Pills Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5 text-primary" />
                    练习音列序列（共 {scale.notes.length} 音 · 点击任一音符切换指法并试听）
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevNote}
                      className="h-7 px-2 text-xs gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      上一音
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextNote}
                      className="h-7 px-2 text-xs gap-1 cursor-pointer"
                    >
                      下一音
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {scale.notes.map((note, idx) => {
                    const isActive = !exploreMode && idx === activeNoteIndex;
                    const nf = FINGERINGS[note];
                    const shortJianpu = nf ? nf.jianpu.split(' ')[0] : '';
                    const hasHalf = nf?.keys.some((k) => k.endsWith('_half'));
                    return (
                      <button
                        key={`${note}-${idx}`}
                        type="button"
                        onClick={() => handleSelectNote(idx, true)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all flex flex-col items-center min-w-[48px] cursor-pointer ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm scale-105'
                            : hasHalf
                              ? 'bg-amber-500/10 text-foreground border-amber-500/30 hover:border-primary/60'
                              : 'bg-muted/50 text-foreground border-border hover:border-primary/50 hover:bg-muted'
                        }`}
                        title={`${note} · ${nf?.jianpu || ''} · ${nf?.desc || ''}`}
                      >
                        <span className="text-[11px] leading-tight font-bold">
                          {shortJianpu}
                        </span>
                        <span className="text-[10px] opacity-80 leading-tight">
                          {note.replace('#', '♯').replace('b', '♭')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Metronome & Daily Check-in Streak Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Metronome
                scaleNotes={scale.notes}
                diziKey={diziKey}
                onStepNote={(idx) => setActiveNoteIndex(idx)}
                isPlayingScale={isPlayingScale}
                setIsPlayingScale={setIsPlayingScale}
              />
              <StreakCard />
            </div>

            {/* Per-Note Wind, Embouchure & Fingering Coaching Card */}
            <PracticeTipsCard
              activeNote={displayedNote}
              activeJianpu={displayedJianpu}
              scaleTip={scale.tip}
              tongyinSystem={scale.tongyinSystem}
            />
          </div>

          {/* Right Column (5 cols): Interactive Chinese Bamboo Flute Diagram */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground mt-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            中国竹笛每日指法与气功练习 · 支持曲笛 (C/D调) 与梆笛 (F/G调) · 筒音转调与半孔/叉口可视化
          </span>
          <span className="font-mono text-[11px]">
            Built with React 19 + Tailwind CSS v4 + abcjs + Web Audio API
          </span>
        </div>
      </footer>
    </div>
  );
}
