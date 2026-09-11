import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  LayoutGrid,
  Printer,
  RotateCcw,
  Save,
  Shuffle,
  Users,
  X,
} from 'lucide-react';
import { ClassroomLayout, FullClassData, TeacherDeskSide, UserRole } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../Toast';

interface ClassroomLayoutModuleProps {
  data: FullClassData;
  onRefresh: () => void;
  userRole?: UserRole;
  userName: string;
}

const DEFAULT_LAYOUT: ClassroomLayout = {
  id: 'main',
  rows: 5,
  columns: 4,
  seatsPerDesk: 2,
  teacherDeskSide: 'left',
  assignments: {},
};

const seatId = (row: number, column: number, seat: number) => `R${row}C${column}S${seat}`;

const normalizedLayout = (layout?: ClassroomLayout): ClassroomLayout => ({
  ...DEFAULT_LAYOUT,
  ...(layout || {}),
  id: 'main',
  rows: Math.min(8, Math.max(1, Number(layout?.rows) || DEFAULT_LAYOUT.rows)),
  columns: Math.min(6, Math.max(1, Number(layout?.columns) || DEFAULT_LAYOUT.columns)),
  seatsPerDesk: Math.min(2, Math.max(1, Number(layout?.seatsPerDesk) || DEFAULT_LAYOUT.seatsPerDesk)),
  teacherDeskSide: layout?.teacherDeskSide === 'right' ? 'right' : 'left',
  assignments: { ...(layout?.assignments || {}) },
});

export const ClassroomLayoutModule: React.FC<ClassroomLayoutModuleProps> = ({
  data,
  onRefresh,
  userRole = 'guest',
  userName,
}) => {
  const { success, error } = useToast();
  const canEdit = userRole === 'gvcn';
  const [layout, setLayout] = useState<ClassroomLayout>(() => normalizedLayout(data.classroomLayout));
  const [isEditing, setIsEditing] = useState(canEdit && !data.classroomLayout);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const students = useMemo(
    () => [...(data.students || [])].sort((first, second) => (
      Number(first.orderNumber) - Number(second.orderNumber)
      || first.fullName.localeCompare(second.fullName, 'vi')
    )),
    [data.students]
  );

  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  );

  const activeSeatIds = useMemo(() => {
    const ids: string[] = [];
    for (let row = 1; row <= layout.rows; row += 1) {
      for (let column = 1; column <= layout.columns; column += 1) {
        for (let seat = 1; seat <= layout.seatsPerDesk; seat += 1) {
          ids.push(seatId(row, column, seat));
        }
      }
    }
    return ids;
  }, [layout.rows, layout.columns, layout.seatsPerDesk]);

  const activeSeatSet = useMemo(() => new Set(activeSeatIds), [activeSeatIds]);
  const assignedStudentIds = useMemo(
    () => new Set(
      Object.entries(layout.assignments)
        .filter(([positionId, studentId]) => activeSeatSet.has(positionId) && studentById.has(studentId))
        .map(([, studentId]) => studentId)
    ),
    [activeSeatSet, layout.assignments, studentById]
  );
  const unassignedStudents = students.filter((student) => !assignedStudentIds.has(student.id));

  useEffect(() => {
    if (isDirty) return;
    setLayout(normalizedLayout(data.classroomLayout));
    if (!data.classroomLayout && canEdit) setIsEditing(true);
  }, [data.classroomLayout, canEdit, isDirty]);

  const updateLayout = (updates: Partial<ClassroomLayout>) => {
    setLayout((current) => ({ ...current, ...updates }));
    setIsDirty(true);
  };

  const handleSeatChange = (positionId: string, studentId: string) => {
    setLayout((current) => {
      const assignments = { ...current.assignments };
      Object.keys(assignments).forEach((key) => {
        if (assignments[key] === studentId && studentId) delete assignments[key];
      });
      if (studentId) assignments[positionId] = studentId;
      else delete assignments[positionId];
      return { ...current, assignments };
    });
    setIsDirty(true);
  };

  const handleAutoArrange = () => {
    const assignments: Record<string, string> = {};
    activeSeatIds.forEach((positionId, index) => {
      const student = students[index];
      if (student) assignments[positionId] = student.id;
    });
    updateLayout({ assignments });
    success('Đã xếp nhanh học sinh theo số thứ tự. Hãy kiểm tra và bấm Lưu sơ đồ.');
  };

  const handleClear = () => {
    if (!window.confirm('Xóa toàn bộ vị trí đang xếp trong sơ đồ? Danh sách học sinh vẫn được giữ nguyên.')) return;
    updateLayout({ assignments: {} });
  };

  const handleCancel = () => {
    setLayout(normalizedLayout(data.classroomLayout));
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await api.saveClassroomLayout({
        rows: layout.rows,
        columns: layout.columns,
        seatsPerDesk: layout.seatsPerDesk,
        teacherDeskSide: layout.teacherDeskSide,
        assignments: layout.assignments,
      });
      if (result.success) {
        success(result.message);
        setIsDirty(false);
        setIsEditing(false);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Không thể lưu sơ đồ lớp.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTeacherDeskSide = (side: TeacherDeskSide) => updateLayout({ teacherDeskSide: side });

  const capacity = layout.rows * layout.columns * layout.seatsPerDesk;

  return (
    <div className="space-y-6 classroom-layout-print print-container">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#064e3b] via-[#095c47] to-[#043d2e] text-white p-6 sm:p-8 shadow-xl overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-amber-300/10" />
        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-[11px] font-black uppercase tracking-wide mb-3">
              <LayoutGrid className="w-4 h-4" /> Không gian lớp học
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Sơ đồ lớp {data.config.className}</h2>
            <p className="mt-2 text-sm text-emerald-100 font-medium">
              Bảng lớp ở phía trên • {layout.rows} hàng × {layout.columns} dãy • {capacity} chỗ ngồi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {!isEditing && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> In sơ đồ
              </button>
            )}
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-emerald-950 font-black text-sm shadow-lg hover:bg-amber-300 transition cursor-pointer"
              >
                <Edit3 className="w-4 h-4" /> Chỉnh sửa sơ đồ
              </button>
            )}
          </div>
        </div>
      </section>

      {isEditing && canEdit && (
        <section className="no-print bg-white border border-emerald-100 rounded-[2rem] shadow-sm p-5 sm:p-6">
          <div className="flex flex-col xl:flex-row xl:items-end gap-5 justify-between">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <label className="text-xs font-bold text-slate-600">
                Số hàng bàn
                <select
                  value={layout.rows}
                  onChange={(event) => updateLayout({ rows: Number(event.target.value) })}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-black text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => <option key={value} value={value}>{value} hàng</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">
                Số dãy bàn
                <select
                  value={layout.columns}
                  onChange={(event) => updateLayout({ columns: Number(event.target.value) })}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-black text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} dãy</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">
                Chỗ mỗi bàn
                <select
                  value={layout.seatsPerDesk}
                  onChange={(event) => updateLayout({ seatsPerDesk: Number(event.target.value) })}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-black text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value={1}>1 học sinh</option>
                  <option value={2}>2 học sinh</option>
                </select>
              </label>
              <div className="text-xs font-bold text-slate-600">
                Bàn giáo viên
                <div className="mt-1.5 grid grid-cols-2 rounded-xl border border-slate-200 overflow-hidden">
                  {(['left', 'right'] as TeacherDeskSide[]).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => handleTeacherDeskSide(side)}
                      className={`px-2 py-2.5 text-xs font-black cursor-pointer transition ${layout.teacherDeskSide === side ? 'bg-amber-400 text-emerald-950' : 'bg-white text-slate-600 hover:bg-emerald-50'}`}
                    >
                      {side === 'left' ? 'Bên trái' : 'Bên phải'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleAutoArrange} className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 cursor-pointer">
                <Shuffle className="w-4 h-4" /> Xếp theo STT
              </button>
              <button type="button" onClick={handleClear} className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 cursor-pointer">
                <RotateCcw className="w-4 h-4" /> Xóa vị trí
              </button>
              <button type="button" onClick={handleCancel} className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer">
                <X className="w-4 h-4" /> Hủy
              </button>
              <button type="button" onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#064e3b] text-white font-black text-xs hover:bg-[#095c47] disabled:opacity-50 cursor-pointer">
                <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu sơ đồ'}
              </button>
            </div>
          </div>

          <div className={`mt-4 flex items-start gap-2 px-4 py-3 rounded-xl text-xs font-semibold ${capacity < students.length ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>
            {capacity < students.length ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>
              Sơ đồ có {capacity} chỗ cho {students.length} học sinh. {capacity < students.length
                ? `Cần thêm ít nhất ${students.length - capacity} chỗ để xếp đủ cả lớp.`
                : 'Có thể để trống các chỗ chưa sử dụng.'}
            </span>
          </div>
        </section>
      )}

      {!canEdit && !data.classroomLayout && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-amber-900 text-sm font-semibold">
          GVCN chưa tạo sơ đồ chỗ ngồi cho lớp.
        </div>
      )}

      <section className="bg-white border border-emerald-100 rounded-[2rem] shadow-sm p-4 sm:p-7 overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="w-2/3 mx-auto rounded-2xl bg-slate-800 text-white text-center py-3 px-5 shadow-md border-b-4 border-amber-400">
            <div className="text-sm font-black tracking-[0.25em]">BẢNG LỚP</div>
          </div>

          <div className={`mt-5 flex ${layout.teacherDeskSide === 'left' ? 'justify-start' : 'justify-end'}`}>
            <div className="w-48 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-950 px-4 py-3 text-center shadow-sm">
              <div className="text-xs font-black uppercase tracking-wide">Bàn giáo viên</div>
              <div className="text-[10px] font-semibold mt-0.5">Phía {layout.teacherDeskSide === 'left' ? 'bên trái' : 'bên phải'} lớp</div>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {Array.from({ length: layout.rows }, (_, rowIndex) => rowIndex + 1).map((row) => (
              <div key={row}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">Hàng {row}</span>
                  <span className="h-px bg-slate-100 flex-1" />
                </div>
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: layout.columns }, (_, columnIndex) => columnIndex + 1).map((column) => (
                    <div key={`${row}-${column}`} className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 p-2 shadow-sm">
                      <div className="text-center text-[9px] uppercase tracking-wider font-black text-emerald-700 mb-1.5">
                        Bàn {column}
                      </div>
                      <div className={`grid gap-1.5 ${layout.seatsPerDesk === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {Array.from({ length: layout.seatsPerDesk }, (_, seatIndex) => seatIndex + 1).map((seat) => {
                          const positionId = seatId(row, column, seat);
                          const assignedId = layout.assignments[positionId] || '';
                          const student = studentById.get(assignedId);
                          return (
                            <div key={positionId} className="min-h-16 rounded-xl bg-white border border-emerald-100 flex items-center justify-center p-1.5 text-center">
                              {isEditing && canEdit ? (
                                <select
                                  value={assignedId}
                                  onChange={(event) => handleSeatChange(positionId, event.target.value)}
                                  className="w-full min-w-0 bg-transparent text-[11px] leading-tight font-bold text-slate-800 outline-none cursor-pointer"
                                  aria-label={`Hàng ${row}, dãy ${column}, chỗ ${seat}`}
                                >
                                  <option value="">— Trống —</option>
                                  {students.map((item) => (
                                    <option
                                      key={item.id}
                                      value={item.id}
                                      disabled={assignedStudentIds.has(item.id) && item.id !== assignedId}
                                    >
                                      {item.orderNumber}. {item.fullName}
                                    </option>
                                  ))}
                                </select>
                              ) : student ? (
                                <div>
                                  <div className="text-xs font-black text-emerald-950 leading-tight">{student.fullName}</div>
                                  <div className="text-[9px] text-emerald-700 font-bold mt-1">STT {student.orderNumber} • Tổ {student.groupNumber}</div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-300 font-semibold">Chỗ trống</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-xs font-bold text-slate-400">
            <span className="h-px bg-slate-200 w-20" /> CUỐI LỚP <span className="h-px bg-slate-200 w-20" />
          </div>
        </div>
      </section>

      <section className="bg-white border border-emerald-100 rounded-[2rem] shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-700" /></span>
            <div>
              <div className="font-black text-emerald-950">Đã xếp {assignedStudentIds.size}/{students.length} học sinh</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {data.classroomLayout?.updatedAt
                  ? `Cập nhật gần nhất bởi ${data.classroomLayout.updatedBy || userName}`
                  : 'Sơ đồ chưa được lưu lần nào.'}
              </div>
            </div>
          </div>
          {unassignedStudents.length > 0 && (
            <div className="text-xs font-semibold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
              Còn {unassignedStudents.length} học sinh chưa xếp chỗ
            </div>
          )}
        </div>

        {isEditing && canEdit && unassignedStudents.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 no-print">
            {unassignedStudents.map((student) => (
              <span key={student.id} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                {student.orderNumber}. {student.fullName}
              </span>
            ))}
          </div>
        )}
      </section>

      {canEdit && isEditing && isDirty && (
        <div className="fixed bottom-24 lg:bottom-6 right-5 z-30 no-print">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 text-emerald-950 font-black text-sm shadow-2xl border border-amber-300 hover:bg-amber-300 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-5 h-5" /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      )}

      {!canEdit && data.classroomLayout && (
        <div className="flex items-center gap-2 justify-center text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Bạn đang xem sơ đồ lớp do GVCN cập nhật.
        </div>
      )}
    </div>
  );
};
