import React, { useState } from 'react';
import { 
  Award, 
  TrendingUp, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  Sparkles, 
  FileText, 
  ChevronRight,
  School,
  CheckCircle2
} from 'lucide-react';
import { FullClassData, SchoolRankRecord, UserRole } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { getWeekDateRange } from '../../utils/dateUtils';

interface SchoolRankingModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
  onRefresh: () => void;
  onSelectWeek?: (week: number) => void;
  userRole?: UserRole;
}

export const SchoolRankingModule: React.FC<SchoolRankingModuleProps> = ({
  data,
  selectedMonth,
  selectedWeek,
  onRefresh,
  onSelectWeek,
  userRole = 'guest',
}) => {
  const { success, error } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalWeek, setModalWeek] = useState<number>(selectedWeek);
  const [schoolRank, setSchoolRank] = useState<number>(1);
  const [totalSchoolClasses, setTotalSchoolClasses] = useState<number>(36);
  const [gradeRank, setGradeRank] = useState<number>(1);
  const [totalGradeClasses, setTotalGradeClasses] = useState<number>(12);
  const [competitionPoints, setCompetitionPoints] = useState<number>(98.5);
  const [deductedPoints, setDeductedPoints] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const isGvcn = userRole === 'gvcn';
  const rankings = data.schoolRankings || [];
  const totalWeeks = Math.max(4, Number(data.config.totalWeeks) || 4);
  const allWeeks = Array.from({ length: totalWeeks }, (_, index) => index + 1);
  const selectedWeekMonth = getWeekDateRange(data.config.week1StartDate, selectedWeek).monthNum;
  const selectedRank = rankings.find(
    record => record.week === selectedWeek && record.month === selectedWeekMonth
  );

  const openUpdateModal = () => {
    const existing = rankings.find(record => record.month === selectedWeekMonth && record.week === selectedWeek);
    setModalWeek(selectedWeek);
    setSchoolRank(existing?.schoolRank || 1);
    setTotalSchoolClasses(existing?.totalSchoolClasses || 36);
    setGradeRank(existing?.gradeRank || 1);
    setTotalGradeClasses(existing?.totalGradeClasses || 12);
    setCompetitionPoints(existing?.competitionPoints ?? 100);
    setDeductedPoints(existing?.deductedPoints ?? Math.max(0, 100 - (existing?.competitionPoints ?? 100)));
    setNote(existing?.deductionReason || existing?.note || '');
    setShowAddModal(true);
  };

  const handleSaveRank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.saveSchoolRank({
        month: getWeekDateRange(data.config.week1StartDate, modalWeek).monthNum,
        week: modalWeek,
        schoolRank,
        totalSchoolClasses,
        gradeRank,
        totalGradeClasses,
        competitionPoints,
        deductedPoints,
        deductionReason: note,
        note,
      });
      if (res.success) {
        success(res.message);
        setShowAddModal(false);
        setNote('');
        onSelectWeek?.(modalWeek);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu thứ hạng');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi thứ hạng này?')) return;
    try {
      const res = await api.deleteSchoolRank(id);
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
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
            Kết Quả Thi Đua Toàn Trường
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-400" />
            <span>Thứ Hạng Toàn Trường & Khối 11</span>
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Ghi nhận và theo dõi vị trí thi đua của Lớp {data.config.className} theo kết quả công bố định kỳ của Đoàn trường.
          </p>
        </div>

        {isGvcn && (
          <button
            onClick={openUpdateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-emerald-950" />
            <span>Cập nhật thứ hạng</span>
          </button>
        )}
      </div>

      {/* Week selector */}
      <div className="bg-white rounded-[24px] p-4 sm:p-5 shadow-sm border border-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-emerald-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>Chọn tuần cần xem</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Hiển thị đủ {totalWeeks} tuần của năm học. Bấm tuần nào để xem đúng kết quả và điểm bị trừ của tuần đó.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full self-start sm:self-auto">
            Tháng {selectedMonth} • Đang xem Tuần {selectedWeek}
          </div>
        </div>

        {allWeeks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {allWeeks.map(week => {
              const weekMonth = getWeekDateRange(data.config.week1StartDate, week).monthNum;
              const weekRange = getWeekDateRange(data.config.week1StartDate, week).rangeFormatted;
              const hasData = rankings.some(record => record.week === week && record.month === weekMonth);
              const isActive = selectedWeek === week;

              return (
                <button
                  key={week}
                  type="button"
                  onClick={() => onSelectWeek?.(week)}
                  className={`min-h-[62px] px-3 py-2.5 rounded-2xl border-2 font-black text-sm transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-0.5 ${
                    isActive
                      ? 'bg-amber-400 border-amber-400 text-emerald-950 shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}
                  aria-pressed={isActive}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Tuần {week}
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${hasData ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      title={hasData ? 'Đã cập nhật dữ liệu' : 'Chưa cập nhật dữ liệu'}
                    />
                  </span>
                  <span className={`text-[9px] font-bold ${isActive ? 'text-emerald-900' : 'text-slate-400'}`}>
                    Tháng {weekMonth} • {weekRange}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-500 text-center">
            Chưa xác định được tuần nào trong năm học.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-slate-500 font-medium">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Đã cập nhật</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />Chưa cập nhật</span>
        </div>
      </div>

      {/* Selected week standing KPI cards */}
      {selectedRank ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-[24px] p-6 border border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Hạng toàn trường</div>
              <div className="text-3xl sm:text-4xl font-black text-[#064e3b] mt-1">
                #{selectedRank.schoolRank} <span className="text-sm font-semibold text-slate-400">/ {selectedRank.totalSchoolClasses} lớp</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-1">
                Tuần {selectedRank.week} (Tháng {selectedRank.month})
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              👑
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Hạng trong Khối 11</div>
              <div className="text-3xl sm:text-4xl font-black text-amber-600 mt-1">
                #{selectedRank.gradeRank} <span className="text-sm font-semibold text-slate-400">/ {selectedRank.totalGradeClasses} lớp</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Top dẫn đầu khối 11
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              🥇
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Điểm lớp bị trừ trong tuần</div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700 mt-1">
                −{selectedRank.deductedPoints ?? Math.max(0, 100 - selectedRank.competitionPoints)} <span className="text-sm font-semibold text-slate-400">điểm</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1 truncate max-w-[200px]">
                {selectedRank.deductionReason || selectedRank.note || 'Không bị trừ điểm'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black">
              ⭐
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-[24px] p-7 shadow-sm border border-dashed border-slate-300 text-center">
          <Calendar className="w-9 h-9 text-slate-300 mx-auto mb-2" />
          <div className="font-black text-emerald-950">Tuần {selectedWeek} chưa có dữ liệu thứ hạng</div>
          <p className="text-xs text-slate-500 mt-1">
            {isGvcn
              ? 'Bấm “Cập nhật thứ hạng” để nhập kết quả cho tuần đang xem.'
              : 'Giáo viên chủ nhiệm chưa cập nhật kết quả của tuần này.'}
          </p>
        </div>
      )}

      {/* History Log Table */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
        <h3 className="text-base sm:text-lg font-black text-emerald-950 mb-4">
          Lịch Sử Xếp Hạng Qua Các Tuần
        </h3>

        {rankings.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Chưa có dữ liệu xếp hạng trường. GVCN có thể bấm nút cập nhật ở trên.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#064e3b] text-white uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3">Thời điểm</th>
                  <th className="p-3 text-center">Hạng toàn trường</th>
                  <th className="p-3 text-center">Hạng khối 11</th>
                  <th className="p-3 text-center">Điểm bị trừ</th>
                  <th className="p-3">Lý do bị trừ điểm</th>
                  <th className="p-3 text-right">Ngày cập nhật</th>
                  {isGvcn && <th className="p-3 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rankings.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                      Tuần {r.week} (Tháng {r.month})
                    </td>
                    <td className="p-3 text-center font-black text-emerald-800">
                      #{r.schoolRank} / {r.totalSchoolClasses}
                    </td>
                    <td className="p-3 text-center font-black text-amber-600">
                      #{r.gradeRank} / {r.totalGradeClasses}
                    </td>
                    <td className="p-3 text-center font-black text-slate-900">
                      −{r.deductedPoints ?? Math.max(0, 100 - r.competitionPoints)}đ
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {r.deductionReason || r.note || '-'}
                    </td>
                    <td className="p-3 text-right text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {r.updatedDate}
                    </td>
                    {isGvcn && (
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add School Rank */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-emerald-100">
            <h3 className="text-lg font-black text-emerald-950 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Nhập Kết Quả Thi Đua Của Trường</span>
            </h3>

            <form onSubmit={handleSaveRank} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn tuần cập nhật:</label>
                <select
                  value={modalWeek}
                  onChange={(e) => {
                    const week = Number(e.target.value);
                    setModalWeek(week);
                    const existing = rankings.find(record => record.week === week);
                    if (existing) {
                      setSchoolRank(existing.schoolRank);
                      setTotalSchoolClasses(existing.totalSchoolClasses);
                      setGradeRank(existing.gradeRank);
                      setTotalGradeClasses(existing.totalGradeClasses);
                      setCompetitionPoints(existing.competitionPoints);
                      setDeductedPoints(existing.deductedPoints ?? Math.max(0, 100 - existing.competitionPoints));
                      setNote(existing.deductionReason || existing.note || '');
                    } else {
                      setDeductedPoints(0);
                      setCompetitionPoints(100);
                      setNote('');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                >
                  {Array.from({ length: Math.max(4, Number(data.config.totalWeeks) || 4) }, (_, index) => index + 1).map(week => (
                    <option key={week} value={week}>Tuần {week}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hạng toàn trường:</label>
                  <input
                    type="number"
                    min={1}
                    value={schoolRank}
                    onChange={(e) => setSchoolRank(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tổng số lớp trường:</label>
                  <input
                    type="number"
                    min={1}
                    value={totalSchoolClasses}
                    onChange={(e) => setTotalSchoolClasses(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hạng trong khối 11:</label>
                  <input
                    type="number"
                    min={1}
                    value={gradeRank}
                    onChange={(e) => setGradeRank(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tổng số lớp khối:</label>
                  <input
                    type="number"
                    min={1}
                    value={totalGradeClasses}
                    onChange={(e) => setTotalGradeClasses(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Điểm lớp bị trừ trong tuần:</label>
                <input
                  type="number"
                  min={0}
                  value={deductedPoints}
                  onChange={(e) => {
                    const points = Math.max(0, Number(e.target.value));
                    setDeductedPoints(points);
                    setCompetitionPoints(Math.max(0, 100 - points));
                  }}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lý do bị trừ điểm:</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi rõ học sinh, sự việc hoặc nội dung lớp bị trừ điểm..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-bold text-xs shadow hover:bg-[#095c47]"
                >
                  {saving ? 'Đang lưu...' : 'Lưu kết quả'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
