import React from 'react';
import { 
  Users, 
  AlertTriangle, 
  BookOpenCheck, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Lock, 
  Unlock, 
  ArrowUpRight,
  HeartHandshake,
  CheckCircle2,
  Calendar,
  Clock,
  PlusCircle,
  Sparkle
} from 'lucide-react';
import { FullClassData } from '../../types';
import { computeStudentScores, computeGroupStandings } from '../../utils/calculations';
import { ModuleTab } from '../Navigation';

interface OverviewModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
  onNavigate: (tab: ModuleTab) => void;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  data,
  selectedMonth,
  selectedWeek,
  onNavigate,
}) => {
  const students = data.students || [];
  const transactions = data.transactions || [];
  const groupBonuses = data.groupBonuses || [];
  const weekLocks = data.weekLocks || [];

  const isWeekLocked = weekLocks.some(wl => wl.month === selectedMonth && wl.week === selectedWeek && wl.isLocked);

  const studentSummaries = computeStudentScores(students, transactions, selectedMonth);
  const groupStandings = computeGroupStandings(students, transactions, groupBonuses, selectedMonth);

  // Total fault counts
  const totalDiscipline = studentSummaries.reduce((sum, s) => sum + s.disciplineFaults, 0);
  const totalAcademic = studentSummaries.reduce((sum, s) => sum + s.academicFaults, 0);
  const totalReportCards = studentSummaries.reduce((sum, s) => sum + s.reportCardsCount, 0);

  // Standout Top Students (Top 5)
  const topStudents = [...studentSummaries].sort((a, b) => b.monthTotal - a.monthTotal).slice(0, 5);

  // Students Needing Attention (Bottom with lowest scores or highest faults)
  const attentionStudents = [...studentSummaries]
    .filter(s => s.monthTotal < 80 || s.disciplineFaults > 2 || s.academicFaults > 2)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Welcome & KPI Highlight Card with Forest Green & Golden Accents */}
      <div className="bg-gradient-to-br from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50 relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 uppercase tracking-wider shadow-sm">
                Tháng {selectedMonth} • Tuần {selectedWeek}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isWeekLocked ? 'bg-rose-900/80 text-rose-200 border border-rose-600/50' : 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/50'
              }`}>
                {isWeekLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {isWeekLocked ? 'Tuần đã khóa' : 'Tuần đang mở'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Bảng Tổng Quan Thi Đua Lớp 11B6
            </h2>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl">
              Theo dõi toàn diện điểm rèn luyện, thi đua giữa các tổ, nề nếp kỷ luật và nhiệm vụ học tập tuần này.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('point_entry')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-950" />
              <span>Ghi nhận điểm ngay</span>
            </button>
            <button
              onClick={() => onNavigate('homework_schedule')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Báo bài tuần</span>
            </button>
          </div>
        </div>

        {/* 4 Core KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-emerald-600/40">
          <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-4 border border-emerald-700/40">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
              <span>Sĩ số lớp</span>
              <Users className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {students.length} <span className="text-xs font-normal text-emerald-300">học sinh</span>
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-1">4 Tổ thi đua đồng đều</div>
          </div>

          <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-4 border border-emerald-700/40">
            <div className="flex items-center justify-between text-amber-300 text-xs font-semibold">
              <span>Tổng lỗi rèn luyện</span>
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2">
              {totalDiscipline} <span className="text-xs font-normal text-emerald-200">lượt</span>
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-1">Gồm trễ, ngủ, nề nếp</div>
          </div>

          <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-4 border border-emerald-700/40">
            <div className="flex items-center justify-between text-teal-300 text-xs font-semibold">
              <span>Tổng lỗi học tập</span>
              <BookOpenCheck className="w-4 h-4 text-teal-300" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {totalAcademic} <span className="text-xs font-normal text-emerald-200">lượt</span>
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-1">Không thuộc / thiếu bài</div>
          </div>

          <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-4 border border-emerald-700/40">
            <div className="flex items-center justify-between text-rose-300 text-xs font-semibold">
              <span>Bản kiểm điểm</span>
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-300 mt-2">
              {totalReportCards} <span className="text-xs font-normal text-emerald-200">bản</span>
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-1">Thống kê lưu hồ sơ GVCN</div>
          </div>
        </div>
      </div>

      {/* Group Competitions Standings Strip */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-emerald-950 tracking-tight">
              Bảng Xếp Hạng Thi Đua 4 Tổ (Tháng {selectedMonth})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('group_competition')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Chi tiết bục vinh quang</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupStandings.map((g) => {
            const rankStyles = [
              { label: 'Hạng 1', bg: 'bg-amber-50 border-amber-300 text-amber-950', badge: 'bg-amber-400 text-amber-950' },
              { label: 'Hạng 2', bg: 'bg-slate-50 border-slate-300 text-slate-900', badge: 'bg-slate-300 text-slate-800' },
              { label: 'Hạng 3', bg: 'bg-orange-50 border-orange-200 text-orange-950', badge: 'bg-orange-300 text-orange-950' },
              { label: 'Hạng 4', bg: 'bg-emerald-50/50 border-emerald-200 text-emerald-950', badge: 'bg-emerald-200 text-emerald-900' },
            ][g.rank - 1] || { label: `Hạng ${g.rank}`, bg: 'bg-slate-50 border-slate-200 text-slate-900', badge: 'bg-slate-200 text-slate-700' };

            return (
              <div
                key={g.groupNumber}
                className={`p-4 rounded-2xl border transition hover:shadow-md ${rankStyles.bg}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-base">{g.groupName}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${rankStyles.badge}`}>
                    {rankStyles.label}
                  </span>
                </div>
                <div className="text-3xl font-black tracking-tight mt-2">
                  {g.grandTotal} <span className="text-xs font-normal text-slate-500">điểm</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2 border-t border-slate-200/60">
                  <span>Cá nhân: {g.memberPointsTotal}đ</span>
                  <span className="font-semibold text-emerald-700">+Thưởng: {g.bonusPointsTotal}đ</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Standout Honored Students & Students Needing Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Standout Students */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base sm:text-lg font-black text-emerald-950">
                Gương Mặt Nổi Bật (Điểm Rèn Luyện Cao)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('individual_conduct')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>Xem cả lớp</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topStudents.map((st, idx) => (
              <div
                key={st.studentId}
                className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-400 text-emerald-950' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-300 text-orange-950' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-emerald-950">{st.studentName}</div>
                    <div className="text-xs text-slate-500">
                      Tổ {st.groupNumber} {st.position !== 'Thành viên' && `• ${st.position}`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block font-black text-emerald-800 text-base">
                    +{st.monthTotal}đ
                  </span>
                  <div className="text-[11px] font-bold text-emerald-600">
                    Xếp loại: {st.conductRank}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Students Needing Attention */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-rose-500" />
              <h3 className="text-base sm:text-lg font-black text-emerald-950">
                Học Sinh Cần Lưu Ý & Động Viên
              </h3>
            </div>
            <button
              onClick={() => onNavigate('discipline_violations')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
            >
              <span>Xem vi phạm</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {attentionStudents.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              Lớp 11B6 đang duy trì nề nếp rèn luyện rất tốt!
            </div>
          ) : (
            <div className="space-y-2.5">
              {attentionStudents.map((st) => (
                <div
                  key={st.studentId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 hover:bg-rose-50 border border-rose-100 transition"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900">{st.studentName}</div>
                    <div className="text-xs text-rose-700 font-medium">
                      Tổ {st.groupNumber} • Lỗi nề nếp: {st.disciplineFaults} | Lỗi học tập: {st.academicFaults}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-700 text-sm">
                      {st.monthTotal}đ
                    </span>
                    <div className="text-[11px] text-slate-500 font-medium">
                      TB: {st.monthAverage}đ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
