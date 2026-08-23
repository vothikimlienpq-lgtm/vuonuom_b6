import React, { useState } from 'react';
import { 
  PlusCircle, 
  MinusCircle, 
  Search, 
  Lock, 
  Unlock, 
  Trash2, 
  Edit3, 
  Calendar, 
  Filter, 
  Check, 
  AlertCircle,
  Clock,
  UserCheck,
  BookOpen,
  HelpCircle,
  FileText,
  RotateCw,
  ChevronDown
} from 'lucide-react';
import { 
  FullClassData, 
  DayOfWeek, 
  Student, 
  PointRule, 
  PointTransaction, 
  UserRole 
} from '../../types';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { getWeekDateRange } from '../../utils/dateUtils';

const DAYS_OF_WEEK: DayOfWeek[] = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const EXAM_TYPES = [
  'Kiểm tra miệng',
  'Kiểm tra 15 phút',
  'Kiểm tra một tiết',
  'Kiểm tra giữa kỳ',
  'Kiểm tra cuối kỳ',
  'Thực hành hoặc dự án',
  'Đánh giá thường xuyên'
];

interface PointEntryModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
  onRefresh: () => void;
  userRole?: UserRole;
  userName?: string;
  onSelectWeek?: (week: number) => void;
  onSelectMonth?: (month: number) => void;
}

export const PointEntryModule: React.FC<PointEntryModuleProps> = ({
  data,
  selectedMonth,
  selectedWeek,
  onRefresh,
  userRole = 'guest',
  userName = 'Người dùng',
  onSelectWeek,
  onSelectMonth,
}) => {
  const { success, error, warning } = useToast();

  const config = data.config || {
    className: '11B6',
    week1StartDate: '2026-08-03',
    totalWeeks: 38
  };
  const totalWeeks = Number(config.totalWeeks) || 38;
  const weekInfo = getWeekDateRange(config.week1StartDate, selectedWeek);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Thứ 2');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Recording Modal State
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [ruleTypeFilter, setRuleTypeFilter] = useState<'all' | 'plus' | 'minus'>('all');
  const [selectedRule, setSelectedRule] = useState<PointRule | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [flexiblePoints, setFlexiblePoints] = useState<number>(5);
  const [subject, setSubject] = useState<string>('Toán');
  const [examType, setExamType] = useState<string>('Kiểm tra 15 phút');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Transaction Modal State
  const [editingTx, setEditingTx] = useState<PointTransaction | null>(null);

  const canEdit = userRole === 'gvcn' || userRole === 'bcs';
  const isGvcn = userRole === 'gvcn';

  const students = data.students || [];
  const rules = data.rules || [];
  const transactions = data.transactions || [];
  const dayLocks = data.dayLocks || [];
  const weekLocks = data.weekLocks || [];
  const subjects = data.config?.subjects || [];

  // Locks check
  const isWeekLocked = weekLocks.some(wl => wl.month === selectedMonth && wl.week === selectedWeek && wl.isLocked);
  const currentDayLock = dayLocks.find(dl => dl.month === selectedMonth && dl.week === selectedWeek && dl.dayOfWeek === selectedDay && dl.isLocked);
  const isDayLocked = !!currentDayLock;

  // Filter students
  const filteredStudents = students.filter(st => {
    const matchesGroup = selectedGroupFilter === 'all' || st.groupNumber === selectedGroupFilter;
    const matchesSearch = !searchQuery || st.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Filter transactions for history table
  const weekTransactions = transactions.filter(t => t.month === selectedMonth && t.week === selectedWeek);

  const handleOpenRecordModal = (student: Student) => {
    if (!canEdit) {
      warning('Bạn cần đăng nhập vai trò Ban cán sự hoặc GVCN để ghi nhận điểm.');
      return;
    }
    if (isWeekLocked) {
      error(`Tuần ${selectedWeek} đã bị khóa. Không thể ghi nhận thêm.`);
      return;
    }
    if (isDayLocked && !isGvcn) {
      error(`${selectedDay} đã bị hoàn tất & khóa bởi ${currentDayLock?.lockedBy}.`);
      return;
    }

    setActiveStudent(student);
    setSelectedRule(null);
    setQuantity(1);
    setFlexiblePoints(5);
    setReason('');
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !selectedRule) {
      error('Vui lòng chọn quy định điểm cộng hoặc trừ.');
      return;
    }

    if (selectedRule.requiresReason && !reason.trim()) {
      error('Quy định này bắt buộc phải nhập lý do cụ thể.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createTransaction({
        studentId: activeStudent.id,
        studentName: activeStudent.fullName,
        groupNumber: activeStudent.groupNumber,
        month: selectedMonth,
        week: selectedWeek,
        dayOfWeek: selectedDay,
        ruleId: selectedRule.id,
        ruleContent: selectedRule.content,
        type: selectedRule.type,
        points: selectedRule.isFlexiblePoints ? flexiblePoints : selectedRule.defaultPoints,
        quantity,
        subject: selectedRule.requiresSubjectAndExamType ? subject : undefined,
        examType: selectedRule.requiresSubjectAndExamType ? examType : undefined,
        reason: reason.trim() || undefined,
      });

      if (res.success) {
        success(res.message);
        setActiveStudent(null);
        setSelectedRule(null);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu điểm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (tx: PointTransaction) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi điểm "${tx.ruleContent}" của học sinh ${tx.studentName}?`)) {
      return;
    }

    try {
      const res = await api.deleteTransaction(tx.id);
      if (res.success) {
        success(res.message);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa giao dịch');
    }
  };

  const handleToggleLockDay = async (lockState: boolean) => {
    try {
      const res = await api.lockDay({
        month: selectedMonth,
        week: selectedWeek,
        dayOfWeek: selectedDay,
        isLocked: lockState,
      });
      if (res.success) {
        success(res.message);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleToggleLockWeek = async (lockState: boolean) => {
    try {
      const res = await api.lockWeek({
        month: selectedMonth,
        week: selectedWeek,
        isLocked: lockState,
      });
      if (res.success) {
        success(res.message);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Training Week Selector & Month Display Card (Matching Uploaded Image) */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100 space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5">
            CHỌN TUẦN RÈN LUYỆN:
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown Select Box */}
            <div className="relative inline-block">
              <select
                value={selectedWeek}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  onSelectWeek?.(w);
                  const wInfo = getWeekDateRange(config.week1StartDate, w);
                  onSelectMonth?.(wInfo.monthNum);
                }}
                className="appearance-none bg-[#f0fdf9] hover:bg-[#e6faf3] border-2 border-[#34d399] text-slate-900 font-bold text-base rounded-2xl pl-5 pr-11 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer transition min-w-[135px]"
              >
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w} className="text-slate-900 font-bold text-sm">
                    Tuần {w}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
            </div>

            {/* Date Range Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-700 font-semibold text-sm shadow-xs">
              <Calendar className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
              <span>Từ {weekInfo.mondayFull} đến {weekInfo.saturdayFull}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
            THÁNG HIỂN THỊ:
          </label>
          <div className="inline-flex items-center px-4 py-1.5 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-800 font-bold text-sm shadow-xs">
            {weekInfo.monthShort}
          </div>
        </div>
      </div>

      {/* Step Selector & Lock Controls Header Bar */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-emerald-950 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-amber-500" />
              <span>Ghi Nhận & Nhập Điểm Tuần {selectedWeek} ({weekInfo.monthShort})</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Quy trình chuẩn: Chọn ngày trong tuần → Chọn học sinh → Chọn quy định điểm cộng/trừ → Lưu giao dịch.
            </p>
          </div>

          {/* Day & Week Lock Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                {/* Day Lock Control */}
                {isDayLocked ? (
                  isGvcn ? (
                    <button
                      onClick={() => handleToggleLockDay(false)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 transition"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Mở khóa {selectedDay}</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{selectedDay} đã khóa</span>
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => handleToggleLockDay(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Hoàn tất & khóa {selectedDay}</span>
                  </button>
                )}

                {/* Week Lock Control (GVCN Only) */}
                {isGvcn && (
                  <button
                    onClick={() => handleToggleLockWeek(!isWeekLocked)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                      isWeekLocked
                        ? 'bg-amber-400 hover:bg-amber-300 text-emerald-950'
                        : 'bg-rose-700 hover:bg-rose-800 text-white'
                    }`}
                  >
                    {isWeekLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isWeekLocked ? `Mở khóa Tuần ${selectedWeek}` : `Khóa Tuần ${selectedWeek}`}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Day of Week Selector Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-5">
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = selectedDay === d;
            const dayLocked = data.dayLocks.some(dl => dl.month === selectedMonth && dl.week === selectedWeek && dl.dayOfWeek === d && dl.isLocked);
            const dateStr = weekInfo.dayDates[d];

            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`py-3 px-2 rounded-2xl text-center transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#064e3b] text-amber-300 font-black border-[#064e3b] shadow-md scale-102'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-bold'
                }`}
              >
                <div className="text-sm">{d}</div>
                {dateStr && (
                  <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-amber-200/90' : 'text-slate-500'}`}>
                    {dateStr}
                  </div>
                )}
                <div className="text-[10px] mt-0.5 flex items-center justify-center gap-1">
                  {dayLocked ? (
                    <span className="text-rose-500 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Đã khóa
                    </span>
                  ) : (
                    <span className={isSelected ? 'text-emerald-300' : 'text-emerald-700'}>
                      Mở ghi
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Student Selector Card */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
        
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          
          {/* Group Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedGroupFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedGroupFilter === 'all'
                  ? 'bg-amber-400 text-emerald-950'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả tổ ({students.length})
            </button>
            {[1, 2, 3, 4].map(g => (
              <button
                key={g}
                onClick={() => setSelectedGroupFilter(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedGroupFilter === g
                    ? 'bg-amber-400 text-emerald-950'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tổ {g}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên học sinh..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Student Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredStudents.map(student => {
            // Count student transactions today
            const todayTxs = weekTransactions.filter(t => t.studentId === student.id && t.dayOfWeek === selectedDay);
            const todayPoints = todayTxs.reduce((sum, t) => sum + t.totalPoints, 0);

            return (
              <div
                key={student.id}
                className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-200 transition flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        #{student.orderNumber}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{student.fullName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Tổ {student.groupNumber} {student.position !== 'Thành viên' && `• ${student.position}`}
                    </div>
                  </div>

                  {todayPoints !== 0 && (
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      todayPoints > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {todayPoints > 0 ? `+${todayPoints}` : todayPoints}đ
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenRecordModal(student)}
                  disabled={!canEdit || isWeekLocked || (isDayLocked && !isGvcn)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-[#064e3b] hover:bg-[#095c47] text-amber-300 font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Ghi nhận điểm</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History Table for the Selected Week */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-emerald-950">
              Lịch Sử Giao Dịch Điểm (Tuần {selectedWeek}, Tháng {selectedMonth})
            </h3>
            <p className="text-xs text-slate-500">
              Tất cả các lần cộng / trừ điểm đều được lưu độc lập, phục vụ truy xuất và kiểm tra.
            </p>
          </div>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full">
            {weekTransactions.length} giao dịch
          </span>
        </div>

        {weekTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Chưa có giao dịch điểm nào được ghi nhận trong Tuần {selectedWeek}.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#064e3b] text-white uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3">Thời gian / Ngày</th>
                  <th className="p-3">Học sinh</th>
                  <th className="p-3">Tổ</th>
                  <th className="p-3">Sự kiện / Quy định</th>
                  <th className="p-3 text-center">Điểm</th>
                  <th className="p-3">Chi tiết môn / Lý do</th>
                  <th className="p-3">Người nhập</th>
                  {canEdit && <th className="p-3 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {weekTransactions.map(tx => {
                  const isPlus = tx.type === 'plus';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{tx.dayOfWeek}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                        {tx.studentName}
                      </td>
                      <td className="p-3 font-medium text-slate-600 whitespace-nowrap">
                        Tổ {tx.groupNumber}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          isPlus ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isPlus ? <PlusCircle className="w-3.5 h-3.5 shrink-0" /> : <MinusCircle className="w-3.5 h-3.5 shrink-0" />}
                          {tx.ruleContent}
                        </span>
                        {tx.quantity > 1 && (
                          <span className="ml-1 text-[10px] font-bold text-slate-500">
                            (x{tx.quantity})
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                          isPlus ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPlus ? `+${tx.totalPoints}` : tx.totalPoints}đ
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {tx.subject && (
                          <span className="font-semibold text-emerald-900">[{tx.subject}] </span>
                        )}
                        {tx.examType && (
                          <span className="text-slate-500">{tx.examType} </span>
                        )}
                        {tx.reason && (
                          <span className="italic text-slate-700 font-medium">"{tx.reason}"</span>
                        )}
                        {!tx.subject && !tx.examType && !tx.reason && (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">
                        <div className="font-semibold">{tx.createdBy}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{tx.creatorRole}</div>
                      </td>
                      {canEdit && (
                        <td className="p-3 text-right whitespace-nowrap">
                          {!isWeekLocked && (
                            <button
                              onClick={() => handleDeleteTransaction(tx)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                              title="Xóa giao dịch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Point Modal Popup */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto relative">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Ghi nhận điểm ({selectedDay}, Tuần {selectedWeek})
                </span>
                <h3 className="text-xl font-black text-emerald-950 mt-0.5">
                  Học sinh: {activeStudent.fullName} (Tổ {activeStudent.groupNumber})
                </h3>
              </div>
              <button
                onClick={() => setActiveStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="mt-5 space-y-4">
              
              {/* Type Filter Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRuleTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    ruleTypeFilter === 'all' ? 'bg-[#064e3b] text-amber-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Tất cả quy định
                </button>
                <button
                  type="button"
                  onClick={() => setRuleTypeFilter('plus')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    ruleTypeFilter === 'plus' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  + Điểm Cộng ({rules.filter(r => r.type === 'plus').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRuleTypeFilter('minus')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    ruleTypeFilter === 'minus' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  − Điểm Trừ ({rules.filter(r => r.type === 'minus').length})
                </button>
              </div>

              {/* Rule Picker List */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Chọn quy định áp dụng:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border rounded-2xl border-slate-200">
                  {rules
                    .filter(r => r.isActive && (ruleTypeFilter === 'all' || r.type === ruleTypeFilter))
                    .map(r => {
                      const isSelected = selectedRule?.id === r.id;
                      const isPlus = r.type === 'plus';

                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRule(r)}
                          className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? isPlus
                                ? 'bg-emerald-100 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-600'
                                : 'bg-rose-100 border-rose-600 text-rose-950 font-bold ring-2 ring-rose-600'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <span className="truncate">{r.content}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] shrink-0 ${
                            isPlus ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                          }`}>
                            {isPlus ? `+${r.defaultPoints}` : `−${r.defaultPoints}`}đ
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Multiplier / Flexible Points */}
              {selectedRule && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  
                  {selectedRule.isFlexiblePoints && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số điểm cộng linh hoạt (1 - 100 điểm):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={flexiblePoints}
                        onChange={(e) => setFlexiblePoints(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số lần áp dụng:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                      />
                    </div>

                    <div className="flex-1 text-right">
                      <div className="text-xs text-slate-500 font-semibold">Tổng điểm dự kiến:</div>
                      <div className={`text-xl font-black ${
                        selectedRule.type === 'plus' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {selectedRule.type === 'plus' ? '+' : '−'}
                        {Math.abs((selectedRule.isFlexiblePoints ? flexiblePoints : selectedRule.defaultPoints) * quantity)}đ
                      </div>
                    </div>
                  </div>

                  {/* Subject & Exam Type if required */}
                  {selectedRule.requiresSubjectAndExamType && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Môn học:
                        </label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                        >
                          {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Hình thức kiểm tra:
                        </label>
                        <select
                          value={examType}
                          onChange={(e) => setExamType(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                        >
                          {EXAM_TYPES.map(et => (
                            <option key={et} value={et}>{et}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Reason / Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lý do / Ghi chú {selectedRule.requiresReason && <span className="text-rose-600">* (Bắt buộc)</span>}:
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ví dụ: Giữ trật tự tốt, hoặc Viết bản kiểm điểm vì ngủ gật..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>

                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStudent(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedRule}
                  className="px-6 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#095c47] text-amber-300 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : 'XÁC NHẬN LƯU ĐIỂM'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
