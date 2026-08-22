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
  Settings
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
  { id: 'individual_conduct' as ModuleTab, label: 'Rèn luyện cá nhân', icon: Users, shortLabel: 'Rèn luyện' },
  { id: 'class_settings' as ModuleTab, label: 'Cài đặt lớp', icon: Settings, shortLabel: 'Cài đặt', requiresGvcn: true },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  userRole = 'guest',
}) => {
  const navItems = NAV_ITEMS;

  return (
    <>
      {/* Desktop & Laptop Top Navigation Bar */}
      <nav className="hidden lg:block bg-white border-b border-emerald-100 shadow-sm sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isGvcnOnly = (item as any).requiresGvcn && userRole !== 'gvcn';

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-emerald-950 shadow-md scale-[1.02]'
                        : 'text-emerald-900/80 hover:text-emerald-950 hover:bg-emerald-50'
                    } ${isGvcnOnly ? 'opacity-70' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-950 stroke-[2.5]' : 'text-emerald-700'}`} />
                    <span>{item.label}</span>
                    {(item as any).requiresGvcn && userRole !== 'gvcn' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold">
                        GVCN
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Floating Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-2xl py-1.5 px-2">
        <>
            <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
              {[
                NAV_ITEMS[0], // Tổng quan
                NAV_ITEMS[1], // Nhập điểm
                NAV_ITEMS[2], // Thi đua tổ
                NAV_ITEMS[6], // Báo bài
                NAV_ITEMS[8], // Rèn luyện
              ].map((item) => {
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
                {[
                  NAV_ITEMS[3], // Xếp hạng trường
                  NAV_ITEMS[4], // Vi phạm
                  NAV_ITEMS[5], // Học tập
                  NAV_ITEMS[7], // Trực nhật
                  NAV_ITEMS[9], // Cài đặt
                ].map(item => (
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
