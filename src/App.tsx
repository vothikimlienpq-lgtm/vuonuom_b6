import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Header } from './components/Header';
import { Navigation, ModuleTab } from './components/Navigation';
import { LoginModal } from './components/LoginModal';
import { ClassAccessGate } from './components/ClassAccessGate';
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
import { Sprout } from 'lucide-react';

function MainAppContent() {
  const { success, error } = useToast();

  const [data, setData] = useState<FullClassData | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [verifiedClassId, setVerifiedClassId] = useState<string | null>(null);
  const [parentLookupCode, setParentLookupCode] = useState<string | null>(null);
  
  // Default to current week & month calculation
  const initialTime = getCurrentWeekAndMonth();
  const [selectedMonth, setSelectedMonth] = useState<number>(initialTime.currentMonth);
  const [selectedWeek, setSelectedWeek] = useState<number>(initialTime.currentWeek);
  const [activeTab, setActiveTab] = useState<ModuleTab>('overview');

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Tuyệt đối không đọc dữ liệu lớp trước khi hoàn tất cả hai lớp đăng nhập.
  useEffect(() => {
    if (!verifiedClassId || !session || session.role === 'guest' || session.role === 'parent') return;
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
    }, session);

    return () => unsubscribe?.();
  }, [verifiedClassId, session?.role, session?.username]);

  // Phụ huynh chỉ theo dõi đúng một tài liệu parentViews/{mã}; không mở
  // bất kỳ listener nào vào classes/{classId} hoặc các collection của lớp.
  useEffect(() => {
    if (!parentLookupCode || session?.role !== 'parent') return;
    return api.subscribeParentView(
      parentLookupCode,
      (parentData, parentSession) => {
        setData(parentData);
        setSession(parentSession);
      },
      (message) => error(message)
    );
  }, [parentLookupCode, session?.role, error]);

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsSyncing(true);
    try {
      if (parentLookupCode) {
        const result = await api.lookupParentCode(parentLookupCode, verifiedClassId || undefined);
        setData(result.data);
        setSession(result.session);
        return;
      }
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
  }, [error, parentLookupCode, verifiedClassId]);

  const handleClassVerified = (classId: string) => {
    setData(null);
    setSession(null);
    setParentLookupCode(null);
    setActiveTab('overview');
    setVerifiedClassId(classId);
  };

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
      setVerifiedClassId(null);
      setParentLookupCode(null);
      setShowLoginModal(false);
      setActiveTab('overview');
      success('Đã kết thúc phiên làm việc an toàn.');
    } catch (err: any) {
      error(err.message || 'Lỗi khi đăng xuất');
    }
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setParentLookupCode(null);
    setSession(newSession);
    setActiveTab(newSession.role === 'parent' ? 'individual_conduct' : 'overview');
    setShowLoginModal(false);
  };

  const handleParentVerified = (result: Awaited<ReturnType<typeof api.lookupParentCode>>) => {
    if (!verifiedClassId || result.classId.toLowerCase() !== verifiedClassId.toLowerCase()) {
      error('Mã phụ huynh không thuộc lớp vừa được xác thực.');
      return;
    }
    setParentLookupCode(result.normalizedCode);
    setData(result.data);
    setSession(result.session);
    setActiveTab('individual_conduct');
    if (result.data.config?.week1StartDate) {
      const current = getCurrentWeekAndMonth(result.data.config.week1StartDate);
      setSelectedWeek(current.currentWeek);
      setSelectedMonth(current.currentMonth);
    }
  };

  if (!verifiedClassId) {
    return <ClassAccessGate onVerified={handleClassVerified} />;
  }

  if (!session || session.role === 'guest') {
    return (
      <LoginModal
        isOpen
        mandatory
        classId={verifiedClassId}
        onLoginSuccess={handleLoginSuccess}
        onParentLoginSuccess={handleParentVerified}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-[#064e3b] p-3 shadow-xl flex items-center justify-center animate-bounce">
          <Sprout className="w-10 h-10 text-amber-300" />
        </div>
        <h2 className="text-xl font-black text-[#064e3b] mt-4 tracking-tight">
          Cổng quản lý {verifiedClassId.toUpperCase()}
        </h2>
        <p className="text-xs text-emerald-800 font-semibold mt-1 animate-pulse">
          Đang mở đúng dữ liệu của lớp đã xác thực...
        </p>
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
                HỆ THỐNG QUẢN LÝ LỚP CHỦ NHIỆM {data?.config?.className || verifiedClassId.toUpperCase()} • {data?.config?.themeTitle || 'VƯỜN ƯƠM TRI THỨC'}
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
        classId={verifiedClassId}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onParentLoginSuccess={handleParentVerified}
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
