import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Header } from './components/Header';
import { Navigation, ModuleTab } from './components/Navigation';
import { LoginModal } from './components/LoginModal';
import { ParentPortal } from './components/ParentPortal';
import { OverviewModule } from './components/modules/OverviewModule';
import { PointEntryModule } from './components/modules/PointEntryModule';
import { GroupCompetitionModule } from './components/modules/GroupCompetitionModule';
import { SchoolRankingModule } from './components/modules/SchoolRankingModule';
import { DisciplineViolationsModule } from './components/modules/DisciplineViolationsModule';
import { AcademicMonitoringModule } from './components/modules/AcademicMonitoringModule';
import { HomeworkScheduleModule } from './components/modules/HomeworkScheduleModule';
import { CleaningDutyModule } from './components/modules/CleaningDutyModule';
import { IndividualConductModule } from './components/modules/IndividualConductModule';
import { ClassSettingsModule } from './components/modules/ClassSettingsModule';
import { FullClassData, UserSession } from './types';
import { api } from './services/api';
import { getCurrentWeekAndMonth, getWeekDateRange } from './utils/dateUtils';
import { LogIn, ShieldCheck, Sprout } from 'lucide-react';

function MainAppContent() {
  const { success, error } = useToast();

  const [data, setData] = useState<FullClassData | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  
  // Default to current week & month calculation
  const initialTime = getCurrentWeekAndMonth();
  const [selectedMonth, setSelectedMonth] = useState<number>(initialTime.currentMonth);
  const [selectedWeek, setSelectedWeek] = useState<number>(initialTime.currentWeek);
  const [activeTab, setActiveTab] = useState<ModuleTab>('overview');

  const [isLoading, setIsLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);

  // Đọc phiên trước. Khách và phụ huynh không tải toàn bộ dữ liệu lớp.
  useEffect(() => {
    api.getCurrentSession().then(userSession => {
      setSession(userSession);
      setShowLoginModal(!userSession || userSession.role === 'guest');
      setSessionReady(true);
      if (!userSession || userSession.role === 'guest' || userSession.role === 'parent') {
        setIsLoading(false);
      }
    });
  }, []);

  // Chỉ tài khoản thành viên lớp đã xác thực mới nhận toàn bộ dữ liệu thời gian thực.
  useEffect(() => {
    if (!sessionReady || !session || session.role === 'guest' || session.role === 'parent') return;
    setIsLoading(true);
    const unsubscribe = api.subscribeFullClassData((fullData) => {
      setData(fullData);
      setIsLoading(false);
      setIsSyncing(false);

      if (fullData?.config?.week1StartDate) {
        const current = getCurrentWeekAndMonth(fullData.config.week1StartDate);
        setSelectedWeek(prev => prev === initialTime.currentWeek ? current.currentWeek : prev);
        setSelectedMonth(prev => prev === initialTime.currentMonth ? current.currentMonth : prev);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sessionReady, session?.role, session?.username]);

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsSyncing(true);
    try {
      const [fullData, userSession] = await Promise.all([
        api.getFullData(),
        api.getCurrentSession(),
      ]);

      setData(fullData);
      setSession(userSession);

      if (fullData?.config?.week1StartDate) {
        const current = getCurrentWeekAndMonth(fullData.config.week1StartDate);
        setSelectedWeek(current.currentWeek);
        setSelectedMonth(current.currentMonth);
      }

    } catch (err: any) {
      console.error('Fetch error:', err);
      if (!quiet) error('Không thể đồng bộ dữ liệu lớp học.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [error]);

  const handleSelectWeek = (week: number) => {
    setSelectedWeek(week);
    if (data?.config?.week1StartDate) {
      const info = getWeekDateRange(data.config.week1StartDate, week);
      setSelectedMonth(info.monthNum);
    }
  };

  const handleSelectMonth = (month: number) => {
    setSelectedMonth(month);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setSession(null);
      setData(null);
      setShowLoginModal(true);
      success('Đã kết thúc phiên làm việc an toàn.');
    } catch (err: any) {
      error(err.message || 'Lỗi khi đăng xuất');
    }
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    if (newSession.role !== 'parent') fetchData(true);
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-[#064e3b] p-3 shadow-xl flex items-center justify-center animate-bounce">
          <Sprout className="w-10 h-10 text-amber-300" />
        </div>
        <h2 className="text-xl font-black text-[#064e3b] mt-4 tracking-tight">
          Đang mở cổng đăng nhập
        </h2>
        <p className="text-xs text-emerald-800 font-semibold mt-1 animate-pulse">
          Đang kiểm tra phiên làm việc an toàn...
        </p>
      </div>
    );
  }

  if (session?.role === 'parent') {
    return <ParentPortal session={session} onLogout={handleLogout} />;
  }

  if (!session || session.role === 'guest') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#043d2e] via-[#0b5b43] to-[#032b21] flex items-center justify-center p-4">
        <div className="max-w-xl w-full rounded-[32px] bg-white/95 border border-emerald-100 p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-[#064e3b] flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-[#064e3b]">Không gian lớp học</h1>
          <p className="mt-2 text-sm text-slate-600">Vui lòng đăng nhập hoặc nhập mã tra cứu phụ huynh. Dữ liệu lớp không hiển thị trước khi xác thực.</p>
          <button onClick={() => setShowLoginModal(true)} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#064e3b] px-6 py-3 font-black text-amber-300 shadow-lg">
            <LogIn className="w-5 h-5" /> MỞ CỬA SỔ ĐĂNG NHẬP
          </button>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-[#064e3b] p-3 shadow-xl flex items-center justify-center animate-bounce"><Sprout className="w-10 h-10 text-amber-300" /></div>
        <h2 className="text-xl font-black text-[#064e3b] mt-4">Đang đồng bộ dữ liệu lớp học...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col font-sans text-slate-800 antialiased selection:bg-amber-300 selection:text-emerald-950">
      
      {/* Fixed/Sticky Top Bar */}
      <Header
        config={data.config}
        session={session}
        selectedMonth={selectedMonth}
        selectedWeek={selectedWeek}
        onSelectMonth={handleSelectMonth}
        onSelectWeek={handleSelectWeek}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onRefreshData={() => fetchData(false)}
        isSyncing={isSyncing}
      />

      {/* Main Top Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userRole={session?.role || 'guest'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-12">
        <>
            {activeTab === 'overview' && (
              <OverviewModule
                data={data}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'point_entry' && (
              <PointEntryModule
                data={data}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
                onRefresh={() => fetchData(true)}
                userRole={session?.role || 'guest'}
                userName={session?.username || 'Khách'}
                onSelectWeek={handleSelectWeek}
                onSelectMonth={handleSelectMonth}
              />
            )}

            {activeTab === 'group_competition' && (
              <GroupCompetitionModule
                data={data}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
                onRefresh={() => fetchData(true)}
                userRole={session?.role || 'guest'}
              />
            )}

            {activeTab === 'school_ranking' && (
              <SchoolRankingModule
                data={data}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
                onRefresh={() => fetchData(true)}
                userRole={session?.role || 'guest'}
              />
            )}

            {activeTab === 'discipline_violations' && (
              <DisciplineViolationsModule
                data={data}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
              />
            )}

            {activeTab === 'academic_monitoring' && (
              <AcademicMonitoringModule
                data={data}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
              />
            )}

            {activeTab === 'homework_schedule' && (
              <HomeworkScheduleModule
                data={data}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
                onRefresh={() => fetchData(true)}
                userRole={session?.role || 'guest'}
                onSelectWeek={handleSelectWeek}
                onSelectMonth={handleSelectMonth}
              />
            )}

            {activeTab === 'cleaning_duty' && (
              <CleaningDutyModule
                data={data}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
                onRefresh={() => fetchData(true)}
                userRole={session?.role || 'guest'}
                onSelectWeek={handleSelectWeek}
                onSelectMonth={handleSelectMonth}
              />
            )}

            {activeTab === 'individual_conduct' && (
              <IndividualConductModule
                data={data}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
                userRole={session?.role || 'guest'}
                session={session}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'class_settings' && (
              <ClassSettingsModule
                data={data}
                onRefresh={() => fetchData(true)}
                userRole={session?.role || 'guest'}
                onOpenLogin={() => setShowLoginModal(true)}
              />
            )}
        </>
      </main>

      {/* Footer */}
      <footer className="bg-[#064e3b] text-white border-t border-emerald-800 py-8 px-4 text-xs no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black">
              <Sprout className="w-6 h-6 text-emerald-950" />
            </div>
            <div>
              <div className="font-black text-sm text-white">
                HỆ THỐNG QUẢN LÝ LỚP CHỦ NHIỆM {data?.config?.className || '11B6'} • {data?.config?.themeTitle || 'VƯỜN ƯƠM TRI THỨC'}
              </div>
              <div className="text-emerald-200/90 text-[11px] mt-0.5">
                {data?.config?.schoolName || 'THCS & THPT Lê Lợi'} • Giáo viên chủ nhiệm: {data?.config?.teacherName || 'Cô Võ Thị Kim Liên'} • Niên khóa {data?.config?.academicYear || '2026 – 2027'}
              </div>
            </div>
          </div>

          <div className="text-emerald-200/80 text-[11px]">
            <div>Bảo mật Firebase • Phân quyền vai trò trực tiếp • Đồng bộ thời gian thực (Real-time)</div>
            <div className="text-amber-300/90 mt-0.5 font-bold italic">
              "{data?.config?.slogan || 'Mỗi tuần một bước tiến – Cùng nhau vun đắp'}"
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
