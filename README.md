# Vườn Ươm – Quản lý nhiều lớp trên cùng website

Ứng dụng React + TypeScript + Vite dùng chung một Firebase project và một địa chỉ web cho nhiều lớp. Mỗi lớp có Class ID, mật khẩu cổng lớp, thành viên, cấu hình và toàn bộ dữ liệu Firestore riêng.

## Tài liệu quan trọng

- `HUONG-DAN-CHE-DO-DA-LOP.md`: tạo lớp và giáo viên mới trên website đang dùng.
- `HUONG-DAN-BAO-MAT-2-LOP.md`: cơ chế hai lớp bảo vệ và Cổng Phụ huynh.
- `HUONG-DAN-TRIEN-KHAI.md`: cấu hình Firebase và GitHub Pages.
- `firestore.rules`: quy tắc phân quyền bắt buộc phải Publish.

## Chạy trên máy

1. Cài Node.js.
2. Chạy `npm install`.
3. Sao chép `.env.example` thành `.env.local` và điền cấu hình Firebase Web App.
4. Chạy `npm run lint` và `npm run build` để kiểm tra.
5. Chạy `npm run dev` để mở bản thử.

Không đưa `.env.local`, mật khẩu hoặc danh sách mã phụ huynh lên GitHub.
