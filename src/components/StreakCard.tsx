import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Flame, CheckCircle2, Trophy, Calendar } from 'lucide-react';
import {
  loadCheckIns,
  saveCheckIns,
  toDateKey,
  addDays,
  computeStreakStats,
} from '../lib/streak';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const StreakCard: React.FC = () => {
  const [checkIns, setCheckIns] = useState<Set<string>>(() => loadCheckIns());
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  useEffect(() => {
    saveCheckIns(checkIns);
  }, [checkIns]);

  const stats = useMemo(
    () => computeStreakStats(checkIns, today),
    [checkIns, today]
  );

  const past14Days = useMemo(() => {
    const arr: { key: string; label: string; dayNum: number; isToday: boolean }[] = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      arr.push({
        key: toDateKey(d),
        label: weekdays[d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0,
      });
    }
    return arr;
  }, [today]);

  const handleToggleToday = () => {
    setCheckIns((prev) => {
      const next = new Set(prev);
      if (next.has(todayKey)) {
        next.delete(todayKey);
      } else {
        next.add(todayKey);
        try {
          confetti({
            particleCount: 55,
            spread: 65,
            origin: { y: 0.75 },
          });
        } catch {
          // ignore confetti errors in headless/SSR
        }
      }
      return next;
    });
  };

  return (
    <Card className="p-5 flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            每日练笛打卡记录
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1" title="历史最长连续练笛天数">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            最长 <strong className="text-foreground font-mono">{stats.longestStreak}</strong> 天
          </span>
          <span className="inline-flex items-center gap-1" title="累计练笛打卡总天数">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            累计 <strong className="text-foreground font-mono">{stats.totalDays}</strong> 天
          </span>
        </div>
      </div>

      {/* Main Streak Counter & Check-In Button */}
      <div className="flex items-center justify-between gap-4 my-1">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold font-mono tracking-tight text-foreground">
              {stats.currentStreak}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              天连续练笛
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {stats.checkedInToday
              ? '今日竹笛长音与指法已打卡，继续保持清越笛韵！'
              : '完成今日筒音长音与音阶指法后点击右侧打卡'}
          </p>
        </div>

        <Button
          onClick={handleToggleToday}
          variant={stats.checkedInToday ? 'secondary' : 'default'}
          className={`gap-1.5 font-semibold shrink-0 cursor-pointer ${
            stats.checkedInToday
              ? 'border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
              : ''
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {stats.checkedInToday ? '今日已打卡' : '今日练笛打卡'}
        </Button>
      </div>

      {/* 14-Day Heatmap Strip */}
      <div>
        <div className="text-[10px] text-muted-foreground mb-1.5 flex justify-between">
          <span>近 14 天练笛足迹</span>
          <span>点击今日按钮即可记录</span>
        </div>
        <div className="grid grid-cols-14 gap-1">
          {past14Days.map((d) => {
            const done = checkIns.has(d.key);
            return (
              <div
                key={d.key}
                title={`${d.key} ${done ? '已练笛' : '未打卡'}`}
                className={`flex flex-col items-center justify-center py-1.5 rounded-md border text-[10px] transition-all ${
                  done
                    ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                    : d.isToday
                      ? 'bg-muted/80 text-foreground border-primary/50 border-dashed'
                      : 'bg-muted/40 text-muted-foreground border-border/60'
                }`}
              >
                <span className="text-[9px] opacity-75">{d.label}</span>
                <span className="font-mono leading-tight">{d.dayNum}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
