import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Printer,
  Save,
  Shuffle,
  X,
} from 'lucide-react';
import { ClassroomLayout, FullClassData, TeacherDeskSide, UserRole } from '../../types';
import { api } from '../../services/api';
import { rawFirebaseConfig } from '../../firebase/config';
import { useToast } from '../Toast';
import { moveOrSwapSeatAssignment } from '../../utils/classroomLayoutUtils';

interface ClassroomLayoutModuleProps {
  data: FullClassData;
  onRefresh: () => void;
  userRole?: UserRole;
  userName: string;
}

const DEFAULT_LAYOUT: ClassroomLayout = {
  id: 'main',
  layoutMode: 4,
  groupOrder: [4, 2, 3, 1],
  teacherDeskSide: 'left',
  doorSide: 'right',
  teacherDeskLabel: 'BÀN GIÁO VIÊN',
  doorLabel: 'CỬA RA VÀO',
  aisleLabel: 'LỐI ĐI GIỮA',
  assignments: {},
};

const seatId = (group: number, desk: number, seat: number) => `G${group}D${desk}S${seat}`;

const defaultGroupOrder = (mode: 4 | 6) => mode === 4 ? [4, 2, 3, 1] : [1, 2, 3, 4, 5, 6];

const seatIdsForLayout = (mode: 4 | 6, groupOrder: number[]) => {
  const deskCount = mode === 6 ? 2 : 3;
  return groupOrder.flatMap((group) => (
    Array.from({ length: deskCount }, (_, deskIndex) => deskIndex + 1).flatMap((desk) => (
      Array.from({ length: 4 }, (_, seatIndex) => seatId(group, desk, seatIndex + 1))
    ))
  ));
};

const normalizeLayout = (layout?: ClassroomLayout, configuredMode?: 4 | 6): ClassroomLayout => {
  const mode: 4 | 6 = configuredMode || (Number(layout?.layoutMode) === 6 ? 6 : 4);
  const fallbackOrder = defaultGroupOrder(mode);
  const sourceOrder = Array.isArray(layout?.groupOrder) ? layout.groupOrder.map(Number) : [];
  const groupOrder = sourceOrder.filter((group, index) => (
    Number.isInteger(group)
    && group >= 1
    && group <= mode
    && sourceOrder.indexOf(group) === index
  ));
  fallbackOrder.forEach((group) => {
    if (!groupOrder.includes(group)) groupOrder.push(group);
  });

  const assignments = { ...(layout?.assignments || {}) };
  const hasNewSeatIds = Object.keys(assignments).some((key) => /^G\d+D\d+S\d+$/.test(key));
  if (!hasNewSeatIds && Object.keys(assignments).length > 0) {
    const oldStudentIds = Object.entries(assignments)
      .sort(([first], [second]) => first.localeCompare(second, undefined, { numeric: true }))
      .map(([, studentId]) => studentId)
      .filter(Boolean);
    Object.keys(assignments).forEach((key) => delete assignments[key]);
    seatIdsForLayout(mode, groupOrder).forEach((positionId, index) => {
      if (oldStudentIds[index]) assignments[positionId] = oldStudentIds[index];
    });
  }

  return {
    ...DEFAULT_LAYOUT,
    ...(layout || {}),
    id: 'main',
    layoutMode: mode,
    groupOrder: groupOrder.slice(0, mode),
    teacherDeskSide: layout?.teacherDeskSide === 'right' ? 'right' : 'left',
    doorSide: layout?.doorSide === 'left' ? 'left' : 'right',
    teacherDeskLabel: String(layout?.teacherDeskLabel || DEFAULT_LAYOUT.teacherDeskLabel),
    doorLabel: String(layout?.doorLabel || DEFAULT_LAYOUT.doorLabel),
    aisleLabel: String(layout?.aisleLabel || DEFAULT_LAYOUT.aisleLabel),
    assignments,
  };
};

export const ClassroomLayoutModule: React.FC<ClassroomLayoutModuleProps> = ({
  data,
  onRefresh,
  userRole = 'guest',
  userName,
}) => {
  const { success, error } = useToast();
  const canEdit = userRole === 'gvcn';
  const configuredGroupCount: 4 | 6 = Number(data.config.groupCount) === 6 ? 6 : 4;
  const moduleRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<ClassroomLayout>(() => normalizeLayout(data.classroomLayout, configuredGroupCount));
  const [isEditing, setIsEditing] = useState(canEdit && !data.classroomLayout);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const students = useMemo(
    () => [...(data.students || [])].sort((first, second) => (
      Number(first.orderNumber) - Number(second.orderNumber)
      || first.fullName.localeCompare(second.fullName, 'vi')
    )),
    [data.students]
  );
  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const activeSeatIds = useMemo(
    () => seatIdsForLayout(configuredGroupCount, layout.groupOrder),
    [configuredGroupCount, layout.groupOrder]
  );
  const activeSeatSet = useMemo(() => new Set(activeSeatIds), [activeSeatIds]);
  const assignedStudentIds = useMemo(
    () => new Set(
      Object.entries(layout.assignments)
        .filter(([positionId, studentId]) => activeSeatSet.has(positionId) && studentById.has(studentId))
        .map(([, studentId]) => studentId)
    ),
    [activeSeatSet, layout.assignments, studentById]
  );

  useEffect(() => {
    if (!isDirty) setLayout(normalizeLayout(data.classroomLayout, configuredGroupCount));
  }, [configuredGroupCount, data.classroomLayout, isDirty]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === moduleRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const updateLayout = (updates: Partial<ClassroomLayout>) => {
    setLayout((current) => ({ ...current, ...updates }));
    setIsDirty(true);
  };

  const handleSeatChange = (positionId: string, studentId: string) => {
    setLayout((current) => {
      const assignments = moveOrSwapSeatAssignment(current.assignments, positionId, studentId);
      return { ...current, assignments };
    });
    setIsDirty(true);
  };

  const handleGroupNumberChange = (currentGroup: number, requestedGroup: number) => {
    if (currentGroup === requestedGroup) return;
    const nextOrder = [...layout.groupOrder];
    const currentIndex = nextOrder.indexOf(currentGroup);
    const requestedIndex = nextOrder.indexOf(requestedGroup);
    if (currentIndex < 0 || requestedIndex < 0) return;
    [nextOrder[currentIndex], nextOrder[requestedIndex]] = [nextOrder[requestedIndex], nextOrder[currentIndex]];
    updateLayout({ groupOrder: nextOrder });
  };

  const moveGroup = (group: number, direction: -1 | 1) => {
    const nextOrder = [...layout.groupOrder];
    const index = nextOrder.indexOf(group);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= nextOrder.length) return;
    [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
    updateLayout({ groupOrder: nextOrder });
  };

  const handleAutoArrange = () => {
    const assignments: Record<string, string> = {};
    activeSeatIds.forEach((positionId, index) => {
      if (students[index]) assignments[positionId] = students[index].id;
    });
    updateLayout({ assignments });
    success('Đã xếp học sinh theo số thứ tự. Hãy kiểm tra và bấm Lưu.');
  };

  const handleCancel = () => {
    setLayout(normalizeLayout(data.classroomLayout, configuredGroupCount));
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await api.saveClassroomLayout({
        layoutMode: configuredGroupCount,
        groupOrder: layout.groupOrder,
        teacherDeskSide: layout.teacherDeskSide,
        doorSide: layout.doorSide,
        teacherDeskLabel: layout.teacherDeskLabel,
        doorLabel: layout.doorLabel,
        aisleLabel: layout.aisleLabel,
        assignments: layout.assignments,
      });
      if (result.success) {
        success(result.message);
        setIsDirty(false);
        setIsEditing(false);
        onRefresh();
      }
    } catch (err: any) {
      const message = String(err?.message || '');
      error(message.includes('Missing or insufficient permissions')
        ? `Firebase chưa cấp quyền lưu Sơ đồ lớp. Hãy triển khai firestore.rules vào đúng dự án ${rawFirebaseConfig.projectId || 'đang kết nối'} rồi đăng nhập lại GVCN.`
        : message || 'Không thể lưu sơ đồ lớp.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await moduleRef.current?.requestFullscreen();
    } catch {
      error('Trình duyệt không thể mở chế độ toàn màn hình.');
    }
  };

  const changeTeacherSide = (side: TeacherDeskSide) => updateLayout({
    teacherDeskSide: side,
    doorSide: side === 'left' ? 'right' : 'left',
  });

  const desksPerGroup = configuredGroupCount === 6 ? 2 : 3;
  const rowCount = configuredGroupCount === 6 ? 3 : 2;
  const capacity = configuredGroupCount * desksPerGroup * 4;

  const renderFixture = (kind: 'teacher' | 'door') => {
    const isTeacher = kind === 'teacher';
    const label = isTeacher ? layout.teacherDeskLabel : layout.doorLabel;
    if (isTeacher) {
      return (
        <div className="h-12 border-2 border-emerald-600 rounded-xl bg-emerald-50 flex items-center justify-center px-2">
          {isEditing && canEdit ? (
            <input
              value={label}
              onChange={(event) => updateLayout({ teacherDeskLabel: event.target.value })}
              className="w-full bg-transparent text-center text-xs font-black text-emerald-950 outline-none"
              aria-label="Tên bàn giáo viên"
            />
          ) : <span className="text-xs font-black text-emerald-950">{label}</span>}
        </div>
      );
    }
    return (
      <div
        className="h-12 bg-emerald-700 flex items-center justify-center pl-7 pr-2"
        style={{ clipPath: 'polygon(17% 0,100% 0,100% 100%,17% 100%,17% 73%,0 50%,17% 27%)' }}
      >
        {isEditing && canEdit ? (
          <input
            value={label}
            onChange={(event) => updateLayout({ doorLabel: event.target.value })}
            className="w-full bg-transparent text-center text-xs font-black text-white outline-none"
            aria-label="Tên cửa ra vào"
          />
        ) : <span className="text-xs font-black text-white">{label}</span>}
      </div>
    );
  };

  return (
    <div
      ref={moduleRef}
      className={`h-[calc(100vh-90px)] min-h-[650px] print:h-auto print:min-h-0 flex flex-col gap-2 bg-[#f4f7f5] ${isFullscreen ? 'p-2' : ''}`}
    >
      <section className="no-print shrink-0 min-h-13 bg-white border border-emerald-200 rounded-2xl px-3 py-2 shadow-sm flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 mr-auto">
          <LayoutGrid className="w-5 h-5 text-emerald-700" />
          <div>
            <h2 className="text-sm font-black text-emerald-950">Sơ đồ lớp {data.config.className}</h2>
            <p className="text-[10px] text-slate-500 font-semibold">{configuredGroupCount} tổ • {capacity} chỗ • Đã xếp {assignedStudentIds.size}/{students.length} học sinh</p>
          </div>
        </div>

        {isEditing && canEdit ? (
          <>
            <span className="h-8 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black inline-flex items-center">
              {configuredGroupCount} tổ · đổi tại Cài đặt lớp
            </span>
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              Bàn GV
              <select value={layout.teacherDeskSide} onChange={(event) => changeTeacherSide(event.target.value as TeacherDeskSide)} className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-black text-emerald-950">
                <option value="left">Bên trái</option>
                <option value="right">Bên phải</option>
              </select>
            </label>
            <button type="button" onClick={handleAutoArrange} className="h-8 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer"><Shuffle className="w-3.5 h-3.5" /> Xếp theo STT</button>
            <span className="hidden xl:inline-flex h-8 items-center px-2.5 rounded-lg bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-100">
              Chọn “—” để xóa một chỗ · Chọn HS khác để chuyển/hoán đổi
            </span>
            <button type="button" onClick={handleCancel} className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-700 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer"><X className="w-3.5 h-3.5" /> Hủy</button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="h-8 px-3 rounded-lg bg-amber-400 text-emerald-950 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"><Save className="w-3.5 h-3.5" /> {isSaving ? 'Đang lưu' : 'Lưu'}</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => window.print()} className="h-8 px-2.5 rounded-lg border border-emerald-200 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer"><Printer className="w-3.5 h-3.5" /> In sơ đồ</button>
            {canEdit && <button type="button" onClick={() => setIsEditing(true)} className="h-8 px-3 rounded-lg bg-amber-400 text-emerald-950 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer"><Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa</button>}
          </>
        )}
        <button type="button" onClick={toggleFullscreen} className="h-8 px-2.5 rounded-lg bg-emerald-800 text-white text-[10px] font-black inline-flex items-center gap-1 cursor-pointer">
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          {isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        </button>
      </section>

      <section className="classroom-print-area print-container flex-1 min-h-0 bg-white border-[3px] border-emerald-700 p-2.5 grid grid-rows-[minmax(0,1fr)_3rem] gap-2 shadow-sm overflow-hidden">
        <div
          className="min-h-0 grid gap-x-2.5 gap-y-1.5"
          style={{ gridTemplateColumns: 'minmax(0,1fr) 3rem minmax(0,1fr)', gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}
        >
          <div className="col-start-2 row-start-1 row-end-[-1] border-x border-dashed border-emerald-200 flex items-center justify-center min-h-0">
            {isEditing && canEdit ? (
              <input
                value={layout.aisleLabel}
                onChange={(event) => updateLayout({ aisleLabel: event.target.value })}
                className="w-56 rotate-90 bg-transparent text-center text-[10px] tracking-[0.18em] font-black text-slate-500 outline-none"
                aria-label="Tên lối đi"
              />
            ) : <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] tracking-[0.18em] font-black text-slate-400">{layout.aisleLabel}</span>}
          </div>

          {layout.groupOrder.map((group, positionIndex) => {
            const row = Math.floor(positionIndex / 2) + 1;
            const column = positionIndex % 2 === 0 ? 1 : 3;
            return (
              <div key={group} className="min-w-0 min-h-0 grid grid-rows-[1.75rem_minmax(0,1fr)]" style={{ gridColumn: column, gridRow: row }}>
                <div className="flex items-center justify-center gap-1">
                  {isEditing && canEdit && (
                    <button type="button" onClick={() => moveGroup(group, -1)} className="no-print w-7 h-6 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center justify-center cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  )}
                  {isEditing && canEdit ? (
                    <select value={group} onChange={(event) => handleGroupNumberChange(group, Number(event.target.value))} className="h-6 min-w-18 px-2 rounded-md border-0 bg-emerald-700 text-white text-[11px] font-black text-center cursor-pointer">
                      {Array.from({ length: configuredGroupCount }, (_, index) => index + 1).map((value) => <option key={value} value={value}>TỔ {value}</option>)}
                    </select>
                  ) : <span className="min-w-18 px-3 py-1 rounded-md bg-emerald-700 text-white text-[11px] font-black text-center">TỔ {group}</span>}
                  {isEditing && canEdit && (
                    <button type="button" onClick={() => moveGroup(group, 1)} className="no-print w-7 h-6 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center justify-center cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
                  )}
                </div>

                <div className="min-h-0 grid gap-1" style={{ gridTemplateRows: `repeat(${desksPerGroup}, minmax(0, 1fr))` }}>
                  {Array.from({ length: desksPerGroup }, (_, deskIndex) => deskIndex + 1).map((desk) => (
                    <div key={desk} className="min-h-0 grid grid-cols-4 border border-emerald-300 bg-white">
                      {Array.from({ length: 4 }, (_, seatIndex) => seatIndex + 1).map((seat) => {
                        const positionId = seatId(group, desk, seat);
                        const assignedId = layout.assignments[positionId] || '';
                        const student = studentById.get(assignedId);
                        return (
                          <div key={positionId} className="min-w-0 min-h-0 border-r last:border-r-0 border-emerald-200 flex items-center justify-center p-0.5 text-center">
                            {isEditing && canEdit ? (
                              <div className="w-full h-full min-h-7 flex items-center gap-0.5">
                                <select
                                  value={assignedId}
                                  onChange={(event) => handleSeatChange(positionId, event.target.value)}
                                  className="min-w-0 flex-1 h-full bg-transparent border-0 px-0.5 text-[10px] font-bold text-slate-800 text-center outline-none cursor-pointer"
                                  aria-label={`Tổ ${group}, bàn ${desk}, chỗ ${seat}`}
                                  title="Chọn học sinh khác để chuyển hoặc hoán đổi vị trí"
                                >
                                  <option value="">—</option>
                                  {students.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.orderNumber}. {item.fullName}
                                    </option>
                                  ))}
                                </select>
                                {assignedId && (
                                  <button
                                    type="button"
                                    onClick={() => handleSeatChange(positionId, '')}
                                    className="no-print shrink-0 w-5 h-5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 inline-flex items-center justify-center cursor-pointer"
                                    aria-label={`Xóa ${student?.fullName || 'học sinh'} khỏi vị trí này`}
                                    title="Chỉ xóa học sinh khỏi vị trí này"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : student ? (
                              <div className="leading-tight">
                                <div className="text-[10px] sm:text-[11px] font-black text-slate-900">{student.fullName}</div>
                                <div className="text-[8px] sm:text-[9px] font-bold text-emerald-700 mt-0.5">STT {student.orderNumber}</div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[11rem_minmax(8rem,1fr)_11rem] gap-3 items-center">
          {layout.teacherDeskSide === 'left' ? renderFixture('teacher') : renderFixture('door')}
          <div className="text-center text-xl font-black text-emerald-950">LỚP {String(data.config.className || '').toUpperCase()}</div>
          {layout.teacherDeskSide === 'right' ? renderFixture('teacher') : renderFixture('door')}
        </div>
      </section>

      {!canEdit && data.classroomLayout && (
        <div className="no-print shrink-0 flex items-center justify-center gap-1 text-[10px] text-emerald-700 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Sơ đồ do GVCN cập nhật {data.classroomLayout.updatedBy ? `• ${data.classroomLayout.updatedBy}` : `• ${userName}`}
        </div>
      )}
    </div>
  );
};
