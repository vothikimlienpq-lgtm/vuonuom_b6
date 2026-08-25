import { PointTransaction, GroupBonus, Student, ClassConfig } from '../types';
import { getWeekDateRange } from './dateUtils';

export type ConductRank = 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';

export interface ConductMonthResult {
  key: string;
  label: string;
  month: number;
  year: number;
  weekNumbers: number[];
  totalPoints: number;
  rank: ConductRank;
}

export interface ConductSemesterResult {
  semester: 1 | 2;
  startWeek: number;
  endWeek: number;
  months: ConductMonthResult[];
  suggestedRank: ConductRank | null;
  isComplete: boolean;
}

export interface StudentAnnualConductSummary {
  studentId: string;
  studentName: string;
  groupNumber: number;
  orderNumber: number;
  semester1: ConductSemesterResult;
  semester2: ConductSemesterResult;
  annualRank: ConductRank | null;
  isAnnualComplete: boolean;
}

const CONDUCT_RANK_ORDER: Record<ConductRank, number> = {
  'Chưa đạt': 0,
  'Đạt': 1,
  'Khá': 2,
  'Tốt': 3,
};

export function getConductRankFromPoints(totalPoints: number): ConductRank {
  if (totalPoints >= 200) return 'Tốt';
  if (totalPoints >= 100) return 'Khá';
  if (totalPoints >= 51) return 'Đạt';
  return 'Chưa đạt';
}

/**
 * Gợi ý học kỳ theo dữ liệu theo dõi tháng của lớp. Đây là cách tổng hợp nội
 * bộ theo mức thấp nhất của các tháng đã diễn ra; GVCN vẫn là người quyết định
 * kết quả học kỳ theo Điều 8 Thông tư 22/2021/TT-BGDĐT.
 */
export function suggestSemesterConduct(months: ConductMonthResult[]): ConductRank | null {
  if (months.length === 0) return null;
  return months.reduce<ConductRank>((lowest, month) => (
    CONDUCT_RANK_ORDER[month.rank] < CONDUCT_RANK_ORDER[lowest] ? month.rank : lowest
  ), 'Tốt');
}

/**
 * Xếp loại cả năm đúng ma trận tại Điều 8 Thông tư 22/2021/TT-BGDĐT.
 * Kết quả HKII giữ vai trò chính, kết hợp với kết quả HKI.
 */
export function computeOfficialAnnualConduct(
  semester1: ConductRank | null,
  semester2: ConductRank | null
): ConductRank | null {
  if (!semester1 || !semester2) return null;

  if (semester2 === 'Tốt' && (semester1 === 'Tốt' || semester1 === 'Khá')) {
    return 'Tốt';
  }

  if (
    (semester2 === 'Khá' && (semester1 === 'Tốt' || semester1 === 'Khá' || semester1 === 'Đạt'))
    || (semester2 === 'Đạt' && semester1 === 'Tốt')
    || (semester2 === 'Tốt' && (semester1 === 'Đạt' || semester1 === 'Chưa đạt'))
  ) {
    return 'Khá';
  }

  if (
    (semester2 === 'Đạt' && (semester1 === 'Khá' || semester1 === 'Đạt' || semester1 === 'Chưa đạt'))
    || (semester2 === 'Khá' && semester1 === 'Chưa đạt')
  ) {
    return 'Đạt';
  }

  return 'Chưa đạt';
}

const getElapsedAcademicWeeks = (config: ClassConfig): number => {
  const startValue = config.week1StartDate || '';
  const [year, month, day] = startValue.split('-').map(Number);
  const start = new Date(year, (month || 1) - 1, day || 1);
  if (Number.isNaN(start.getTime())) return 0;
  const elapsed = Math.floor((Date.now() - start.getTime()) / 604800000) + 1;
  return Math.min(Math.max(elapsed, 0), Math.max(1, Number(config.totalWeeks) || 38));
};

const buildSemesterResult = (
  studentId: string,
  transactions: PointTransaction[],
  config: ClassConfig,
  semester: 1 | 2,
  startWeek: number,
  endWeek: number,
  elapsedWeeks: number
): ConductSemesterResult => {
  const evaluatedEndWeek = Math.min(endWeek, elapsedWeeks);
  const groupedWeeks = new Map<string, { label: string; month: number; year: number; weekNumbers: number[] }>();

  for (let week = startWeek; week <= evaluatedEndWeek; week += 1) {
    const info = getWeekDateRange(config.week1StartDate, week);
    const key = `${info.yearNum}-${String(info.monthNum).padStart(2, '0')}`;
    const existing = groupedWeeks.get(key);
    if (existing) existing.weekNumbers.push(week);
    else groupedWeeks.set(key, {
      label: `Tháng ${info.monthNum}/${info.yearNum}`,
      month: info.monthNum,
      year: info.yearNum,
      weekNumbers: [week],
    });
  }

  const studentTransactions = transactions.filter((tx) => tx.studentId === studentId);
  const months: ConductMonthResult[] = Array.from(groupedWeeks.entries()).map(([key, period]) => {
    const allowedWeeks = new Set(period.weekNumbers);
    const totalPoints = studentTransactions
      .filter((tx) => allowedWeeks.has(Number(tx.week)))
      .reduce((sum, tx) => sum + getSignedTransactionPoints(tx), 0);
    return {
      key,
      ...period,
      totalPoints,
      rank: getConductRankFromPoints(totalPoints),
    };
  });

  return {
    semester,
    startWeek,
    endWeek,
    months,
    suggestedRank: suggestSemesterConduct(months),
    isComplete: elapsedWeeks >= endWeek,
  };
};

export function computeAcademicYearConduct(
  students: Student[] = [],
  transactions: PointTransaction[] = [],
  config: ClassConfig
): StudentAnnualConductSummary[] {
  const totalWeeks = Math.max(2, Number(config.totalWeeks) || 38);
  const semester1Weeks = Math.min(
    Math.max(1, Number(config.semester1Weeks) || 18),
    totalWeeks - 1
  );
  const elapsedWeeks = getElapsedAcademicWeeks(config);

  return students.map((student) => {
    const semester1 = buildSemesterResult(
      student.id, transactions, config, 1, 1, semester1Weeks, elapsedWeeks
    );
    const semester2 = buildSemesterResult(
      student.id, transactions, config, 2, semester1Weeks + 1, totalWeeks, elapsedWeeks
    );
    return {
      studentId: student.id,
      studentName: student.fullName,
      groupNumber: student.groupNumber,
      orderNumber: student.orderNumber,
      semester1,
      semester2,
      annualRank: computeOfficialAnnualConduct(semester1.suggestedRank, semester2.suggestedRank),
      isAnnualComplete: semester1.isComplete && semester2.isComplete,
    };
  });
}

export interface StudentScoreSummary {
  studentId: string;
  studentName: string;
  groupNumber: number;
  position: string;
  parentCode?: string;
  weekScores: { [week: number]: number };
  monthTotal: number;
  monthAverage: number;
  conductRank: ConductRank;
  isTemporary: boolean;
  disciplineFaults: number;
  academicFaults: number;
  reportCardsCount: number; // Bản kiểm điểm
  faultBreakdown: {
    sleeping: number;
    absent: number;
    late: number;
    disorder: number;
    uniform: number;
    reportCard: number;
    noLesson: number;
    noPrep: number;
  };
  totalBonusPoints: number;
  totalMinusPoints: number;
}

/**
 * Chuẩn hóa dấu điểm cho cả dữ liệu mới và dữ liệu cũ. Một số bản ghi cũ
 * lưu điểm trừ dưới dạng số dương, vì vậy loại giao dịch quyết định dấu.
 */
export function getSignedTransactionPoints(transaction: PointTransaction): number {
  const rawTotal = Number(transaction.totalPoints);
  const fallbackTotal = Number(transaction.points || 0) * Number(transaction.quantity || 1);
  const absoluteTotal = Math.abs(Number.isFinite(rawTotal) ? rawTotal : fallbackTotal);
  return transaction.type === 'minus' ? -absoluteTotal : absoluteTotal;
}

export function formatSignedPoints(points: number, suffix = ''): string {
  const safePoints = Number.isFinite(Number(points)) ? Number(points) : 0;
  return `${safePoints > 0 ? '+' : ''}${safePoints}${suffix}`;
}

export function computeStudentScores(
  students: Student[] = [],
  transactions: PointTransaction[] = [],
  activeMonth: number = 9,
  completedWeeksCount: number = 4
): StudentScoreSummary[] {
  const safeStudents = students || [];
  const safeTransactions = transactions || [];

  return safeStudents.map(student => {
    const studentTxs = safeTransactions.filter(t => t.studentId === student.id && t.month === activeMonth);

    const weekScores: { [week: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalBonusPoints = 0;
    let totalMinusPoints = 0;

    const faultBreakdown = {
      sleeping: 0,
      absent: 0,
      late: 0,
      disorder: 0,
      uniform: 0,
      reportCard: 0,
      noLesson: 0,
      noPrep: 0,
    };

    studentTxs.forEach(tx => {
      const pts = getSignedTransactionPoints(tx);
      if (tx.week >= 1 && tx.week <= 4) {
        weekScores[tx.week] = (weekScores[tx.week] || 0) + pts;
      }

      if (tx.type === 'plus') {
        totalBonusPoints += Math.abs(pts);
      } else {
        totalMinusPoints += Math.abs(pts);
      }

      // Breakdown analysis
      const ruleText = (tx.ruleContent || '').toLowerCase();
      const reasonText = (tx.reason || '').toLowerCase();

      if (ruleText.includes('ngủ') || ruleText.includes('nằm lên bàn')) {
        faultBreakdown.sleeping += tx.quantity || 1;
      }
      if (ruleText.includes('vắng') || ruleText.includes('bỏ tiết')) {
        faultBreakdown.absent += tx.quantity || 1;
      }
      if (ruleText.includes('trễ') || ruleText.includes('muộn')) {
        faultBreakdown.late += tx.quantity || 1;
      }
      if (ruleText.includes('nói chuyện') || ruleText.includes('lộn xộn') || ruleText.includes('vật dụng')) {
        faultBreakdown.disorder += tx.quantity || 1;
      }
      if (ruleText.includes('tác phong') || ruleText.includes('đồng phục') || ruleText.includes('nói tục') || ruleText.includes('điện thoại') || ruleText.includes('đồ ăn')) {
        faultBreakdown.uniform += tx.quantity || 1;
      }
      if (ruleText.includes('kiểm điểm') || reasonText.includes('kiểm điểm')) {
        faultBreakdown.reportCard += tx.quantity || 1;
      }
      if (ruleText.includes('không thuộc bài') || ruleText.includes('đối phó')) {
        faultBreakdown.noLesson += tx.quantity || 1;
      }
      if (ruleText.includes('không chuẩn bị') || ruleText.includes('thiếu bài tập') || ruleText.includes('thiếu đồ dùng')) {
        faultBreakdown.noPrep += tx.quantity || 1;
      }
    });

    const monthTotal = (weekScores[1] || 0) + (weekScores[2] || 0) + (weekScores[3] || 0) + (weekScores[4] || 0);
    // Base average across 4 tracking weeks
    const monthAverage = Math.round(monthTotal / 4);

    const conductRank = getConductRankFromPoints(monthTotal);

    const isTemporary = completedWeeksCount < 4;

    const disciplineFaults = 
      faultBreakdown.sleeping + 
      faultBreakdown.absent + 
      faultBreakdown.late + 
      faultBreakdown.disorder + 
      faultBreakdown.uniform;

    const academicFaults = faultBreakdown.noLesson + faultBreakdown.noPrep;

    return {
      studentId: student.id,
      studentName: student.fullName,
      groupNumber: student.groupNumber,
      position: student.position,
      parentCode: student.parentCode,
      weekScores,
      monthTotal,
      monthAverage,
      conductRank,
      isTemporary,
      disciplineFaults,
      academicFaults,
      reportCardsCount: faultBreakdown.reportCard,
      faultBreakdown,
      totalBonusPoints,
      totalMinusPoints,
    };
  });
}

export interface GroupStanding {
  groupNumber: number;
  groupName: string;
  memberCount: number;
  weekScores: { [week: number]: number };
  memberPointsTotal: number;
  bonusPointsTotal: number;
  grandTotal: number;
  rank: number; // 1, 2, 3, 4
}

export function computeGroupStandings(
  students: Student[] = [],
  transactions: PointTransaction[] = [],
  groupBonuses: GroupBonus[] = [],
  activeMonth: number = 9
): GroupStanding[] {
  const summaries = computeStudentScores(students || [], transactions || [], activeMonth);
  const bonusesList = groupBonuses || [];

  const standings: GroupStanding[] = [1, 2, 3, 4].map(gNum => {
    const groupStudents = summaries.filter(s => s.groupNumber === gNum);
    const bonuses = bonusesList.filter(b => b.month === activeMonth && b.groupNumber === gNum);

    const weekScores: { [week: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let memberPointsTotal = 0;

    groupStudents.forEach(st => {
      for (let w = 1; w <= 4; w++) {
        weekScores[w] = (weekScores[w] || 0) + (st.weekScores[w] || 0);
      }
      memberPointsTotal += st.monthTotal;
    });

    const bonusPointsTotal = bonuses.reduce((sum, b) => sum + (b.bonusPoints || 0), 0);
    const grandTotal = memberPointsTotal + bonusPointsTotal;

    return {
      groupNumber: gNum,
      groupName: `Tổ ${gNum}`,
      memberCount: groupStudents.length,
      weekScores,
      memberPointsTotal,
      bonusPointsTotal,
      grandTotal,
      rank: 0,
    };
  });

  // Sort descending by grand total
  const sorted = [...standings].sort((a, b) => b.grandTotal - a.grandTotal);
  sorted.forEach((g, idx) => {
    const orig = standings.find(s => s.groupNumber === g.groupNumber);
    if (orig) {
      orig.rank = idx + 1;
    }
  });

  return standings.sort((a, b) => a.rank - b.rank);
}
