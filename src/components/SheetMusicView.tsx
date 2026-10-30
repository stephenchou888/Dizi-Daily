import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Rows2,
  AlignJustify,
  Tag,
  Hash,
  Sparkles,
  Expand,
  Shrink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { FINGERINGS } from '../data/scales';

// 放大窗口时在当前缩放基础上再放大的倍数
const FOCUS_ZOOM = 1.5;

const loadAbcjs = () => import('abcjs').then((m) => m.default);

interface SheetMusicViewProps {
  abc: string;
  notes: string[];
  activeNoteIndex: number;
  onSelectNote: (index: number) => void;
}

function formatNoteLabel(note: string, showJianpu: boolean): string {
  const prettyNote = note.replace('#', '♯').replace('b', '♭');
  if (!showJianpu) return prettyNote;
  const f = FINGERINGS[note];
  if (!f) return prettyNote;
  const shortJianpu = f.jianpu.split(' ')[0];
  return `${shortJianpu}(${prettyNote})`;
}

function noteToAbcToken(noteName: string, withAcc: boolean): string {
  const match = noteName.match(/^([A-G])([#b]?)([4-7])$/);
  if (!match) return 'C';
  const [, letter, acc, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  let prefix = '';
  if (withAcc) {
    if (acc === '#') prefix = '^';
    else if (acc === 'b') prefix = '_';
  }
  // Standard scientific pitch to ABC notation:
  // Octave 4 (G4..B4) -> G, A, B, or G A B (we use G A B for octave 4, c d e for octave 5, c' d' for octave 6, c'' for octave 7)
  if (octave === 4) return `${prefix}${letter.toUpperCase()}`;
  if (octave === 5) return `${prefix}${letter.toLowerCase()}`;
  if (octave === 6) return `${prefix}${letter.toLowerCase()}'`;
  if (octave === 7) return `${prefix}${letter.toLowerCase()}''`;
  return `${prefix}${letter}`;
}

export const SheetMusicView: React.FC<SheetMusicViewProps> = ({
  abc,
  notes,
  activeNoteIndex,
  onSelectNote,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const onSelectNoteRef = useRef(onSelectNote);
  const [zoom, setZoom] = useState<number>(1);
  const [singleLine, setSingleLine] = useState<boolean>(true);
  const [showNoteNames, setShowNoteNames] = useState<boolean>(true);
  const [showAccidentals, setShowAccidentals] = useState<boolean>(true);
  const [renderTick, setRenderTick] = useState<number>(0);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const activeIndexRef = useRef(activeNoteIndex);
  activeIndexRef.current = activeNoteIndex;
  const notesLenRef = useRef(notes.length);
  notesLenRef.current = notes.length;

  // 放大窗口：Esc 关闭，←/→ 切换音符，并锁定页面滚动
  useEffect(() => {
    if (!focusMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusMode(false);
      } else if (e.key === 'ArrowRight' && activeIndexRef.current < notesLenRef.current - 1) {
        e.preventDefault();
        onSelectNoteRef.current(activeIndexRef.current + 1);
      } else if (e.key === 'ArrowLeft' && activeIndexRef.current > 0) {
        e.preventDefault();
        onSelectNoteRef.current(activeIndexRef.current - 1);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [focusMode]);

  useEffect(() => {
    onSelectNoteRef.current = onSelectNote;
  }, [onSelectNote]);

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)));
  const handleZoomReset = () => setZoom(1);

  // Identify half-hole or fork-fingered notes in the current scale
  const specialFingeredNotes = useMemo(() => {
    const seen = new Set<string>();
    const list: { note: string; label: string }[] = [];
    notes.forEach((n) => {
      if (seen.has(n)) return;
      seen.add(n);
      const f = FINGERINGS[n];
      const isHalf = f?.keys.some((k) => k.endsWith('_half'));
      const isFork = n === 'F5' || n === 'F6' || n === 'A6' || n === 'B6' || n === 'C7';
      if (isHalf || isFork || n.includes('#') || n.includes('b')) {
        const shortJ = f ? f.jianpu.split(' ')[0] : '';
        list.push({
          note: n,
          label: `${shortJ} (${n.replace('#', '♯').replace('b', '♭')})${
            isHalf ? '·半孔◐' : isFork ? '·叉口' : ''
          }`,
        });
      }
    });
    return list;
  }, [notes]);

  const activeAbc = useMemo(() => {
    let keySig = 'C';
    const kMatch = abc.match(/K:\s*([A-G][#b]?m?)/);
    if (kMatch) {
      keySig = kMatch[1];
    }

    const measures: string[] = [];
    const words: string[] = [];
    let curM: string[] = [];
    let curW: string[] = [];

    notes.forEach((n, idx) => {
      curM.push(noteToAbcToken(n, showAccidentals));
      curW.push(formatNoteLabel(n, true));
      if (curM.length === 4 || idx === notes.length - 1) {
        measures.push(curM.join(' '));
        words.push(curW.join(' '));
        curM = [];
        curW = [];
      }
    });

    const header = `X:1\nM:4/4\nL:1/4\nK:${keySig}`;
    if (singleLine) {
      const musicLine = measures.join(' | ') + ' |]';
      const lyricLine = showNoteNames ? `\nw: ${words.join(' | ')} |]` : '';
      return `${header}\n${musicLine}${lyricLine}`;
    } else {
      const lines: string[] = [];
      for (let i = 0; i < measures.length; i += 2) {
        const isLast = i + 2 >= measures.length;
        const lineM = measures.slice(i, i + 2).join(' | ') + (isLast ? ' |]' : ' |');
        lines.push(lineM);
        if (showNoteNames) {
          const lineW = words.slice(i, i + 2).join(' | ') + (isLast ? ' |]' : ' |');
          lines.push(`w: ${lineW}`);
        }
      }
      return `${header}\n${lines.join('\n')}`;
    }
  }, [abc, notes, singleLine, showNoteNames, showAccidentals]);

  useEffect(() => {
    let cancelled = false;

    loadAbcjs()
      .then((abcjs) => {
        const el = containerRef.current;
        if (cancelled || !el) return;

        el.innerHTML = '';
        const baseStaffWidth = singleLine ? Math.max(860, notes.length * 46) : 680;
        const renderZoom = focusMode ? zoom * FOCUS_ZOOM : zoom;
        const staffWidth = Math.round(baseStaffWidth * renderZoom);

        abcjs.renderAbc(el, activeAbc, {
          responsive: singleLine ? undefined : 'resize',
          scale: renderZoom,
          staffwidth: staffWidth,
          format: singleLine ? { stretchlast: true } : undefined,
          add_classes: true,
          paddingtop: 12,
          paddingbottom: showNoteNames ? 20 : 12,
          paddingleft: 14,
          paddingright: 14,
        });

        const allNotes = el.querySelectorAll('.abcjs-note');
        allNotes.forEach((noteEl, idx) => {
          (noteEl as HTMLElement).style.cursor = 'pointer';
          const noteStr = notes[idx] || '';
          if (noteStr.includes('#')) {
            noteEl.classList.add('abcjs-accidental-sharp');
          } else if (noteStr.length > 1 && noteStr[1] === 'b') {
            noteEl.classList.add('abcjs-accidental-flat');
          }
          noteEl.addEventListener('click', () => {
            onSelectNoteRef.current(idx);
          });
        });

        setRenderTick((t) => t + 1);
      })
      .catch((err) => console.error('Error loading abcjs:', err));

    return () => {
      cancelled = true;
    };
  }, [activeAbc, notes, zoom, singleLine, showNoteNames, focusMode]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.querySelectorAll('.active-score-note').forEach((node) => {
      node.classList.remove('active-score-note');
      node.querySelectorAll('path').forEach((p) => {
        p.style.fill = '';
        p.style.stroke = '';
        p.style.filter = '';
      });
    });

    const target = (el.querySelectorAll('.abcjs-note')[activeNoteIndex] as HTMLElement | undefined) ?? null;
    if (!target) return;
    target.classList.add('active-score-note');
    const glow = 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.95))';
    const paths = target.querySelectorAll('path');
    if (paths.length > 0) {
      paths.forEach((p) => {
        p.style.fill = '#f59e0b';
        p.style.stroke = '#f59e0b';
        p.style.filter = glow;
      });
    } else {
      target.style.fill = '#f59e0b';
      target.style.stroke = '#f59e0b';
      target.style.filter = glow;
    }

    const wrapper = scrollWrapperRef.current;
    if (singleLine && wrapper) {
      const t = target.getBoundingClientRect();
      const w = wrapper.getBoundingClientRect();
      if (w.width > 0) {
        wrapper.scrollTo({
          left: wrapper.scrollLeft + (t.left + t.width / 2) - (w.left + w.width / 2),
          behavior: 'smooth',
        });
      }
    }
  }, [activeNoteIndex, renderTick, singleLine]);

  const view = (
    <div
      className={`w-full relative rounded-xl bg-muted/40 border border-border p-3 overflow-hidden space-y-2 ${
        focusMode ? 'flex flex-col max-h-[90vh] w-[min(96vw,1400px)] !bg-card shadow-2xl' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/80">
            点击五线谱音符切换竹笛六孔指法并试听：
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            ♯升音/半孔
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
            ♭降音/半孔
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Toggle
            pressed={showAccidentals}
            onPressedChange={setShowAccidentals}
            variant="outline"
            size="sm"
            title="在音符旁直接显示临时升降号提示"
            className="h-7 px-2 text-[11px] gap-1 data-[state=on]:bg-primary/15 data-[state=on]:text-primary data-[state=on]:border-primary/30"
          >
            <Hash className="w-3 h-3" />
            升降号提示
          </Toggle>

          <Toggle
            pressed={showNoteNames}
            onPressedChange={setShowNoteNames}
            variant="outline"
            size="sm"
            title={showNoteNames ? '隐藏谱下简谱与音名' : '显示谱下简谱与音名'}
            className="h-7 px-2 text-[11px] gap-1 data-[state=on]:bg-primary/15 data-[state=on]:text-primary data-[state=on]:border-primary/30"
          >
            <Tag className="w-3 h-3" />
            简谱+音名
          </Toggle>

          <Toggle
            pressed={singleLine}
            onPressedChange={setSingleLine}
            variant="outline"
            size="sm"
            title={singleLine ? '切换为多行折行曲谱' : '切换为单行横向曲谱'}
            className="h-7 px-2 text-[11px] gap-1 data-[state=on]:bg-primary/15 data-[state=on]:text-primary data-[state=on]:border-primary/30"
          >
            {singleLine ? (
              <>
                <AlignJustify className="w-3 h-3" />
                单行谱
              </>
            ) : (
              <>
                <Rows2 className="w-3 h-3" />
                多行谱
              </>
            )}
          </Toggle>

          <div className="flex items-center gap-0.5 bg-background/80 p-0.5 rounded-lg border border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.7}
              title="缩小曲谱"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomReset}
              title="重置曲谱大小 (100%)"
              className="h-6 px-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground min-w-[38px]"
            >
              {zoom === 1 && !focusMode ? (
                <RotateCcw className="w-3 h-3" />
              ) : (
                `${Math.round(zoom * (focusMode ? FOCUS_ZOOM : 1) * 100)}%`
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 1.6}
              title="放大曲谱"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            variant={focusMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFocusMode((v) => !v)}
            title={focusMode ? '关闭放大窗口（Esc）' : '放大窗口看谱（← / → 切换音符，Esc 关闭）'}
            aria-label={focusMode ? '关闭放大窗口' : '放大窗口看谱'}
            className="h-7 px-2 text-[11px] gap-1"
          >
            {focusMode ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
            {focusMode ? '关闭' : '放大'}
          </Button>
        </div>
      </div>

      {/* Special Half-Hole / Forked Fingering Highlight Bar */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/60 text-[11px]">
        <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
          <Sparkles className="w-3 h-3 text-primary" />
          本练习重点半孔/叉口音位：
        </span>
        {specialFingeredNotes.length > 0 ? (
          specialFingeredNotes.map((item) => (
            <Badge
              key={item.note}
              variant="outline"
              className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30"
            >
              {item.label}
            </Badge>
          ))
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
          >
            全自然开闭音孔（无半孔或叉口指法）
          </Badge>
        )}
      </div>

      <div
        ref={scrollWrapperRef}
        className={`w-full overflow-x-auto pb-1 ${
          focusMode ? 'flex-1 overflow-y-auto min-h-[40vh] flex flex-col justify-center' : ''
        }`}
      >
        <div
          ref={containerRef}
          className={`abc-sheet-container text-foreground select-none ${
            singleLine ? 'min-w-max' : 'w-full'
          }`}
        />
      </div>
    </div>
  );

  if (!focusMode) return view;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="放大查看五线谱"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && setFocusMode(false)}
    >
      {view}
    </div>,
    document.body
  );
};
