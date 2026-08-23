# HƯỚNG DẪN TẠO THÊM LỚP VÀ GIÁO VIÊN TRÊN CÙNG WEBSITE

## 1. Cách hệ thống đa lớp hoạt động

Chỉ cần một website GitHub Pages và một Firebase project. Dữ liệu được tách theo đường dẫn `classes/{classId}`.

Ví dụ:

- `classes/11b6-2026-2027`
- `classes/10a1-2026-2027`

Ứng dụng hủy listener, xóa cache và tạo vùng dữ liệu mới mỗi khi người dùng đổi Class ID. Tài khoản chỉ đọc được lớp có tài liệu `members/{uid}` hợp lệ.

## 2. Quy tắc đặt Class ID

Dùng chữ thường, không dấu, không khoảng trắng. Nên dùng dạng `<tên-lớp>-<năm-bắt-đầu>-<năm-kết-thúc>`, ví dụ `10a1-2026-2027`.

Không đổi Class ID sau khi lớp đã có dữ liệu, vì Class ID chính là đường dẫn Firestore của lớp.

## 3. Tạo cổng bảo vệ cho lớp mới

Trong **Firebase Console → Authentication → Users → Add user**, tạo:

- Email: `10a1-2026-2027@lop.local`
- Password: mật khẩu lớp mạnh do GVCN tự đặt

Đây chỉ là tài khoản kiểm tra ở bước 1. Không tạo tài liệu `members` cho tài khoản này.

## 4. Tạo tài khoản cho giáo viên lớp mới

Vẫn trong **Authentication → Users → Add user**, tạo tài khoản giáo viên, ví dụ:

- Email: `gvcn.10a1-2026-2027@lop.local`
- Password: mật khẩu riêng của giáo viên, khác mật khẩu lớp

Sau khi tạo xong, sao chép chính xác **User UID** của tài khoản giáo viên.

Giáo viên cũng có thể dùng một email thật. Khi đăng nhập ở bước 2, nhập nguyên email đó. Một tài khoản Firebase có thể được cấp quyền ở nhiều lớp bằng cách dùng cùng UID trong nhiều collection `members`.

## 5. Cấp quyền GVCN trong Firestore

Mở **Firestore Database → Data** và tạo đúng đường dẫn:

`classes/10a1-2026-2027/members/{UID-GIAO-VIEN}`

Tên document phải là UID vừa sao chép, không dùng email hoặc tên giáo viên. Tạo các field:

| Field | Type | Value mẫu |
|---|---|---|
| `active` | boolean | `true` |
| `displayName` | string | `Cô Nguyễn Thị A` |
| `email` | string | `gvcn.10a1-2026-2027@lop.local` |
| `role` | string | `teacher` |

Firestore Console cho phép tạo subcollection `members` ngay cả khi document lớp chưa có field. Không xóa `members` của lớp cũ.

## 6. Đăng nhập và khởi tạo dữ liệu lớp mới

1. Mở website bằng cửa sổ ẩn danh.
2. Bước 1: nhập `10a1-2026-2027` và mật khẩu lớp.
3. Bước 2: chọn **Giáo viên chủ nhiệm**.
4. Nhập tên đăng nhập `gvcn` và mật khẩu giáo viên. Có thể nhập nguyên email thay cho `gvcn`.
5. Mở **Cài đặt lớp → Thông tin lớp**.
6. Sửa tên lớp, trường, năm học, tên GVCN, ngày bắt đầu tuần 1 và các thông tin cần thiết.
7. Mở **Dữ liệu & Khởi tạo** và bấm **Khởi tạo dữ liệu lớp ngay**.
8. Thêm danh sách học sinh rồi tạo mã phụ huynh.

Nút khởi tạo chỉ ghi vào `classes/10a1-2026-2027`; dữ liệu 11B6 không bị thay đổi.

## 7. Tạo Ban cán sự và Thành viên

Tạo tài khoản Authentication theo dạng:

- BCS: `bancansu.10a1-2026-2027@lop.local`
- Thành viên: `thanhvien.10a1-2026-2027@lop.local`

Với mỗi tài khoản, sao chép UID rồi tạo `classes/10a1-2026-2027/members/{uid}`.

| Vai trò | `role` | `active` |
|---|---|---|
| Giáo viên | `teacher` | `true` |
| Ban cán sự | `bcs` | `true` |
| Thành viên | `student` | `true` |

Thêm `displayName` và `email` đúng tài khoản. Tên đăng nhập ở website là phần đứng trước `.<classId>@lop.local`.

## 8. Kiểm tra không lẫn dữ liệu giữa hai lớp

1. Đăng nhập lớp cũ và ghi lại số học sinh hiển thị.
2. Đăng xuất hoàn toàn.
3. Đăng nhập lớp mới; lớp mới chỉ được thấy dữ liệu vừa tạo.
4. Thêm một học sinh thử ở lớp mới.
5. Đăng xuất và quay lại lớp cũ; học sinh thử không được xuất hiện.
6. Dùng tài khoản lớp cũ đăng nhập ở bước 2 của lớp mới; hệ thống phải báo chưa được cấp quyền.

## 9. Các lỗi thường gặp

### Class ID đúng nhưng không qua bước 1

Kiểm tra Authentication có đúng email `<classId>@lop.local`. Firebase không cho xem lại mật khẩu; nếu quên, đặt mật khẩu mới cho tài khoản này.

### Đăng nhập giáo viên báo `Missing or insufficient permissions`

- Kiểm tra document ID trong `members` có đúng UID Authentication.
- Kiểm tra `active` là boolean `true`, không phải chuỗi `"true"`.
- Kiểm tra `role` là `teacher` hoặc `gvcn`.
- Kiểm tra document nằm dưới đúng Class ID vừa nhập ở bước 1.
- Publish lại đúng tệp `firestore.rules` của gói này.

### Tài khoản đăng nhập được lớp A nhưng không vào lớp B

Đây là hành vi đúng nếu UID chưa được thêm vào `classes/{classId-lớp-B}/members/{uid}`. Muốn một giáo viên quản lý cả hai lớp, thêm cùng UID vào `members` của cả hai lớp.

### Website vẫn hiện bản cũ

Chờ GitHub Actions có dấu tích xanh, sau đó mở cửa sổ ẩn danh hoặc nhấn `Ctrl + Shift + R`.

## 10. Nguyên tắc an toàn

- Không đưa `.env.local`, mật khẩu hoặc mã phụ huynh lên GitHub.
- Không dùng chung mật khẩu lớp và mật khẩu GVCN.
- Không tạo `members` cho tài khoản cổng lớp `<classId>@lop.local`.
- Không đặt document `members` bằng tên đăng nhập; luôn dùng UID.
- Không xóa dữ liệu lớp cũ khi tạo lớp mới.
- Gửi riêng mã phụ huynh cho đúng gia đình, không đăng danh sách mã trong nhóm chung.
