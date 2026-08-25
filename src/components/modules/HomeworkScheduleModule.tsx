import React, { useState } from 'react';
import { 
  CalendarDays, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  FileText,
  Printer,
  Copy,
  ClipboardPaste,
  Sparkles,
  Calendar,
  Lock,
  Tag,
  Check,
  Plus
} from 'lucide-react';
import { FullClassData, DayOfWeek, HomeworkTask, TimetableEntry, UserRole } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { getWeekDateRange } from '../../utils/dateUtils';

const DAYS_OF_WEEK: { key: DayOfWeek; label: string; offset: number }[] = [
  { key: 'Thứ 2', label: 'THỨ HAI', offset: 0 },
  { key: 'Thứ 3', label: 'THỨ BA', offset: 1 },
  { key: 'Thứ 4', label: 'THỨ TƯ', offset: 2 },
  { key: 'Thứ 5', label: 'THỨ NĂM', offset: 3 },
  { key: 'Thứ 6', label: 'THỨ SÁU', offset: 4 },
  { key: 'Thứ 7', label: 'THỨ BẢY', offset: 5 },
];

interface HomeworkScheduleModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
  onRefresh: () => void;
  userRole?: UserRole;
  onSelectWeek?: (week: number) => void;
  onSelectMonth?: (month: number) => void;
}

export const HomeworkScheduleModule: React.FC<HomeworkScheduleModuleProps> = ({
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

  const totalPeriods = Number(config.periodsPerDay) || 8;
  const morningCount = Number(config.morningPeriods) || 5;
  const afternoonCount = Math.max(0, totalPeriods - morningCount);
  const usesSplitPeriodNumbering = config.scheduleStructure === 'split10';

  const timetable = data.timetable || [];
  const homeworkList = data.homeworkTasks || [];
  const weekLocks = data.weekLocks || [];
  const totalWeeks = Number(config.totalWeeks) || 38;

  // Selected week inside this module (can switch weeks directly)
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

  // Edit / Add Timetable Entry Modal
  const [editingEntry, setEditingEntry] = useState<{
    dayOfWeek: DayOfWeek;
    period: number;
    session: 'morning' | 'afternoon';
    existing?: TimetableEntry;
  } | null>(null);

  const [formSubject, setFormSubject] = useState('');
  const [formLessonName, setFormLessonName] = useState('');
  const [formHomework, setFormHomework] = useState('');
  const [formMaterials, setFormMaterials] = useState('');
  const [formTag, setFormTag] = useState<string>('Bình thường');
  const [formNote, setFormNote] = useState('');
  const [savingEntry, setSavingEntry] = useState(false);

  // Batch Paste Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [importingBatch, setImportingBatch] = useState(false);

  // Copy previous week modal
  const [copyingWeek, setCopyingWeek] = useState(false);

  // Calculate dates for the week
  const weekInfo = getWeekDateRange(config.week1StartDate, currentWeek);
  const mondayFormatted = weekInfo.mondayFull;
  const saturdayFormatted = weekInfo.saturdayFull;
  const dayDates = weekInfo.dayDates;

  // Filter timetable for current week
  // Bản ghi cũ chưa có week được hiển thị ở tuần đang hoạt động. Khi giáo viên
  // bấm sửa và lưu lại, API sẽ tự bổ sung month/week để hoàn tất chuyển đổi.
  const currentWeekTimetable = timetable.filter(t =>
    t.week === currentWeek || (!t.week && currentWeek === config.activeWeek)
  );

  const getEntrySession = (entry: TimetableEntry): 'morning' | 'afternoon' => (
    entry.session || (entry.period <= morningCount ? 'morning' : 'afternoon')
  );

  const getEntryDisplayPeriod = (entry: TimetableEntry): number => {
    const session = getEntrySession(entry);
    if (session === 'morning') return entry.period;
    if (usesSplitPeriodNumbering) {
      return entry.period > morningCount ? entry.period - morningCount : entry.period;
    }
    return entry.period <= morningCount ? entry.period + morningCount : entry.period;
  };

  const findTimetableEntry = (
    day: DayOfWeek,
    period: number,
    session: 'morning' | 'afternoon'
  ) => currentWeekTimetable.find((entry) => (
    entry.dayOfWeek === day
    && getEntrySession(entry) === session
    && getEntryDisplayPeriod(entry) === period
  ));

  // Open modal to edit a period
  const handleOpenEditPeriod = (day: DayOfWeek, period: number, session: 'morning' | 'afternoon') => {
    if (!canEdit) return;
    const existing = findTimetableEntry(day, period, session);
    setEditingEntry({ dayOfWeek: day, period, session, existing });
    if (existing) {
      setFormSubject(existing.subject || '');
      setFormLessonName(existing.lessonName || '');
      setFormHomework(existing.homework || '');
      setFormMaterials(existing.materials || '');
      setFormTag(existing.tag || 'Bình thường');
      setFormNote(existing.note || '');
    } else {
      setFormSubject('');
      setFormLessonName('');
      setFormHomework('');
      setFormMaterials('');
      setFormTag('Bình thường');
      setFormNote('');
    }
  };

  // Save period timetable entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    const subject = formSubject.trim();
    if (!subject) {
      warning('Vui lòng nhập tên môn học.');
      return;
    }
    setSavingEntry(true);
    try {
      const res = await api.saveTimetableEntry({
        id: editingEntry.existing?.id,
        month: weekInfo.monthNum,
        week: currentWeek,
        dayOfWeek: editingEntry.dayOfWeek,
        period: editingEntry.period,
        session: editingEntry.session,
        subject,
        lessonName: formLessonName,
        homework: formHomework,
        materials: formMaterials,
        tag: formTag as any,
        note: formNote
      });

      if (res.success) {
        success(res.message || 'Đã lưu thời khóa biểu & báo bài!');
        setEditingEntry(null);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu thời khóa biểu');
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteEntry = async (entry: TimetableEntry) => {
    const sessionLabel = getEntrySession(entry) === 'morning' ? 'Sáng' : 'Chiều';
    if (!window.confirm(`Xóa nội dung ${entry.dayOfWeek} - ${sessionLabel}, Tiết ${getEntryDisplayPeriod(entry)} (${entry.subject})?`)) return;
    setSavingEntry(true);
    try {
      const res = await api.deleteTimetableEntry(entry.id);
      if (res.success) {
        success(res.message);
        setEditingEntry(null);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa tiết học');
    } finally {
      setSavingEntry(false);
    }
  };

  // Copy previous week schedule
  const handleCopyPreviousWeek = async () => {
    if (currentWeek <= 1) {
      warning('Không có tuần trước đó để sao chép.');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn sao chép toàn bộ thời khóa biểu từ Tuần ${currentWeek - 1} sang Tuần ${currentWeek}?`)) {
      return;
    }
    setCopyingWeek(true);
    try {
      const res = await api.copyWeekTimetable({
        sourceWeek: currentWeek - 1,
        targetWeek: currentWeek,
        month: weekInfo.monthNum
      });
      if (res.success) {
        success(res.message);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi sao chép thời khóa biểu');
    } finally {
      setCopyingWeek(false);
    }
  };

  // Batch paste timetable
  const handleBatchPaste = async () => {
    if (!batchText.trim()) {
      warning('Vui lòng nhập nội dung thời khóa biểu.');
      return;
    }
    setImportingBatch(true);
    try {
      // Format parser: lines can be "Thứ 2 | 1 | Tiếng Anh | BTVN bài 1 | Mang SGK | KIỂM TRA"
      // or standard tab delimited matrix
      const lines = batchText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const entriesToSave: Partial<TimetableEntry>[] = [];

      lines.forEach(line => {
        const parts = line.split(/[\t,|;]/).map(p => p.trim());
        if (parts.length >= 2) {
          // Detect day
          let day: DayOfWeek = 'Thứ 2';
          const dStr = parts[0].toLowerCase();
          if (dStr.includes('3') || dStr.includes('ba')) day = 'Thứ 3';
          else if (dStr.includes('4') || dStr.includes('tư') || dStr.includes('tu')) day = 'Thứ 4';
          else if (dStr.includes('5') || dStr.includes('năm') || dStr.includes('nam')) day = 'Thứ 5';
          else if (dStr.includes('6') || dStr.includes('sáu') || dStr.includes('sau')) day = 'Thứ 6';
          else if (dStr.includes('7') || dStr.includes('bảy') || dStr.includes('bay')) day = 'Thứ 7';

          const hasSessionColumn = usesSplitPeriodNumbering && /sáng|sang|chiều|chieu/i.test(parts[1] || '');
          const session: 'morning' | 'afternoon' = hasSessionColumn && /chiều|chieu/i.test(parts[1])
            ? 'afternoon'
            : 'morning';
          const periodIndex = hasSessionColumn ? 2 : 1;
          const period = parseInt(parts[periodIndex]) || 1;
          const inferredSession: 'morning' | 'afternoon' = hasSessionColumn
            ? session
            : period <= morningCount ? 'morning' : 'afternoon';
          const subject = parts[periodIndex + 1] || 'Chào cờ';
          const homework = parts[periodIndex + 2] || '';
          const materials = parts[periodIndex + 3] || '';
          const tag = parts[periodIndex + 4] || 'Bình thường';

          entriesToSave.push({
            dayOfWeek: day,
            period,
            session: inferredSession,
            subject,
            homework,
            materials,
            tag: tag as any
          });
        }
      });

      if (entriesToSave.length === 0) {
        warning('Không nhận diện được định dạng. Vui lòng kiểm tra lại cấu trúc dòng.');
        return;
      }

      const res = await api.batchPasteTimetable({
        month: weekInfo.monthNum,
        week: currentWeek,
        timetableData: entriesToSave
      });

      if (res.success) {
        success(res.message);
        setShowBatchModal(false);
        setBatchText('');
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi dán thời khóa biểu');
    } finally {
      setImportingBatch(false);
    }
  };

  // Important reminders list (entries with homework, materials, or check tags)
  const importantEntries = currentWeekTimetable.filter(
    t => (t.homework && t.homework.trim().length > 0) || 
         (t.materials && t.materials.trim().length > 0) || 
         (t.tag && t.tag !== 'Bình thường')
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-400 text-emerald-950">
              <Calendar className="w-5 h-5 stroke-[2.5]" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Báo bài & Thời khóa biểu
            </h2>
          </div>
          <p className="text-amber-300 font-bold text-xs sm:text-sm mt-1.5 flex items-center gap-1.5">
            <span>Tuần {currentWeek}</span>
            <span>–</span>
            <span>Từ ngày {mondayFormatted} đến ngày {saturdayFormatted}</span>
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <>
              <button
                onClick={handleCopyPreviousWeek}
                disabled={copyingWeek || currentWeek <= 1}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Sao chép toàn bộ tiết học và bài tập từ tuần trước"
              >
                <Copy className="w-4 h-4" />
                <span>Sao chép tuần trước</span>
              </button>

              <button
                onClick={() => setShowBatchModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition active:scale-95 cursor-pointer"
                title="Dán nhanh thời khóa biểu hàng loạt"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Dán thời khóa biểu</span>
              </button>
            </>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>In / Lưu PDF</span>
          </button>
        </div>
      </div>

      {/* Week Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {Array.from({ length: Math.min(totalWeeks, 16) }, (_, i) => i + 1).map((w) => {
          const isSelected = currentWeek === w;
          const isLocked = weekLocks.some(l => l.week === w && l.isLocked);

          return (
            <button
              key={w}
              onClick={() => handleWeekChange(w)}
              className={`flex items-center gap-1 px-4 py-2 rounded-2xl text-xs font-black transition-all duration-150 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-emerald-950 shadow-md scale-105 border-2 border-amber-300'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>Tuần {w}</span>
              {isLocked && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Main Content Layout: Timetable Grid (8 cols) + Reminders Panel (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Weekly Timetable & Homework Matrix (xl:col-span-8) */}
        <div className="xl:col-span-8 bg-white rounded-[24px] shadow-sm border border-emerald-100 overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              
              {/* Header Row */}
              <thead>
                <tr className="bg-[#064e3b] text-white uppercase text-[11px] font-black">
                  <th className="p-3 text-center w-20 border-r border-emerald-800">TIẾT</th>
                  {DAYS_OF_WEEK.map((d) => (
                    <th key={d.key} className="p-3 text-center border-r border-emerald-800 last:border-r-0">
                      <div className="font-black">{d.label}</div>
                      <div className="text-[10px] text-amber-300 font-bold opacity-90 mt-0.5">
                        ({dayDates[d.key]})
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                
                {/* Morning Session Separator */}
                <tr className="bg-emerald-50/80 border-y border-emerald-200/80">
                  <td colSpan={7} className="p-2.5 px-4 text-xs font-black text-emerald-950 tracking-wide uppercase">
                    🌅 BUỔI SÁNG (TIẾT 1 – {morningCount})
                  </td>
                </tr>

                {/* Morning Period Rows (1 to morningCount) */}
                {Array.from({ length: morningCount }, (_, i) => i + 1).map((period) => (
                  <tr key={period} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    
                    {/* Period Column */}
                    <td className="p-3 text-center bg-slate-50/80 border-r border-slate-200">
                      <div className="font-black text-slate-900 text-xs">Tiết {period}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Sáng</div>
                    </td>

                    {/* Day Columns */}
                    {DAYS_OF_WEEK.map((d) => {
                      const entry = findTimetableEntry(d.key, period, 'morning');
                      
                      return (
                        <td 
                          key={d.key} 
                          onClick={() => handleOpenEditPeriod(d.key, period, 'morning')}
                          className={`p-2.5 border-r border-slate-100 last:border-r-0 align-top transition relative group ${
                            canEdit ? 'cursor-pointer hover:bg-emerald-50/40' : ''
                          }`}
                        >
                          {entry ? (
                            <div className="space-y-1.5">
                              
                              {/* Subject & Tag */}
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="font-black text-xs text-slate-900 leading-tight">
                                  {entry.subject}
                                </span>

                                {entry.tag && entry.tag !== 'Bình thường' && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase tracking-tight ${
                                    entry.tag.toLowerCase().includes('kiểm tra') || entry.tag.toLowerCase().includes('kt')
                                      ? 'bg-rose-100 text-rose-800'
                                      : entry.tag.toLowerCase().includes('mang') || entry.tag.toLowerCase().includes('tài liệu')
                                      ? 'bg-amber-300 text-emerald-950 font-black'
                                      : entry.tag.toLowerCase().includes('btvn') || entry.tag.toLowerCase().includes('bài tập')
                                      ? 'bg-blue-100 text-blue-900'
                                      : entry.tag.toLowerCase().includes('nộp')
                                      ? 'bg-orange-100 text-orange-900'
                                      : 'bg-purple-100 text-purple-900'
                                  }`}>
                                    {entry.tag}
                                  </span>
                                )}
                              </div>

                              {/* Lesson Name */}
                              {entry.lessonName && (
                                <div className="text-[11px] text-emerald-900 font-medium leading-tight">
                                  {entry.lessonName}
                                </div>
                              )}

                              {/* Homework Task Line */}
                              {entry.homework && (
                                <div className="text-[11px] text-slate-700 leading-tight bg-slate-100/70 p-1 rounded-md">
                                  <strong className="text-slate-900 font-bold">BTVN:</strong> {entry.homework}
                                </div>
                              )}

                              {/* Materials Line */}
                              {entry.materials && (
                                <div className="text-[11px] text-amber-900 leading-tight bg-amber-50/70 p-1 rounded-md">
                                  <strong className="font-bold">Mang:</strong> {entry.materials}
                                </div>
                              )}

                              {/* Sửa / xóa nhanh ngay tại mỗi tiết */}
                              {canEdit && (
                                <div className="opacity-0 group-hover:opacity-100 transition absolute top-1 right-1 flex gap-1">
                                  <button type="button" onClick={(event) => { event.stopPropagation(); handleOpenEditPeriod(d.key, period, 'morning'); }} className="p-1 rounded bg-white shadow text-emerald-700" title="Sửa tiết học">
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button type="button" onClick={(event) => { event.stopPropagation(); handleDeleteEntry(entry); }} className="p-1 rounded bg-white shadow text-rose-600" title="Xóa tiết học">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                            </div>
                          ) : (
                            <div className="h-10 flex items-center justify-center text-slate-300 text-xs">
                              {canEdit ? (
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                  <Plus className="w-3 h-3" /> Ghi
                                </span>
                              ) : (
                                <span>—</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                  </tr>
                ))}

                {/* Afternoon Session Separator (if afternoon periods exist) */}
                {afternoonCount > 0 && (
                  <>
                    <tr className="bg-amber-50/80 border-y border-amber-200/80">
                      <td colSpan={7} className="p-2.5 px-4 text-xs font-black text-amber-950 tracking-wide uppercase">
                        🌆 BUỔI CHIỀU (TIẾT {usesSplitPeriodNumbering ? 1 : morningCount + 1} – {usesSplitPeriodNumbering ? afternoonCount : totalPeriods})
                      </td>
                    </tr>

                    {/* Afternoon Period Rows */}
                    {Array.from({ length: afternoonCount }, (_, i) => (usesSplitPeriodNumbering ? 1 : morningCount + 1) + i).map((period) => (
                      <tr key={`afternoon-${period}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        
                        {/* Period Column */}
                        <td className="p-3 text-center bg-slate-50/80 border-r border-slate-200">
                          <div className="font-black text-slate-900 text-xs">Tiết {period}</div>
                          <div className="text-[10px] text-amber-800 font-medium">Chiều</div>
                        </td>

                        {/* Day Columns */}
                        {DAYS_OF_WEEK.map((d) => {
                          const entry = findTimetableEntry(d.key, period, 'afternoon');
                          
                          return (
                            <td 
                              key={d.key} 
                              onClick={() => handleOpenEditPeriod(d.key, period, 'afternoon')}
                              className={`p-2.5 border-r border-slate-100 last:border-r-0 align-top transition relative group ${
                                canEdit ? 'cursor-pointer hover:bg-emerald-50/40' : ''
                              }`}
                            >
                              {entry ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <span className="font-black text-xs text-slate-900 leading-tight">
                                      {entry.subject}
                                    </span>

                                    {entry.tag && entry.tag !== 'Bình thường' && (
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase tracking-tight ${
                                        entry.tag.toLowerCase().includes('kiểm tra') || entry.tag.toLowerCase().includes('kt')
                                          ? 'bg-rose-100 text-rose-800'
                                          : entry.tag.toLowerCase().includes('mang') || entry.tag.toLowerCase().includes('tài liệu')
                                          ? 'bg-amber-300 text-emerald-950 font-black'
                                          : 'bg-blue-100 text-blue-900'
                                      }`}>
                                        {entry.tag}
                                      </span>
                                    )}
                                  </div>

                                  {entry.lessonName && (
                                    <div className="text-[11px] text-emerald-900 font-medium leading-tight">
                                      {entry.lessonName}
                                    </div>
                                  )}

                                  {entry.homework && (
                                    <div className="text-[11px] text-slate-700 leading-tight bg-slate-100/70 p-1 rounded-md">
                                      <strong className="text-slate-900 font-bold">BTVN:</strong> {entry.homework}
                                    </div>
                                  )}

                                  {entry.materials && (
                                    <div className="text-[11px] text-amber-900 leading-tight bg-amber-50/70 p-1 rounded-md">
                                      <strong className="font-bold">Mang:</strong> {entry.materials}
                                    </div>
                                  )}

                                  {canEdit && (
                                    <div className="opacity-0 group-hover:opacity-100 transition absolute top-1 right-1 flex gap-1">
                                      <button type="button" onClick={(event) => { event.stopPropagation(); handleOpenEditPeriod(d.key, period, 'afternoon'); }} className="p-1 rounded bg-white shadow text-emerald-700" title="Sửa tiết học">
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button type="button" onClick={(event) => { event.stopPropagation(); handleDeleteEntry(entry); }} className="p-1 rounded bg-white shadow text-rose-600" title="Xóa tiết học">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-10 flex items-center justify-center text-slate-300 text-xs">
                                  {canEdit ? (
                                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                      <Plus className="w-3 h-3" /> Ghi
                                    </span>
                                  ) : (
                                    <span>—</span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}

                      </tr>
                    ))}
                  </>
                )}

              </tbody>
            </table>
          </div>

        </div>

        {/* Right Side: ✨ Việc Cần Nhớ (Tuần X) Panel (xl:col-span-4) */}
        <div className="xl:col-span-4 bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100 space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-emerald-950">
                Việc Cần Nhớ (Tuần {currentWeek})
              </h3>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-300 text-emerald-950">
              {importantEntries.length} mục
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Danh sách tổng hợp tự động các bài kiểm tra, đồ dùng cần mang và nhiệm vụ bài tập về nhà trong tuần {currentWeek}.
          </p>

          {/* Important List Cards */}
          <div className="space-y-3">
            {importantEntries.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto" />
                <p>Chưa có việc dặn dò đặc biệt cho tuần này.</p>
              </div>
            ) : (
              importantEntries.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-200 transition space-y-2"
                >
                  {/* Header of Item */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="font-black text-xs text-slate-900">
                      {item.dayOfWeek} – {getEntrySession(item) === 'morning' ? 'Sáng' : 'Chiều'}, Tiết {getEntryDisplayPeriod(item)} ({item.subject})
                    </div>

                    {item.tag && item.tag !== 'Bình thường' && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase ${
                        item.tag.toLowerCase().includes('kiểm tra')
                          ? 'bg-rose-100 text-rose-800'
                          : item.tag.toLowerCase().includes('mang')
                          ? 'bg-amber-300 text-emerald-950 font-black'
                          : 'bg-blue-100 text-blue-900'
                      }`}>
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {/* Body details */}
                  <ul className="text-xs text-slate-700 space-y-1 pl-1">
                    {item.homework && (
                      <li className="flex items-start gap-1.5 leading-snug">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span><strong>BTVN:</strong> {item.homework}</span>
                      </li>
                    )}
                    {item.materials && (
                      <li className="flex items-start gap-1.5 leading-snug">
                        <span className="text-amber-600 font-bold">•</span>
                        <span><strong>Mang theo:</strong> {item.materials}</span>
                      </li>
                    )}
                    {item.note && (
                      <li className="flex items-start gap-1.5 leading-snug text-slate-500 italic">
                        <span>•</span>
                        <span>{item.note}</span>
                      </li>
                    )}
                  </ul>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Modal 1: Edit / Add Single Period Timetable & Homework */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-emerald-100">
            <h3 className="text-lg font-black text-emerald-950 mb-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span>{editingEntry.existing ? 'Chỉnh sửa Báo bài & Tiết học' : 'Ghi Báo Bài & Tiết Học'}</span>
            </h3>
            <p className="text-xs font-bold text-slate-500 mb-4">
              {editingEntry.dayOfWeek} – Tiết {editingEntry.period} ({editingEntry.session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'})
            </p>

            <form onSubmit={handleSaveEntry} className="space-y-3.5">
              
              {/* Subject: free text so every school can use its own subjects */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Môn học:</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Tự nhập tên môn học..."
                  autoFocus
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                />
              </div>

              {/* Tag / Badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nhãn / Đánh dấu nổi bật:</label>
                <select
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  <option value="Bình thường">Bình thường (Không nhãn)</option>
                  <option value="MANG TÀI LIỆU">MANG TÀI LIỆU (Màu vàng)</option>
                  <option value="KIỂM TRA">KIỂM TRA 15P / 1 TIẾT (Màu đỏ)</option>
                  <option value="BTVN">BÀI TẬP VỀ NHÀ (Màu xanh)</option>
                  <option value="CẦN NỘP">CẦN NỘP BÀI (Màu cam)</option>
                  <option value="QUAN TRỌNG">QUAN TRỌNG (Màu tím)</option>
                </select>
              </div>

              {/* Lesson Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên bài học / Chuyên đề:</label>
                <input
                  type="text"
                  value={formLessonName}
                  onChange={(e) => setFormLessonName(e.target.value)}
                  placeholder="Ví dụ: Bài 4: Khảo sát hàm số..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              {/* Homework Task */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bài tập về nhà (BTVN) & Nhiệm vụ:</label>
                <textarea
                  value={formHomework}
                  onChange={(e) => setFormHomework(e.target.value)}
                  placeholder="Ví dụ: Làm bài 1, 2, 3 SGK trang 45. Học thuộc 16 từ vựng..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              {/* Materials */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dụng cụ / Sách vở cần mang theo:</label>
                <input
                  type="text"
                  value={formMaterials}
                  onChange={(e) => setFormMaterials(e.target.value)}
                  placeholder="Ví dụ: Máy tính casio, compa, kẹp tài liệu..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div>
                  {editingEntry.existing && (
                    <button
                      type="button"
                      disabled={savingEntry}
                      onClick={() => handleDeleteEntry(editingEntry.existing!)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa nội dung
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEntry}
                  className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-black text-xs shadow hover:bg-[#095c47] cursor-pointer"
                >
                  {savingEntry ? 'Đang lưu...' : 'Lưu tiết học'}
                </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Paste Timetable */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-emerald-950 flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-amber-500" />
                <span>Dán Nhanh Thời Khóa Biểu Tuần {currentWeek}</span>
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dán dữ liệu từ bảng Excel hoặc danh sách theo mẫu. Cấu trúc mỗi dòng: <br/>
              <code className="text-emerald-800 font-mono font-bold bg-emerald-50 px-1 py-0.5 rounded">
                {usesSplitPeriodNumbering
                  ? 'Thứ [tab] Buổi [tab] Tiết [tab] Tên Môn [tab] BTVN [tab] Mang theo [tab] Nhãn'
                  : 'Thứ [tab] Tiết [tab] Tên Môn [tab] BTVN [tab] Mang theo [tab] Nhãn'}
              </code>
            </p>

            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={usesSplitPeriodNumbering
                ? `Thứ 2\tSáng\t1\tChào cờ\t\t\nThứ 2\tChiều\t1\tTiếng Anh\tHọc 16 từ vựng unit 1\tTài liệu, tập kẹp\tMANG TÀI LIỆU`
                : `Thứ 2\t1\tChào cờ\t\t\nThứ 2\t2\tTiếng Anh\tHọc 16 từ vựng unit 1\tTài liệu, tập kẹp\tMANG TÀI LIỆU\nThứ 3\t1\tToán\tLàm bài tập 1,2,3 trang 50\tThước, compa\tBTVN`}
              rows={8}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50"
            />

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{batchText.split('\n').filter(l => l.trim()).length} dòng được nhập</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={importingBatch || !batchText.trim()}
                  onClick={handleBatchPaste}
                  className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-bold text-xs shadow hover:bg-[#095c47] disabled:opacity-50"
                >
                  {importingBatch ? 'Đang cập nhật...' : 'Cập nhật Thời khóa biểu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
