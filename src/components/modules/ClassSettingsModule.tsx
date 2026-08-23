import React, { useState } from 'react';
import { 
  Settings, 
  Lock, 
  KeyRound, 
  Plus, 
  Trash2, 
  Check, 
  Edit3, 
  Download, 
  Upload, 
  Sparkles, 
  Users, 
  School,
  Database,
  Calendar,
  Clock,
  Building2,
  UserPlus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';
import { FullClassData, ClassConfig, PointRule, Student, UserRole } from '../../types';
import { api } from '../../services/api';
import { auth } from '../../firebase/config';
import { useToast } from '../Toast';

interface ClassSettingsModuleProps {
  data: FullClassData;
  onRefresh: () => void;
  userRole?: UserRole;
  onOpenLogin: () => void;
}

export const ClassSettingsModule: React.FC<ClassSettingsModuleProps> = ({
  data,
  onRefresh,
  userRole = 'guest',
  onOpenLogin,
}) => {
  const { success, error, warning } = useToast();
  const isGvcn = userRole === 'gvcn';

  // Active Settings Tab
  const [activeTab, setActiveTab] = useState<'info' | 'rules' | 'students' | 'security' | 'backup'>('info');

  const students = data.students || [];
  const rules = data.rules || [];
  const currentConfig: ClassConfig = data.config || {
    id: 'class_11b6',
    className: '11B6',
    schoolName: 'THPT Kim Liên',
    academicYear: '2026 – 2027',
    teacherName: 'Cô Võ Thị Kim Liên',
    themeTitle: 'Vườn Ươm 11B6 - Nơi Ươm Mầm Tri Thức & Nhân Cách',
    slogan: 'Mỗi tuần một bước tiến – Cùng nhau vun đắp',
    week1StartDate: '2026-08-03',
    totalWeeks: 38,
    activeMonth: 8,
    activeWeek: 3,
    periodsPerDay: 8,
    morningPeriods: 5,
    afternoonPeriods: 3,
    scheduleStructure: 'standard8',
    subjects: ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý', 'GDCD', 'Tin học', 'Công nghệ', 'GDTC', 'Hoạt động trải nghiệm', 'Chào cờ', 'Sinh hoạt lớp'],
    cleaningTasks: ['Quét lớp & lau bảng', 'Lau hành lang & đổ rác', 'Kê bàn ghế & lau cửa kính', 'Tưới cây & góc xanh']
  };

  // Form states
  const [config, setConfig] = useState<ClassConfig>({
    ...currentConfig,
    academicYear: currentConfig.academicYear || '2026 – 2027',
    week1StartDate: currentConfig.week1StartDate || '2026-08-03',
    totalWeeks: currentConfig.totalWeeks || 38,
    periodsPerDay: currentConfig.periodsPerDay || 8,
    morningPeriods: currentConfig.morningPeriods || 5,
    afternoonPeriods: currentConfig.afternoonPeriods || 3,
    scheduleStructure: currentConfig.scheduleStructure || 'standard8',
    slogan: currentConfig.slogan || 'Mỗi tuần một bước tiến – Cùng nhau vun đắp',
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Security Form states
  const [gvcnPass, setGvcnPass] = useState('');
  const [bcsPass, setBcsPass] = useState('');
  const [studentPass, setStudentPass] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  // Add Rule Modal
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleContent, setNewRuleContent] = useState('');
  const [newRuleType, setNewRuleType] = useState<'plus' | 'minus'>('plus');
  const [newRulePoints, setNewRulePoints] = useState<number>(5);
  const [newRuleCategory, setNewRuleCategory] = useState<'academic' | 'discipline' | 'hygiene' | 'bonus'>('academic');
  const [requiresReason, setRequiresReason] = useState(false);
  const [requiresSubject, setRequiresSubject] = useState(false);
  const [isFlexible, setIsFlexible] = useState(false);

  // Student Modals & states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [newStudentGroup, setNewStudentGroup] = useState<number>(1);
  const [newStudentPos, setNewStudentPos] = useState('Thành viên');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFullName, setStudentFullName] = useState('');
  const [studentGender, setStudentGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [studentGroup, setStudentGroup] = useState<number>(1);
  const [studentPos, setStudentPos] = useState('');
  const [studentParentCode, setStudentParentCode] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentParentPhone, setStudentParentPhone] = useState('');

  // Delete student confirmation modal
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Batch import students modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [importingBatch, setImportingBatch] = useState(false);

  if (!isGvcn) {
    return (
      <div className="bg-white rounded-[28px] p-8 sm:p-12 text-center shadow-sm border border-emerald-100 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-black text-emerald-950">Mục Cài Đặt Dành Riêng Cho GVCN</h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Chức năng cấu hình quy tắc, thông tin lớp học, danh sách lớp và mật khẩu hệ thống chỉ dành cho Giáo Viên Chủ Nhiệm.
        </p>
        <button
          onClick={onOpenLogin}
          className="mt-6 px-6 py-3 rounded-2xl bg-[#064e3b] text-amber-300 font-bold text-sm shadow-lg hover:bg-[#095c47] transition active:scale-95 cursor-pointer"
        >
          Đăng nhập vai trò GVCN
        </button>
      </div>
    );
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.updateConfig({
        ...config,
        periodsPerDay: Number(config.periodsPerDay) || 8,
        totalWeeks: Number(config.totalWeeks) || 38,
        morningPeriods: Number(config.morningPeriods) || 5,
        afternoonPeriods: (Number(config.periodsPerDay) || 8) > 5 ? (Number(config.periodsPerDay) || 8) - 5 : 0,
      });
      if (res.success) {
        success('Đã lưu cấu hình thông tin lớp, kế hoạch thời gian và thời khóa biểu thành công!');
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdatePasswords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gvcnPass.trim()) {
      warning('Vui lòng nhập mật khẩu mới cho GVCN.');
      return;
    }
    setUpdatingPass(true);
    try {
      const res = await api.updateGvcnPassword(gvcnPass);
      if (res.success) {
        success(res.message);
        setGvcnPass('');
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi cập nhật mật khẩu.');
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleSaveNewRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.saveRule({
        content: newRuleContent,
        type: newRuleType,
        defaultPoints: newRulePoints,
        category: newRuleCategory,
        requiresReason,
        requiresSubjectAndExamType: requiresSubject,
        isFlexiblePoints: isFlexible,
        isActive: true,
      });
      if (res.success) {
        success(res.message);
        setShowAddRuleModal(false);
        setNewRuleContent('');
        onRefresh();
      }
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa quy định này?')) return;
    try {
      const res = await api.deleteRule(ruleId);
      if (res.success) {
        success(res.message);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message);
    }
  };

  // Add new student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      warning('Vui lòng nhập họ và tên học sinh');
      return;
    }
    try {
      const res = await api.saveStudent({
        fullName: newStudentName.trim(),
        gender: newStudentGender,
        groupNumber: newStudentGroup,
        position: newStudentPos.trim() || 'Thành viên',
        phone: newStudentPhone.trim(),
        parentPhone: newStudentParentPhone.trim(),
      });
      if (res.success) {
        success(res.message);
        setShowAddStudentModal(false);
        setNewStudentName('');
        setNewStudentPos('Thành viên');
        setNewStudentPhone('');
        setNewStudentParentPhone('');
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi thêm học sinh');
    }
  };

  // Edit existing student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await api.updateStudent(editingStudent.id, {
        ...editingStudent,
        fullName: studentFullName.trim(),
        gender: studentGender,
        groupNumber: studentGroup,
        position: studentPos.trim(),
        parentCode: studentParentCode.trim().toUpperCase(),
        phone: studentPhone.trim(),
        parentPhone: studentParentPhone.trim(),
      });
      if (res.success) {
        success(res.message);
        setEditingStudent(null);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message);
    }
  };

  // Delete student
  const handleConfirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    try {
      const res = await api.deleteStudent(deletingStudent.id);
      if (res.success) {
        success(res.message || 'Đã xóa học sinh khỏi danh sách lớp.');
        setDeletingStudent(null);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa học sinh');
    }
  };

  // Regenerate parent codes
  const handleRegenerateParentCodes = async () => {
    if (!window.confirm('Hành động này sẽ tạo mới toàn bộ mã phụ huynh bí mật cho tất cả học sinh. Bạn có chắc muốn tiếp tục?')) return;
    try {
      const res = await api.regenerateParentCodes();
      if (res.success) {
        success(res.message);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi tạo mã phụ huynh');
    }
  };

  // Firebase One-Time Class Initialization
  const [initializingFirebase, setInitializingFirebase] = useState(false);
  const handleInitializeFirebase = async () => {
    if (!window.confirm('Khởi tạo cơ sở dữ liệu Lớp 11B6 chuẩn lên Cloud Firestore (Cấu hình năm học 2026–2027 và 30 quy chế điểm)?')) return;
    setInitializingFirebase(true);
    try {
      const res = await api.initializeClassData();
      if (res.success) {
        success(res.message);
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi khởi tạo dữ liệu');
    } finally {
      setInitializingFirebase(false);
    }
  };

  // Batch import
  const handleBatchImport = async () => {
    if (!batchText.trim()) {
      warning('Vui lòng nhập nội dung danh sách học sinh');
      return;
    }
    setImportingBatch(true);
    try {
      const res = await api.batchImportStudents(batchText);
      if (res.success) {
        success(res.message);
        setShowBatchModal(false);
        setBatchText('');
        onRefresh();
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi nhập danh sách');
    } finally {
      setImportingBatch(false);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${config.className || 'class'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('Đã tải tệp sao lưu dữ liệu lớp học.');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#095c47] to-[#043d2e] rounded-[28px] p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
            Khu Vực Quản Trị GVCN
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            <Settings className="w-7 h-7 text-amber-400" />
            <span>Cài Đặt & Cấu Hình Hệ Thống Lớp</span>
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Quản lý thông tin lớp, kế hoạch thời gian học tập, cấu hình thời khóa biểu, danh sách lớp và quy chế thi đua.
          </p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-emerald-100 pb-2 overflow-x-auto">
        {[
          { id: 'info', label: 'Thông tin lớp & Thời khóa biểu', icon: School },
          { id: 'students', label: 'Danh sách lớp', icon: Users },
          { id: 'rules', label: 'Danh mục quy chế điểm', icon: Sparkles },
          { id: 'security', label: 'Đổi mật khẩu', icon: KeyRound },
          { id: 'backup', label: 'Sao lưu & Phục hồi', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-[#064e3b] text-amber-300 shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'students' && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-amber-400 text-emerald-950' : 'bg-slate-100 text-slate-600'
                }`}>
                  {students.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Class Info, Study Plan & Timetable Config */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Form (8 cols) */}
          <div className="lg:col-span-7 bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100 space-y-6">
            
            <form onSubmit={handleSaveConfig} className="space-y-6">
              
              {/* Section 1: General Class Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building2 className="w-5 h-5 text-emerald-800" />
                  <h3 className="text-base font-black text-emerald-950">
                    Thông Tin Tổng Quan Lớp
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Lớp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.className}
                      onChange={(e) => setConfig({ ...config, className: e.target.value })}
                      required
                      placeholder="Ví dụ: 11B6"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Giáo viên chủ nhiệm (GVCN) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.teacherName}
                      onChange={(e) => setConfig({ ...config, teacherName: e.target.value })}
                      required
                      placeholder="Ví dụ: Cô Võ Thị Kim Liên"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#064e3b] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Trường <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.schoolName}
                      onChange={(e) => setConfig({ ...config, schoolName: e.target.value })}
                      required
                      placeholder="Ví dụ: THPT Kim Liên"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Năm học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.academicYear}
                      onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
                      required
                      placeholder="Ví dụ: 2026 – 2027"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Study Time Planning */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Calendar className="w-5 h-5 text-emerald-800" />
                  <h3 className="text-base font-black text-emerald-950">
                    Kế Hoạch Thời Gian Học Tập
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ngày/Tuần bắt đầu học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={config.week1StartDate ? config.week1StartDate.slice(0, 10) : '2026-08-03'}
                      onChange={(e) => setConfig({ ...config, week1StartDate: e.target.value })}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                    />
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Ngày bắt đầu tuần 1 của năm học (tự động đồng bộ với Báo bài, Thời khóa biểu và Báo cáo).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      # Số tuần học trong năm <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={50}
                      value={config.totalWeeks || 38}
                      onChange={(e) => setConfig({ ...config, totalWeeks: Number(e.target.value) })}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                    />
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Chương trình chuẩn gồm 35 – 38 tuần thực học.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Timetable & Homework Configuration */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-800" />
                    <h3 className="text-base font-black text-emerald-950">
                      Cấu Hình Thời Khóa Biểu & Báo Bài
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                    Đồng bộ trực tiếp sang Báo bài
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Số tiết học mỗi ngày trên Thời khóa biểu:
                  </label>
                  
                  {/* Visual Radio Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div 
                      onClick={() => setConfig({ 
                        ...config, 
                        periodsPerDay: 8, 
                        morningPeriods: 5, 
                        afternoonPeriods: 3, 
                        scheduleStructure: 'standard8' 
                      })}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                        (config.periodsPerDay || 8) === 8
                          ? 'border-emerald-700 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">8 Tiết / Ngày</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-400 text-emerald-950">
                          Chuẩn THPT
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                        Gồm <strong>Buổi sáng (Tiết 1 – 5)</strong> và <strong>Buổi chiều (Tiết 6, 7, 8)</strong>
                      </p>
                      {(config.periodsPerDay || 8) === 8 && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-600"></div>
                      )}
                    </div>

                    <div 
                      onClick={() => setConfig({ 
                        ...config, 
                        periodsPerDay: 5, 
                        morningPeriods: 5, 
                        afternoonPeriods: 0, 
                        scheduleStructure: 'standard5' 
                      })}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                        (config.periodsPerDay || 8) === 5
                          ? 'border-emerald-700 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">5 Tiết / Ngày</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Chỉ học sáng
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                        Chỉ học buổi sáng (Tiết 1 – 5), không có thời khóa biểu buổi chiều.
                      </p>
                      {(config.periodsPerDay || 8) === 5 && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-600"></div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown for specific custom periods */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Hoặc chọn số tiết cụ thể (1 – 10):
                    </label>
                    <select
                      value={config.periodsPerDay || 8}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setConfig({
                          ...config,
                          periodsPerDay: val,
                          morningPeriods: Math.min(val, 5),
                          afternoonPeriods: Math.max(0, val - 5),
                          scheduleStructure: val === 8 ? 'standard8' : val === 5 ? 'standard5' : 'custom'
                        });
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value={8}>8 tiết (Sáng: 1..5 + Chiều: 6, 7, 8 - Mặc định)</option>
                      <option value={5}>5 tiết (Sáng: 1..5 - Chỉ buổi sáng)</option>
                      <option value={6}>6 tiết (Sáng: 1..5 + Chiều: 6)</option>
                      <option value={7}>7 tiết (Sáng: 1..5 + Chiều: 6, 7)</option>
                      <option value={9}>9 tiết (Sáng: 1..5 + Chiều: 6..9)</option>
                      <option value={10}>10 tiết (Sáng: 1..5 + Chiều: 6..10 - Cả ngày)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khẩu hiệu / Thông điệp lớp (Slogan):
                  </label>
                  <input
                    type="text"
                    value={config.slogan}
                    onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                    placeholder="Ví dụ: Mỗi tuần một bước tiến – Cùng nhau vun đắp"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-6 py-3 rounded-2xl bg-[#064e3b] hover:bg-[#095c47] text-amber-300 font-black text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>{savingConfig ? 'Đang lưu cài đặt...' : 'Lưu Thay Đổi Thông Tin'}</span>
                </button>
              </div>

            </form>
          </div>

          {/* Right Column: Live Branding & Plan Preview (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-emerald-950">
                Xem Trước Thương Hiệu Lớp
              </h3>
            </div>

            {/* Top Bar Preview */}
            <div className="p-4 rounded-2xl bg-[#064e3b] text-white shadow-md space-y-2">
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                Thanh tiêu đề Top Bar
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-lg shadow">
                  🌱
                </div>
                <div>
                  <div className="font-black text-base leading-tight">
                    Lớp {config.className || '11B6'}
                  </div>
                  <div className="text-xs text-emerald-100 opacity-90">
                    {config.schoolName || 'THPT Kim Liên'} • GVCN: {config.teacherName || 'Cô Kim Liên'}
                  </div>
                </div>
              </div>
            </div>

            {/* Study Plan Specs Preview */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-3">
              <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>Chi Tiết Kế Hoạch Học Tập</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-100">
                  <div className="text-slate-500 text-[10px] font-bold">Năm học</div>
                  <div className="font-black text-slate-900 mt-0.5">{config.academicYear || '2026 – 2027'}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-100">
                  <div className="text-slate-500 text-[10px] font-bold">Ngày bắt đầu Tuần 1</div>
                  <div className="font-black text-slate-900 mt-0.5">
                    {config.week1StartDate ? new Date(config.week1StartDate).toLocaleDateString('vi-VN') : '03/08/2026'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-100">
                  <div className="text-slate-500 text-[10px] font-bold">Tổng số tuần thực học</div>
                  <div className="font-black text-emerald-800 mt-0.5">{config.totalWeeks || 38} tuần</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-100">
                  <div className="text-slate-500 text-[10px] font-bold">Thời khóa biểu / ngày</div>
                  <div className="font-black text-emerald-800 mt-0.5">
                    {config.periodsPerDay || 8} tiết ({(config.periodsPerDay || 8) > 5 ? 'Sáng & Chiều' : 'Chỉ học sáng'})
                  </div>
                </div>
              </div>
            </div>

            {/* Slogan card */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/70">
              <div className="text-[11px] font-bold text-amber-900 mb-1">Khẩu hiệu / Thông điệp lớp:</div>
              <p className="text-xs font-semibold text-emerald-950 italic">
                "{config.slogan || 'Mỗi tuần một bước tiến – Cùng nhau vun đắp'}"
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Danh Sách Lớp (Student Roster & Parent Codes) */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-emerald-950">
                  Danh Sách Lớp & Mã Tra Cứu Phụ Huynh
                </h3>
                <span className="text-xs font-black text-emerald-900 bg-amber-300 px-3 py-0.5 rounded-full shadow-sm">
                  Sĩ số: {students.length} học sinh
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Quản lý hồ sơ học sinh theo tổ, phân công cán sự và mã phụ huynh bảo mật tra cứu kết quả rèn luyện.
              </p>
            </div>

            {/* Action Buttons: Add, Batch Import, Regenerate Codes */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Thêm học sinh mới</span>
              </button>

              <button
                onClick={() => setShowBatchModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-200 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Nhập nhanh từ danh sách</span>
              </button>

              <button
                onClick={handleRegenerateParentCodes}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                title="Tạo lại toàn bộ mã phụ huynh bí mật"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tạo lại mã PH</span>
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#064e3b] text-white uppercase text-[11px]">
                <tr>
                  <th className="p-3 text-center w-12">STT</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3 text-center">Giới tính</th>
                  <th className="p-3 text-center">Tổ</th>
                  <th className="p-3">Chức vụ</th>
                  <th className="p-3 font-mono font-bold">Mã Phụ Huynh (Bảo mật)</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      Chưa có học sinh nào trong danh sách lớp. Bấm "Thêm học sinh mới" để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-center font-black text-slate-400">#{st.orderNumber}</td>
                      <td className="p-3 font-black text-slate-900 flex items-center gap-1.5">
                        <span>{st.fullName}</span>
                        {st.position && st.position !== 'Thành viên' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                            {st.position}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">
                        {st.gender || 'Nam'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          st.groupNumber === 1 ? 'bg-blue-100 text-blue-800' :
                          st.groupNumber === 2 ? 'bg-amber-100 text-amber-800' :
                          st.groupNumber === 3 ? 'bg-purple-100 text-purple-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          Tổ {st.groupNumber}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-600">{st.position || 'Thành viên'}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800 bg-emerald-50/50">
                        {isGvcn ? (st.parentCode || 'Chưa thiết lập') : '•••••••• (Bảo mật)'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingStudent(st);
                              setStudentFullName(st.fullName);
                              setStudentGender((st.gender as any) || 'Nam');
                              setStudentGroup(st.groupNumber);
                              setStudentPos(st.position);
                              setStudentParentCode(st.parentCode);
                              setStudentPhone(st.phone || '');
                              setStudentParentPhone(st.parentPhone || '');
                            }}
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition"
                            title="Sửa thông tin học sinh"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingStudent(st)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa học sinh khỏi lớp"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Point Rules Directory */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-emerald-950">
                Danh Mục Quy Chế Điểm Cộng & Điểm Trừ
              </h3>
              <p className="text-xs text-slate-500">
                Tổng cộng {rules.length} quy định nề nếp và học tập được áp dụng toàn lớp.
              </p>
            </div>
            <button
              onClick={() => setShowAddRuleModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm quy định mới</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#064e3b] text-white uppercase text-[11px]">
                <tr>
                  <th className="p-3">Nội dung quy định</th>
                  <th className="p-3 text-center">Loại</th>
                  <th className="p-3 text-center">Điểm mặc định</th>
                  <th className="p-3 text-center">Lĩnh vực</th>
                  <th className="p-3 text-center">Bắt buộc lý do</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rules.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{r.content}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        r.type === 'plus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.type === 'plus' ? '+ Điểm cộng' : '− Điểm trừ'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-black text-slate-800">
                      {r.isFlexiblePoints ? 'Linh hoạt' : `${r.defaultPoints}đ`}
                    </td>
                    <td className="p-3 text-center text-slate-500 font-medium capitalize">
                      {r.category}
                    </td>
                    <td className="p-3 text-center">
                      {r.requiresReason ? '✓ Có' : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteRule(r.id)}
                        className="p-1 text-rose-600 hover:text-rose-800"
                        title="Xóa quy định"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Authentication */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100 space-y-6 max-w-2xl">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 uppercase">
              Firebase Authentication
            </span>
            <h3 className="text-lg font-black text-emerald-950 mt-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Bảo Mật Tài Khoản Giáo Viên Chủ Nhiệm</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ứng dụng sử dụng Firebase Authentication để xác thực tài khoản GVCN an toàn. Mật khẩu không bao giờ lưu trữ dạng văn bản thô.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-bold">Email quản trị viên (GVCN):</span>
              <span className="font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">{auth.currentUser?.email || 'Chưa đăng nhập'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-bold">Trạng thái phiên đăng nhập:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isGvcn ? 'Đã xác thực quyền GVCN' : 'Chưa đăng nhập'}</span>
              </span>
            </div>
          </div>

          {isGvcn ? (
            <form onSubmit={handleUpdatePasswords} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đổi mật khẩu mới cho tài khoản GVCN ({auth.currentUser?.email || 'tài khoản hiện tại'}):
                </label>
                <input
                  type="password"
                  value={gvcnPass}
                  onChange={(e) => setGvcnPass(e.target.value)}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={updatingPass || !gvcnPass.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#064e3b] text-amber-300 font-bold text-xs shadow-md hover:bg-[#095c47] disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{updatingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu GVCN'}</span>
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span>Vui lòng đăng nhập tài khoản GVCN để thực hiện đổi mật khẩu.</span>
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-emerald-950 font-bold hover:bg-amber-300 cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Backup & Firebase Cloud Initializer */}
      {activeTab === 'backup' && (
        <div className="space-y-6 max-w-2xl">
          
          {/* Card 1: One-Click Class Data Setup on Firebase */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-emerald-950">
                Khởi Tạo Dữ Liệu Lớp 11B6 Trên Cloud Firestore
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thiết lập cấu hình lớp mẫu (THCS & THPT Lê Lợi, Niên khóa 2026–2027) cùng 30 quy chế thi đua điểm cộng/trừ chuẩn vào cơ sở dữ liệu Firebase Firestore của bạn.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Chỉ cần thực hiện 1 lần duy nhất sau khi tạo Firestore.</span>
              <button
                type="button"
                disabled={initializingFirebase}
                onClick={handleInitializeFirebase}
                className="px-4 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#095c47] text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{initializingFirebase ? 'Đang khởi tạo...' : 'Khởi tạo dữ liệu lớp ngay'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: JSON Data Backup & Restore */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-800" />
              <h3 className="text-base font-black text-emerald-950">
                Sao Lưu Tệp Dữ Liệu Lớp Học (JSON)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xuất tệp sao lưu JSON chứa toàn bộ học sinh, điểm số, nề nếp, báo bài và lịch trực nhật để lưu trữ ngoại tuyến trên máy tính.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Lưu trữ an toàn tại máy tính cá nhân.</span>
              <button
                onClick={handleExportBackup}
                className="px-4 py-2 rounded-xl bg-[#064e3b] text-amber-300 hover:bg-[#095c47] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Download className="w-4 h-4" />
                <span>Tải tệp sao lưu JSON</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Modal 1: Add Student */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-emerald-100">
            <h3 className="text-lg font-black text-emerald-950 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" />
              <span>Thêm Học Sinh Vào Danh Sách Lớp</span>
            </h3>

            <form onSubmit={handleAddStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính:</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân vào Tổ:</label>
                  <select
                    value={newStudentGroup}
                    onChange={(e) => setNewStudentGroup(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chức vụ trong lớp:</label>
                <input
                  type="text"
                  value={newStudentPos}
                  onChange={(e) => setNewStudentPos(e.target.value)}
                  placeholder="Ví dụ: Thành viên, Tổ trưởng, Lớp phó..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại HS:</label>
                  <input
                    type="text"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Phụ huynh:</label>
                  <input
                    type="text"
                    value={newStudentParentPhone}
                    onChange={(e) => setNewStudentParentPhone(e.target.value)}
                    placeholder="0988..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Mã tra cứu phụ huynh sẽ được hệ thống cấp tự động theo cấu trúc bảo mật PH11B6-XX.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-bold text-xs shadow hover:bg-[#095c47]"
                >
                  Thêm học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Student */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-emerald-100">
            <h3 className="text-lg font-black text-emerald-950 mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-700" />
              <span>Chỉnh Sửa Thông Tin Học Sinh</span>
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên:</label>
                <input
                  type="text"
                  value={studentFullName}
                  onChange={(e) => setStudentFullName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính:</label>
                  <select
                    value={studentGender}
                    onChange={(e) => setStudentGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tổ:</label>
                  <select
                    value={studentGroup}
                    onChange={(e) => setStudentGroup(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chức vụ:</label>
                <input
                  type="text"
                  value={studentPos}
                  onChange={(e) => setStudentPos(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã Phụ Huynh:</label>
                <input
                  type="text"
                  value={studentParentCode}
                  onChange={(e) => setStudentParentCode(e.target.value.toUpperCase())}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Học sinh:</label>
                  <input
                    type="text"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Phụ huynh:</label>
                  <input
                    type="text"
                    value={studentParentPhone}
                    onChange={(e) => setStudentParentPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-bold text-xs shadow hover:bg-[#095c47]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Student Confirmation */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-rose-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Xác Nhận Xóa Học Sinh</h3>
              <p className="text-xs text-slate-600 mt-1.5">
                Bạn có chắc chắn muốn xóa học sinh <strong className="text-rose-700">{deletingStudent.fullName}</strong> (STT #{deletingStudent.orderNumber}, Tổ {deletingStudent.groupNumber}) khỏi danh sách lớp?
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Hệ thống sẽ tự động cập nhật lại số thứ tự (STT) cho các học sinh còn lại.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Xóa học sinh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Batch Import Students */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-emerald-950 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <span>Nhập Nhanh Danh Sách Học Sinh</span>
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dán danh sách học sinh từ Excel hoặc văn bản. Mỗi học sinh một dòng. Cấu trúc mỗi dòng: <br/>
              <code className="text-emerald-800 font-mono font-bold bg-emerald-50 px-1 py-0.5 rounded">Họ và tên [tab hoặc phẩy] Tổ [tab] Chức vụ</code>
            </p>

            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`Nguyễn Văn An\t1\tTổ trưởng\nTrần Thị Bình\t2\tThành viên\nLê Hoàng Cường\t1\tLớp phó`}
              rows={8}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50"
            />

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{batchText.split('\n').filter(l => l.trim()).length} dòng được nhập</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={importingBatch || !batchText.trim()}
                  onClick={handleBatchImport}
                  className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-bold text-xs shadow hover:bg-[#095c47] disabled:opacity-50"
                >
                  {importingBatch ? 'Đang thêm...' : 'Tiến hành thêm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-emerald-100">
            <h3 className="text-lg font-black text-emerald-950 mb-4">Thêm Quy Định Mới</h3>
            <form onSubmit={handleSaveNewRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung quy định:</label>
                <input
                  type="text"
                  value={newRuleContent}
                  onChange={(e) => setNewRuleContent(e.target.value)}
                  placeholder="Ví dụ: Giúp đỡ bạn học tiến bộ..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại:</label>
                  <select
                    value={newRuleType}
                    onChange={(e) => setNewRuleType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="plus">+ Điểm cộng</option>
                    <option value="minus">− Điểm trừ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Điểm mặc định:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newRulePoints}
                    onChange={(e) => setNewRulePoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresReason}
                    onChange={(e) => setRequiresReason(e.target.checked)}
                    className="rounded text-emerald-700"
                  />
                  <span>Bắt buộc nhập lý do khi ghi nhận</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresSubject}
                    onChange={(e) => setRequiresSubject(e.target.checked)}
                    className="rounded text-emerald-700"
                  />
                  <span>Yêu cầu chọn Môn học & Hình thức kiểm tra</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFlexible}
                    onChange={(e) => setIsFlexible(e.target.checked)}
                    className="rounded text-emerald-700"
                  />
                  <span>Cho phép nhập số điểm linh hoạt</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#064e3b] text-amber-300 font-bold text-xs shadow"
                >
                  Lưu quy định
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
