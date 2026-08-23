# HƯỚNG DẪN CẬP NHẬT FIREBASE VÀ CỔNG PHỤ HUYNH

## 1. Luồng truy cập sau khi cập nhật

Mọi người dùng đều đi qua đúng hai lớp bảo vệ, không có lối tắt:

### Lớp bảo vệ 1: xác thực lớp học

1. Nhập **Class ID**.
2. Nhập **Mật khẩu lớp**.
3. Chỉ khi hai giá trị đúng, website mới mở màn hình chọn chức năng.

### Lớp bảo vệ 2: chọn và xác thực chức năng

- **Giáo viên chủ nhiệm:** nhập email/tên đăng nhập và mật khẩu tài khoản GVCN.
- **Ban cán sự:** nhập tên đăng nhập và mật khẩu tài khoản BCS.
- **Thành viên:** nhập tên đăng nhập và mật khẩu tài khoản học sinh.
- **Phụ huynh:** nhập mã tra cứu riêng do GVCN cấp; không cần tài khoản Firebase.

Website kiểm tra vai trò thật trong `classes/{classId}/members/{uid}`. Nếu một tài khoản BCS chọn nhầm ô GVCN, hệ thống từ chối thay vì cấp quyền theo ô đã chọn.

Với phụ huynh, trình duyệt chỉ đọc đúng một tài liệu `parentViews/{mã-tra-cứu}` sau khi đã qua lớp bảo vệ 1. Tài liệu này chỉ chứa hồ sơ của một học sinh, giao dịch điểm của học sinh đó, báo bài và thời khóa biểu. Người dùng không thể liệt kê `parentViews` hoặc đọc toàn bộ `classes/{classId}`.

## 2. Bắt buộc xuất bản Firestore Rules mới trước

1. Mở **Firebase Console**.
2. Chọn dự án của website.
3. Vào **Firestore Database → Rules**.
4. Sao chép toàn bộ nội dung tệp `firestore.rules` trong gói mã nguồn này.
5. Dán đè vào trình soạn thảo Rules và bấm **Publish**.

Rules mới thực hiện đồng thời các việc sau:

- Chặn người chưa đăng nhập đọc dữ liệu trong `classes`.
- Chỉ cho khách đọc một tài liệu `parentViews/{mã}` khi biết chính xác mã.
- Cấm truy vấn hoặc liệt kê toàn bộ `parentViews`.
- Chỉ GVCN được tạo, đổi hoặc thu hồi mã phụ huynh.
- GVCN và Ban cán sự được cập nhật nội dung tra cứu khi ghi điểm, báo bài hoặc thời khóa biểu.
- Không cho ghi giao dịch nếu thiếu `studentId` hoặc `studentName` hợp lệ.

Không sử dụng quy tắc `allow read, write: if true`.

## 3. Tài khoản bảo vệ lớp

Trong Firebase Authentication cần có tài khoản:

- Email nội bộ: `<class-id>@lop.local`
- Ví dụ: `11b6-2026-2027@lop.local`
- Mật khẩu: GVCN tự đặt và chỉ cấp cho thành viên lớp.

Không tạo tài liệu `members` cho tài khoản bảo vệ Class ID.

## 4. Tài khoản thành viên

Tài khoản GVCN, Ban cán sự hoặc học sinh có email nội bộ:

`<ten-dang-nhap>.<class-id>@lop.local`

Ví dụ: `loptruong.11b6-2026-2027@lop.local`.

Lấy UID của tài khoản Authentication và tạo tài liệu:

`classes/{classId}/members/{uid}`

| Trường | Kiểu | Giá trị |
|---|---|---|
| `active` | boolean | `true` |
| `displayName` | string | Họ tên người dùng |
| `email` | string | Email nội bộ |
| `role` | string | `teacher`, `bcs` hoặc `student` |

Phụ huynh vẫn phải qua Class ID và mật khẩu lớp ở bước 1, nhưng không cần tạo tài khoản Authentication và không cần tài liệu `members` ở bước 2.

## 5. Khởi tạo mã phụ huynh sau khi đưa mã nguồn mới lên web

Thực hiện đúng thứ tự:

1. Đăng nhập website bằng tài khoản GVCN.
2. Mở **Cài đặt lớp → Danh sách học sinh**.
3. Bấm **Tạo mới mã PH**.
4. Xác nhận thao tác.
5. Chờ thông báo tạo mã thành công.

Hệ thống sẽ tự động:

- Tạo mã ngẫu nhiên khó đoán theo dạng `PH11B6-XXXX-XXXX`.
- Lưu mã trong `privateStudentData` chỉ dành cho GVCN.
- Tạo liên kết nội bộ `parentViewLinks/{studentId}` cho việc đồng bộ.
- Tạo đúng một tài liệu `parentViews/{mã}` cho từng học sinh.
- Xóa tài liệu tra cứu của mã cũ để mã cũ hết hiệu lực.

Sau đó GVCN sao chép mã hiển thị cạnh từng học sinh và gửi riêng cho đúng phụ huynh. Không gửi danh sách mã chung vào nhóm lớp.

> Lưu ý: nếu lớp đang dùng các mã cũ dạng `PH11B6-01`, phải bấm **Tạo mới mã PH** một lần sau khi Rules mới đã được Publish. Các mã cũ sẽ không còn sử dụng.

## 6. Cơ chế tự đồng bộ

Sau khi cổng phụ huynh đã được khởi tạo:

- Ghi, sửa hoặc xóa điểm: cập nhật hồ sơ đúng học sinh.
- Sửa thông tin học sinh: cập nhật hồ sơ của học sinh đó.
- Sửa báo bài hoặc thời khóa biểu: cập nhật các cổng phụ huynh đã được tạo.
- Tạo mã mới: mã cũ bị vô hiệu hóa ngay.

Dữ liệu giao dịch luôn được ghi kèm `studentId`, `studentName`, `groupNumber`, nội dung quy định, loại cộng/trừ và số điểm. Mã nguồn có kiểm tra dự phòng để không còn ghi giá trị `studentName: undefined`.

## 7. Kiểm tra trước khi sử dụng chính thức

Mở website bằng cửa sổ ẩn danh và thử lần lượt:

1. Chưa xác thực Class ID: không nhìn thấy lựa chọn vai trò hoặc dữ liệu lớp.
2. Nhập sai Class ID/mật khẩu lớp: không sang được bước 2.
3. Qua bước 1: phải thấy đủ bốn lựa chọn GVCN, Ban cán sự, Thành viên, Phụ huynh.
4. Chọn sai chức năng so với vai trò tài khoản: hệ thống phải từ chối.
5. Chọn Phụ huynh và nhập mã sai: không hiển thị hồ sơ.
6. Nhập mã đúng: chỉ thấy một học sinh cùng báo bài và thời khóa biểu.
7. Kết thúc phiên phụ huynh: quay lại bước nhập Class ID, không còn dữ liệu cũ.
8. Đăng nhập GVCN và Ban cán sự: nhập thử một giao dịch điểm.
9. Mở lại mã phụ huynh của học sinh đó: giao dịch mới phải xuất hiện.
10. Kiểm tra Firestore: giao dịch phải có `studentName` là chuỗi họ tên, không phải `undefined`.

## 8. Chạy thử trên máy

```cmd
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị, thường là `http://localhost:5173`.

## 9. Đưa lên GitHub Pages và Firebase

1. Chép toàn bộ tệp trong gói này vào thư mục dự án.
2. Không đưa `.env.local`, mật khẩu hoặc tài khoản thật lên GitHub.
3. Mở GitHub Desktop và chọn đúng repository.
4. Nhập Summary: `Cổng phụ huynh bằng mã và sửa dữ liệu ghi điểm`.
5. Bấm **Commit to main** rồi **Push origin**.
6. Vào GitHub → Actions và chờ quy trình triển khai có dấu tích xanh.
7. Nếu dùng Firebase Hosting, chạy quy trình triển khai hiện có sau khi đã Publish Rules.
8. Mở website bằng cửa sổ ẩn danh hoặc nhấn `Ctrl + Shift + R` để tránh bản cũ trong bộ nhớ đệm.

## 10. Xử lý lỗi thường gặp

### Bấm tạo mã nhưng báo `Missing or insufficient permissions`

- Kiểm tra đã Publish đúng tệp `firestore.rules` mới chưa.
- Kiểm tra tài khoản đang đăng nhập có tài liệu `members/{uid}` với `active: true` và `role: teacher` hoặc `gvcn`.

### Mã đúng nhưng báo không tìm thấy

- Đăng nhập GVCN và bấm **Tạo mới mã PH**.
- Kiểm tra Firestore có tài liệu `parentViews/{mã}` tương ứng.
- Nhập mã không có khoảng trắng thừa; website tự chuyển mã sang chữ in hoa.

### Mã dạng `PH11B6-27` báo là mã cũ

- Đây là mã ngắn tuần tự, có thể bị đoán và không còn được chấp nhận.
- GVCN vào **Cài đặt lớp → Danh sách học sinh → Tạo mới mã PH**.
- Cấp riêng mã mới dạng `PH11B6-XXXX-XXXX` cho đúng phụ huynh.

### Báo Firestore Rules chưa cho phép đọc `parentViews`

- Mở **Firestore Database → Rules**.
- Dán toàn bộ tệp `firestore.rules` trong gói mới, rồi bấm **Publish**.
- Chờ khoảng một phút và thử lại bằng cửa sổ ẩn danh.

### Ghi điểm xong nhưng cổng phụ huynh chưa cập nhật

- Kiểm tra Ban cán sự/GVCN vẫn đang đăng nhập hợp lệ.
- Kiểm tra `parentViewLinks/{studentId}` đã được tạo bằng thao tác **Tạo mới mã PH**.
- Tải lại trang phụ huynh và kiểm tra kết nối mạng.
