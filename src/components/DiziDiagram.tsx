import React, { useState } from 'react';
import { BreathLevel } from '../types/music';
import { FingeringMatch } from '../lib/fingeringLookup';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  RotateCw,
  Volume2,
  Wind,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type SoundMode = 'both' | 'dizi' | 'tap';

interface DiziDiagramProps {
  activeKeys: string[];
  activeNote: string | null;
  activeJianpu?: string;
  activeBreath?: BreathLevel;
  fingeringDesc: string;
  exploreMode?: boolean;
  onToggleExploreMode?: () => void;
  onToggleHole?: (holeNumber: number, forceHalf?: boolean) => void;
  onResetCustomKeys?: () => void;
  exploreBreath?: BreathLevel | 'all';
  onChangeExploreBreath?: (breath: BreathLevel | 'all') => void;
  exploreMatch?: FingeringMatch | null;
  onSelectSameHoleNote?: (note: string, breath: BreathLevel) => void;
  soundMode?: SoundMode;
  onChangeSoundMode?: (mode: SoundMode) => void;
}

type ViewMode = 'schematic' | 'realistic' | 'both';

interface HoleMeta {
  num: number;
  label: string;
  hand: 'left' | 'right';
  finger: string;
  tongyin5Note: string;
  schemY: number;
  realY: number;
}

const HOLES: HoleMeta[] = [
  {
    num: 6,
    label: '第六孔',
    hand: 'left',
    finger: '左手食指',
    tongyin5Note: '开孔发 #4',
    schemY: 205,
    realY: 230,
  },
  {
    num: 5,
    label: '第五孔',
    hand: 'left',
    finger: '左手中指',
    tongyin5Note: '开孔发 3',
    schemY: 255,
    realY: 282,
  },
  {
    num: 4,
    label: '第四孔',
    hand: 'left',
    finger: '左手无名指',
    tongyin5Note: '开孔发 2',
    schemY: 305,
    realY: 334,
  },
  {
    num: 3,
    label: '第三孔',
    hand: 'right',
    finger: '右手食指',
    tongyin5Note: '开孔发 1 (定调音)',
    schemY: 375,
    realY: 404,
  },
  {
    num: 2,
    label: '第二孔',
    hand: 'right',
    finger: '右手中指',
    tongyin5Note: '开孔发 7̣ / 7',
    schemY: 425,
    realY: 456,
  },
  {
    num: 1,
    label: '第一孔',
    hand: 'right',
    finger: '右手无名指',
    tongyin5Note: '开孔发 6̣ / 6',
    schemY: 475,
    realY: 508,
  },
];

const BREATH_META: Record<
  BreathLevel,
  { label: string; short: string; badgeClass: string; desc: string }
> = {
  slow: {
    label: '缓吹 · 低音区',
    short: '缓吹 ●',
    badgeClass:
      'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
    desc: '风门放宽、气速舒缓深沉（第一泛音基频）',
  },
  moderate: {
    label: '平吹 · 中音区',
    short: '平吹 ●●',
    badgeClass:
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    desc: '风门适中、口风平稳自然（竹笛核心甜区）',
  },
  fast: {
    label: '急吹 · 高音区',
    short: '急吹 ●●●',
    badgeClass:
      'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    desc: '风门缩小、口风流速加快（八度泛音共鸣）',
  },
  overblow: {
    label: '超吹 · 极高音',
    short: '超吹 ⚡',
    badgeClass:
      'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
    desc: '风门如针、气束极细极急（配合叉口泛音）',
  },
};

export const DiziDiagram: React.FC<DiziDiagramProps> = ({
  activeKeys,
  activeNote,
  activeJianpu,
  activeBreath = 'moderate',
  fingeringDesc,
  exploreMode = false,
  onToggleExploreMode,
  onToggleHole,
  onResetCustomKeys,
  exploreBreath = 'all',
  onChangeExploreBreath,
  exploreMatch,
  onSelectSameHoleNote,
  soundMode = 'both',
  onChangeSoundMode,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('schematic');
  const [zoom, setZoom] = useState<number>(1);
  const activeSet = new Set(activeKeys);

  const getHoleState = (num: number): 'closed' | 'half' | 'open' => {
    if (activeSet.has(`hole_${num}`)) return 'closed';
    if (activeSet.has(`hole_${num}_half`)) return 'half';
    return 'open';
  };

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)));
  const handleZoomReset = () => setZoom(1);

  const currentBreathMeta = BREATH_META[activeBreath] ?? BREATH_META.moderate;

  // Render a 3-state hole (closed ● / half ◐ / open ○) in SVG
  const renderHoleCircle = (
    cx: number,
    cy: number,
    r: number,
    num: number,
    isRealistic = false
  ) => {
    const state = getHoleState(num);
    const clipId = `half-hole-${isRealistic ? 'real' : 'schem'}-${num}`;

    return (
      <g
        key={num}
        onClick={() => exploreMode && onToggleHole?.(num, false)}
        onContextMenu={(e) => {
          if (exploreMode) {
            e.preventDefault();
            onToggleHole?.(num, true);
          }
        }}
        className={exploreMode ? 'cursor-pointer group' : undefined}
        style={{ transition: 'all 0.15s ease' }}
      >
        <defs>
          <clipPath id={clipId}>
            {/* Bottom half closed for half-hole technique */}
            <rect x={cx - r} y={cy} width={r * 2} height={r} />
          </clipPath>
        </defs>

        {/* Outer interactive halo in explore mode */}
        {exploreMode && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 5}
            fill="transparent"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            opacity="0.45"
          />
        )}

        {/* Base hole interior */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={
            state === 'closed'
              ? 'var(--primary)'
              : isRealistic
                ? '#1c140d'
                : 'var(--sax-key-fill)'
          }
          stroke={
            state !== 'open'
              ? 'var(--sax-key-active-stroke)'
              : isRealistic
                ? '#573f28'
                : 'var(--sax-key-stroke)'
          }
          strokeWidth={state !== 'open' ? 2.5 : 1.75}
          style={{
            filter:
              state !== 'open'
                ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.55))'
                : 'none',
          }}
        />

        {/* Half-hole fill (◐) */}
        {state === 'half' && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="var(--primary)"
            clipPath={`url(#${clipId})`}
          />
        )}

        {/* Inner rim highlight for open hole on realistic flute */}
        {isRealistic && state === 'open' && (
          <ellipse
            cx={cx}
            cy={cy - 1.5}
            rx={r - 2}
            ry={r - 3}
            fill="none"
            stroke="#856544"
            strokeWidth="0.8"
            opacity="0.6"
          />
        )}
      </g>
    );
  };

  return (
    <Card className="p-4 flex flex-col items-center relative overflow-hidden h-full">
      <div className="w-full flex flex-wrap justify-between items-center gap-2 mb-3 z-10">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            竹笛六孔指法与口风图
          </h3>
          {onToggleExploreMode && (
            <Toggle
              pressed={exploreMode}
              onPressedChange={() => onToggleExploreMode()}
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-[11px] font-semibold gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
              title="开启后可直接点击六个音孔（左键切换全按/半孔/全开）反查对应音高与泛音"
            >
              <Hand className="w-3 h-3" />
              {exploreMode ? '退出查指法' : '查指法'}
            </Toggle>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            variant="pill"
            size="sm"
            className="bg-muted p-0.5 rounded-lg border border-border"
          >
            <ToggleGroupItem value="schematic" className="h-6 px-2 text-[11px]">
              教学图
            </ToggleGroupItem>
            <ToggleGroupItem value="realistic" className="h-6 px-2 text-[11px]">
              拟真竹笛
            </ToggleGroupItem>
            <ToggleGroupItem value="both" className="h-6 px-2 text-[11px]">
              双图同屏
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg border border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.75}
              title="缩小指法图"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomReset}
              title="重置缩放 (100%)"
              className="h-6 px-1 text-[10px] font-mono text-muted-foreground hover:text-foreground min-w-[36px]"
            >
              {zoom === 1 ? <RotateCcw className="w-3 h-3" /> : `${Math.round(zoom * 100)}%`}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 1.6}
              title="放大指法图"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Explore Mode Banner */}
      {exploreMode && (
        <div className="w-full mb-3 p-2.5 rounded-xl bg-primary/10 border border-primary/30 flex flex-col gap-2 z-10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-primary shrink-0">
                点击音孔循环「全按● → 半孔◐ → 全开○」：
              </span>
              {exploreMatch ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base font-bold font-mono text-foreground">
                    {exploreMatch.displayName}
                  </span>
                  <Badge variant="secondary" className="text-[11px] font-mono">
                    {exploreMatch.jianpu}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      exploreMatch.exact
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    }`}
                  >
                    {exploreMatch.exact ? '精准匹配' : '近似指法'}
                  </Badge>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  点击下方六个音孔探索竹笛音位
                </span>
              )}
            </div>
            {onResetCustomKeys && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetCustomKeys}
                className="h-6 px-2 text-[11px] gap-1 shrink-0"
                title="清空全部按孔（六孔全开 #4）"
              >
                <RotateCw className="w-3 h-3" />
                全开清零
              </Button>
            )}
          </div>

          {/* Breath Register Filter + Same-Hole Harmonics Switcher */}
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-primary/20 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Wind className="w-3 h-3 text-primary" />
                口风档位：
              </span>
              <ToggleGroup
                type="single"
                value={exploreBreath}
                onValueChange={(v) =>
                  v && onChangeExploreBreath?.(v as BreathLevel | 'all')
                }
                variant="pill"
                size="sm"
                className="bg-background/80 p-0.5 rounded-lg border border-border"
              >
                <ToggleGroupItem value="all" className="h-5 px-2 text-[10px]">
                  自动
                </ToggleGroupItem>
                <ToggleGroupItem value="slow" className="h-5 px-2 text-[10px]">
                  缓吹(低)
                </ToggleGroupItem>
                <ToggleGroupItem value="moderate" className="h-5 px-2 text-[10px]">
                  平吹(中)
                </ToggleGroupItem>
                <ToggleGroupItem value="fast" className="h-5 px-2 text-[10px]">
                  急吹(高)
                </ToggleGroupItem>
                <ToggleGroupItem value="overblow" className="h-5 px-2 text-[10px]">
                  超吹(极高)
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {onChangeSoundMode && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-primary" />
                  音效：
                </span>
                <ToggleGroup
                  type="single"
                  value={soundMode}
                  onValueChange={(v) => v && onChangeSoundMode(v as SoundMode)}
                  variant="pill"
                  size="sm"
                  className="bg-background/80 p-0.5 rounded-lg border border-border"
                >
                  <ToggleGroupItem value="both" className="h-5 px-2 text-[10px]">
                    打孔+笛音
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dizi" className="h-5 px-2 text-[10px]">
                    仅笛音
                  </ToggleGroupItem>
                  <ToggleGroupItem value="tap" className="h-5 px-2 text-[10px]">
                    仅按孔声
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
          </div>

          {/* Same-Hole Octave Harmonics Bar */}
          {exploreMatch && exploreMatch.sameHoleNotes.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-primary/15">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                当前孔位可吹奏的同指法泛音：
              </span>
              {exploreMatch.sameHoleNotes.map((item) => (
                <button
                  key={item.note}
                  type="button"
                  onClick={() => onSelectSameHoleNote?.(item.note, item.breath)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors cursor-pointer ${
                    item.note === exploreMatch.note
                      ? 'bg-primary text-primary-foreground border-primary font-bold'
                      : 'bg-background/70 text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {item.note} · {item.jianpu} ({BREATH_META[item.breath].short})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Note & Breath Indicator Header */}
      <div className="w-full flex items-center justify-between gap-2 px-3 py-2 mb-2 rounded-xl bg-muted/60 border border-border z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl font-bold font-mono text-primary leading-none">
            {activeNote ? activeNote.replace('#', '♯').replace('b', '♭') : '--'}
          </span>
          {activeJianpu && (
            <Badge variant="secondary" className="text-xs font-mono">
              {activeJianpu}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            {fingeringDesc}
          </span>
        </div>
        <Badge
          variant="outline"
          className={`text-[11px] font-semibold shrink-0 ${currentBreathMeta.badgeClass}`}
          title={currentBreathMeta.desc}
        >
          {currentBreathMeta.label}
        </Badge>
      </div>
      <div className="w-full text-[11px] text-muted-foreground px-1 mb-2 sm:hidden text-center">
        {fingeringDesc}
      </div>

      {/* Interactive Diagram Canvas */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-[380px] overflow-auto py-1">
        <div
          className={`w-full grid ${
            viewMode === 'both' ? 'grid-cols-1 md:grid-cols-2 gap-3' : 'grid-cols-1'
          } items-center justify-items-center transition-transform duration-200 origin-top`}
          style={{
            transform: `scale(${zoom})`,
            marginBottom: zoom > 1 ? `${(zoom - 1) * 340}px` : undefined,
          }}
        >
          {/* 1. Pedagogical Schematic Diagram (教学示意图) */}
          {(viewMode === 'schematic' || viewMode === 'both') && (
            <div className="relative flex flex-col items-center justify-center w-full">
              {viewMode === 'both' && (
                <span className="mb-1 text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  教学孔位图（含半孔 ◐ 与手指分工）
                </span>
              )}
              <svg
                viewBox="0 0 310 610"
                className="w-full max-w-[275px] h-auto max-h-[470px] drop-shadow-sm select-none"
              >
                {/* Bamboo body outline */}
                <rect
                  x="128"
                  y="24"
                  width="44"
                  height="555"
                  rx="16"
                  fill="var(--sax-body-bg)"
                  stroke="var(--sax-body-stroke)"
                  strokeWidth="2"
                />

                {/* Decorative ox-horn head & tail caps */}
                <rect
                  x="128"
                  y="24"
                  width="44"
                  height="24"
                  rx="10"
                  fill="var(--sax-key-stroke)"
                  opacity="0.55"
                />
                <rect
                  x="128"
                  y="555"
                  width="44"
                  height="24"
                  rx="10"
                  fill="var(--sax-key-stroke)"
                  opacity="0.55"
                />

                {/* Bamboo nodes (竹节纹) */}
                {[65, 168, 342, 522].map((ny) => (
                  <path
                    key={ny}
                    d={`M 126 ${ny} Q 150 ${ny - 3} 174 ${ny}`}
                    fill="none"
                    stroke="var(--sax-body-stroke)"
                    strokeWidth="2"
                  />
                ))}

                {/* Blow hole (吹孔) */}
                <ellipse
                  cx="150"
                  cy="92"
                  rx="11"
                  ry="9.5"
                  fill="#0f172a"
                  stroke="var(--primary)"
                  strokeWidth="2"
                />
                <text
                  x="105"
                  y="89"
                  textAnchor="end"
                  className="text-[11px] font-bold fill-foreground"
                >
                  吹孔
                </text>
                <text
                  x="105"
                  y="103"
                  textAnchor="end"
                  className="text-[9px] fill-muted-foreground"
                >
                  {currentBreathMeta.short}
                </text>

                {/* Animated Wind Stream Arrow into Blow Hole */}
                <path
                  d="M 192 78 Q 175 85 164 90"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
                <polygon points="163,90 170,85 169,92" fill="var(--primary)" />
                <text
                  x="196"
                  y="82"
                  className="text-[9px] font-mono fill-primary font-semibold"
                >
                  口风气束
                </text>

                {/* Dimo hole (膜孔 · 笛膜) */}
                <ellipse
                  cx="150"
                  cy="142"
                  rx="10.5"
                  ry="12.5"
                  fill="var(--primary)"
                  fillOpacity="0.22"
                  stroke="var(--primary)"
                  strokeWidth="1.8"
                />
                {/* Dimo ripples */}
                <line
                  x1="142"
                  y1="138"
                  x2="158"
                  y2="138"
                  stroke="var(--primary)"
                  strokeWidth="1"
                  opacity="0.75"
                />
                <line
                  x1="141"
                  y1="142"
                  x2="159"
                  y2="142"
                  stroke="var(--primary)"
                  strokeWidth="1.2"
                />
                <line
                  x1="142"
                  y1="146"
                  x2="158"
                  y2="146"
                  stroke="var(--primary)"
                  strokeWidth="1"
                  opacity="0.75"
                />
                <text
                  x="105"
                  y="145"
                  textAnchor="end"
                  className="text-[11px] font-semibold fill-foreground"
                >
                  膜孔 (笛膜)
                </text>

                {/* Left Hand Bracket */}
                <path
                  d="M 114 195 L 106 195 L 106 315 L 114 315"
                  fill="none"
                  stroke="var(--sax-label)"
                  strokeWidth="1.3"
                />
                <text
                  x="98"
                  y="258"
                  textAnchor="end"
                  className="text-[11px] font-bold fill-foreground"
                >
                  左手按孔
                </text>
                <text
                  x="98"
                  y="272"
                  textAnchor="end"
                  className="text-[9px] fill-muted-foreground"
                >
                  (六 · 五 · 四孔)
                </text>

                {/* Right Hand Bracket */}
                <path
                  d="M 114 365 L 106 365 L 106 485 L 114 485"
                  fill="none"
                  stroke="var(--sax-label)"
                  strokeWidth="1.3"
                />
                <text
                  x="98"
                  y="428"
                  textAnchor="end"
                  className="text-[11px] font-bold fill-foreground"
                >
                  右手按孔
                </text>
                <text
                  x="98"
                  y="442"
                  textAnchor="end"
                  className="text-[9px] fill-muted-foreground"
                >
                  (三 · 二 · 一孔)
                </text>

                {/* Six Finger Holes (Holes 6 down to 1) */}
                {HOLES.map((h) => {
                  const state = getHoleState(h.num);
                  const stateText =
                    state === 'closed' ? '● 全按' : state === 'half' ? '◐ 半孔' : '○ 全开';
                  return (
                    <g key={h.num}>
                      {renderHoleCircle(150, h.schemY, 13.5, h.num, false)}
                      <text
                        x="182"
                        y={h.schemY - 2}
                        className="text-[11px] font-semibold fill-foreground"
                      >
                        {h.label} · {h.finger}
                      </text>
                      <text
                        x="182"
                        y={h.schemY + 11}
                        className="text-[9.5px] font-mono fill-muted-foreground"
                      >
                        {stateText} ({h.tongyin5Note})
                      </text>
                    </g>
                  );
                })}

                {/* Bottom Acoustic Vent Holes (前出音孔 / 调音孔) */}
                <circle
                  cx="142"
                  cy="538"
                  r="4.5"
                  fill="none"
                  stroke="var(--sax-key-stroke)"
                  strokeWidth="1.2"
                />
                <circle
                  cx="158"
                  cy="538"
                  r="4.5"
                  fill="none"
                  stroke="var(--sax-key-stroke)"
                  strokeWidth="1.2"
                />
                <text
                  x="182"
                  y="541"
                  className="text-[9.5px] fill-muted-foreground"
                >
                  出音孔 (筒音 = 低音5̣)
                </text>

                {/* Legend at bottom */}
                <g transform="translate(45, 594)">
                  <circle cx="12" cy="0" r="5" fill="var(--primary)" />
                  <text x="22" y="3.5" className="text-[10px] fill-muted-foreground">
                    全按闭孔
                  </text>
                  <circle
                    cx="92"
                    cy="0"
                    r="5"
                    fill="var(--sax-key-fill)"
                    stroke="var(--primary)"
                    strokeWidth="1.5"
                  />
                  <path d="M 87 0 A 5 5 0 0 0 97 0 Z" fill="var(--primary)" />
                  <text x="102" y="3.5" className="text-[10px] fill-muted-foreground">
                    半孔 (◐)
                  </text>
                  <circle
                    cx="166"
                    cy="0"
                    r="5"
                    fill="var(--sax-key-fill)"
                    stroke="var(--sax-key-stroke)"
                    strokeWidth="1.5"
                  />
                  <text x="176" y="3.5" className="text-[10px] fill-muted-foreground">
                    开放音孔
                  </text>
                </g>
              </svg>
            </div>
          )}

          {/* 2. Realistic Annotated Chinese Bamboo Flute (拟真苦竹笛实景图) */}
          {(viewMode === 'realistic' || viewMode === 'both') && (
            <div className="relative flex flex-col items-center justify-center w-full">
              {viewMode === 'both' && (
                <span className="mb-1 text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  紫竹/苦竹笛实景拟真图（带笛膜与双节铜套）
                </span>
              )}
              <svg
                viewBox="0 0 310 610"
                className="w-full max-w-[275px] h-auto max-h-[470px] drop-shadow-md select-none"
              >
                <defs>
                  {/* Realistic aged bamboo cylindrical gradient */}
                  <linearGradient id="bambooCylinder" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6e4720" />
                    <stop offset="22%" stopColor="#b88446" />
                    <stop offset="48%" stopColor="#e5b976" />
                    <stop offset="78%" stopColor="#a87234" />
                    <stop offset="100%" stopColor="#593716" />
                  </linearGradient>

                  {/* Ox-horn black-jade cap gradient */}
                  <linearGradient id="oxHornCap" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0f1115" />
                    <stop offset="35%" stopColor="#374151" />
                    <stop offset="70%" stopColor="#1f2937" />
                    <stop offset="100%" stopColor="#090a0f" />
                  </linearGradient>

                  {/* Brass tuning joint gradient */}
                  <linearGradient id="brassJoint" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#92400e" />
                    <stop offset="35%" stopColor="#fde68a" />
                    <stop offset="55%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                </defs>

                {/* Red Silk Chinese Knot & Tassel (中国结红笛穗) hanging from tail */}
                <path
                  d="M 148 566 Q 124 580 116 602"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                />
                <circle cx="127" cy="583" r="5" fill="#dc2626" />
                <path
                  d="M 116 602 L 106 608 M 116 602 L 114 609 M 116 602 L 122 608"
                  stroke="#ef4444"
                  strokeWidth="1.8"
                />

                {/* Main Bamboo Tube Body */}
                <rect
                  x="130"
                  y="20"
                  width="40"
                  height="555"
                  rx="8"
                  fill="url(#bambooCylinder)"
                  stroke="#4a2c11"
                  strokeWidth="1.5"
                />

                {/* Top & Bottom Ox-Horn Mounts (牛角笛头与笛尾) */}
                <rect
                  x="129"
                  y="18"
                  width="42"
                  height="24"
                  rx="5"
                  fill="url(#oxHornCap)"
                />
                <rect
                  x="129"
                  y="553"
                  width="42"
                  height="24"
                  rx="5"
                  fill="url(#oxHornCap)"
                />

                {/* Traditional Black/Red Silk Binding Coils (缠线) */}
                {[
                  { y: 62, h: 12 },
                  { y: 120, h: 10 },
                  { y: 200, h: 12 },
                  { y: 528, h: 12 },
                ].map((coil, idx) => (
                  <g key={idx}>
                    <rect
                      x="130"
                      y={coil.y}
                      width="40"
                      height={coil.h}
                      fill="#181210"
                    />
                    <line
                      x1="130"
                      y1={coil.y + 2}
                      x2="170"
                      y2={coil.y + 2}
                      stroke="#b91c1c"
                      strokeWidth="1.2"
                    />
                    <line
                      x1="130"
                      y1={coil.y + coil.h - 2}
                      x2="170"
                      y2={coil.y + coil.h - 2}
                      stroke="#b91c1c"
                      strokeWidth="1.2"
                    />
                  </g>
                ))}

                {/* Brass Double-Socket Tuning Joint (双插铜套) between Blow Hole & Dimo */}
                <rect
                  x="129.5"
                  y="133"
                  width="41"
                  height="26"
                  fill="url(#brassJoint)"
                  stroke="#78350f"
                  strokeWidth="1"
                />
                <line
                  x1="129.5"
                  y1="146"
                  x2="170.5"
                  y2="146"
                  stroke="#78350f"
                  strokeWidth="1.2"
                />

                {/* Engraved Classical Chinese Poetry between top cap and blow hole */}
                <text
                  x="150"
                  y="54"
                  textAnchor="middle"
                  className="text-[8px] fill-amber-950 font-serif tracking-widest opacity-80"
                >
                  幽篁清韵
                </text>

                {/* Blow Hole (吹孔) */}
                <ellipse
                  cx="150"
                  cy="96"
                  rx="10.5"
                  ry="9"
                  fill="#120c07"
                  stroke="#6b4423"
                  strokeWidth="2"
                />
                <text
                  x="114"
                  y="99"
                  textAnchor="end"
                  className="text-[10px] font-semibold fill-foreground"
                >
                  吹孔
                </text>

                {/* Dimo Hole (膜孔 · 芦苇笛膜) */}
                <ellipse
                  cx="150"
                  cy="180"
                  rx="10"
                  ry="12"
                  fill="#fef3c7"
                  fillOpacity="0.88"
                  stroke="#d97706"
                  strokeWidth="1.5"
                />
                {/* Fine reed membrane wrinkles */}
                {[-5, -2, 1, 4].map((dy) => (
                  <line
                    key={dy}
                    x1="142"
                    y1={180 + dy}
                    x2="158"
                    y2={180 + dy}
                    stroke="#b45309"
                    strokeWidth="0.7"
                    opacity="0.65"
                  />
                ))}
                <text
                  x="114"
                  y="184"
                  textAnchor="end"
                  className="text-[10px] font-semibold fill-amber-600 dark:fill-amber-400"
                >
                  笛膜 (膜孔)
                </text>

                {/* Six Interactive Finger Holes on Realistic Bamboo Body */}
                {HOLES.map((h) => {
                  const state = getHoleState(h.num);
                  return (
                    <g key={h.num}>
                      {renderHoleCircle(150, h.realY, 12.5, h.num, true)}
                      <line
                        x1="166"
                        y1={h.realY}
                        x2="184"
                        y2={h.realY}
                        stroke="var(--primary)"
                        strokeWidth="1.2"
                        opacity={state !== 'open' ? 0.9 : 0.35}
                      />
                      <text
                        x="189"
                        y={h.realY + 4}
                        className={`text-[10.5px] font-mono ${
                          state !== 'open'
                            ? 'font-bold fill-primary'
                            : 'fill-muted-foreground'
                        }`}
                      >
                        {h.label}{' '}
                        {state === 'closed'
                          ? '●闭'
                          : state === 'half'
                            ? '◐半'
                            : '○开'}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Quick Hole Buttons Bar at Bottom (Always accessible for 1-click half-hole or full-hole) */}
      <div className="w-full mt-2 pt-2 border-t border-border flex flex-wrap items-center justify-between gap-1.5 z-10">
        <span className="text-[10px] text-muted-foreground">
          六孔状态速览（六→一孔）：
        </span>
        <div className="flex items-center gap-1">
          {HOLES.map((h) => {
            const st = getHoleState(h.num);
            return (
              <button
                key={h.num}
                type="button"
                onClick={() => exploreMode && onToggleHole?.(h.num, false)}
                title={`${h.label} (${h.finger})：${
                  st === 'closed' ? '全按' : st === 'half' ? '半孔' : '全开'
                }`}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
                  exploreMode ? 'cursor-pointer hover:border-primary' : 'cursor-default'
                } ${
                  st === 'closed'
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : st === 'half'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {h.num}孔{st === 'closed' ? '●' : st === 'half' ? '◐' : '○'}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
