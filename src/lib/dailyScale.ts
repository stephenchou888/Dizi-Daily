import { ScaleDefinition } from '../types/music';
import { SCALES } from '../data/scales';

export function getTodayScale(date: Date = new Date()): {
  scale: ScaleDefinition;
  dayOfYear: number;
  dateStr: string;
} {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const scaleIndex = dayOfYear % SCALES.length;
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  const dateStr = date.toLocaleDateString('zh-CN', options);

  return {
    scale: SCALES[scaleIndex],
    dayOfYear,
    dateStr,
  };
}
