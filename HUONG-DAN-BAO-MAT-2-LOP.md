# HƯỚNG DẪN CẬP NHẬT BẢO MẬT 2 LỚP

## 1. Cấu trúc đăng nhập

1. Lớp bảo vệ thứ nhất: nhập Class ID và mật khẩu của lớp.
2. Lớp bảo vệ thứ hai: nhập tên đăng nhập và mật khẩu thành viên.
3. Quyền được đọc từ `classes/{classId}/members/{uid}`, người dùng không tự chọn quyền.

## 2. Tài khoản bảo vệ Class ID

Trong Firebase Authentication tạo một tài khoản:

- Email nội bộ: `<class-id>@lop.local`
- Ví dụ Class ID `11b6-2026-2027`: `11b6-2026-2027@lop.local`
- Mật khẩu: giáo viên tự đặt và chỉ cấp cho thành viên lớp.

Không tạo tài liệu `members` cho tài khoản bảo vệ Class ID này.

## 3. Tài khoản thành viên

Tạo tài khoản trong Firebase Authentication theo mẫu:

- Email nội bộ: `<ten-dang-nhap>.<class-id>@lop.local`
- Ví dụ: `loptruong.11b6-2026-2027@lop.local`

Sau đó sao chép UID của tài khoản và tạo tài liệu:

`classes/{classId}/members/{uid}`

Các trường bắt buộc:

| Trường | Kiểu | Giá trị |
|---|---|---|
| `active` | boolean | `true` |
| `displayName` | string | Họ tên |
| `email` | string | Email nội bộ vừa tạo |
| `role` | string | `teacher`, `bcs`, `student` hoặc `parent` |

Nếu là phụ huynh, thêm:

| Trường | Kiểu | Giá trị |
|---|---|---|
| `studentId` | string | ID tài liệu học sinh là con của phụ huynh |

## 4. Phân quyền

- `teacher`: toàn quyền, gồm cài đặt lớp.
- `bcs`: được nhập/xóa điểm, không được cài đặt lớp.
- `student`: chỉ xem, không được nhập điểm hoặc cài đặt.
- `parent`: chỉ xem thông tin con có `studentId` tương ứng và báo bài/thời khóa biểu.

## 5. Cập nhật Firestore Rules

Cách dễ nhất:

1. Mở Firebase Console.
2. Chọn Firestore Database > Rules.
3. Sao chép toàn bộ nội dung tệp `firestore.rules` của gói này vào.
4. Bấm Publish.

Không sử dụng quy tắc `allow read, write: if true`.

## 6. Chạy thử trên máy

Mở Terminal tại thư mục dự án rồi chạy:

```cmd
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị, thường là `http://localhost:5173`.

Kiểm tra bằng cửa sổ ẩn danh:

1. Chưa nhập Class ID thì không nhìn thấy dữ liệu lớp.
2. Nhập đúng Class ID và mật khẩu lớp mới tới màn hình thành viên.
3. Đăng nhập lần lượt teacher, bcs, student và parent để kiểm tra quyền.
4. Thử ghi điểm cho học sinh và xác nhận không còn lỗi `studentName undefined`.

## 7. Đưa lên GitHub Pages

1. Chép toàn bộ tệp trong gói này đè vào thư mục dự án trên máy.
2. Mở GitHub Desktop và chọn đúng repository.
3. Nhập Summary: `Bảo mật 2 lớp và sửa lỗi ghi điểm`.
4. Bấm **Commit to main**.
5. Bấm **Push origin**.
6. Vào GitHub > Actions > Deploy to GitHub Pages.
7. Chờ lần chạy mới nhất có dấu tích xanh.
8. Mở website bằng cửa sổ ẩn danh hoặc nhấn `Ctrl + Shift + R` để tránh bản cũ trong bộ nhớ đệm.

## 8. Lưu ý

- Địa chỉ `@lop.local` chỉ là email nội bộ cho Firebase, không phải hộp thư thật và không hiển thị trên giao diện.
- Không đưa `.env.local`, mật khẩu hoặc tài khoản thật lên GitHub.
- Mỗi tài khoản Authentication phải dùng đúng UID làm Document ID trong `members`.
