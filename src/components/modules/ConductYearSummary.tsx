import React, { useMemo, useState } from 'react';
import { CalendarRange, Info, Search, ShieldCheck } from 'lucide-react';
import { FullClassData, UserRole, UserSession } from '../../types';
import {
  ConductRank,
  ConductSemesterResult,
  computeAcademicYearConduct,
} from '../../utils/calculations';

interface ConductYearSummaryProps {
  data: FullClassData;
  userRole?: UserRole;
  session?: UserSession | null;
}

const rankClass: Record<ConductRank, string> = {
  'Tốt': 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'Khá': 'bg-teal-100 text-teal-900 border-teal-300',
  'Đạt': 'bg-amber-100 text-amber-900 border-amber-300',
  'Chưa đạt': 'bg-rose-100 text-rose-900 border-rose-300',
};

const RankBadge: React.FC<{ rank: ConductRank | null; temporary?: boolean }> = ({ rank, temporary }) => (
  rank ? (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${rankClass[rank]}`}>
      {rank}
      {temporary && <span className="text-[9px] font-bold opacity-70">(Tạm)</span>}
    </span>
  ) : (
    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200">
      Chưa có dữ liệu
    </span>
  )
);

const MonthResults: React.FC<{ semester: ConductSemesterResult }> = ({ semester }) => (
  <div className="mt-2 flex flex-wrap justify-center gap-1">
    {semester.months.length === 0 ? (
      <span className="text-[10px] text-slate-400">Chưa đến thời gian đánh giá</span>
    ) : semester.months.map((month) => (
      <span
        key={month.key}
        className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${rankClass[month.rank]}`}
        title={`${month.label}: ${month.totalPoints} điểm • ${month.rank} • Tuần ${month.weekNumbers.join(', ')}`}
      >
        T{month.month}: {month.rank}
      </span>
    ))}
  </div>
);

export const ConductYearSummary: React.FC<ConductYearSummaryProps> = ({
  data,
  userRole = 'guest',
  session,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const summaries = useMemo(
    () => computeAcademicYearConduct(data.students || [], data.transactions || [], data.config),
    [data.students, data.transactions, data.config]
  );
  const semester1Weeks = Math.min(
    Math.max(1, Number(data.config.semester1Weeks) || 18),
    Math.max(1, (Number(data.config.totalWeeks) || 38) - 1)
  );
  const totalWeeks = Math.max(2, Number(data.config.totalWeeks) || 38);

  const visibleSummaries = summaries.filter((summary) => {
    if (userRole === 'parent') return summary.studentId === session?.studentId;
    return !searchQuery.trim()
      || summary.studentName.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Theo Thông tư 22/2021/TT-BGDĐT
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 flex items-center gap-2">
              <CalendarRange className="w-7 h-7 text-amber-300" />
              Tổng hợp rèn luyện học kỳ & cả năm
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed">
              Học kỳ được gợi ý từ kết quả các tháng đã diễn ra. Kết quả cả năm được tính theo đúng tổ hợp HKI–HKII tại Điều 8; GVCN vẫn là người xem xét và xác nhận kết quả chính thức.
            </p>
          </div>

          {userRole !== 'parent' && (
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-emerald-200 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm tên học sinh..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-emerald-200 text-xs outline-none focus:bg-white/15"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm">
          <div className="text-xs font-black text-emerald-950">Học kỳ I</div>
          <div className="text-sm font-bold text-emerald-700 mt-1">Tuần 1 – Tuần {semester1Weeks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Cài đặt bởi GVCN trong mục Cài đặt lớp.</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-teal-100 shadow-sm">
          <div className="text-xs font-black text-teal-950">Học kỳ II</div>
          <div className="text-sm font-bold text-teal-700 mt-1">Tuần {semester1Weeks + 1} – Tuần {totalWeeks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tự động nhận toàn bộ số tuần còn lại của năm học.</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-2.5 text-xs text-sky-950">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-sky-700" />
        <p className="leading-relaxed">
          Mức học kỳ hiển thị là <strong>gợi ý theo mức thấp nhất của các tháng đã đánh giá</strong>: tất cả tháng Tốt → Tốt; không có tháng dưới Khá → Khá; không có tháng dưới Đạt → Đạt; còn lại → Chưa đạt. Đây là công cụ hỗ trợ theo dõi, không thay thế nhận xét và quyết định chuyên môn của GVCN.
        </p>
      </div>

      <div className="bg-white rounded-[24px] p-4 sm:p-6 shadow-sm border border-emerald-100">
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#064e3b] text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-3 text-center w-12">STT</th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3 text-center">Tổ</th>
                <th className="p-3 text-center min-w-[210px]">Học kỳ I</th>
                <th className="p-3 text-center min-w-[210px]">Học kỳ II</th>
                <th className="p-3 text-center min-w-[130px]">Cả năm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {visibleSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    Chưa có học sinh hoặc không tìm thấy kết quả phù hợp.
                  </td>
                </tr>
              ) : visibleSummaries.map((summary) => (
                <tr key={summary.studentId} className="hover:bg-slate-50 align-top">
                  <td className="p-3 text-center font-bold text-slate-400">{summary.orderNumber}</td>
                  <td className="p-3 font-bold text-slate-900 text-sm whitespace-nowrap">{summary.studentName}</td>
                  <td className="p-3 text-center font-semibold text-slate-600">Tổ {summary.groupNumber}</td>
                  <td className="p-3 text-center">
                    <RankBadge rank={summary.semester1.suggestedRank} temporary={!summary.semester1.isComplete} />
                    <MonthResults semester={summary.semester1} />
                  </td>
                  <td className="p-3 text-center">
                    <RankBadge rank={summary.semester2.suggestedRank} temporary={!summary.semester2.isComplete} />
                    <MonthResults semester={summary.semester2} />
                  </td>
                  <td className="p-3 text-center">
                    <RankBadge rank={summary.annualRank} temporary={!summary.isAnnualComplete} />
                    {summary.annualRank && (
                      <div className="text-[9px] text-slate-400 font-medium mt-1">
                        Theo tổ hợp HKI–HKII
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
