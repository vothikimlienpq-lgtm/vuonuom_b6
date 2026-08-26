import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Printer, X } from 'lucide-react';
import { DayOfWeek, FullClassData, PointTransaction, Student } from '../types';
import {
  computeAcademicYearConduct,
  computeStudentScores,
  formatSignedPoints,
  getSignedTransactionPoints,
} from '../utils/calculations';
import { getWeekDateRange } from '../utils/dateUtils';

type ReportScope = 'week' | 'month' | 'semester' | 'year';

interface ParentReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
}

const DAY_INDEX: Record<DayOfWeek, number> = {
  'Thứ 2': 0,
  'Thứ 3': 1,
  'Thứ 4': 2,
  'Thứ 5': 3,
  'Thứ 6': 4,
  'Thứ 7': 5,
};

const getTransactionDate = (transaction: PointTransaction, week1StartDate?: string): Date => {
  const weekInfo = getWeekDateRange(week1StartDate, Number(transaction.week) || 1);
  const result = new Date(weekInfo.monday);
  result.setDate(result.getDate() + (DAY_INDEX[transaction.dayOfWeek] ?? 0));
  return result;
};

const formatDate = (date: Date): string => date.toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const ParentReportPrintModal: React.FC<ParentReportPrintModalProps> = ({
  isOpen,
  onClose,
  students,
  data,
  selectedMonth,
  selectedWeek,
}) => {
  const [printDate, setPrintDate] = useState(() => new Date());
  const [reportScope, setReportScope] = useState<ReportScope>('month');

  useEffect(() => {
    if (isOpen) {
      setPrintDate(new Date());
      setReportScope('month');
    }
  }, [isOpen]);

  const allStudents = data.students || [];
  const allTransactions = data.transactions || [];
  const config = data.config;
  const totalWeeks = Math.max(2, Number(config.totalWeeks) || 38);
  const semester1Weeks = Math.min(Math.max(1, Number(config.semester1Weeks) || 18), totalWeeks - 1);
  const selectedSemester: 1 | 2 = selectedWeek <= semester1Weeks ? 1 : 2;
  const semesterStartWeek = selectedSemester === 1 ? 1 : semester1Weeks + 1;
  const semesterEndWeek = selectedSemester === 1 ? semester1Weeks : totalWeeks;

  const reportLabel = reportScope === 'week'
    ? `TUẦN ${selectedWeek}`
    : reportScope === 'month'
      ? `THÁNG ${selectedMonth}`
      : reportScope === 'semester'
        ? `HỌC KỲ ${selectedSemester === 1 ? 'I' : 'II'}`
        : 'CẢ NĂM HỌC';

  const reportTransactions = useMemo(() => allTransactions.filter((transaction) => {
    if (reportScope === 'week') {
      return transaction.week === selectedWeek && transaction.month === selectedMonth;
    }
    if (reportScope === 'month') return transaction.month === selectedMonth;
    if (reportScope === 'semester') {
      return transaction.week >= semesterStartWeek && transaction.week <= semesterEndWeek;
    }
    return transaction.week >= 1 && transaction.week <= totalWeeks;
  }), [allTransactions, reportScope, selectedWeek, selectedMonth, semesterStartWeek, semesterEndWeek, totalWeeks]);

  const monthlySummaries = useMemo(
    () => computeStudentScores(allStudents, allTransactions, selectedMonth),
    [allStudents, allTransactions, selectedMonth]
  );
  const annualSummaries = useMemo(
    () => computeAcademicYearConduct(allStudents, allTransactions, config),
    [allStudents, allTransactions, config]
  );

  if (!isOpen) return null;

  const configuredTeacher = String(config.teacherName || '').trim();
  const teacherName = configuredTeacher && configuredTeacher.toLowerCase() !== 'chưa cập nhật'
    ? configuredTeacher
    : 'Chưa cập nhật tên GVCN';
  const educationDepartment = String(config.educationDepartment || '').trim();
  const educationDepartmentForPrint = educationDepartment
    ? educationDepartment.toLocaleUpperCase('vi-VN')
    : 'SỞ GIÁO DỤC VÀ ĐÀO TẠO: CHƯA CẬP NHẬT';
  const province = String(config.province || '').trim() || 'CHƯA CẬP NHẬT TỈNH/THÀNH PHỐ';

  const handlePrint = () => {
    setPrintDate(new Date());
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pb-4 pt-32 bg-emerald-950/80 backdrop-blur-sm overflow-y-auto print:p-0">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md px-4 sm:px-5 py-3 rounded-3xl shadow-2xl border border-emerald-200 flex flex-wrap items-center justify-center gap-2.5 no-print w-[calc(100%-2rem)] sm:w-auto">
        <span className="text-xs font-bold text-emerald-950 whitespace-nowrap">Xem trước A4 ({students.length} phiếu)</span>
        <label className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
          <CalendarRange className="w-4 h-4 text-emerald-800" />
          <span className="text-[11px] font-bold text-slate-600">Phạm vi</span>
          <select
            value={reportScope}
            onChange={(event) => setReportScope(event.target.value as ReportScope)}
            className="bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs font-black text-emerald-950 outline-none"
            aria-label="Chọn phạm vi phiếu theo dõi"
          >
            <option value="week">Theo tuần {selectedWeek}</option>
            <option value="month">Theo tháng {selectedMonth}</option>
            <option value="semester">Theo học kỳ {selectedSemester === 1 ? 'I' : 'II'}</option>
            <option value="year">Theo cả năm học</option>
          </select>
        </label>
        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#064e3b] hover:bg-[#095c47] text-amber-300 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer">
          <Printer className="w-4 h-4" />
          <span>In phạm vi đang chọn</span>
        </button>
        <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-8 w-full max-w-4xl space-y-8 print:m-0 print:w-full print:max-w-none print-container">
        {students.map((student) => {
          const monthlySummary = monthlySummaries.find((summary) => summary.studentId === student.id);
          const annualSummary = annualSummaries.find((summary) => summary.studentId === student.id);
          const studentTransactions = reportTransactions
            .filter((transaction) => transaction.studentId === student.id)
            .sort((first, second) => {
              const firstDate = getTransactionDate(first, config.week1StartDate).getTime();
              const secondDate = getTransactionDate(second, config.week1StartDate).getTime();
              if (firstDate !== secondDate) return firstDate - secondDate;
              return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
            });

          const plusTransactions = studentTransactions.filter((transaction) => transaction.type === 'plus');
          const minusTransactions = studentTransactions.filter((transaction) => transaction.type === 'minus');
          const netPoints = studentTransactions.reduce((total, transaction) => total + getSignedTransactionPoints(transaction), 0);
          const semesterSummary = selectedSemester === 1 ? annualSummary?.semester1 : annualSummary?.semester2;
          const conductRank = reportScope === 'month'
            ? monthlySummary?.conductRank
            : reportScope === 'semester'
              ? semesterSummary?.suggestedRank
              : reportScope === 'year'
                ? annualSummary?.annualRank
                : null;
          const isTemporary = reportScope === 'month'
            ? Boolean(monthlySummary?.isTemporary)
            : reportScope === 'semester'
              ? !semesterSummary?.isComplete
              : reportScope === 'year'
                ? !annualSummary?.isAnnualComplete
                : false;

          return (
            <div key={student.id} className="bg-white p-8 sm:p-10 rounded-[20px] shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-6 print:rounded-none page-break">
              <div className="flex items-start justify-between border-b-2 border-emerald-900 pb-4 mb-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{educationDepartmentForPrint}</div>
                  <div className="text-sm font-black uppercase text-[#064e3b]">{config.schoolName || 'CHƯA CẬP NHẬT TRƯỜNG'}</div>
                  <div className="text-[11px] font-semibold text-slate-500">LỚP: {config.className || config.id.toUpperCase()} • NĂM HỌC {config.academicYear || 'CHƯA CẬP NHẬT'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-700">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="text-[10px] italic text-slate-500">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{student.parentCode ? `Mã tra cứu: ${student.parentCode}` : ''}</div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-lg sm:text-xl font-black text-[#064e3b] uppercase tracking-wide">PHIẾU THEO DÕI KẾT QUẢ RÈN LUYỆN & HỌC TẬP</h1>
                <div className="text-xs font-bold text-amber-700 mt-1">{reportLabel} • NĂM HỌC {config.academicYear || 'CHƯA CẬP NHẬT'}</div>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 mb-6 text-xs text-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><span className="text-slate-500">Họ và tên:</span><div className="font-bold text-sm text-[#064e3b]">{student.fullName}</div></div>
                <div><span className="text-slate-500">STT / Tổ thi đua:</span><div className="font-bold">#{student.orderNumber} • Tổ {student.groupNumber}</div></div>
                <div><span className="text-slate-500">Chức vụ trong lớp:</span><div className="font-bold">{student.position}</div></div>
                <div><span className="text-slate-500">GVCN phụ trách:</span><div className="font-bold">{teacherName}</div></div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2">1. Tổng hợp theo phạm vi {reportLabel.toLocaleLowerCase('vi-VN')}:</h3>
                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-center">
                    <thead className="bg-[#064e3b] text-white"><tr>
                      <th className="p-2 border-r border-emerald-700">Lượt khen thưởng</th>
                      <th className="p-2 border-r border-emerald-700">Lượt vi phạm</th>
                      <th className="p-2 border-r border-emerald-700">Điểm phát sinh</th>
                      <th className="p-2">Kết quả rèn luyện</th>
                    </tr></thead>
                    <tbody><tr>
                      <td className="p-2.5 border-r border-slate-200 font-bold text-emerald-700">{plusTransactions.length}</td>
                      <td className="p-2.5 border-r border-slate-200 font-bold text-rose-700">{minusTransactions.length}</td>
                      <td className="p-2.5 border-r border-slate-200 font-black text-sm text-[#064e3b]">{formatSignedPoints(netPoints, 'đ')}</td>
                      <td className="p-2.5 font-black text-sm text-emerald-800">{conductRank ? `${conductRank}${isTemporary ? ' (Tạm)' : ''}` : 'Theo dõi trong tuần'}</td>
                    </tr></tbody>
                  </table>
                </div>
                {reportScope !== 'month' && <p className="text-[10px] text-slate-500 mt-1.5 italic">Điểm phát sinh là tổng điểm cộng/trừ trong phạm vi đã chọn; kết quả học kỳ và cả năm là kết quả gợi ý để GVCN xem xét theo quy định.</p>}
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2">2. Nhật ký khen thưởng / vi phạm theo thứ tự ngày 1 đến ngày n:</h3>
                {studentTransactions.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">Không có giao dịch điểm trong phạm vi {reportLabel.toLocaleLowerCase('vi-VN')}.</div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700"><tr>
                        <th className="p-2 w-[18%]">Ngày ghi nhận</th>
                        <th className="p-2 w-[31%]">Nội dung khen thưởng / vi phạm</th>
                        <th className="p-2 w-[12%]">Phân loại</th>
                        <th className="p-2 text-center w-[9%]">Điểm</th>
                        <th className="p-2 w-[30%]">Chi tiết môn học / hình thức / lý do</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentTransactions.map((transaction) => {
                          const occurrenceDate = getTransactionDate(transaction, config.week1StartDate);
                          const details = [
                            transaction.subject ? `Môn: ${transaction.subject}` : '',
                            transaction.examType ? `Hình thức: ${transaction.examType}` : '',
                            transaction.reason ? `Lý do: ${transaction.reason}` : '',
                          ].filter(Boolean);
                          return (
                            <tr key={transaction.id}>
                              <td className="p-2 text-slate-600 align-top">
                                <div className="font-bold text-slate-800">{formatDate(occurrenceDate)}</div>
                                <div>{transaction.dayOfWeek} • Tuần {transaction.week}{formatTime(transaction.createdAt) ? ` • ${formatTime(transaction.createdAt)}` : ''}</div>
                              </td>
                              <td className="p-2 font-medium text-slate-900 align-top">{transaction.ruleContent}</td>
                              <td className={`p-2 font-bold align-top ${transaction.type === 'plus' ? 'text-emerald-700' : 'text-rose-700'}`}>{transaction.type === 'plus' ? 'Khen thưởng' : 'Vi phạm'}</td>
                              <td className={`p-2 text-center font-bold align-top ${transaction.type === 'plus' ? 'text-emerald-700' : 'text-rose-700'}`}>{formatSignedPoints(getSignedTransactionPoints(transaction), 'đ')}</td>
                              <td className="p-2 text-slate-600 align-top">{details.length ? details.join(' • ') : 'Không có ghi chú bổ sung'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mb-8 p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider mb-1">3. Nhận xét của Giáo viên chủ nhiệm:</div>
                <div className="h-12 border-b border-dashed border-slate-300" />
              </div>

              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
                <div>
                  <div className="font-bold text-slate-800 uppercase">Ý KIẾN & CHỮ KÝ PHỤ HUYNH</div>
                  <div className="text-[10px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
                  <div className="h-20" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 italic mb-1">{province}, ngày {printDate.getDate()} tháng {printDate.getMonth() + 1} năm {printDate.getFullYear()}</div>
                  <div className="font-bold text-slate-800 uppercase">GIÁO VIÊN CHỦ NHIỆM</div>
                  <div className="text-[10px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-emerald-950 text-sm">{teacherName}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
