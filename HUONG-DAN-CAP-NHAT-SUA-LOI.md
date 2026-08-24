# Hướng dẫn cập nhật bản sửa lỗi

## Các nội dung đã sửa

1. Điểm trừ luôn được tính là số âm; dữ liệu cũ lưu điểm trừ dưới dạng số dương cũng được đọc và tổng hợp lại đúng.
2. Tuần đang chọn được giữ nguyên sau khi lưu, xóa hoặc đồng bộ dữ liệu.
3. Có thể ghi điểm cho một học sinh, một tổ hoặc cả lớp; trước khi lưu có thể bỏ chọn từng học sinh.
4. Mục thứ hạng trường có nút **Cập nhật thứ hạng**, chọn tuần, nhập điểm bị trừ và lý do.
5. Báo bài và thời khóa biểu lưu đầy đủ tháng/tuần, hiển thị ngay sau khi ghi, đồng thời có nút sửa và xóa tại từng tiết.
6. Thanh điều khiển xem trước bản in không còn che tên học sinh; tên GVCN và năm ký được lấy từ cấu hình lớp.

## Cách kiểm tra trên máy

Mở Terminal tại thư mục mã nguồn rồi chạy:

```cmd
npm install
npm run lint
npm run build
npm run dev
```

Sau đó mở địa chỉ Vite hiển thị trong Terminal và kiểm tra lần lượt:

- Chọn một tuần cũ, nhập liên tiếp hai giao dịch và xác nhận hệ thống không tự nhảy về tuần hiện tại.
- Nhập một điểm cộng và một điểm trừ cho cùng học sinh; kiểm tra tổng ngày, tổng tuần và tổng tháng.
- Dùng nút **Ghi cho cả lớp** hoặc **Ghi cho Tổ ...**.
- Ghi một tiết trong mục Báo bài & Thời khóa biểu, sau đó thử sửa và xóa.
- Mở bản xem trước phiếu học sinh và kiểm tra tên học sinh, tên GVCN.

## Đưa lên GitHub Pages

Không chép tệp `.env.local` lên GitHub. Chỉ cập nhật các tệp mã nguồn trong gói này, commit và push lên nhánh `main`, sau đó chờ GitHub Actions build/deploy thành công.

Không cần xóa dữ liệu điểm cũ trên Firestore. Bản sửa đã tương thích với các giao dịch điểm trừ trước đây.
