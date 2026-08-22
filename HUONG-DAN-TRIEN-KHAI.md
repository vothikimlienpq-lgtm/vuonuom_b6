# HƯỚNG DẪN TRIỂN KHAI VƯỜN ƯƠM 11B6 LÊN GITHUB PAGES & FIREBASE

Tài liệu này hướng dẫn chi tiết từng bước xuất bản ứng dụng **Vườn Ươm 11B6 (THCS & THPT Lê Lợi - Niên khóa 2026–2027)** lên **GitHub Pages** dưới dạng **Website tĩnh (Static SPA)** hoàn toàn miễn phí, kết nối bảo mật với **Google Firebase (Authentication & Cloud Firestore)**.

---

## TỔNG QUAN KIẾN TRÚC

> **Lưu ý:** Phiên bản này hỗ trợ đăng nhập GVCN và Ban cán sự bằng Firebase Authentication. Cổng phụ huynh tạm thời được ẩn cho đến khi có quy trình cấp tài khoản riêng và quy tắc chỉ đọc theo từng học sinh.

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Cơ sở dữ liệu:** Google Cloud Firestore (Real-time sync đa thiết bị với `onSnapshot`).
- **Xác thực:** Firebase Authentication (Email/Password cho GVCN: `vothikimlien.pq@gmail.com` và Ban Cán Sự/Người dùng được cấp quyền trong `authorizedUsers`).
- **Bảo mật:** Quy tắc ABAC bảo mật cấp cao (`firestore.rules`), tách biệt dữ liệu công khai và dữ liệu liên hệ riêng tư (`privateStudentData`).
- **Lưu trữ tĩnh:** GitHub Pages (Hoàn toàn phía trình duyệt, không cần máy chủ Node.js/Express).

---

## BƯỚC 1: TẠO DỰ ÁN TRÊN FIREBASE CONSOLE

1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Bấm **Add project** (Tạo dự án mới).
3. Đặt tên dự án: `vuon-uom-11b6` (hoặc tên tùy thích) ➔ Bấm **Continue** ➔ Hoàn tất tạo dự án.
4. Tại trang chủ dự án, bấm vào biểu tượng **Web (`</>`)** để thêm Web App:
   - Đặt tên ứng dụng web: `VuonUom11B6-Web`.
   - Bấm **Register app**.
5. Ghi lại các giá trị cấu hình `firebaseConfig` (gồm `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

---

## BƯỚC 2: KÍCH HOẠT FIREBASE AUTHENTICATION

1. Trên menu trái của Firebase Console, chọn **Build** ➔ **Authentication** ➔ Bấm **Get started**.
2. Chọn tab **Sign-in method** ➔ Chọn **Email/Password** ➔ Bật công tắc **Enable** ➔ Bấm **Save**.
3. Chọn tab **Users** ➔ Bấm **Add user**:
   - **Email:** `vothikimlien.pq@gmail.com`
   - **Password:** Nhập mật khẩu an toàn của cô Kim Liên (ít nhất 6 ký tự).
   - Bấm **Add user**.

---

## BƯỚC 3: KÍCH HOẠT CLOUD FIRESTORE & CÀI ĐẶT SECURITY RULES

1. Trên menu trái, chọn **Build** ➔ **Firestore Database** ➔ Bấm **Create database**.
2. Chọn vị trí máy chủ (Location): `asia-southeast1` (Singapore) hoặc vị trí gần nhất.
3. Chọn chế độ bảo mật: Chọn **Start in production mode** ➔ Bấm **Create**.
4. Chuyển sang tab **Rules**, dán toàn bộ nội dung trong tệp `firestore.rules` vào và bấm **Publish**.

---

## BƯỚC 4: THÊM TÊN MIỀN GITHUB PAGES VÀO AUTHORIZED DOMAINS

1. Vào **Authentication** ➔ Chọn tab **Settings** ➔ Chọn **Authorized domains**.
2. Bấm **Add domain**:
   - Nhập tên miền GitHub Pages của bạn (Ví dụ: `yourusername.github.io`).
   - Bấm **Add**.

---

## BƯỚC 5: ĐƯA MÃ NGUỒN LÊN GITHUB & CẤU HÌNH GITHUB PAGES

1. Khởi tạo kho lưu trữ GitHub mới và đẩy mã nguồn lên:
   ```bash
   git init
   git add .
   git commit -m "feat: deploy Vuon Uom 11B6 static SPA to GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/yourusername/vuon-uom-11b6.git
   git push -u origin main
   ```
2. Cấu hình GitHub Secrets cho CI/CD:
   - Vào GitHub Repo ➔ **Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ **New repository secret**:
     - `VITE_FIREBASE_API_KEY`: Giá trị apiKey
     - `VITE_FIREBASE_AUTH_DOMAIN`: Giá trị authDomain
     - `VITE_FIREBASE_PROJECT_ID`: Giá trị projectId
     - `VITE_FIREBASE_STORAGE_BUCKET`: Giá trị storageBucket
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`: Giá trị messagingSenderId
     - `VITE_FIREBASE_APP_ID`: Giá trị appId
3. Kích hoạt GitHub Pages:
   - Vào **Settings** ➔ **Pages**.
   - Tại mục **Build and deployment** ➔ **Source**, chọn **GitHub Actions**.
   - Quy trình `.github/workflows/deploy-pages.yml` sẽ tự động build và xuất bản trang web.

---

## BƯỚC 6: ĐĂNG NHẬP VÀ KHỞI TẠO DỮ LIỆU LỚP

1. Mở trang web GitHub Pages vừa xuất bản.
2. Bấm **Đăng Nhập** ở góc trên màn hình ➔ Đăng nhập bằng Email `vothikimlien.pq@gmail.com` và Mật khẩu đã tạo ở Bước 2.
3. Vào tab **Cài Đặt Lớp** ➔ Chọn mục **Dữ liệu & Khởi tạo**:
   - Bấm **"Khởi tạo dữ liệu lớp 11B6"** để tự động nạp cấu hình lớp học và 30 quy chế điểm chuẩn.
