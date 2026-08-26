import React, { useState } from 'react';
import { 
  BookOpenCheck, 
  Search, 
  Filter, 
  Sparkles, 
  GraduationCap, 
  AlertCircle, 
  TrendingUp,
  BookOpen,
  Award,
  Calendar
} from 'lucide-react';
import { FullClassData } from '../../types';
import { computeStudentScores } from '../../utils/calculations';

interface AcademicMonitoringModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
  onSelectMonth: (month: number) => void;
}

export const AcademicMonitoringModule: React.FC<AcademicMonitoringModuleProps> = ({
  data,
  selectedMonth,
  selectedWeek,
  onSelectMonth,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const students = data.students || [];
  const transactions = data.transactions || [];
  const subjects = data.config?.subjects || [];

  const studentSummaries = computeStudentScores(students, transactions, selectedMonth);

  // Filter transactions for academic metrics
  const academicTxs = transactions.filter(t => {
    const isAcademic = 
      t.ruleContent.toLowerCase().includes('bài') || 
      t.ruleContent.toLowerCase().includes('điểm') || 
      t.ruleContent.toLowerCase().includes('phát biểu') ||
      t.subject;
    const matchesMonth = t.month === selectedMonth;
    const matchesSubject = selectedSubject === 'all' || t.subject === selectedSubject;
    return isAcademic && matchesMonth && matchesSubject;
  });

  const totalNoLesson = academicTxs.filter(t => t.ruleContent.toLowerCase().includes('không thuộc')).length;
  const totalNoPrep = academicTxs.filter(t => t.ruleContent.toLowerCase().includes('chuẩn bị') || t.ruleContent.toLowerCase().includes('thiếu')).length;
  const totalGoodScores = academicTxs.filter(t => t.type === 'plus' && t.ruleContent.toLowerCase().includes('điểm')).length;
  const totalSpeaking = academicTxs.filter(t => t.type === 'plus' && t.ruleContent.toLowerCase().includes('phát biểu')).length;

  const filteredSummaries = studentSummaries.filter(s => {
    const matchesGroup = selectedGroup === 'all' || s.groupNumber === selectedGroup;
    const matchesSearch = !searchQuery || s.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
            Chuyên Cần & Thành Tích Học Tập Tháng {selectedMonth}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            <BookOpenCheck className="w-7 h-7 text-amber-400" />
            <span>Theo Dõi Năng Suất & Học Tập</span>
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Tổng hợp tình hình phát biểu, làm bài tập về nhà, trả bài miệng và điểm số cao của từng thành viên.
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-bold text-white shrink-0">
          <Calendar className="h-4 w-4 text-amber-300" />
          <span>Xem tháng</span>
          <select
            value={selectedMonth}
            onChange={(event) => onSelectMonth(Number(event.target.value))}
            className="rounded-lg border border-emerald-600 bg-emerald-950 px-2 py-1 font-black text-white outline-none"
            aria-label="Chọn tháng xem theo dõi học tập"
          >
            {[8, 9, 10, 11, 12, 1, 2, 3, 4, 5].map((month) => (
              <option key={month} value={month}>Tháng {month}</option>
            ))}
          </select>
        </label>
      </div>

      {/* 4 Academic KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Điểm 9 - 10 tốt</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-2">
            {totalGoodScores} <span className="text-xs text-slate-400 font-normal">lượt</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">Được cộng điểm rèn luyện</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>Phát biểu xây dựng</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {totalSpeaking} <span className="text-xs text-slate-400 font-normal">lượt</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Tích cực trong tiết học</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Không thuộc bài</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
            {totalNoLesson} <span className="text-xs text-slate-400 font-normal">lượt</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Khảo bài miệng đầu giờ</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-orange-800 text-xs font-bold">
            <span>Thiếu bài / Dụng cụ</span>
            <AlertCircle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-700 mt-2">
            {totalNoPrep} <span className="text-xs text-slate-400 font-normal">lượt</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Chưa hoàn thành BTVN</div>
        </div>

      </div>

      {/* Roster & Academic History Table */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
        
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedGroup === 'all' ? 'bg-amber-400 text-emerald-950' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Tất cả tổ
              </button>
              {[1, 2, 3, 4].map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedGroup === g ? 'bg-amber-400 text-emerald-950' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Tổ {g}
                </button>
              ))}
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#064e3b] text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-3">Học sinh</th>
                <th className="p-3">Tổ</th>
                <th className="p-3 text-center">Không thuộc bài</th>
                <th className="p-3 text-center">Thiếu chuẩn bị / BTVN</th>
                <th className="p-3 text-center font-black">Tổng lỗi học tập</th>
                <th className="p-3 text-right">Đánh giá chung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredSummaries.map(s => (
                <tr key={s.studentId} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                    {s.studentName}
                  </td>
                  <td className="p-3 font-medium text-slate-600 whitespace-nowrap">
                    Tổ {s.groupNumber}
                  </td>
                  <td className="p-3 text-center font-semibold text-slate-700">
                    {s.faultBreakdown.noLesson > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                        {s.faultBreakdown.noLesson}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-center font-semibold text-slate-700">
                    {s.faultBreakdown.noPrep > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold">
                        {s.faultBreakdown.noPrep}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-center font-black text-rose-700 text-sm">
                    {s.academicFaults}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {s.academicFaults === 0 ? (
                      <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                        ✓ Rất tốt
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md">
                        Cần đôn đốc
                      </span>
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
