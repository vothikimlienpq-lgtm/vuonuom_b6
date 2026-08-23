# TRIỂN KHAI VƯỜN ƯƠM 11B6 LÊN GITHUB PAGES VÀ FIREBASE

Ứng dụng là website tĩnh React + TypeScript + Vite, dùng Firebase Authentication cho thành viên và Cloud Firestore để đồng bộ dữ liệu. Mọi người dùng xác thực Class ID trước; phụ huynh dùng mã riêng ở bước 2 và không cần tài khoản Firebase.

## 1. Tạo Firebase Web App

1. Mở [Firebase Console](https://console.firebase.google.com/), tạo hoặc chọn dự án.
2. Thêm Web App bằng biểu tượng `</>`.
3. Ghi lại `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` và `appId`.
4. Bật **Authentication → Sign-in method → Email/Password**.
5. Tạo **Cloud Firestore** ở chế độ Production.

## 2. Xuất bản Firestore Rules

1. Vào **Firestore Database → Rules**.
2. Sao chép toàn bộ tệp `firestore.rules` của gói này.
3. Dán vào Firebase Console và bấm **Publish**.

Phải hoàn thành bước này trước khi tạo mã phụ huynh. Xem quy trình kiểm tra chi tiết trong `HUONG-DAN-BAO-MAT-2-LOP.md`.

## 3. Tạo tài khoản bảo vệ lớp

Trong Authentication, tạo:

- Email: `11b6-2026-2027@lop.local`
- Mật khẩu: mật khẩu lớp do GVCN tự đặt.

Không tạo tài liệu `members` cho tài khoản này.

## 4. Tạo tài khoản GVCN

1. Trong Authentication, tạo email nội bộ, ví dụ `gvcn.11b6-2026-2027@lop.local`.
2. Sao chép UID của tài khoản.
3. Trong Firestore, tạo tài liệu `classes/11b6-2026-2027/members/{uid}` với dữ liệu:

```json
{
  "active": true,
  "displayName": "Cô Võ Thị Kim Liên",
  "email": "gvcn.11b6-2026-2027@lop.local",
  "role": "teacher"
}
```

Ban cán sự và học sinh được tạo tương tự, dùng `role: "bcs"` hoặc `role: "student"`.

## 5. Cấu hình biến môi trường trên máy

Sao chép `.env.example` thành `.env.local` và điền cấu hình Firebase Web App. Không đưa `.env.local` lên GitHub.

Chạy thử:

```cmd
npm install
npm run lint
npm run build
npm run dev
```

## 6. Cấu hình GitHub Actions

Trong repository, vào **Settings → Secrets and variables → Actions** và tạo:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Sau đó:

1. Vào **Settings → Pages**.
2. Chọn nguồn triển khai **GitHub Actions**.
3. Đẩy mã nguồn lên nhánh `main`.
4. Chờ workflow `.github/workflows/deploy-pages.yml` hoàn thành.
5. Thêm tên miền GitHub Pages, ví dụ `ten-tai-khoan.github.io`, vào **Authentication → Settings → Authorized domains**.

## 7. Khởi tạo dữ liệu và Cổng Phụ huynh

1. Mở website đã triển khai.
2. Ở **Bước 1 / 2**, nhập Class ID và mật khẩu lớp.
3. Ở **Bước 2 / 2**, chọn **Giáo viên chủ nhiệm**, rồi đăng nhập tài khoản GVCN.
4. Vào **Cài đặt lớp → Dữ liệu & Khởi tạo** và khởi tạo cấu hình nếu Firestore còn trống.
5. Thêm hoặc nhập danh sách học sinh.
6. Vào **Danh sách học sinh** và bấm **Tạo mới mã PH**.
7. Gửi riêng mã của từng học sinh cho đúng phụ huynh.

Khi phụ huynh sử dụng: nhập Class ID và mật khẩu lớp ở bước 1, chọn **Phụ huynh** ở bước 2, rồi nhập mã mới dạng `PH11B6-XXXX-XXXX`. Mã cũ ngắn như `PH11B6-27` phải được thay bằng mã mới.

## 8. Cập nhật phiên bản sau này

1. Chép các tệp đã sửa vào repository.
2. Commit với nội dung rõ ràng.
3. Push lên `main`.
4. Chờ GitHub Actions có dấu tích xanh.
5. Nếu `firestore.rules` thay đổi, Publish lại Rules trong Firebase Console.
6. Kiểm tra website bằng cửa sổ ẩn danh.
