import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Clock, 
  UserX, 
  Moon, 
  Volume2, 
  Shirt, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { FullClassData, Student, PointTransaction } from '../../types';
import { computeStudentScores } from '../../utils/calculations';

interface DisciplineViolationsModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
}

export const DisciplineViolationsModule: React.FC<DisciplineViolationsModuleProps> = ({
  data,
  selectedMonth,
  selectedWeek,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  const students = data.students || [];
  const transactions = data.transactions || [];

  const studentSummaries = computeStudentScores(students, transactions, selectedMonth);

  // Totals for summary KPI cards
  const totalSleeping = studentSummaries.reduce((sum, s) => sum + s.faultBreakdown.sleeping, 0);
  const totalAbsent = studentSummaries.reduce((sum, s) => sum + s.faultBreakdown.absent, 0);
  const totalLate = studentSummaries.reduce((sum, s) => sum + s.faultBreakdown.late, 0);
  const totalDisorder = studentSummaries.reduce((sum, s) => sum + s.faultBreakdown.disorder, 0);
  const totalUniform = studentSummaries.reduce((sum, s) => sum + s.faultBreakdown.uniform, 0);
  const totalReportCards = studentSummaries.reduce((sum, s) => sum + s.reportCardsCount, 0);

  // Filter list
  const filteredSummaries = studentSummaries.filter(s => {
    const matchesGroup = selectedGroup === 'all' || s.groupNumber === selectedGroup;
    const matchesSearch = !searchQuery || s.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Get transactions for modal inspector
  const studentTxs = detailStudent
    ? transactions.filter(t => t.studentId === detailStudent.id && t.month === selectedMonth && t.type === 'minus')
    : [];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
            Nề Nếp & Kỷ Luật Tháng {selectedMonth}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
            <span>Thống Kê Vi Phạm Rèn Luyện</span>
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Dữ liệu tự động tổng hợp từ nhật ký ghi nhận điểm tuần, minh bạch và có thể truy xuất từng lần vi phạm.
          </p>
        </div>
      </div>

      {/* 6 Core Violation KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Ngủ trong giờ</span>
            <Moon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{totalSleeping}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">lượt trong tháng</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Vắng học</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{totalAbsent}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">có phép & không phép</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Đi trễ</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{totalLate}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">sau tiếng trống</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Mất trật tự</span>
            <Volume2 className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{totalDisorder}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">bị nhắc nhở</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Sai tác phong</span>
            <Shirt className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{totalUniform}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">đồng phục, phù hiệu</div>
        </div>

        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Bản kiểm điểm</span>
            <FileText className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-800 mt-2">{totalReportCards}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">thống kê hồ sơ</div>
        </div>

      </div>

      {/* Main Violation Roster Table */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
        
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedGroup === 'all' ? 'bg-amber-400 text-emerald-950' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Tất cả ({studentSummaries.length})
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

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên học sinh..."
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
                <th className="p-3 text-center">Ngủ giờ</th>
                <th className="p-3 text-center">Vắng</th>
                <th className="p-3 text-center">Đi trễ</th>
                <th className="p-3 text-center">Mất trật tự</th>
                <th className="p-3 text-center">Tác phong</th>
                <th className="p-3 text-center">Bản kiểm điểm</th>
                <th className="p-3 text-center font-black">Tổng vi phạm</th>
                <th className="p-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredSummaries.map(s => {
                const rawStudent = students.find(st => st.id === s.studentId);

                return (
                  <tr key={s.studentId} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                      {s.studentName}
                    </td>
                    <td className="p-3 font-medium text-slate-600 whitespace-nowrap">
                      Tổ {s.groupNumber}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      {s.faultBreakdown.sleeping > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                          {s.faultBreakdown.sleeping}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      {s.faultBreakdown.absent > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                          {s.faultBreakdown.absent}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      {s.faultBreakdown.late > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          {s.faultBreakdown.late}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      {s.faultBreakdown.disorder > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold">
                          {s.faultBreakdown.disorder}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      {s.faultBreakdown.uniform > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                          {s.faultBreakdown.uniform}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      {s.reportCardsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-950 font-black">
                          {s.reportCardsCount}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-center font-black text-rose-700 text-sm">
                      {s.disciplineFaults}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setDetailStudent(rawStudent || null)}
                        className="px-2.5 py-1 rounded-lg text-emerald-800 hover:bg-emerald-50 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem nguồn</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-xl w-full p-6 shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Truy xuất nguồn gốc vi phạm</span>
                <h3 className="text-lg font-black text-emerald-950">
                  Học sinh: {detailStudent.fullName} (Tổ {detailStudent.groupNumber})
                </h3>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
              {studentTxs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Không có bản ghi vi phạm nào trong Tháng {selectedMonth}.
                </div>
              ) : (
                studentTxs.map(t => (
                  <div key={t.id} className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-rose-900">
                      <span>{t.ruleContent} (x{t.quantity})</span>
                      <span>{t.totalPoints}đ</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span>{t.dayOfWeek}, Tuần {t.week} {t.reason && `• Lý do: "${t.reason}"`}</span>
                      <span className="text-slate-400">Ghi bởi: {t.createdBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2 rounded-xl bg-[#064e3b] text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
