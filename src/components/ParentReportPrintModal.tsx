import React from 'react';
import { Printer, X, Download, Sprout, School, UserCheck } from 'lucide-react';
import { Student, FullClassData } from '../types';
import { computeStudentScores, formatSignedPoints, getSignedTransactionPoints } from '../utils/calculations';

interface ParentReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  data: FullClassData;
  selectedMonth: number;
  selectedWeek: number;
}

export const ParentReportPrintModal: React.FC<ParentReportPrintModalProps> = ({
  isOpen,
  onClose,
  students,
  data,
  selectedMonth,
  selectedWeek,
}) => {
  if (!isOpen) return null;

  const allStudents = data.students || [];
  const allTransactions = data.transactions || [];
  const config = data.config;
  const configuredTeacher = String(config.teacherName || '').trim();
  const hasTeacherName = configuredTeacher && configuredTeacher.toLowerCase() !== 'chưa cập nhật';
  const teacherName = hasTeacherName
    ? configuredTeacher
    : String(config.className || '').toUpperCase() === '11B6'
      ? 'Cô Võ Thị Kim Liên'
      : 'Chưa cập nhật tên GVCN';
  const academicYears = String(config.academicYear || '').match(/20\d{2}/g);
  const reportYear = academicYears?.[academicYears.length - 1] || new Date().getFullYear();

  const studentSummaries = computeStudentScores(allStudents, allTransactions, selectedMonth);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pb-4 pt-28 bg-emerald-950/80 backdrop-blur-sm overflow-y-auto print:p-0">
      
      {/* Top Floating Control Bar (Hidden on print) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 rounded-3xl sm:rounded-full shadow-2xl border border-emerald-200 flex flex-wrap items-center justify-center gap-3 sm:gap-4 no-print w-[calc(100%-2rem)] sm:w-auto">
        <span className="text-xs font-bold text-emerald-950">
          Xem trước bản in A4 ({students.length} phiếu)
        </span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#064e3b] hover:bg-[#095c47] text-amber-300 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>In ngay (A4)</span>
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Sheet Container */}
      <div className="mb-8 w-full max-w-3xl space-y-8 print:m-0 print:w-full print:max-w-none print-container">
        {students.map((student, sIdx) => {
          const summary = studentSummaries.find(s => s.studentId === student.id);
          const studentTxs = allTransactions.filter(
            t => t.studentId === student.id && t.month === selectedMonth
          );

          if (!summary) return null;

          return (
            <div
              key={student.id}
              className="bg-white p-8 sm:p-10 rounded-[20px] shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-6 print:rounded-none page-break"
            >
              
              {/* Official Header */}
              <div className="flex items-start justify-between border-b-2 border-emerald-900 pb-4 mb-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HÀ NỘI
                  </div>
                  <div className="text-sm font-black uppercase text-[#064e3b]">
                    {config.schoolName || 'CHƯA CẬP NHẬT TRƯỜNG'}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    LỚP: {config.className || config.id.toUpperCase()} • NĂM HỌC {config.academicYear || 'CHƯA CẬP NHẬT'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-700">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="text-[10px] italic text-slate-500">
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {student.parentCode ? `Mã tra cứu: ${student.parentCode}` : ''}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-6">
                <h1 className="text-lg sm:text-xl font-black text-[#064e3b] uppercase tracking-wide">
                  PHIẾU THÔNG BÁO KẾT QUẢ RÈN LUYỆN & HỌC TẬP
                </h1>
                <div className="text-xs font-bold text-amber-700 mt-1">
                  ĐÁNH GIÁ ĐỊNH KỲ THÁNG {selectedMonth} (NĂM HỌC {config.academicYear})
                </div>
              </div>

              {/* Student Bio Grid */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 mb-6 text-xs text-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500">Họ và tên:</span>
                  <div className="font-bold text-sm text-[#064e3b]">{student.fullName}</div>
                </div>
                <div>
                  <span className="text-slate-500">STT / Tổ thi đua:</span>
                  <div className="font-bold">#{student.orderNumber} • Tổ {student.groupNumber}</div>
                </div>
                <div>
                  <span className="text-slate-500">Chức vụ trong lớp:</span>
                  <div className="font-bold">{student.position}</div>
                </div>
                <div>
                  <span className="text-slate-500">GVCN phụ trách:</span>
                  <div className="font-bold">{teacherName}</div>
                </div>
              </div>

              {/* Score & Ranking Matrix */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2">
                  1. Kết quả điểm thi đua rèn luyện 4 tuần:
                </h3>
                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-center">
                    <thead className="bg-[#064e3b] text-white">
                      <tr>
                        <th className="p-2 border-r border-emerald-700">Tuần 1</th>
                        <th className="p-2 border-r border-emerald-700">Tuần 2</th>
                        <th className="p-2 border-r border-emerald-700">Tuần 3</th>
                        <th className="p-2 border-r border-emerald-700">Tuần 4</th>
                        <th className="p-2 border-r border-emerald-700 font-black">Tổng điểm tháng</th>
                        <th className="p-2 font-black">Xếp loại rèn luyện</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 border-r border-slate-200 font-bold">{formatSignedPoints(summary.weekScores[1] || 0, 'đ')}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold">{formatSignedPoints(summary.weekScores[2] || 0, 'đ')}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold">{formatSignedPoints(summary.weekScores[3] || 0, 'đ')}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold">{formatSignedPoints(summary.weekScores[4] || 0, 'đ')}</td>
                        <td className="p-2.5 border-r border-slate-200 font-black text-sm text-[#064e3b]">
                          {formatSignedPoints(summary.monthTotal, 'đ')}
                        </td>
                        <td className="p-2.5 font-black text-sm text-emerald-800">
                          {summary.conductRank} {summary.isTemporary && '(Tạm)'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Breakdown of Merits and Infractions */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2">
                  2. Thống kê chi tiết nề nếp & học tập:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <span className="text-slate-500">Ngủ trong giờ:</span>
                    <div className="font-bold text-slate-800">{summary.faultBreakdown.sleeping} lần</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <span className="text-slate-500">Vắng học / Trễ:</span>
                    <div className="font-bold text-slate-800">{summary.faultBreakdown.absent + summary.faultBreakdown.late} lần</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <span className="text-slate-500">Không thuộc bài / BTVN:</span>
                    <div className="font-bold text-slate-800">{summary.faultBreakdown.noLesson + summary.faultBreakdown.noPrep} lần</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <span className="text-slate-500">Bản kiểm điểm:</span>
                    <div className="font-bold text-rose-700">{summary.reportCardsCount} bản</div>
                  </div>
                </div>
              </div>

              {/* Specific Point Events Log (Top 6) */}
              {studentTxs.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2">
                    3. Nhật ký các sự kiện khen thưởng / vi phạm trong tháng:
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="p-2">Thời điểm</th>
                          <th className="p-2">Nội dung sự kiện</th>
                          <th className="p-2 text-center">Điểm</th>
                          <th className="p-2">Lý do / Môn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentTxs.slice(0, 6).map(t => (
                          <tr key={t.id}>
                            <td className="p-2 text-slate-600">{t.dayOfWeek}, Tuần {t.week}</td>
                            <td className="p-2 font-medium text-slate-900">{t.ruleContent}</td>
                            <td className={`p-2 text-center font-bold ${t.type === 'plus' ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {formatSignedPoints(getSignedTransactionPoints(t), 'đ')}
                            </td>
                            <td className="p-2 text-slate-500">{t.reason || t.subject || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Teacher Comments Section */}
              <div className="mb-8 p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider mb-1">
                  4. Nhận xét & Đề nghị của Giáo Viên Chủ Nhiệm:
                </div>
                <p className="italic text-slate-700 leading-relaxed">
                  {summary.conductRank === 'Tốt'
                    ? 'Em duy trì nề nếp rèn luyện rất tốt, tích cực tham gia các phong trào thi đua của lớp và trường. Đề nghị tiếp tục phát huy.'
                    : summary.conductRank === 'Khá'
                    ? 'Em chấp hành tốt nội quy lớp học, có ý thức vươn lên trong học tập. Cần chú ý hoàn thành đầy đủ bài tập về nhà hơn nữa.'
                    : 'Em cần chấn chỉnh nề nếp chuyên cần, tập trung chú ý nghe giảng và tránh vi phạm quy định lớp học. Kính đề nghị Quý phụ huynh cùng phối hợp nhắc nhở em.'}
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
                <div>
                  <div className="font-bold text-slate-800 uppercase">Ý KIẾN & CHỮ KÝ PHỤ HUYNH</div>
                  <div className="text-[10px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
                  <div className="h-20"></div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 italic mb-1">
                    Hà Nội, ngày ..... tháng ..... năm {reportYear}
                  </div>
                  <div className="font-bold text-slate-800 uppercase">GIÁO VIÊN CHỦ NHIỆM</div>
                  <div className="text-[10px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-emerald-950 text-sm">
                    {teacherName}
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
