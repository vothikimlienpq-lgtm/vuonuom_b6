# Hướng dẫn cập nhật bản sửa lỗi

## Các nội dung đã sửa

1. Điểm trừ luôn được tính là số âm; dữ liệu cũ lưu điểm trừ dưới dạng số dương cũng được đọc và tổng hợp lại đúng.
2. Tuần đang chọn được giữ nguyên sau khi lưu, xóa hoặc đồng bộ dữ liệu.
3. Có thể ghi điểm cho một học sinh, một tổ hoặc cả lớp; trước khi lưu có thể bỏ chọn từng học sinh.
4. Mục thứ hạng trường có nút **Cập nhật thứ hạng**, chọn tuần, nhập điểm bị trừ và lý do.
5. Báo bài và thời khóa biểu lưu đầy đủ tháng/tuần, hiển thị ngay sau khi ghi, đồng thời có nút sửa và xóa tại từng tiết.
6. Thanh điều khiển xem trước bản in không còn che tên học sinh; tên GVCN và năm ký được lấy từ cấu hình lớp.
7. Mục **Thứ hạng trường & khối** hiển thị nút chọn đủ toàn bộ tuần của năm học (theo tổng số tuần đã cài đặt), kèm tháng, khoảng ngày và trạng thái đã/chưa cập nhật; bấm tuần nào sẽ hiển thị đúng dữ liệu tuần đó.
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
14. Cài đặt lớp có thêm ô **Sở Giáo dục và Đào tạo chủ quản** và **Tỉnh/Thành phố**; phần đầu phiếu in lấy tên Sở, còn địa danh ký lấy đúng tỉnh/thành phố giáo viên đã nhập, không còn ghi cứng Hà Nội.
15. Mục **Đổi mật khẩu** hỗ trợ cả GVCN, Ban cán sự và Thành viên lớp. Với tài khoản BCS/Thành viên, hệ thống yêu cầu mật khẩu hiện tại trước khi đổi và chỉ thao tác trên tài khoản đang hoạt động của đúng lớp.
16. Ngày, tháng, năm trên phiếu in tự động cập nhật theo đúng ngày giáo viên bấm **In ngay**.
17. Cấu hình thời khóa biểu có thêm lựa chọn **10 tiết (Sáng 1–5 + Chiều 1–5)**. Hệ thống phân biệt tiết sáng/chiều bằng buổi học nên không ghi đè hai tiết có cùng số; dữ liệu kiểu cũ 6–10 vẫn được đọc tương thích.
18. Lịch sử giao dịch điểm được chia thành từng **Thứ 2 → Thứ 7**, hiển thị ngày thực tế, số giao dịch và trạng thái khóa của từng ngày.
19. Khi GVCN khóa một ngày hoặc một tuần, các giao dịch thuộc phạm vi đó không thể ghi thêm, sửa hoặc xóa; cần mở khóa trước khi thay đổi lịch sử.
20. Hai quy định **Không thuộc bài hoặc học đối phó** và **Không chuẩn bị bài, thiếu bài tập hoặc đồ dùng** cho phép tự nhập tên môn học, không còn bắt buộc chọn từ danh sách môn cố định.
21. Phiếu theo dõi có bộ chọn phạm vi **Tuần / Tháng / Học kỳ / Cả năm học**:
    - Khi in theo tuần, có nút chọn đủ toàn bộ tuần đã cài đặt và ghi chính xác ngày bắt đầu–kết thúc của tuần.
    - Khi in theo tháng, học kỳ hoặc năm học, các giao dịch được gộp theo nội dung, số lượt và tổng điểm để trình bày gọn trên một mặt A4.
    - Nhận xét GVCN tự tạo theo điểm tích cực, lỗi học tập, lỗi nề nếp và kết quả rèn luyện thực tế của từng học sinh.
22. Ba mục **Vi phạm rèn luyện**, **Theo dõi học tập** và **Rèn luyện cá nhân** có bộ chọn tháng ngay trong màn hình để xem lại dữ liệu các tháng trước.
23. Mục **Theo dõi học tập** đã bỏ bộ lọc chọn môn; hệ thống luôn tổng hợp đầy đủ dữ liệu học tập của tất cả môn trong tháng đang xem.

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
- Vào Cài đặt lớp, nhập Sở GDĐT và Tỉnh/Thành phố; mở phiếu in để kiểm tra phần đầu phiếu, địa danh và ngày ký hiện tại.
- Vào Đổi mật khẩu, chọn thử một tài khoản BCS/Thành viên; xác nhận mật khẩu hiện tại sai bị từ chối và mật khẩu đúng cho phép cập nhật.
- Chọn cấu hình **10 tiết (Sáng 1–5 + Chiều 1–5)**, ghi thử Tiết 1 buổi sáng và Tiết 1 buổi chiều trong cùng ngày; xác nhận hai tiết được lưu và hiển thị độc lập.
- Vào Cài đặt → Thông tin lớp, nhập tổng số tuần và số tuần HKI rồi lưu; mở Rèn luyện cá nhân → Học kỳ & Cả năm để kiểm tra phạm vi tuần và kết quả tổng hợp.
- Mở bản xem trước phiếu học sinh và kiểm tra tên học sinh, tên GVCN.
- Khóa một ngày đã có điểm; kiểm tra nhóm lịch sử của ngày đó hiện **Đã khóa điểm** và không còn nút xóa. Mở khóa rồi kiểm tra nút xóa xuất hiện lại.
- Chọn hai quy định không thuộc bài/thiếu chuẩn bị, tự gõ tên môn rồi lưu và kiểm tra tên môn trong lịch sử.
- Mở phiếu in, chọn một tuần bất kỳ và kiểm tra khoảng ngày của tuần; tiếp tục chọn Tháng, Học kỳ và Cả năm để kiểm tra bảng tổng hợp rút gọn vừa một mặt A4.
- Kiểm tra phần nhận xét GVCN thay đổi phù hợp giữa học sinh không vi phạm, học sinh thiếu bài và học sinh có lỗi nề nếp.
- Đổi tháng ngay tại Vi phạm rèn luyện, Theo dõi học tập và Rèn luyện cá nhân; kiểm tra tiêu đề và số liệu cùng đổi theo tháng.

## Đưa lên GitHub Pages

Không chép tệp `.env.local` lên GitHub. Chỉ cập nhật các tệp mã nguồn trong gói này, commit và push lên nhánh `main`, sau đó chờ GitHub Actions build/deploy thành công.

Không cần xóa dữ liệu điểm cũ trên Firestore. Bản sửa đã tương thích với các giao dịch điểm trừ trước đây.
