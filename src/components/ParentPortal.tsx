import React from 'react';
import { BookOpen, CalendarDays, LogOut, ShieldCheck, TrendingDown, TrendingUp, UserRound } from 'lucide-react';
import { UserSession } from '../types';

interface ParentPortalProps {
  session: UserSession;
  onLogout: () => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ session, onLogout }) => {
  const view = session.parentView;

  if (!view) {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-2xl">
          <h1 className="text-xl font-black text-emerald-950">Không tìm thấy phiên tra cứu</h1>
          <button onClick={onLogout} className="mt-5 rounded-2xl bg-emerald-900 px-5 py-3 font-black text-amber-300">
            Nhập lại mã
          </button>
        </div>
      </div>
    );
  }

  const homework = view.weeklyHomework;

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-800">
      <header className="bg-[#064e3b] text-white px-4 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-lg">Tra cứu dành cho phụ huynh</div>
              <div className="text-xs text-emerald-100">Chỉ hiển thị dữ liệu của học sinh được gắn với mã</div>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-black hover:bg-rose-700">
            <LogOut className="w-4 h-4" /> Kết thúc
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <section className="rounded-[28px] bg-gradient-to-r from-[#064e3b] to-[#17603f] p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <UserRound className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">Thông tin học sinh</div>
              <h1 className="text-2xl sm:text-3xl font-black">{view.studentName}</h1>
              <p className="text-sm text-emerald-100">Tổ {view.group}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <ScoreCard icon={<ShieldCheck />} label="Điểm hiện tại" value={view.currentScore} color="text-emerald-800" />
          <ScoreCard icon={<TrendingUp />} label="Điểm cộng" value={view.conductData.plusPoints} color="text-emerald-700" />
          <ScoreCard icon={<TrendingDown />} label="Điểm trừ" value={view.conductData.minusPoints} color="text-rose-700" />
          <ScoreCard icon={<ShieldCheck />} label="Tổng điểm" value={view.conductData.totalScore} color="text-amber-700" />
          <ScoreCard icon={<BookOpen />} label="Số vi phạm" value={view.conductData.violations} color="text-slate-700" />
        </section>

        <section className="rounded-3xl bg-white border border-emerald-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-950 font-black text-lg">
            <BookOpen className="w-5 h-5 text-amber-500" /> Báo bài trong tuần
          </div>
          <h2 className="mt-4 font-bold text-slate-900">{homework?.title || 'Báo bài tuần'}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {homework?.content?.trim() || 'Giáo viên chưa cập nhật nội dung báo bài.'}
          </p>
        </section>

        {view.allowTimetable && (
          <section className="rounded-3xl bg-white border border-emerald-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-lg">
              <CalendarDays className="w-5 h-5 text-amber-500" /> Thời khóa biểu
            </div>
            {view.timetable?.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead><tr className="bg-emerald-950 text-white"><th className="p-3 text-left">Ngày</th><th className="p-3 text-left">Tiết</th><th className="p-3 text-left">Môn</th><th className="p-3 text-left">Ghi chú</th></tr></thead>
                  <tbody>{view.timetable.map((item, index) => <tr key={item.id || index} className="border-b"><td className="p-3">{item.dayOfWeek}</td><td className="p-3">{item.period}</td><td className="p-3 font-bold">{item.subject}</td><td className="p-3">{item.note || item.homework || ''}</td></tr>)}</tbody>
                </table>
              </div>
            ) : <p className="mt-3 text-sm text-slate-500">Giáo viên chưa đưa thời khóa biểu vào mã tra cứu này.</p>}
          </section>
        )}

        <p className="text-center text-xs text-slate-500">Phiên tra cứu tự hết hạn sau 12 giờ. Mã không cho phép xem danh sách lớp, nhập điểm hoặc cài đặt lớp.</p>
      </main>
    </div>
  );
};

const ScoreCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
    <div className={`w-8 h-8 ${color}`}>{icon}</div>
    <div className="mt-2 text-xs font-bold uppercase text-slate-500">{label}</div>
    <div className={`text-2xl font-black ${color}`}>{value}</div>
  </div>
);
