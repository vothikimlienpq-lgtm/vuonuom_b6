import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Printer, 
  FileText, 
  Sparkles, 
  Eye, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle,
  Download,
  GraduationCap,
  Calendar,
  BookOpen,
  Send,
  MessageSquareQuote,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { FullClassData, Student, UserRole, UserSession } from '../../types';
import { ModuleTab } from '../Navigation';
import { computeStudentScores, StudentScoreSummary } from '../../utils/calculations';
import { ParentReportPrintModal } from '../ParentReportPrintModal';
import { useToast } from '../Toast';

interface IndividualConductModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
  userRole?: UserRole;
  session?: UserSession | null;
  onNavigate?: (tab: ModuleTab) => void;
}

export const IndividualConductModule: React.FC<IndividualConductModuleProps> = ({
  data,
  selectedMonth,
  selectedWeek,
  userRole = 'guest',
  session,
  onNavigate,
}) => {
  const { success } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [selectedRank, setSelectedRank] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'total'>('order');
  const [sortAsc, setSortAsc] = useState(true);

  // Student Detail Modal & Print Modal
  const [activeDetailStudent, setActiveDetailStudent] = useState<StudentScoreSummary | null>(null);
  const [printStudents, setPrintStudents] = useState<Student[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const students = data.students || [];
  const transactions = data.transactions || [];
  const homeworkTasks = data.homeworkTasks || [];

  const studentSummaries = computeStudentScores(students, transactions, selectedMonth);

  // -------------------------------------------------------------
  // PARENT EXCLUSIVE VIEW: Strictly shows ONLY the parent's child
  // -------------------------------------------------------------
  if (userRole === 'parent') {
    const student = students.find(s => s.id === session?.studentId) || students[0];

    if (!student) {
      return (
        <div className="bg-white rounded-[28px] p-8 text-center shadow-sm border border-emerald-100 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Không tìm thấy hồ sơ học sinh</h3>
          <p className="text-sm text-slate-500 mt-2">
            Vui lòng kiểm tra lại Mã Phụ Huynh hoặc liên hệ Giáo viên chủ nhiệm để được hỗ trợ.
          </p>
        </div>
      );
    }

    const summary = studentSummaries.find(s => s.studentId === student.id);
    const studentTxs = transactions.filter(
      t => t.studentId === student.id && t.month === selectedMonth
    );
    const todayHomework = homeworkTasks.filter(
      h => h.month === selectedMonth && h.week === selectedWeek
    );

    const rankBadgeColor = {
      'Tốt': 'bg-emerald-100 text-emerald-950 border-emerald-300',
      'Khá': 'bg-teal-100 text-teal-950 border-teal-300',
      'Đạt': 'bg-amber-100 text-amber-950 border-amber-300',
      'Chưa đạt': 'bg-rose-100 text-rose-950 border-rose-300',
    }[summary?.conductRank || ''] || 'bg-slate-100 text-slate-800';

    return (
      <div className="space-y-6">
        
        {/* Parent Banner */}
        <div className="bg-gradient-to-br from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cổng Tra Cứu Phụ Huynh • Bảo Mật Riêng Tư</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <GraduationCap className="w-8 h-8 text-amber-300" />
              <span>Hồ Sơ Rèn Luyện: Em {student.fullName}</span>
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1.5 font-medium">
              Lớp {data.config?.className || '11B6'} • STT: {student.orderNumber} • Tổ {student.groupNumber} • GVCN: {data.config?.teacherName || 'Cô Võ Thị Kim Liên'}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setPrintStudents([student]);
                setShowPrintModal(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-950" />
              <span>In phiếu rèn luyện A4 của con</span>
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('homework_schedule')}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>Xem Báo bài & TKB</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Score Highlight Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-[24px] p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Tổng điểm Tháng {selectedMonth}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-[#064e3b] mt-2">
                +{summary.monthTotal}đ
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-medium">
                Khởi điểm: +200đ mỗi tháng
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
              <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                Điểm TB mỗi tuần
              </div>
              <div className="text-3xl sm:text-4xl font-black text-teal-900 mt-2">
                {summary.monthAverage}đ
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-medium">
                Mục tiêu duy trì: ≥50đ/tuần
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Xếp loại rèn luyện
              </div>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-xl text-base sm:text-lg font-black border ${rankBadgeColor}`}>
                  {summary.conductRank}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-medium">
                Quy chế: Tốt (≥200đ) • Khá (100-199đ)
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                Lỗi vi phạm / Khen thưởng
              </div>
              <div className="text-3xl sm:text-4xl font-black text-rose-800 mt-2">
                {summary.disciplineFaults + summary.academicFaults}
                <span className="text-xs font-semibold text-slate-500 ml-1.5">lần vi phạm</span>
              </div>
              <div className="text-[11px] text-emerald-800 font-semibold mt-2">
                ✓ {studentTxs.filter(t => t.type === 'plus').length} lần được biểu dương
              </div>
            </div>
          </div>
        )}

        {/* Weekly Breakdown Grid */}
        {summary && (
          <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-xs border border-emerald-100">
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider mb-3">
              📊 Diễn biến điểm rèn luyện 4 tuần trong Tháng {selectedMonth}:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(w => (
                <div key={w} className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                  <div className="text-xs font-bold text-slate-500 uppercase">Tuần {w}</div>
                  <div className="text-2xl font-black text-[#064e3b] mt-1">
                    +{summary.weekScores[w] || 0}đ
                  </div>
                  <div className="text-[10px] text-emerald-800 font-medium mt-1">
                    {(summary.weekScores[w] || 0) >= 50 ? '✓ Đạt chuẩn tuần' : 'Cần phấn đấu thêm'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Points & Violations Log for this child */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-xs border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">
              📝 Nhật ký ghi nhận điểm & nề nếp Tháng {selectedMonth}:
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Tổng {studentTxs.length} lượt ghi nhận
            </span>
          </div>

          {studentTxs.length === 0 ? (
            <div className="text-center py-8 bg-emerald-50/40 rounded-2xl border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-950">
                Em {student.fullName} thực hiện nề nếp rất tốt!
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Chưa có phát sinh vi phạm nào trong Tháng {selectedMonth}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#064e3b] text-white uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Nội dung rèn luyện</th>
                    <th className="p-3">Môn / Tiết</th>
                    <th className="p-3">Lý do / Chi tiết</th>
                    <th className="p-3 text-center">Số lượng</th>
                    <th className="p-3 text-right">Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {studentTxs.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                        {t.dayOfWeek}, Tuần {t.week}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {t.ruleContent}
                      </td>
                      <td className="p-3 text-slate-600">
                        {t.subject ? `Môn ${t.subject}` : '—'}
                      </td>
                      <td className="p-3 text-slate-600 italic">
                        {t.reason ? `"${t.reason}"` : '—'}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        x{t.quantity}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <span className={`font-black text-sm ${t.type === 'plus' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {t.type === 'plus' ? `+${t.totalPoints}` : `${t.totalPoints}`}đ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Homework Summary Preview for this week */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-xs border border-emerald-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Nhiệm vụ học tập & Báo bài Tuần {selectedWeek}:</span>
            </h3>
            {onNavigate && (
              <button
                onClick={() => onNavigate('homework_schedule')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem thời khóa biểu đầy đủ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {todayHomework.length === 0 ? (
            <div className="text-center py-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
              Không có bài tập về nhà đặc biệt cần nộp trong tuần này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayHomework.map(h => (
                <div key={h.id} className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span className="text-[#064e3b]">[{h.subject}] {h.title}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{h.dayOfWeek}</span>
                  </div>
                  <p className="text-slate-700 mt-1">{h.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Official Teacher Contact & Consultation Notice */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-xs border border-amber-200">
          <div className="flex items-center gap-2 mb-2 text-sm font-black text-amber-950 uppercase">
            <MessageSquareQuote className="w-5 h-5 text-amber-700" />
            <span>Kênh liên lạc & Trao đổi chính thức với Giáo viên chủ nhiệm:</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Để đảm bảo thông tin liên lạc kịp thời và bảo mật, Quý phụ huynh cần xin phép vắng hoặc trao đổi tình hình học tập xin vui lòng liên hệ trực tiếp với GVCN Cô Võ Thị Kim Liên qua số điện thoại/Zalo cá nhân hoặc sổ liên lạc điện tử của nhà trường.
          </p>
        </div>

        {/* Print Modal */}
        {showPrintModal && (
          <ParentReportPrintModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            students={printStudents}
            data={data}
            selectedMonth={selectedMonth}
            selectedWeek={selectedWeek}
          />
        )}

      </div>
    );
  }

  // -------------------------------------------------------------
  // STANDARD VIEW (GVCN, BCS, GUEST): Dynamic student roster & scoring
  // -------------------------------------------------------------

  // Filter and sort for standard view
  const filtered = studentSummaries.filter(s => {
    const matchesGroup = selectedGroup === 'all' || s.groupNumber === selectedGroup;
    const matchesRank = selectedRank === 'all' || s.conductRank === selectedRank;
    const matchesSearch = !searchQuery || s.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesRank && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = a.studentName.split(' ').pop() || '';
      const nameB = b.studentName.split(' ').pop() || '';
      return sortAsc ? nameA.localeCompare(nameB, 'vi') : nameB.localeCompare(nameA, 'vi');
    }
    if (sortBy === 'total') {
      return sortAsc ? a.monthTotal - b.monthTotal : b.monthTotal - a.monthTotal;
    }
    const studentA = students.find(st => st.id === a.studentId);
    const studentB = students.find(st => st.id === b.studentId);
    return sortAsc ? (studentA?.orderNumber || 0) - (studentB?.orderNumber || 0) : (studentB?.orderNumber || 0) - (studentA?.orderNumber || 0);
  });

  // Print Handlers
  const handlePrintSingle = (studentId: string) => {
    const st = students.find(s => s.id === studentId);
    if (st) {
      setPrintStudents([st]);
      setShowPrintModal(true);
    }
  };

  const handlePrintBatch = (group?: number) => {
    let target = students;
    if (group) {
      target = students.filter(s => s.groupNumber === group);
    }
    setPrintStudents(target);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
            Đánh Giá Toàn Diện {students.length} Học Sinh
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            <Users className="w-7 h-7 text-amber-400" />
            <span>Bảng Điểm Rèn Luyện Cá Nhân Tháng {selectedMonth}</span>
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Xếp loại rèn luyện theo quy chế: Tốt (≥200đ) • Khá (100–199đ) • Đạt (51–99đ) • Chưa đạt (≤50đ).
          </p>
        </div>

        {/* Print Batch CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handlePrintBatch()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4 text-emerald-950" />
            <span>In phiếu {students.length} học sinh (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Roster & Scores Table */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
        
        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Group Filter */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedGroup === 'all' ? 'bg-amber-400 text-emerald-950' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Tất cả tổ ({students.length})
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

            {/* Rank Filter */}
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
            >
              <option value="all">Tất cả xếp loại</option>
              <option value="Tốt">Xếp loại Tốt</option>
              <option value="Khá">Xếp loại Khá</option>
              <option value="Đạt">Xếp loại Đạt</option>
              <option value="Chưa đạt">Chưa đạt</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên học sinh..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => {
                if (sortBy === 'total') setSortAsc(!sortAsc);
                else {
                  setSortBy('total');
                  setSortAsc(false);
                }
              }}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1"
              title="Sắp xếp theo tổng điểm"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Điểm {sortBy === 'total' && (sortAsc ? '↑' : '↓')}</span>
            </button>
          </div>
        </div>

        {/* Dynamic students matrix table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#064e3b] text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-3 text-center w-12">STT</th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3 text-center">Tổ</th>
                <th className="p-3">Chức vụ</th>
                <th className="p-3 text-center">Tuần 1</th>
                <th className="p-3 text-center">Tuần 2</th>
                <th className="p-3 text-center">Tuần 3</th>
                <th className="p-3 text-center">Tuần 4</th>
                <th className="p-3 text-center font-black">Tổng tháng</th>
                <th className="p-3 text-center">Điểm TB</th>
                <th className="p-3 text-center">Xếp loại</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sorted.map((s, idx) => {
                const rawStudent = students.find(st => st.id === s.studentId);
                const orderNum = rawStudent?.orderNumber || idx + 1;

                const rankBadge = {
                  'Tốt': 'bg-emerald-100 text-emerald-900 border-emerald-300',
                  'Khá': 'bg-teal-100 text-teal-900 border-teal-300',
                  'Đạt': 'bg-amber-100 text-amber-900 border-amber-300',
                  'Chưa đạt': 'bg-rose-100 text-rose-900 border-rose-300',
                }[s.conductRank] || 'bg-slate-100 text-slate-800';

                return (
                  <tr key={s.studentId} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-center font-bold text-slate-400">
                      {orderNum}
                    </td>
                    <td className="p-3 font-bold text-slate-900 text-sm whitespace-nowrap">
                      {s.studentName}
                    </td>
                    <td className="p-3 text-center font-medium text-slate-600">
                      Tổ {s.groupNumber}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      {s.position !== 'Thành viên' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {s.position}
                        </span>
                      ) : (
                        <span className="text-slate-400">Thành viên</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      +{s.weekScores[1] || 0}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      +{s.weekScores[2] || 0}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      +{s.weekScores[3] || 0}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      +{s.weekScores[4] || 0}
                    </td>
                    <td className="p-3 text-center font-black text-emerald-800 text-sm">
                      {s.monthTotal}đ
                    </td>
                    <td className="p-3 text-center font-medium text-slate-500">
                      {s.monthAverage}đ
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${rankBadge}`}>
                        {s.conductRank} {s.isTemporary && <span className="text-[10px] font-normal opacity-80">(Tạm)</span>}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setActiveDetailStudent(s)}
                        className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-50 text-xs font-bold inline-flex items-center"
                        title="Xem chi tiết rèn luyện"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrintSingle(s.studentId)}
                        className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 text-xs font-bold inline-flex items-center"
                        title="In phiếu gửi phụ huynh"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Student Deep Inspector Modal */}
      {activeDetailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Hồ Sơ Rèn Luyện Tháng {selectedMonth}
                </span>
                <h3 className="text-xl font-black text-emerald-950">
                  {activeDetailStudent.studentName} (Tổ {activeDetailStudent.groupNumber} • {activeDetailStudent.position})
                </h3>
              </div>
              <button
                onClick={() => setActiveDetailStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Score Breakdown Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-950">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Tổng điểm rèn luyện</div>
                <div className="text-2xl font-black mt-1">+{activeDetailStudent.monthTotal}đ</div>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 text-teal-950">
                <div className="text-[10px] uppercase font-bold text-teal-700">Điểm trung bình</div>
                <div className="text-2xl font-black mt-1">{activeDetailStudent.monthAverage}đ</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-950">
                <div className="text-[10px] uppercase font-bold text-amber-700">Xếp loại tháng</div>
                <div className="text-xl font-black mt-1">{activeDetailStudent.conductRank}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 text-rose-950">
                <div className="text-[10px] uppercase font-bold text-rose-700">Tổng lần vi phạm</div>
                <div className="text-2xl font-black mt-1">{activeDetailStudent.disciplineFaults + activeDetailStudent.academicFaults}</div>
              </div>
            </div>

            {/* Transaction Logs */}
            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-bold uppercase text-slate-500">
                Lịch sử ghi nhận điểm trong tháng:
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {transactions
                  .filter(t => t.studentId === activeDetailStudent.studentId && t.month === selectedMonth)
                  .map(t => (
                    <div
                      key={t.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        t.type === 'plus' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' : 'bg-rose-50/50 border-rose-100 text-rose-950'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{t.ruleContent} (x{t.quantity})</div>
                        <div className="text-[10px] text-slate-500">
                          {t.dayOfWeek}, Tuần {t.week} {t.reason && `• "${t.reason}"`}
                        </div>
                      </div>
                      <span className="font-black text-sm">
                        {t.type === 'plus' ? `+${t.totalPoints}` : `${t.totalPoints}`}đ
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  handlePrintSingle(activeDetailStudent.studentId);
                  setActiveDetailStudent(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu A4 gửi phụ huynh</span>
              </button>

              <button
                onClick={() => setActiveDetailStudent(null)}
                className="px-4 py-2 rounded-xl bg-[#064e3b] text-white font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent Printable Report Modal */}
      {showPrintModal && (
        <ParentReportPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          students={printStudents}
          data={data}
          selectedMonth={selectedMonth}
          selectedWeek={selectedWeek}
        />
      )}

    </div>
  );
};
