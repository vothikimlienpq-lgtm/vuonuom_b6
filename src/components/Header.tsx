import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Wifi, 
  Clock, 
  UserCheck, 
  LogOut, 
  LogIn, 
  Calendar, 
  RotateCw, 
  ShieldAlert, 
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ClassConfig, UserSession } from '../types';

interface HeaderProps {
  config: ClassConfig;
  session: UserSession | null;
  selectedMonth: number;
  selectedWeek: number;
  onSelectMonth: (month: number) => void;
  onSelectWeek: (week: number) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onRefreshData: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  session,
  selectedMonth,
  selectedWeek,
  onSelectMonth,
  onSelectWeek,
  onOpenLogin,
  onLogout,
  onRefreshData,
  isSyncing,
}) => {
  const safeConfig: ClassConfig = config || {
    className: '11B6',
    schoolName: 'THPT Kim Liên',
    academicYear: '2024 - 2025',
    teacherName: 'Võ Thị Kim Liên',
    slogan: 'Kỷ luật - Yêu thương - Tự giác - Tỏa sáng',
    subjects: ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa', 'GDCD', 'Tin', 'Công nghệ', 'GDTC'],
  };

  const [bcsCountdown, setBcsCountdown] = useState<number>(session?.bcsTimeRemaining || 1800);

  useEffect(() => {
    if (session?.role === 'bcs') {
      const interval = setInterval(() => {
        setBcsCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session, onLogout]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getRoleBadge = () => {
    if (!session || session.role === 'guest') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-100 border border-white/20">
          <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
          Khách vãng lai
        </span>
      );
    }
    if (session.role === 'gvcn') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-emerald-950 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-900" />
          Giáo Viên Chủ Nhiệm
        </span>
      );
    }
    if (session.role === 'bcs') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-900" />
          Ban Cán Sự (Còn {formatCountdown(bcsCountdown)})
        </span>
      );
    }
    if (session.role === 'parent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-950 border border-sky-200">
          <UserCheck className="w-3.5 h-3.5 text-sky-700" />
          Cổng Phụ Huynh
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-800/80 text-emerald-200 border border-emerald-700">
        <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
        Thành viên Lớp 11B6
      </span>
    );
  };

  return (
    <header className="bg-gradient-to-r from-[#064e3b] via-[#0b5345] to-[#043d2e] text-white shadow-xl sticky top-0 z-40 border-b border-emerald-700/50">
      {/* Top Banner Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Class Identification */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-emerald-300 to-teal-400 p-0.5 shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#064e3b] rounded-[14px] flex items-center justify-center">
                <Sprout className="w-6 h-6 text-amber-300" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>{safeConfig.className || 'Lớp 11B6'}</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-800 text-emerald-200 border border-emerald-600/60">
                  {safeConfig.academicYear || '2026 - 2027'}
                </span>
                <button
                  onClick={onRefreshData}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-900/90 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-800 transition cursor-pointer"
                  title="Nhấn để đồng bộ lại dữ liệu"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>Đồng bộ trực tuyến</span>
                  <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-100/90 mt-0.5">
                <span className="truncate">
                  {safeConfig.schoolName || 'Trường THCS&THPT Lê Lợi'}
                </span>
                <span>•</span>
                <span className="text-amber-200 font-medium truncate">
                  GVCN: {safeConfig.teacherName || 'Cô Kim Liên'}
                </span>
              </div>
            </div>
          </div>

          {/* Slogan Capsule (Center) */}
          <div className="hidden xl:flex items-center justify-center">
            <div className="px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-xs font-semibold text-emerald-100 shadow-inner">
              "{safeConfig.slogan || 'Mỗi tuần một bước tiến - Cùng nhau vun đắp'}"
            </div>
          </div>

          {/* Right Status Controls, Month Selector & Auth */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
            
            {/* Month Dropdown Pill */}
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 px-3 py-1.5 rounded-2xl border border-emerald-700/60 text-xs font-bold text-white shadow-inner transition">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <select
                  value={selectedMonth}
                  onChange={(e) => onSelectMonth(Number(e.target.value))}
                  className="bg-transparent text-white text-xs font-black focus:outline-none cursor-pointer pr-1"
                >
                  {[8, 9, 10, 11, 12, 1, 2, 3, 4, 5].map(m => (
                    <option key={m} value={m} className="bg-[#064e3b] text-white">
                      Tháng {m}/{m >= 8 ? (safeConfig.academicYear?.split('-')[0]?.trim() || '2026') : (safeConfig.academicYear?.split('-')[1]?.trim() || '2027')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-emerald-300 pointer-events-none" />
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-2">
              {getRoleBadge()}

              {session && session.role !== 'guest' ? (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow transition duration-150 active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Kết thúc</span>
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-black bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl shadow transition duration-150 active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
