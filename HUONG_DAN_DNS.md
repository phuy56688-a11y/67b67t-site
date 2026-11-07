# BẢNG HƯỚNG DẪN CẤU HÌNH DNS CHO TÊN MIỀN 67B67T.SITE
*Áp dụng cho Nhà cung cấp tên miền Pika & Cloudflare | Bảo toàn 100% dữ liệu máy chủ Minecraft*

---

## ⚠️ CẢNH BÁO QUAN TRỌNG VỀ MÁY CHỦ MINECRAFT
Hệ thống phát hiện tên miền **67b67t.site** hiện đang hoạt động với máy chủ Minecraft:
- **Bản ghi SRV hiện có:** `_minecraft._tcp.67b67t.site`
- **Cổng kết nối (Port):** `25690`
- **Máy chủ đích (Target):** `node1.gachcloud.net` (IP: `45.117.165.195`)

> [!CAUTION]
> **TUYỆT ĐỐI KHÔNG XÓA HOẶC SỬA BẢN GHI SRV `_minecraft._tcp`!**
> Bản ghi SRV này cho phép game thủ vào Minecraft gõ `67b67t.site` và hệ thống tự động chuyển tiếp tới cổng `25690` của máy chủ.

---

## PHẦN 1: KIỂM TRA NƠI QUẢN LÝ DNS
Hiện tại tên miền **67b67t.site** đang dùng NameServer:
- `donald.ns.cloudflare.com`
- `kia.ns.cloudflare.com`

👉 **Có 2 trường hợp quản lý:**
1. **Trường hợp A (Khuyến nghị nếu bạn đang dùng Cloudflare):** Bạn đăng nhập vào tài khoản **Cloudflare** quản lý tên miền `67b67t.site` và cập nhật các bản ghi DNS tại mục **DNS -> Records**.
2. **Trường hợp B (Nếu bạn quản lý tại Nhà cung cấp Pika):** Bạn đăng nhập vào trang quản trị dịch vụ của **Pika** -> Chọn mục **Quản lý tên miền / Quản lý DNS** của `67b67t.site`.

---

## PHẦN 2: CÁC BẢN GHI CẦN CẤU HÌNH (BẢNG SAO CHÉP NHANH)

### 1. Bản ghi cho Website (GitHub Pages)
Cần thay thế bản ghi `A` cũ của `@` (hoặc `67b67t.site`) bằng **4 địa chỉ IP chính thức của GitHub Pages**:

| Loại (Type) | Tên / Host | Giá trị / Đích (Value / Content) | TTL | Mục đích |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `185.199.108.153` | Auto / 3600 | GitHub Pages IP 1 |
| **A** | `@` | `185.199.109.153` | Auto / 3600 | GitHub Pages IP 2 |
| **A** | `@` | `185.199.110.153` | Auto / 3600 | GitHub Pages IP 3 |
| **A** | `@` | `185.199.111.153` | Auto / 3600 | GitHub Pages IP 4 |
| **CNAME** | `www` | `<tên-tài-khoản-github>.github.io` *(hoặc `67b67t.site`)* | Auto / 3600 | Chuyển hướng www |

*(Lưu ý: Nếu dùng Cloudflare, hãy chuyển biểu tượng đám mây sang **DNS Only** màu xám đối với các bản ghi này để GitHub Pages dễ dàng xác minh và cấp chứng chỉ SSL Let's Encrypt).*

---

### 2. Bản ghi dành riêng cho Minecraft (GIỮ NGUYÊN & THÊM MỚI ĐỂ DỰ PHÒNG)

#### a) Bản ghi SRV hiện tại (BẮT BUỘC GIỮ NGUYÊN):
| Loại (Type) | Tên (Name) | Service | Protocol | Priority | Weight | Port | Target |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SRV** | `_minecraft._tcp` | `_minecraft` | `tcp` | `0` | `5` | `25690` | `node1.gachcloud.net` |

#### b) Bản ghi phụ chuyên biệt cho Minecraft (Khuyến nghị thêm mới):
Tạo thêm một subdomain riêng để game thủ có thể vào trực tiếp mà không bao giờ bị trùng với web:
| Loại (Type) | Tên / Host | Giá trị (Value / Target) | TTL | Mục đích |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `play` | `node1.gachcloud.net` | Auto / 3600 | Địa chỉ chơi game phụ: `play.67b67t.site:25690` |
| **CNAME** | `mc` | `node1.gachcloud.net` | Auto / 3600 | Địa chỉ chơi game phụ: `mc.67b67t.site:25690` |

---

## PHẦN 3: HƯỚNG DẪN KẾT NỐI VỚI REPOSITORY GITHUB

### Bước 1: Tạo Repository trên GitHub
1. Đăng nhập vào [GitHub](https://github.com).
2. Tạo một repository mới đặt tên là `67b67t-site` (chọn chế độ **Public**).
3. Đừng tạo thêm file README hoặc .gitignore trên web (vì source code máy tính đã có đầy đủ).

### Bước 2: Đẩy (Push) Source Code từ máy tính lên GitHub
Mở PowerShell trên máy tính và chạy lần lượt các lệnh sau:
```powershell
cd "C:\Users\OWNER\.gemini\antigravity\scratch\67b67t-site"
git remote add origin https://github.com/<tên-tài-khoản-của-bạn>/67b67t-site.git
git branch -M main
git push -u origin main
```
*(Cửa sổ trình duyệt sẽ hiện lên để bạn đăng nhập tài khoản GitHub một cách bảo mật).*

### Bước 3: Cấu hình GitHub Pages & Custom Domain
1. Trên trang Repository GitHub, vào mục **Settings** -> chọn tab **Pages** (ở menu bên trái).
2. Tại mục **Build and deployment**:
   - Source: Chọn **Deploy from a branch**.
   - Branch: Chọn **main** / thư mục **/ (root)** -> bấm **Save**.
3. Tại mục **Custom domain**:
   - Nhập: `67b67t.site`
   - Bấm **Save**.
   - GitHub sẽ tự động kiểm tra bản ghi DNS và tiến hành cấp chứng chỉ SSL/TLS miễn phí.

---

## PHẦN 4: HƯỚNG DẪN BẬT HTTPS (ENFORCE HTTPS)
1. Sau khi DNS cập nhật và GitHub hoàn tất xác thực chứng chỉ SSL (thường mất từ 5 đến 30 phút).
2. Tại trang **Settings -> Pages**, bạn sẽ thấy thông báo:
   > *"DNS check successful"* và *"Certificate is issued"*.
3. Hãy tích chọn vào ô: **[x] Enforce HTTPS**.
4. Lúc này, website `https://67b67t.site` sẽ chính thức có chứng chỉ bảo mật SSL xanh và truy cập an toàn trên toàn cầu!
