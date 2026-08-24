import { PointTransaction, GroupBonus, Student } from '../types';

export interface StudentScoreSummary {
  studentId: string;
  studentName: string;
  groupNumber: number;
  position: string;
  parentCode?: string;
  weekScores: { [week: number]: number };
  monthTotal: number;
  monthAverage: number;
  conductRank: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
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

    let conductRank: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' = 'Chưa đạt';
    if (monthTotal >= 200) conductRank = 'Tốt';
    else if (monthTotal >= 100) conductRank = 'Khá';
    else if (monthTotal >= 51) conductRank = 'Đạt';
    else conductRank = 'Chưa đạt';

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
