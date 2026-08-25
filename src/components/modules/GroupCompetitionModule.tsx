import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Crown, 
  Plus, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  Gift,
  Calendar
} from 'lucide-react';
import { FullClassData, UserRole } from '../../types';
import { computeGroupStandings, computeStudentScores, formatAveragePoints, formatSignedPoints } from '../../utils/calculations';
import { api } from '../../services/api';
import { useToast } from '../Toast';

interface GroupCompetitionModuleProps {
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
  onSelectMonth: (month: number) => void;
  onRefresh: () => void;
  userRole?: UserRole;
}

export const GroupCompetitionModule: React.FC<GroupCompetitionModuleProps> = ({
  data,
  selectedMonth,
  selectedWeek,
  onSelectMonth,
  onRefresh,
  userRole = 'guest',
}) => {
  const { success, error } = useToast();
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  
  // Bonus points modal
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusGroupNum, setBonusGroupNum] = useState<number>(1);
  const [bonusPoints, setBonusPoints] = useState<number>(20);
  const [bonusReason, setBonusReason] = useState<string>('Trực nhật sạch sẽ & chuyên cần');
  const [bonusWeek, setBonusWeek] = useState<number>(selectedWeek);
  const [savingBonus, setSavingBonus] = useState(false);

  const students = data.students || [];
  const transactions = data.transactions || [];
  const groupBonuses = data.groupBonuses || [];

  const standings = computeGroupStandings(students, transactions, groupBonuses, selectedMonth);
  const studentScores = computeStudentScores(students, transactions, selectedMonth);

  const isGvcn = userRole === 'gvcn';

  const handleSaveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBonus(true);
    try {
      const res = await api.saveGroupBonus({
        month: selectedMonth,
        week: bonusWeek,
        groupNumber: bonusGroupNum,
        bonusPoints,
        reason: bonusReason,
      });
      if (res.success) {
        success(res.message);
        setShowBonusModal(false);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu điểm thưởng');
    } finally {
      setSavingBonus(false);
    }
  };

  // Podium sorting: 2nd place on left, 1st in center (tallest), 3rd on right, 4th below
  const rank1 = standings.find(s => s.rank === 1);
  const rank2 = standings.find(s => s.rank === 2);
  const rank3 = standings.find(s => s.rank === 3);
  const rank4 = standings.find(s => s.rank === 4);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
              Thi Đua Tháng {selectedMonth}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Bảng Vinh Danh Thi Đua 4 Tổ</span>
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Điểm xếp hạng = Trung bình điểm mỗi học sinh trong tổ + Điểm thưởng tập thể do GVCN trao tặng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-bold text-white">
            <Calendar className="h-4 w-4 text-amber-300" />
            <span>Xem tháng</span>
            <select
              aria-label="Chọn tháng xem thi đua theo tổ"
              value={selectedMonth}
              onChange={(event) => onSelectMonth(Number(event.target.value))}
              className="rounded-lg border border-emerald-600 bg-emerald-950 px-2 py-1 font-black text-white outline-none"
            >
              {[8, 9, 10, 11, 12, 1, 2, 3, 4, 5].map((month) => (
                <option key={month} value={month}>Tháng {month}</option>
              ))}
            </select>
          </label>
          {isGvcn && (
            <button
              onClick={() => setShowBonusModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer shrink-0"
            >
              <Gift className="w-4 h-4 text-emerald-950" />
              <span>Trao điểm thưởng tổ</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual 3D-styled Podium */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-sm border border-emerald-100">
        <h3 className="text-center text-xs font-black uppercase tracking-widest text-emerald-800 mb-8">
          🏆 Bục Vinh Quang Xếp Hạng Tháng {selectedMonth} 🏆
        </h3>

        <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-8 pb-4">
          
          {/* Rank 2 - Silver */}
          {rank2 && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center shadow-md mb-3 text-slate-700">
                <span className="font-black text-sm sm:text-lg">🥈 2</span>
              </div>
              <div className="text-center font-black text-slate-800 text-xs sm:text-sm">{rank2.groupName}</div>
              <div className="text-xs sm:text-base font-black text-slate-600 mb-2">{formatAveragePoints(rank2.grandTotal)} điểm TB</div>
              <div className="w-full bg-gradient-to-t from-slate-300 to-slate-200 h-28 sm:h-36 rounded-t-2xl flex items-center justify-center shadow-inner text-slate-600 font-black text-sm sm:text-base border-t-2 border-slate-400">
                HẠNG NHÌ
              </div>
            </div>
          )}

          {/* Rank 1 - Gold (Center, Highest) */}
          {rank1 && (
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-amber-400 absolute -top-5 sm:-top-7 left-1/2 -translate-x-1/2 animate-bounce" />
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center shadow-xl text-amber-900">
                  <span className="font-black text-base sm:text-2xl">🥇 1</span>
                </div>
              </div>
              <div className="text-center font-black text-emerald-950 text-sm sm:text-base">{rank1.groupName}</div>
              <div className="text-sm sm:text-lg font-black text-amber-600 mb-2">{formatAveragePoints(rank1.grandTotal)} điểm TB</div>
              <div className="w-full bg-gradient-to-t from-amber-400 to-amber-300 h-36 sm:h-48 rounded-t-2xl flex items-center justify-center shadow-md text-emerald-950 font-black text-base sm:text-lg border-t-4 border-amber-500">
                HẠNG NHẤT
              </div>
            </div>
          )}

          {/* Rank 3 - Bronze */}
          {rank3 && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-orange-100 border-2 border-orange-300 flex items-center justify-center shadow-md mb-3 text-orange-800">
                <span className="font-black text-sm sm:text-lg">🥉 3</span>
              </div>
              <div className="text-center font-black text-slate-800 text-xs sm:text-sm">{rank3.groupName}</div>
              <div className="text-xs sm:text-base font-black text-orange-700 mb-2">{formatAveragePoints(rank3.grandTotal)} điểm TB</div>
              <div className="w-full bg-gradient-to-t from-orange-300 to-orange-200 h-20 sm:h-28 rounded-t-2xl flex items-center justify-center shadow-inner text-orange-900 font-black text-sm sm:text-base border-t-2 border-orange-400">
                HẠNG BA
              </div>
            </div>
          )}

        </div>

        {/* 4th Place Card */}
        {rank4 && (
          <div className="max-w-md mx-auto mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex items-center justify-between px-6">
            <span className="text-xs font-bold text-slate-600">🏅 Hạng Tư (Cố lên):</span>
            <span className="font-black text-sm text-emerald-950">{rank4.groupName}</span>
            <span className="font-bold text-sm text-emerald-800">{formatAveragePoints(rank4.grandTotal)} điểm TB</span>
          </div>
        )}
      </div>

      {/* Comprehensive Breakdown Matrix Table */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
        <h3 className="text-base sm:text-lg font-black text-emerald-950 mb-4">
          Bảng Điểm Chi Tiết Từng Tuần Của 4 Tổ (Tháng {selectedMonth})
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#064e3b] text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-3">Thứ hạng</th>
                <th className="p-3">Tổ thi đua</th>
                <th className="p-3 text-center">Sĩ số</th>
                <th className="p-3 text-center">Tuần 1</th>
                <th className="p-3 text-center">Tuần 2</th>
                <th className="p-3 text-center">Tuần 3</th>
                <th className="p-3 text-center">Tuần 4</th>
                <th className="p-3 text-center">TB cá nhân/HS</th>
                <th className="p-3 text-center">Điểm thưởng tổ</th>
                <th className="p-3 text-center font-black">Điểm xếp hạng</th>
                <th className="p-3 text-right">Danh sách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {standings.map(g => {
                const isExpanded = expandedGroup === g.groupNumber;
                const members = studentScores.filter(s => s.groupNumber === g.groupNumber);

                return (
                  <React.Fragment key={g.groupNumber}>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-3 font-black whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs ${
                          g.rank === 1 ? 'bg-amber-400 text-emerald-950 font-black' :
                          g.rank === 2 ? 'bg-slate-300 text-slate-800' :
                          g.rank === 3 ? 'bg-orange-300 text-orange-950' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          Hạng {g.rank}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 text-sm whitespace-nowrap">
                        {g.groupName}
                      </td>
                      <td className="p-3 text-center font-medium text-slate-600">
                        {g.memberCount} HS
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {formatSignedPoints(g.weekAverages[1] || 0, 'đ')}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {formatSignedPoints(g.weekAverages[2] || 0, 'đ')}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {formatSignedPoints(g.weekAverages[3] || 0, 'đ')}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {formatSignedPoints(g.weekAverages[4] || 0, 'đ')}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {formatAveragePoints(g.memberPointsAverage)}đ
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        +{g.bonusPointsTotal}đ
                      </td>
                      <td className="p-3 text-center font-black text-sm text-amber-600 whitespace-nowrap">
                        {formatAveragePoints(g.grandTotal)}đ
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setExpandedGroup(isExpanded ? null : g.groupNumber)}
                          className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-50 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Đóng' : 'Xem HS'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Member List */}
                    {isExpanded && (
                      <tr className="bg-emerald-50/40">
                        <td colSpan={11} className="p-4">
                          <div className="text-xs font-black text-emerald-950 mb-2 uppercase">
                            Thành viên {g.groupName} ({members.length} học sinh):
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {members.map(m => (
                              <div key={m.studentId} className="p-2.5 rounded-xl bg-white border border-emerald-100 text-xs flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-slate-900">{m.studentName}</div>
                                  <div className="text-[10px] text-slate-500">{m.position}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-black text-emerald-800">{formatSignedPoints(m.monthTotal, 'đ')}</div>
                                  <div className="text-[10px] text-slate-500">XL: {m.conductRank}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus Modal for GVCN */}
      {showBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-emerald-100">
            <h3 className="text-lg font-black text-emerald-950 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              <span>Trao Điểm Thưởng Tập Thể Cho Tổ</span>
            </h3>

            <form onSubmit={handleSaveBonus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Tổ:</label>
                <select
                  value={bonusGroupNum}
                  onChange={(e) => setBonusGroupNum(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-white"
                >
                  <option value={1}>Tổ 1</option>
                  <option value={2}>Tổ 2</option>
                  <option value={3}>Tổ 3</option>
                  <option value={4}>Tổ 4</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tuần áp dụng:</label>
                <select
                  value={bonusWeek}
                  onChange={(e) => setBonusWeek(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-white"
                >
                  <option value={1}>Tuần 1</option>
                  <option value={2}>Tuần 2</option>
                  <option value={3}>Tuần 3</option>
                  <option value={4}>Tuần 4</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điểm thưởng (+):</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lý do thưởng:</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="Ví dụ: Đạt điểm cao tiết chào cờ, trang trí bảng đẹp..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBonusModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingBonus}
                  className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-bold text-xs shadow hover:bg-[#095c47]"
                >
                  {savingBonus ? 'Đang lưu...' : 'Lưu điểm thưởng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
