import React, { useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { FullClassData, UserRole, UserSession } from '../types';
import { api } from '../services/api';
import { useToast } from './Toast';

interface ParentAccessResult {
  classId: string;
  normalizedCode: string;
  data: FullClassData;
  session: UserSession;
}

type LoginRole = Exclude<UserRole, 'guest'>;

interface LoginModalProps {
  isOpen: boolean;
  classId: string;
  mandatory?: boolean;
  onClose?: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onParentLoginSuccess: (result: ParentAccessResult) => void;
}

const roleOptions: Array<{
  role: LoginRole;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { role: 'gvcn', title: 'Giáo Viên Chủ Nhiệm', description: 'Quản trị và chốt số', icon: Sparkles },
  { role: 'bcs', title: 'Ban Cán Sự', description: 'Ghi điểm và báo bài', icon: ShieldCheck },
  { role: 'student', title: 'Thành Viên', description: 'Theo dõi thông tin lớp', icon: UsersRound },
  { role: 'parent', title: 'Phụ Huynh', description: 'Tra cứu đúng hồ sơ con', icon: KeyRound },
];

const roleLabels: Record<LoginRole, string> = {
  gvcn: 'Giáo viên chủ nhiệm',
  bcs: 'Ban cán sự',
  student: 'Thành viên',
  parent: 'Phụ huynh',
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  classId,
  mandatory = false,
  onClose,
  onLoginSuccess,
  onParentLoginSuccess,
}) => {
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const chooseRole = (role: LoginRole) => {
    setSelectedRole(role);
    setMessage('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRole) {
      setMessage('Vui lòng chọn đúng chức năng trước khi đăng nhập.');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      if (selectedRole === 'parent') {
        const result = await api.lookupParentCode(parentCode, classId);
        toast.success('Đã mở đúng hồ sơ học sinh.');
        onParentLoginSuccess(result);
        return;
      }

      const result = await api.login({ username, classId, password });
      if (result.session.role !== selectedRole) {
        await api.logout().catch(() => undefined);
        throw new Error(
          `Tài khoản này thuộc chức năng “${roleLabels[result.session.role as LoginRole] || result.session.role}”, không phải “${roleLabels[selectedRole]}”.`
        );
      }
      toast.success(`Đăng nhập ${roleLabels[selectedRole]} thành công.`);
      onLoginSuccess(result.session);
    } catch (err: any) {
      const text = err.message || 'Thông tin đăng nhập không chính xác.';
      setMessage(text);
      toast.error(text);
    } finally {
      setLoading(false);
    }
  };

  const selectedLabel = selectedRole ? roleLabels[selectedRole] : '';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-emerald-950/75 p-4 backdrop-blur-sm">
      <div className="relative my-auto w-full max-w-3xl rounded-[30px] bg-white p-6 shadow-2xl sm:p-9">
        {!mandatory && onClose && (
          <button type="button" aria-label="Đóng" onClick={onClose} className="absolute right-5 top-5 text-slate-400 hover:text-slate-700">
            <X className="h-6 w-6" />
          </button>
        )}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
          <Lock className="h-8 w-8 text-[#064e3b]" />
        </div>
        <div className="mb-6 mt-4 text-center">
          <div className="text-xs font-black tracking-widest text-amber-600">BƯỚC 2 / 2 • LỚP {classId.toUpperCase()}</div>
          <h2 className="mt-1 text-3xl font-black text-[#064e3b]">Chọn Đúng Chức Năng</h2>
          <p className="mt-2 text-sm text-slate-600">Mỗi tài khoản chỉ được vào đúng vai trò đã cấp trong Firebase.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const active = selectedRole === option.role;
            return (
              <button
                key={option.role}
                type="button"
                onClick={() => chooseRole(option.role)}
                className={`rounded-2xl border p-4 text-center transition ${active ? 'border-emerald-900 bg-[#064e3b] text-white shadow-lg' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300'}`}
              >
                <Icon className={`mx-auto h-7 w-7 ${active ? 'text-amber-300' : 'text-slate-500'}`} />
                <div className={`mt-2 text-sm font-black ${active ? 'text-amber-300' : 'text-slate-800'}`}>{option.title}</div>
                <div className={`mt-1 text-[11px] leading-snug ${active ? 'text-emerald-100' : 'text-slate-500'}`}>{option.description}</div>
              </button>
            );
          })}
        </div>

        {message && (
          <div className="mb-4 flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" /> {message}
          </div>
        )}

        {!selectedRole ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
            Chọn một trong bốn chức năng ở trên để tiếp tục.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {selectedRole === 'parent' ? (
              <label className="block text-sm font-black text-slate-700">
                MÃ TRA CỨU PHỤ HUYNH
                <span className="relative mt-2 block">
                  <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    value={parentCode}
                    onChange={(event) => setParentCode(event.target.value.toUpperCase())}
                    required
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Ví dụ: PH11B6-ABCD-2345"
                    className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </span>
                <span className="mt-2 block text-xs font-normal leading-relaxed text-slate-500">
                  Dùng mã ngẫu nhiên mới do GVCN cấp. Mã ngắn kiểu cũ như PH11B6-27 không còn đủ an toàn.
                </span>
              </label>
            ) : (
              <>
                <label className="block text-sm font-black text-slate-700">
                  {selectedRole === 'gvcn' ? 'EMAIL HOẶC TÊN ĐĂNG NHẬP GVCN' : `TÊN ĐĂNG NHẬP ${selectedLabel.toUpperCase()}`}
                  <span className="relative mt-2 block">
                    {selectedRole === 'student' ? <GraduationCap className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" /> : <UserRound className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />}
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                      autoComplete="username"
                      placeholder={selectedRole === 'gvcn' ? 'Email Firebase của GVCN' : 'Ví dụ: loptruong hoặc hs01'}
                      className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </span>
                </label>
                <label className="block text-sm font-black text-slate-700">
                  MẬT KHẨU TÀI KHOẢN
                  <span className="relative mt-2 block">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-12 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                    <button type="button" aria-label="Hiện hoặc ẩn mật khẩu" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-3.5 text-slate-400">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </span>
                </label>
              </>
            )}

            <button disabled={loading} className="w-full rounded-2xl bg-[#064e3b] py-4 font-black text-amber-300 disabled:opacity-60">
              {loading ? 'ĐANG XÁC THỰC...' : selectedRole === 'parent' ? 'TRA CỨU HỒ SƠ CỦA CON' : `ĐĂNG NHẬP ${selectedLabel.toUpperCase()}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
