import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Trophy, 
  Award, 
  AlertTriangle, 
  BookOpenCheck, 
  CalendarDays, 
  Sparkle, 
  Users, 
  Settings,
  Map,
} from 'lucide-react';
import { UserRole } from '../types';

export type ModuleTab = 
  | 'overview' 
  | 'point_entry' 
  | 'group_competition' 
  | 'school_ranking' 
  | 'discipline_violations' 
  | 'academic_monitoring' 
  | 'homework_schedule' 
  | 'cleaning_duty' 
  | 'classroom_layout'
  | 'individual_conduct' 
  | 'class_settings';

interface NavigationProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  userRole?: UserRole;
  pendingCount?: number;
}

export const NAV_ITEMS = [
  { id: 'overview' as ModuleTab, label: 'Tổng quan tháng', icon: LayoutDashboard, shortLabel: 'Tổng quan' },
  { id: 'point_entry' as ModuleTab, label: 'Nhập điểm tuần', icon: PlusCircle, shortLabel: 'Nhập điểm' },
  { id: 'group_competition' as ModuleTab, label: 'Thi đua theo tổ', icon: Trophy, shortLabel: 'Thi đua tổ' },
  { id: 'school_ranking' as ModuleTab, label: 'Thứ hạng trường & khối', icon: Award, shortLabel: 'Xếp hạng' },
  { id: 'discipline_violations' as ModuleTab, label: 'Vi phạm rèn luyện', icon: AlertTriangle, shortLabel: 'Vi phạm' },
  { id: 'academic_monitoring' as ModuleTab, label: 'Theo dõi học tập', icon: BookOpenCheck, shortLabel: 'Học tập' },
  { id: 'homework_schedule' as ModuleTab, label: 'Báo bài & TKB', icon: CalendarDays, shortLabel: 'Báo bài' },
  { id: 'cleaning_duty' as ModuleTab, label: 'Lịch trực nhật', icon: Sparkle, shortLabel: 'Trực nhật' },
  { id: 'classroom_layout' as ModuleTab, label: 'Sơ đồ lớp', icon: Map, shortLabel: 'Sơ đồ lớp' },
  { id: 'individual_conduct' as ModuleTab, label: 'Rèn luyện cá nhân', icon: Users, shortLabel: 'Rèn luyện' },
  { id: 'class_settings' as ModuleTab, label: 'Cài đặt lớp', icon: Settings, shortLabel: 'Cài đặt', requiresGvcn: true },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  userRole = 'guest',
}) => {
  const canOpen = (id: ModuleTab) => {
    if (id === 'class_settings') return userRole === 'gvcn';
    if (id === 'point_entry') return userRole === 'gvcn' || userRole === 'bcs';
    if (userRole === 'parent') return id === 'homework_schedule' || id === 'individual_conduct';
    return userRole !== 'guest';
  };
  const navItems = NAV_ITEMS.filter(item => canOpen(item.id));
  const compactDesktop = activeTab === 'classroom_layout';
  const primaryMobile = [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[6], NAV_ITEMS[9]].filter(item => canOpen(item.id));
  const secondaryMobile = [NAV_ITEMS[3], NAV_ITEMS[4], NAV_ITEMS[5], NAV_ITEMS[7], NAV_ITEMS[8], NAV_ITEMS[10]].filter(item => canOpen(item.id));

  return (
    <>
      {/* Desktop & Laptop Left Navigation Bar */}
      <nav className={`hidden lg:flex shrink-0 bg-white border-r border-emerald-100 shadow-sm sticky top-[73px] h-[calc(100vh-73px)] z-30 flex-col no-print transition-[width] duration-200 ${compactDesktop ? 'w-20' : 'w-64 xl:w-72'}`}>
        <div className={`px-4 py-5 border-b border-emerald-100 ${compactDesktop ? 'hidden' : ''}`}>
          <div className="text-[11px] uppercase tracking-[0.18em] font-black text-emerald-700">Danh mục chức năng</div>
          <div className="text-xs text-slate-500 mt-1">Chọn nhanh nội dung cần quản lý</div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={compactDesktop ? item.label : undefined}
                    className={`w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer ${compactDesktop ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-3 text-left'} ${
                      isActive
                        ? `bg-amber-400 text-emerald-950 shadow-md ${compactDesktop ? '' : 'translate-x-1'}`
                        : 'text-emerald-900/80 hover:text-emerald-950 hover:bg-emerald-50'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-white/50' : 'bg-emerald-50'}`}>
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-950 stroke-[2.5]' : 'text-emerald-700'}`} />
                    </span>
                    {!compactDesktop && <span className="leading-tight">{item.label}</span>}
                  </button>
                );
              })}
          </div>
        </div>
        <div className={`px-4 py-4 border-t border-emerald-100 bg-emerald-50/60 text-[11px] text-emerald-800 font-semibold ${compactDesktop ? 'hidden' : ''}`}>
          Menu được giữ cố định để chuyển mục nhanh hơn.
        </div>
      </nav>

      {/* Mobile Floating Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-2xl py-1.5 px-2">
        <>
            <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
              {primaryMobile.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition ${
                      isActive
                        ? 'text-emerald-900 font-black bg-amber-300 shadow-sm'
                        : 'text-emerald-800 hover:bg-emerald-50 font-medium'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] leading-tight truncate w-full text-center">{item.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Secondary Mobile Pill for remaining tabs */}
            <div className="flex items-center justify-between px-2 pt-1 border-t border-emerald-50 text-xs">
              <span className="text-[10px] text-emerald-700 font-semibold">Mục khác:</span>
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {secondaryMobile.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg whitespace-nowrap font-medium ${
                      activeTab === item.id ? 'bg-amber-400 text-emerald-950 font-bold' : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {item.shortLabel}
                  </button>
                ))}
              </div>
            </div>
        </>
      </div>
    </>
  );
};
