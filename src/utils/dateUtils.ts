import { DayOfWeek } from '../types';

export interface WeekInfo {
  monday: Date;
  saturday: Date;
  mondayFull: string;
  saturdayFull: string;
  mondayShort: string;
  saturdayShort: string;
  monthNum: number;
  yearNum: number;
  monthFormatted: string; // e.g. "Tháng 08/2026"
  monthShort: string;     // e.g. "Tháng 8/2026"
  dayDates: Record<DayOfWeek, string>;
  rangeFormatted: string;
}

/**
 * Calculates the exact Monday-Saturday dates, month, and year for a specific week number
 * based on the school start date (week 1 start date).
 */
export function getWeekDateRange(week1StartDateStr?: string, weekNumber: number = 1): WeekInfo {
  const defaultDateStr = week1StartDateStr || '2026-08-03';
  let start: Date;
  
  if (defaultDateStr.includes('-')) {
    const [y, m, d] = defaultDateStr.split('-').map(Number);
    start = new Date(y, m - 1, d);
  } else {
    start = new Date(defaultDateStr);
  }

  if (isNaN(start.getTime())) {
    start = new Date(2026, 7, 3); // Fallback: 03/08/2026
  }

  // Calculate Monday for target week (weekNumber is 1-indexed)
  const monday = new Date(start.getTime() + (weekNumber - 1) * 7 * 86400000);
  const tuesday = new Date(monday.getTime() + 1 * 86400000);
  const wednesday = new Date(monday.getTime() + 2 * 86400000);
  const thursday = new Date(monday.getTime() + 3 * 86400000);
  const friday = new Date(monday.getTime() + 4 * 86400000);
  const saturday = new Date(monday.getTime() + 5 * 86400000);

  const monthNum = monday.getMonth() + 1;
  const yearNum = monday.getFullYear();
  const monthFormatted = `Tháng ${String(monthNum).padStart(2, '0')}/${yearNum}`;
  const monthShort = `Tháng ${monthNum}/${yearNum}`;

  const formatShort = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
  const formatFull = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;

  const dayDates: Record<DayOfWeek, string> = {
    'Thứ 2': formatShort(monday),
    'Thứ 3': formatShort(tuesday),
    'Thứ 4': formatShort(wednesday),
    'Thứ 5': formatShort(thursday),
    'Thứ 6': formatShort(friday),
    'Thứ 7': formatShort(saturday),
  };

  return {
    monday,
    saturday,
    mondayFull: formatFull(monday),
    saturdayFull: formatFull(saturday),
    mondayShort: formatShort(monday),
    saturdayShort: formatShort(saturday),
    monthNum,
    yearNum,
    monthFormatted,
    monthShort,
    dayDates,
    rangeFormatted: `${formatShort(monday)} – ${formatShort(saturday)}`
  };
}

/**
 * Calculates current week number and month from today's real date relative to week 1 start date
 */
export function getCurrentWeekAndMonth(week1StartDateStr?: string): {
  currentWeek: number;
  currentMonth: number;
  weekInfo: WeekInfo;
} {
  const defaultDateStr = week1StartDateStr || '2026-08-03';
  let start: Date;
  
  if (defaultDateStr.includes('-')) {
    const [y, m, d] = defaultDateStr.split('-').map(Number);
    start = new Date(y, m - 1, d);
  } else {
    start = new Date(defaultDateStr);
  }

  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / 86400000);
  let currentWeek = Math.floor(diffDays / 7) + 1;
  if (currentWeek < 1) currentWeek = 1;

  const weekInfo = getWeekDateRange(defaultDateStr, currentWeek);

  return {
    currentWeek,
    currentMonth: weekInfo.monthNum,
    weekInfo
  };
}
