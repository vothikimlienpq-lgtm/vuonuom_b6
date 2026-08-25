# Hướng dẫn cập nhật bản sửa lỗi

## Các nội dung đã sửa

1. Điểm trừ luôn được tính là số âm; dữ liệu cũ lưu điểm trừ dưới dạng số dương cũng được đọc và tổng hợp lại đúng.
2. Tuần đang chọn được giữ nguyên sau khi lưu, xóa hoặc đồng bộ dữ liệu.
3. Có thể ghi điểm cho một học sinh, một tổ hoặc cả lớp; trước khi lưu có thể bỏ chọn từng học sinh.
4. Mục thứ hạng trường có nút **Cập nhật thứ hạng**, chọn tuần, nhập điểm bị trừ và lý do.
5. Báo bài và thời khóa biểu lưu đầy đủ tháng/tuần, hiển thị ngay sau khi ghi, đồng thời có nút sửa và xóa tại từng tiết.
6. Thanh điều khiển xem trước bản in không còn che tên học sinh; tên GVCN và năm ký được lấy từ cấu hình lớp.
7. Mục **Thứ hạng trường & khối** có nút chọn trực tiếp từng tuần và hiển thị đúng dữ liệu của tuần đang chọn.
8. Phần **Báo bài & Thời khóa biểu** cho phép tự nhập tên môn học, không còn phụ thuộc danh sách môn cố định.
9. Chức năng **Thêm quy định mới** đã sửa lỗi Firestore từ chối trường dữ liệu trống; có kiểm tra nội dung, điểm, lĩnh vực và trạng thái đang lưu rõ ràng.
10. Mục **Rèn luyện cá nhân** có thêm chế độ **Học kỳ & Cả năm**:
    - Tổng hợp các tháng đã diễn ra trong từng học kỳ.
    - Giáo viên cài số tuần của HKI; HKII tự nhận số tuần còn lại.
    - Mức học kỳ là gợi ý theo dữ liệu theo dõi tháng và được đánh dấu **Tạm** khi học kỳ chưa kết thúc.
    - Mức cả năm được tính theo đúng tổ hợp HKI–HKII tại Điều 8 Thông tư 22/2021/TT-BGDĐT.
    - Giao diện ghi rõ kết quả gợi ý không thay thế nhận xét và quyết định chuyên môn của GVCN.
11. Danh mục quy định được hợp nhất an toàn giữa 30 quy định chuẩn và dữ liệu Firestore:
    - Thêm quy định mới không còn làm mất các quy định cũ.
    - Quy định đã lưu trùng mã sẽ cập nhật đúng bản ghi tương ứng, không tạo bản sao.
    - Xóa quy định chuẩn không làm quy định đó tự xuất hiện lại sau khi tải trang.
    - Quy định tự thêm được nối sau danh sách chuẩn và vẫn xóa bình thường.
12. Bảng xếp hạng thi đua 4 tổ được tính công bằng theo công thức **trung bình điểm mỗi học sinh + điểm thưởng tập thể**; tổ không có thành viên luôn xếp sau.
13. Bảng xếp hạng ở Tổng quan và Thi đua theo tổ có bộ chọn tháng để xem lại các tháng đã qua.
14. Cài đặt lớp có thêm ô **Sở Giáo dục và Đào tạo chủ quản**; phần đầu và địa danh ký trên phiếu in tự động lấy từ nội dung này, không còn ghi cứng Hà Nội.
15. Mục **Đổi mật khẩu** hỗ trợ cả GVCN, Ban cán sự và Thành viên lớp. Với tài khoản BCS/Thành viên, hệ thống yêu cầu mật khẩu hiện tại trước khi đổi và chỉ thao tác trên tài khoản đang hoạt động của đúng lớp.

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
- Vào Cài đặt → Danh mục quy chế điểm → Thêm quy định mới; kiểm tra quy định xuất hiện trong danh sách và có thể chọn khi ghi điểm.
- Sau khi thêm quy định mới, xác nhận toàn bộ quy định chuẩn vẫn còn; tải lại trang và kiểm tra danh sách không bị thay thế.
- So sánh hai tổ có sĩ số khác nhau và xác nhận thứ hạng dựa trên cột **TB cá nhân/HS**, không dựa vào tổng điểm thô.
- Chọn một tháng cũ ngay trong bảng xếp hạng tổ và xác nhận số liệu đổi đúng tháng.
- Vào Cài đặt lớp, nhập Sở GDĐT rồi mở phiếu in để kiểm tra phần đầu phiếu và địa danh ngày ký.
- Vào Đổi mật khẩu, chọn thử một tài khoản BCS/Thành viên; xác nhận mật khẩu hiện tại sai bị từ chối và mật khẩu đúng cho phép cập nhật.
- Vào Cài đặt → Thông tin lớp, nhập tổng số tuần và số tuần HKI rồi lưu; mở Rèn luyện cá nhân → Học kỳ & Cả năm để kiểm tra phạm vi tuần và kết quả tổng hợp.
- Mở bản xem trước phiếu học sinh và kiểm tra tên học sinh, tên GVCN.

## Đưa lên GitHub Pages

Không chép tệp `.env.local` lên GitHub. Chỉ cập nhật các tệp mã nguồn trong gói này, commit và push lên nhánh `main`, sau đó chờ GitHub Actions build/deploy thành công.

Không cần xóa dữ liệu điểm cũ trên Firestore. Bản sửa đã tương thích với các giao dịch điểm trừ trước đây.
