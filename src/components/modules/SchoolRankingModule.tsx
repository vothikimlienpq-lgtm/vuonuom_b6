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

interface SchoolRankingModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
  onRefresh: () => void;
  userRole?: UserRole;
}

export const SchoolRankingModule: React.FC<SchoolRankingModuleProps> = ({
  data,
  selectedMonth,
  selectedWeek,
  onRefresh,
  userRole = 'guest',
}) => {
  const { success, error } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [schoolRank, setSchoolRank] = useState<number>(1);
  const [totalSchoolClasses, setTotalSchoolClasses] = useState<number>(36);
  const [gradeRank, setGradeRank] = useState<number>(1);
  const [totalGradeClasses, setTotalGradeClasses] = useState<number>(12);
  const [competitionPoints, setCompetitionPoints] = useState<number>(98.5);
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const isGvcn = userRole === 'gvcn';
  const rankings = data.schoolRankings || [];

  const handleSaveRank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.saveSchoolRank({
        month: selectedMonth,
        week: selectedWeek,
        schoolRank,
        totalSchoolClasses,
        gradeRank,
        totalGradeClasses,
        competitionPoints,
        note,
      });
      if (res.success) {
        success(res.message);
        setShowAddModal(false);
        setNote('');
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

  // Latest ranking record
  const latestRank = rankings[0];

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
            Ghi nhận và theo dõi vị trí thi đua của Lớp 11B6 theo kết quả công bố định kỳ của Đoàn trường.
          </p>
        </div>

        {isGvcn && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-emerald-950" />
            <span>Cập nhật thứ hạng tuần này</span>
          </button>
        )}
      </div>

      {/* Latest Standing KPI Cards */}
      {latestRank && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-[24px] p-6 border border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Hạng toàn trường</div>
              <div className="text-3xl sm:text-4xl font-black text-[#064e3b] mt-1">
                #{latestRank.schoolRank} <span className="text-sm font-semibold text-slate-400">/ {latestRank.totalSchoolClasses} lớp</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-1">
                Tuần {latestRank.week} (Tháng {latestRank.month})
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
                #{latestRank.gradeRank} <span className="text-sm font-semibold text-slate-400">/ {latestRank.totalGradeClasses} lớp</span>
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
              <div className="text-xs font-bold text-slate-500 uppercase">Điểm thi đua trường chấm</div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700 mt-1">
                {latestRank.competitionPoints} <span className="text-sm font-semibold text-slate-400">/ 100đ</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1 truncate max-w-[200px]">
                {latestRank.note || 'Nề nếp và chuyên cần tốt'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black">
              ⭐
            </div>
          </div>

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
                  <th className="p-3 text-center">Điểm trường chấm</th>
                  <th className="p-3">Đánh giá & Ghi chú của Đoàn trường</th>
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
                      {r.competitionPoints}đ
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {r.note || '-'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Điểm thi đua trường chấm:</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={competitionPoints}
                  onChange={(e) => setCompetitionPoints(Number(e.target.value))}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú / Nhận xét của Đoàn trường:</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Đạt cờ Nhất tuần 2. Cần lưu ý 1 bạn quên đồng phục..."
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
