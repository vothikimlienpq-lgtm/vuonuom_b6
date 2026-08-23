import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  KeyRound, 
  AlertCircle,
  Clock,
  Mail,
  Eye,
  EyeOff,
  School,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { success, error } = useToast();
  const [classId, setClassId] = useState(localStorage.getItem('activeClassId') || '11b6-2026-2027');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.login({
        classId,
        email,
        password,
      });

      if (res.success) {
        success(res.message || 'Đăng nhập thành công!');
        onLoginSuccess(res.session);
        onClose();
      }
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setErrorMsg(msg);
      if (msg.includes('khóa') || msg.includes('RATE_LIMITED')) {
        setLockoutMinutes(15);
      }
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 relative overflow-hidden">
        
        {/* Top Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-400"></div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7 text-[#064e3b]" />
          </div>
          <h2 className="text-2xl font-black text-[#064e3b] tracking-tight">
            Đăng Nhập Không Gian Lớp
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Xác thực an toàn qua Firebase Authentication để quản lý dữ liệu lớp học
          </p>
        </div>

        {/* Lockout Warning if any */}
        {lockoutMinutes && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Thiết bị tạm khóa 15 phút do nhập sai quá nhiều lần để bảo vệ an toàn.</span>
          </div>
        )}

        {errorMsg && !lockoutMinutes && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Class ID
            </label>
            <div className="relative">
              <School className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={classId}
                onChange={(e) => setClassId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="Ví dụ: 11b6-2026-2027"
                required
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b] transition"
              />
            </div>
          </div>
          
          {/* Email input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Email tài khoản Firebase</span>
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tennguoidung@gmail.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b] transition"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Mật Khẩu Firebase Authentication
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                required
                className="w-full pl-11 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              * Mật khẩu được bảo vệ trực tiếp bởi Google Firebase Security. Không lưu mật khẩu trên trình duyệt hay mã nguồn.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !!lockoutMinutes}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#064e3b] hover:bg-[#085f48] text-amber-300 font-black text-sm tracking-wide shadow-lg shadow-emerald-950/20 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Đang xác thực qua Firebase...' : 'XÁC NHẬN ĐĂNG NHẬP'}
          </button>
        </form>

        {/* Public View note */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Vai trò được hệ thống đọc từ danh sách thành viên của đúng Class ID. Không thể tự chọn quyền giáo viên, ban cán sự hoặc phụ huynh.
          </p>
        </div>

      </div>
    </div>
  );
};
