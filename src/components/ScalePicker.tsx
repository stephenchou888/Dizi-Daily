import React, { useState } from 'react';
import { SCALES } from '../data/scales';
import { ScaleDefinition } from '../types/music';
import {
  Sparkles,
  Music,
  Check,
  ChevronsUpDown,
  RotateCcw,
  Compass,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

interface ScalePickerProps {
  selectedScaleId: string;
  todayScaleId: string;
  onSelectScale: (scaleId: string) => void;
}

export const ScalePicker: React.FC<ScalePickerProps> = ({
  selectedScaleId,
  todayScaleId,
  onSelectScale,
}) => {
  const [open, setOpen] = useState(false);

  const selectedScale =
    SCALES.find((s) => s.id === selectedScaleId) ?? SCALES[0];
  const isToday = selectedScaleId === todayScaleId;

  const tongyinScales = SCALES.filter((s) => s.category === 'tongyin');
  const specialScales = SCALES.filter((s) => s.category === 'special');
  const pentatonicScales = SCALES.filter((s) => s.category === 'pentatonic');
  const westernScales = SCALES.filter(
    (s) => s.category === 'major' || s.category === 'minor'
  );

  const handleSelect = (scale: ScaleDefinition) => {
    onSelectScale(scale.id);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="h-9 px-3 justify-between gap-2 bg-card hover:bg-accent/60 text-xs font-medium min-w-[235px]"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedScale.category === 'tongyin' ? (
            <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
          ) : selectedScale.category === 'special' ? (
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <Music className="w-3.5 h-3.5 text-primary shrink-0" />
          )}
          <span className="truncate">{selectedScale.name}</span>
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
      </Button>

      {!isToday && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectScale(todayScaleId)}
          className="h-9 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1"
          title="切回今日推荐练习音阶"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          回到今日指法
        </Button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="选择竹笛练习指法与调式"
        description="搜索筒音转调（筒音作5/2/1/6/3/4/b7）、竹笛绝技特训、五声七声调式或大小调视奏"
      >
        <CommandInput placeholder="搜索筒音作5、筒音作2、超吹、江南丝竹、吐音、宫商角徵羽..." />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>未找到匹配的竹笛音阶或指法练习</CommandEmpty>

          <CommandGroup heading="常用筒音转调指法 (7套竹笛核心转调)">
            {tongyinScales.map((scale) => {
              const active = scale.id === selectedScaleId;
              const today = scale.id === todayScaleId;
              return (
                <CommandItem
                  key={scale.id}
                  value={`${scale.name} ${scale.tongyinSystem} ${scale.accidentals}`}
                  onSelect={() => handleSelect(scale)}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Compass className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate font-medium">{scale.name}</span>
                    {today && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30"
                      >
                        今日推荐
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {scale.tongyinSystem}
                    </span>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="竹笛气功与南北派绝技特训 (7项)">
            {specialScales.map((scale) => {
              const active = scale.id === selectedScaleId;
              const today = scale.id === todayScaleId;
              return (
                <CommandItem
                  key={scale.id}
                  value={`${scale.name} ${scale.tongyinSystem} ${scale.accidentals}`}
                  onSelect={() => handleSelect(scale)}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate font-medium">{scale.name}</span>
                    {today && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30"
                      >
                        今日推荐
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {scale.tongyinSystem}
                    </span>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="中国传统五声与古典七声调式 (8项 · 宫商角徵羽/雅乐/清乐/燕乐)">
            {pentatonicScales.map((scale) => {
              const active = scale.id === selectedScaleId;
              const today = scale.id === todayScaleId;
              return (
                <CommandItem
                  key={scale.id}
                  value={`${scale.name} ${scale.tongyinSystem} ${scale.accidentals}`}
                  onSelect={() => handleSelect(scale)}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Music className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{scale.name}</span>
                    {today && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30"
                      >
                        今日推荐
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {scale.tongyinSystem}
                    </span>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="通用大小调五线谱视奏 (6项)">
            {westernScales.map((scale) => {
              const active = scale.id === selectedScaleId;
              const today = scale.id === todayScaleId;
              return (
                <CommandItem
                  key={scale.id}
                  value={`${scale.name} ${scale.keySig} ${scale.accidentals}`}
                  onSelect={() => handleSelect(scale)}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Music className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate">{scale.name}</span>
                    {today && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30"
                      >
                        今日推荐
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {scale.accidentals}
                    </span>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};
