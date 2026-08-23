import React, { useState } from 'react';
import { Building2, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { CLASS_ID } from '../firebase/config';

interface Props { onVerified: (classId: string) => void }

export const ClassAccessGate: React.FC<Props> = ({ onVerified }) => {
  const [classId, setClassId] = useState(CLASS_ID);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage(''); setLoading(true);
    try { await api.verifyClassAccess({ classId, password }); onVerified(classId.trim().toLowerCase()); }
    catch (error: any) { setMessage(error.message || 'Class ID hoặc mật khẩu lớp không chính xác.'); }
    finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-[100] bg-[#064e3b] flex items-center justify-center p-4"><div className="w-full max-w-lg bg-white rounded-[30px] p-7 sm:p-10 shadow-2xl">
    <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center"><ShieldCheck className="w-9 h-9 text-emerald-800" /></div>
    <div className="text-center mt-4 mb-7"><div className="text-xs font-black text-amber-600 tracking-widest">BƯỚC 1 / 2</div><h1 className="text-3xl font-black text-[#064e3b] mt-1">Xác Thực Lớp Học</h1><p className="text-sm text-slate-600 mt-2">Phải xác thực đúng Class ID trước khi xem bất kỳ dữ liệu nào.</p></div>
    {message && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">{message}</div>}
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-black text-slate-700">CLASS ID<span className="relative block mt-2"><Building2 className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" /><input value={classId} onChange={e => setClassId(e.target.value)} required autoComplete="off" className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700" /></span></label>
      <label className="block text-sm font-black text-slate-700">MẬT KHẨU LỚP<span className="relative block mt-2"><LockKeyhole className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" /><input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" className="w-full pl-12 pr-12 py-3 rounded-2xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700" /><button type="button" onClick={() => setShow(v => !v)} className="absolute right-4 top-3.5 text-slate-400">{show ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button></span></label>
      <button disabled={loading} className="w-full py-4 rounded-2xl bg-[#064e3b] text-amber-300 font-black disabled:opacity-60">{loading ? 'ĐANG XÁC THỰC...' : 'TIẾP TỤC ĐĂNG NHẬP'}</button>
    </form><p className="text-xs text-slate-500 text-center mt-5">Không lưu mật khẩu lớp trên trình duyệt hoặc mã nguồn.</p>
  </div></div>;
};
