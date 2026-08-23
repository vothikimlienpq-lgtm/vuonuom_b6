import React, { useState } from 'react';
import {
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { DEFAULT_CLASS_ID } from '../firebase/config';

interface Props {
  onVerified: (classId: string) => void;
}

export const ClassAccessGate: React.FC<Props> = ({ onVerified }) => {
  const [classId, setClassId] = useState(DEFAULT_CLASS_ID);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const result = await api.verifyClassAccess({ classId, password });
      onVerified(result.classId);
    } catch (error: any) {
      setMessage(error.message || 'Class ID hoặc mật khẩu lớp không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#064e3b] p-4">
      <div className="w-full max-w-lg rounded-[30px] bg-white p-7 shadow-2xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
          <ShieldCheck className="h-9 w-9 text-emerald-800" />
        </div>
        <div className="mb-7 mt-4 text-center">
          <div className="text-xs font-black tracking-widest text-amber-600">BƯỚC 1 / 2 • XÁC THỰC LỚP</div>
          <h1 className="mt-1 text-3xl font-black text-[#064e3b]">Cổng Bảo Mật Lớp Học</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Giáo viên, Ban cán sự, thành viên và phụ huynh đều phải xác thực đúng lớp trước khi chọn chức năng.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            {message}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-black text-slate-700">
            CLASS ID
            <span className="relative mt-2 block">
              <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="Ví dụ: 10a1-2026-2027"
                className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </span>
          </label>
          <label className="block text-sm font-black text-slate-700">
            MẬT KHẨU LỚP
            <span className="relative mt-2 block">
              <LockKeyhole className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-12 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <button
                type="button"
                aria-label="Hiện hoặc ẩn mật khẩu lớp"
                onClick={() => setShow((value) => !value)}
                className="absolute right-4 top-3.5 text-slate-400"
              >
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </span>
          </label>
          <button disabled={loading} className="w-full rounded-2xl bg-[#064e3b] py-4 font-black text-amber-300 disabled:opacity-60">
            {loading ? 'ĐANG XÁC THỰC LỚP...' : 'XÁC THỰC VÀ SANG BƯỚC 2'}
          </button>
          <p className="text-center text-xs leading-relaxed text-slate-500">
            Qua bước này, hệ thống mới hiển thị lựa chọn Giáo viên, Ban cán sự, Thành viên hoặc Phụ huynh.
          </p>
        </form>
      </div>
    </div>
  );
};
