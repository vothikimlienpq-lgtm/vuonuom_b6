# Hướng dẫn cập nhật đăng nhập phụ huynh bằng mã

## 1. Thay mã nguồn

Giải nén gói này rồi sao chép toàn bộ tệp và thư mục vào thư mục dự án GitHub trên máy. Khi Windows hỏi, chọn **Replace the files in the destination**.

Không sao chép tệp `.env.local` lên GitHub. Giữ nguyên `.env.local` đang có trên máy.

## 2. Cập nhật Firestore Rules

Mở Firebase Console → Firestore Database → Rules. Sao chép toàn bộ nội dung tệp `firestore.rules` của gói này vào trình soạn thảo Rules rồi bấm **Publish**.

Quy tắc mới chỉ cho phép khách đọc đúng một tài liệu `parentViews/{code}` đang hoạt động; không cho phép liệt kê toàn bộ mã.

## 3. Tạo mã phụ huynh

Đường dẫn tài liệu phải là:

`classes/11b6-2026-2027/parentViews/PH-11B6-A7K92X`

Các trường bắt buộc:

- `active`: boolean, `true`
- `studentId`: string, ID thật của học sinh
- `studentName`: string, họ tên thật của học sinh
- `group`: number
- `currentScore`: number
- `allowTimetable`: boolean
- `conductData`: map gồm `plusPoints`, `minusPoints`, `totalScore`, `violations` kiểu number
- `weeklyHomework`: map gồm `title`, `content` kiểu string và `weekNumber` kiểu number

Không để nguyên giá trị mẫu `ID học sinh` hoặc `Họ tên học sinh`, vì hệ thống sẽ từ chối mã chưa gắn với học sinh thật.

## 4. Kiểm tra trên máy

Mở Terminal tại thư mục dự án và chạy:

```bat
npm install
npm run build
npm run dev
```

Mở địa chỉ Vite cung cấp. Kiểm tra:

1. Chưa đăng nhập thì không nhìn thấy dữ liệu lớp.
2. Chọn **Phụ Huynh** và chỉ nhập mã tra cứu.
3. Phụ huynh chỉ thấy đúng học sinh được gắn với mã, báo bài và thời khóa biểu nếu được cho phép.
4. Thử nhập điểm bằng tài khoản GVCN/BCS để xác nhận không còn lỗi `studentName: undefined`.

## 5. Đưa lên GitHub Pages

Trong GitHub Desktop, nhập Summary, ví dụ `Sửa đăng nhập phụ huynh và bảo mật trang đầu`, sau đó bấm **Commit to main** và **Push origin**. Vào GitHub → Actions và chờ workflow Deploy to GitHub Pages hiện dấu tích xanh.

