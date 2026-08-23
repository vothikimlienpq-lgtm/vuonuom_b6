import React, { useState } from 'react';
import { 
  Calendar, 
  Copy, 
  Printer, 
  Sliders, 
  Save, 
  ChevronRight, 
  Check, 
  X, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  Users,
  CheckCircle2,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { FullClassData, DayOfWeek, CleaningAssignment, UserRole } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { getWeekDateRange } from '../../utils/dateUtils';

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'Thứ 2', label: 'Thứ Hai' },
  { key: 'Thứ 3', label: 'Thứ Ba' },
  { key: 'Thứ 4', label: 'Thứ Tư' },
  { key: 'Thứ 5', label: 'Thứ Năm' },
  { key: 'Thứ 6', label: 'Thứ Sáu' },
  { key: 'Thứ 7', label: 'Thứ Bảy' },
];

const DEFAULT_CATEGORY_ITEMS = [
  { id: 'quet_lop', name: 'Quét lớp', icon: '🧹' },
  { id: 'lau_san', name: 'Lau sàn', icon: '🪣' },
  { id: 'lau_bang', name: 'Lau bảng', icon: '🧽' },
  { id: 'tuoi_cay', name: 'Tưới cây & góc xanh', icon: '🌿' },
  { id: 'lau_kinh', name: 'Lau cửa kính & bàn ghế', icon: '🪟' },
  { id: 'do_rac', name: 'Đổ rác & vệ sinh chung', icon: '🗑️' }
];

interface CleaningDutyModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
  onRefresh: () => void;
  userRole?: UserRole;
  onSelectWeek?: (week: number) => void;
  onSelectMonth?: (month: number) => void;
}

export const CleaningDutyModule: React.FC<CleaningDutyModuleProps> = ({
  data,
  selectedMonth,
  selectedWeek,
  onRefresh,
  userRole = 'guest',
  onSelectWeek,
  onSelectMonth,
}) => {
  const { success, error, warning } = useToast();
  const canEdit = userRole === 'gvcn' || userRole === 'bcs';

  const config = data.config;

  const students = data.students || [];
  const cleaningAssignments = data.cleaningAssignments || [];
  const totalWeeks = Number(config.totalWeeks) || 38;

  // Selected week inside this module
  const [currentWeek, setCurrentWeek] = useState<number>(selectedWeek || 1);

  React.useEffect(() => {
    if (selectedWeek && selectedWeek !== currentWeek) {
      setCurrentWeek(selectedWeek);
    }
  }, [selectedWeek]);

  const handleWeekChange = (w: number) => {
    setCurrentWeek(w);
    onSelectWeek?.(w);
    const info = getWeekDateRange(config.week1StartDate, w);
    onSelectMonth?.(info.monthNum);
  };

  // Calculate matching dates and month for currentWeek based on config.week1StartDate
  const weekInfo = getWeekDateRange(config.week1StartDate, currentWeek);

  // Categories parsing
  const savedTasks = config.cleaningTasks && config.cleaningTasks.length > 0
    ? config.cleaningTasks
    : DEFAULT_CATEGORY_ITEMS.map(c => c.name);

  const getCategoryIcon = (taskName: string): string => {
    const lower = taskName.toLowerCase();
    if (lower.includes('quét') || lower.includes('quet')) return '🧹';
    if (lower.includes('sàn') || lower.includes('san')) return '🪣';
    if (lower.includes('bảng') || lower.includes('bang') || lower.includes('giẻ')) return '🧽';
    if (lower.includes('cây') || lower.includes('cay') || lower.includes('xanh') || lower.includes('tưới')) return '🌿';
    if (lower.includes('kính') || lower.includes('kinh') || lower.includes('bàn') || lower.includes('ghế')) return '🪟';
    if (lower.includes('rác') || lower.includes('rac')) return '🗑️';
    if (lower.includes('điện') || lower.includes('quạt') || lower.includes('khoá')) return '💡';
    return '✨';
  };

  const categories = savedTasks.map((tName, idx) => ({
    id: `cat_${idx}_${tName.replace(/\s+/g, '_').toLowerCase()}`,
    name: tName,
    icon: getCategoryIcon(tName)
  }));

  // Filter assignments for current week
  const weekAssignments = cleaningAssignments.filter(a => a.week === currentWeek);

  const getAssignment = (taskId: string, day: DayOfWeek): CleaningAssignment | undefined => {
    return weekAssignments.find(a => (a.taskId === taskId || a.taskName === taskId) && a.dayOfWeek === day);
  };

  // Calculate assignment progress percentage
  const totalSlots = categories.length * DAYS_OF_WEEK.length;
  const assignedSlots = categories.reduce((acc, cat) => {
    return acc + DAYS_OF_WEEK.filter(d => {
      const asg = getAssignment(cat.id, d.key) || getAssignment(cat.name, d.key);
      return asg && (asg.studentNames?.length > 0 || (asg.studentIds && asg.studentIds.length > 0) || asg.note);
    }).length;
  }, 0);
  const assignmentProgress = totalSlots > 0 ? Math.round((assignedSlots / totalSlots) * 100) : 0;

  // Modals state
  const [editingSlot, setEditingSlot] = useState<{
    category: { id: string; name: string; icon: string };
    day: DayOfWeek;
    existing?: CleaningAssignment;
  } | null>(null);

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [assigneeNote, setAssigneeNote] = useState('');
  const [assigneeStatus, setAssigneeStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [savingSlot, setSavingSlot] = useState(false);

  // Manage categories modal
  const [showManageModal, setShowManageModal] = useState(false);
  const [categoryList, setCategoryList] = useState<string[]>(savedTasks);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategories, setSavingCategories] = useState(false);

  // Copy previous week state
  const [copyingWeek, setCopyingWeek] = useState(false);
  const [hasSaved, setHasSaved] = useState(true);

  // Open modal to assign students
  const handleOpenAssignModal = (category: { id: string; name: string; icon: string }, day: DayOfWeek) => {
    if (!canEdit) return;
    const existing = getAssignment(category.id, day) || getAssignment(category.name, day);
    setEditingSlot({ category, day, existing });

    if (existing) {
      setSelectedStudentIds(existing.studentIds || []);
      setAssigneeNote(existing.note || '');
      setAssigneeStatus(existing.status || 'pending');
    } else {
      setSelectedStudentIds([]);
      setAssigneeNote('');
      setAssigneeStatus('pending');
    }
  };

  // Quick select entire Group (Tổ 1, 2, 3, 4)
  const handleSelectGroup = (groupNum: number) => {
    const groupStudents = students.filter(s => s.groupNumber === groupNum);
    const groupIds = groupStudents.map(s => s.id);
    // Toggle all
    const allSelected = groupIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  // Toggle student selection
  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Save assignment slot
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    setSavingSlot(true);
    try {
      const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));
      const studentNames = selectedStudents.map(s => s.fullName);

      const res = await api.saveCleaningAssignment({
        month: weekInfo.monthNum,
        week: currentWeek,
        dayOfWeek: editingSlot.day,
        taskId: editingSlot.category.id,
        taskName: editingSlot.category.name,
        studentIds: selectedStudentIds,
        studentNames,
        status: assigneeStatus,
        note: assigneeNote
      });

      if (res.success) {
        success(res.message || 'Đã lưu phân công trực nhật!');
        setEditingSlot(null);
        setHasSaved(true);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu phân công');
    } finally {
      setSavingSlot(false);
    }
  };

  // Clear an assignment slot
  const handleClearSlot = async () => {
    if (!editingSlot) return;
    const existing = editingSlot.existing || getAssignment(editingSlot.category.id, editingSlot.day);
    if (!existing || !existing.id) {
      setEditingSlot(null);
      return;
    }
    setSavingSlot(true);
    try {
      const res = await api.deleteCleaningAssignment(existing.id);
      if (res.success) {
        success('Đã xóa phân công.');
        setEditingSlot(null);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa phân công');
    } finally {
      setSavingSlot(false);
    }
  };

  // Copy previous week assignments
  const handleCopyPreviousWeek = async () => {
    if (currentWeek <= 1) {
      warning('Không có tuần trước đó để sao chép.');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn sao chép toàn bộ phân công trực nhật từ Tuần ${currentWeek - 1} sang Tuần ${currentWeek}?`)) {
      return;
    }
    setCopyingWeek(true);
    try {
      const res = await api.copyWeekCleaning({
        sourceWeek: currentWeek - 1,
        targetWeek: currentWeek,
        month: weekInfo.monthNum
      });
      if (res.success) {
        success(res.message || `Đã sao chép phân công từ Tuần ${currentWeek - 1}!`);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi sao chép lịch trực nhật');
    } finally {
      setCopyingWeek(false);
    }
  };

  // Save categories changes
  const handleSaveCategories = async () => {
    const valid = categoryList.map(c => c.trim()).filter(Boolean);
    if (valid.length === 0) {
      warning('Cần có ít nhất một hạng mục trực nhật.');
      return;
    }
    setSavingCategories(true);
    try {
      const res = await api.updateCleaningTasks(valid);
      if (res.success) {
        success(res.message || 'Đã cập nhật danh sách hạng mục!');
        setShowManageModal(false);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi cập nhật hạng mục');
    } finally {
      setSavingCategories(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Header matching Image 2) */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-7 text-white shadow-xl space-y-4">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wide shadow-sm">
          <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>NỀ NẾP LỚP {config.className || config.id.toUpperCase()}</span>
        </div>

        {/* Header Title & Subtitle */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Lịch trực nhật tuần
          </h2>
          <p className="text-emerald-100/90 text-xs sm:text-sm mt-1">
            Phân công rõ ràng • Theo dõi nhẹ nhàng • Cùng giữ lớp học xanh sạch
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap pt-1">
          {canEdit && (
            <button
              onClick={handleCopyPreviousWeek}
              disabled={copyingWeek || currentWeek <= 1}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
              title="Sao chép toàn bộ phân công trực nhật từ tuần trước"
            >
              <Copy className="w-4 h-4" />
              <span>Sao chép tuần trước</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>In lịch</span>
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setCategoryList(savedTasks);
                setShowManageModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Sliders className="w-4 h-4 stroke-[2.5]" />
              <span>Quản lý hạng mục</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-sm">
            <Save className="w-4 h-4" />
            <span>Đã lưu</span>
          </div>
        </div>

        {/* Week Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
          {Array.from({ length: Math.min(totalWeeks, 16) }, (_, i) => i + 1).map((w) => {
            const isSelected = currentWeek === w;
            return (
              <button
                key={w}
                onClick={() => handleWeekChange(w)}
                className={`px-4 py-1.5 rounded-2xl text-xs font-black transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-emerald-950 shadow-md font-black scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 font-bold'
                }`}
              >
                Tuần {w}
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Table Matrix (Header & Table matching Image 1) */}
      <div className="bg-white rounded-[24px] shadow-sm border border-emerald-100 overflow-hidden">
        
        {/* Card Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Bảng phân công – Tuần {currentWeek}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {weekInfo.monthFormatted}
            </p>
          </div>

          <div className="text-right">
            <div className="text-emerald-700 font-black text-lg sm:text-xl leading-none">
              {assignmentProgress}%
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              tiến độ phân công
            </div>
          </div>
        </div>

        {/* Table Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            
            {/* Dark Green Header Row */}
            <thead>
              <tr className="bg-[#0c4a3e] text-white uppercase text-xs font-black">
                <th className="p-3.5 pl-6 w-48 border-r border-emerald-900/60 font-black tracking-wider">
                  HẠNG MỤC
                </th>
                {DAYS_OF_WEEK.map((d) => (
                  <th key={d.key} className="p-3.5 text-center border-r border-emerald-900/60 last:border-r-0 font-black tracking-wider">
                    <div>{d.label}</div>
                    <div className="text-[10px] text-amber-300 font-bold opacity-85 mt-0.5 normal-case font-mono">
                      {weekInfo.dayDates[d.key]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body Categories */}
            <tbody className="divide-y divide-slate-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50/50 transition">
                  
                  {/* Category Column */}
                  <td className="p-4 pl-6 align-middle font-black text-slate-900 text-xs border-r border-slate-100 bg-slate-50/40">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-black text-xs text-slate-800 tracking-tight">
                        {category.name}
                      </span>
                    </div>
                  </td>

                  {/* Day Assignment Cells */}
                  {DAYS_OF_WEEK.map((d) => {
                    const assignment = getAssignment(category.id, d.key) || getAssignment(category.name, d.key);
                    const isAssigned = assignment && (
                      (assignment.studentNames && assignment.studentNames.length > 0) || 
                      (assignment.studentIds && assignment.studentIds.length > 0) || 
                      Boolean(assignment.note)
                    );

                    return (
                      <td key={d.key} className="p-2 border-r border-slate-100 last:border-r-0 align-middle">
                        <div
                          onClick={() => handleOpenAssignModal(category, d.key)}
                          className={`rounded-2xl p-3 min-h-[72px] flex flex-col justify-between border transition relative group ${
                            canEdit ? 'cursor-pointer' : ''
                          } ${
                            isAssigned
                              ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300 hover:shadow-xs'
                              : 'bg-white border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/20'
                          }`}
                        >
                          {/* Top Row: Status badge & Chevron */}
                          <div className="flex items-center justify-between w-full">
                            {isAssigned ? (
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-tight ${
                                assignment.status === 'completed'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : assignment.status === 'failed'
                                  ? 'bg-rose-200 text-rose-900'
                                  : 'bg-amber-200 text-amber-900'
                              }`}>
                                {assignment.status === 'completed' ? '✓ Đạt' : assignment.status === 'failed' ? '✕ Chưa sạch' : '⏳ Đang chờ'}
                              </span>
                            ) : (
                              <span></span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-700 transition" />
                          </div>

                          {/* Main Cell Content */}
                          {isAssigned ? (
                            <div className="space-y-1 mt-1">
                              <div className="font-bold text-xs text-slate-900 leading-tight">
                                {assignment.studentNames && assignment.studentNames.length > 0
                                  ? assignment.studentNames.join(', ')
                                  : assignment.note || 'Đã phân công'}
                              </div>
                              {assignment.note && assignment.studentNames && assignment.studentNames.length > 0 && (
                                <div className="text-[10px] text-slate-500 italic leading-none">
                                  {assignment.note}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-[#b45309] my-auto text-left">
                              Chưa phân công
                            </div>
                          )}

                        </div>
                      </td>
                    );
                  })}

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>

      {/* Modal 1: Assign Students to a specific cell */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-emerald-100 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingSlot.category.icon}</span>
                <div>
                  <h3 className="text-base font-black text-emerald-950">
                    Phân công: {editingSlot.category.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {editingSlot.day} (Tuần {currentWeek} – {weekInfo.dayDates[editingSlot.day]})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              
              {/* Quick Group Selectors (Tổ 1, Tổ 2, Tổ 3, Tổ 4) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn nhanh theo Tổ:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleSelectGroup(g)}
                      className="px-3 py-2 rounded-xl text-xs font-black border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-950 transition active:scale-95"
                    >
                      + Toàn Tổ {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Checklist Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Chọn học sinh phụ trách ({selectedStudentIds.length} bạn đã chọn):
                  </label>
                  {selectedStudentIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="text-[11px] text-rose-600 font-bold hover:underline"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50">
                  {students.map(s => {
                    const isChecked = selectedStudentIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                          isChecked ? 'bg-amber-100 text-emerald-950 font-bold' : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStudent(s.id)}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span className="truncate">
                          {s.orderNumber}. {s.fullName} (T{s.groupNumber})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Free-text Note / Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú hoặc tên phân công đặc biệt:
                </label>
                <input
                  type="text"
                  value={assigneeNote}
                  onChange={(e) => setAssigneeNote(e.target.value)}
                  placeholder="Ví dụ: Cả Tổ 1 cùng làm; hoặc quét thêm hành lang trước cửa..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng thái đánh giá:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssigneeStatus('pending')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      assigneeStatus === 'pending'
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-black'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    ⏳ Đang chờ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssigneeStatus('completed')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      assigneeStatus === 'completed'
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-black'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    ✓ Đạt / Hoàn thành
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssigneeStatus('failed')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      assigneeStatus === 'failed'
                        ? 'bg-rose-100 border-rose-300 text-rose-900 font-black'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    ✕ Chưa sạch
                  </button>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={handleClearSlot}
                  disabled={savingSlot}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                >
                  Xóa phân công ô này
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={savingSlot}
                    className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-black text-xs shadow hover:bg-[#095c47] cursor-pointer"
                  >
                    {savingSlot ? 'Đang lưu...' : 'Lưu phân công'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Manage Categories (Quản lý hạng mục trực nhật) */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-emerald-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>Quản lý danh sách hạng mục</span>
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tùy chỉnh các hạng mục trực nhật hàng ngày cho lớp học (ví dụ: Quét lớp, Lau sàn, Lau bảng, Tưới cây...).
            </p>

            {/* Existing Categories List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {categoryList.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span>{getCategoryIcon(cat)}</span>
                    <span>{cat}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCategoryList(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Xóa hạng mục"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Category */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nhập tên hạng mục mới..."
                className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newCategoryName.trim()) {
                      setCategoryList(prev => [...prev, newCategoryName.trim()]);
                      setNewCategoryName('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newCategoryName.trim()) {
                    setCategoryList(prev => [...prev, newCategoryName.trim()]);
                    setNewCategoryName('');
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 active:scale-95"
              >
                + Thêm
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={savingCategories}
                onClick={handleSaveCategories}
                className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-black text-xs shadow hover:bg-[#095c47]"
              >
                {savingCategories ? 'Đang lưu...' : 'Lưu danh sách'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
