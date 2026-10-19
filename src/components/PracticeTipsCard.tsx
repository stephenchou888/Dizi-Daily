import React from 'react';
import { getNoteTip } from '../data/noteTips';
import { Wind, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PracticeTipsCardProps {
  activeNote: string;
  activeJianpu?: string;
  scaleTip: string;
  tongyinSystem: string;
}

export const PracticeTipsCard: React.FC<PracticeTipsCardProps> = ({
  activeNote,
  activeJianpu,
  scaleTip,
  tongyinSystem,
}) => {
  const noteTip = getNoteTip(activeNote);

  return (
    <Card className="p-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            当前音位风门、口风与指法要领
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[11px] font-mono">
            {tongyinSystem}
          </Badge>
          <Badge className="text-xs font-mono">
            {activeNote.replace('#', '♯').replace('b', '♭')}{' '}
            {activeJianpu ? `· ${activeJianpu}` : ''}
          </Badge>
          <Badge variant="secondary" className="text-[11px]">
            {noteTip.register}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Embouchure & Breath (风门与口风) */}
        <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Wind className="w-3.5 h-3.5" />
            风门与口风控制
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {noteTip.embouchure}
          </p>
        </div>

        {/* Common Pitfall (易错点与漏气排查) */}
        <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
            <AlertTriangle className="w-3.5 h-3.5" />
            常见误区与音准陷阱
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {noteTip.pitfall}
          </p>
        </div>

        {/* Pro Tip (名师练笛秘籍) */}
        <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
            <Lightbulb className="w-3.5 h-3.5" />
            竹笛进阶口诀
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {noteTip.proTip}
          </p>
        </div>
      </div>

      {/* Scale Practice Tip Footer */}
      <div className="px-3.5 py-2.5 rounded-xl bg-primary/8 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2">
        <span className="font-semibold text-primary shrink-0">本调练习心法：</span>
        <span className="leading-relaxed">{scaleTip}</span>
      </div>
    </Card>
  );
};
