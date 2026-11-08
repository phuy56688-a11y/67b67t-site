================================================================================
HƯỚNG DẪN CÀI ĐẶT VÀ CẤU HÌNH RANK PLUS VÀ RCON CHO SERVER PAPER 1.21.11
Máy Chủ: 67B67T | Admin: master_Sk | Plugin: Skript 2.17.1
================================================================================

1. YÊU CẦU MÁY CHỦ:
-------------------
- Paper version: 1.21.11 (hoặc các bản Paper 1.21.x tương thích).
- Plugin Skript: phiên bản 2.17.1 (hoặc mới hơn).

2. CÁC BƯỚC CÀI ĐẶT FILE SKRIPT:
--------------------------------
Bước 1: Mở thư mục máy chủ Minecraft của bạn.
Bước 2: Tìm theo đường dẫn:
        plugins/Skript/scripts/
Bước 3: Sao chép file `rank.sk` trong thư mục này vào:
        plugins/Skript/scripts/rank.sk
Bước 4: Trong game hoặc trong Console của máy chủ, gõ lệnh để tải script:
        /sk reload rank
        (Nếu tải thành công, console sẽ báo "Successfully reloaded rank.sk").

3. CẤU HÌNH RCON TRÊN PAPER ĐỂ KẾT NỐI VỚI BACKEND NODE.JS:
-----------------------------------------------------------
RCON cho phép Backend tự động gửi lệnh cấp rank vào console khi có thanh toán ZaloPay hợp lệ.

Bước 1: Mở file `server.properties` ở thư mục gốc của server Minecraft.
Bước 2: Tìm và cấu hình các dòng sau:
        enable-rcon=true
        rcon.port=25575
        rcon.password=MẬT_KHẨU_RCON_CỦA_BẠN (tự đặt mật khẩu mạnh, ví dụ: Sk67b67t_Secure_2026)
Bước 3: Khởi động lại máy chủ Minecraft để áp dụng cấu hình RCON.
Bước 4: Mở file `backend/.env` và cập nhật thông số trùng khớp:
        MINECRAFT_RCON_HOST=127.0.0.1  (hoặc IP VPS nếu backend chạy khác máy)
        MINECRAFT_RCON_PORT=25575
        MINECRAFT_RCON_PASSWORD=MẬT_KHẨU_RCON_CỦA_BẠN

4. DANH SÁCH LỆNH CỦA RANK.SK:
------------------------------
A. Lệnh Quản trị (Chỉ dành cho Console và master_Sk):
- `/giverank <player> plus [mã_đơn]`: Cấp Rank Plus cho người chơi.
- `/removerank <player>`: Thu hồi Rank Plus về Rank Thường.
- `/checkrank <player>`: Kiểm tra rank của người chơi bất kỳ.
- `/rankadmin`: Xem danh sách tất cả người chơi đang sở hữu Rank Plus.

B. Lệnh Người chơi:
- `/checkrank`: Tự xem thông tin rank của bản thân.
- `/sethome [tên]`: Đặt điểm Home (Rank Thường: tối đa 1; Rank Plus: tối đa 4).
- `/home [tên]`: Dịch chuyển về điểm Home đã lưu.
- `/delhome [tên]`: Xóa điểm Home đã lưu.
- `/homes`: Xem danh sách điểm Home đang có.
- `/ec 1`: Mở Ender Chest gốc (Tất cả mọi người).
- `/ec 2` đến `/ec 5`: Mở 4 Ender Chest ảo bổ sung (Đặc quyền riêng của Rank Plus).

5. KIỂM TRA THỬ NGHIỆM TRƯỚC KHI BÀN GIAO:
-----------------------------------------
1. Vào game với tài khoản `master_Sk` hoặc gõ trong Server Console:
   `/giverank master_Sk plus DON_HANG_TEST_001`
2. Kiểm tra xem người chơi có nhận được âm thanh, Title và thông báo broadcast toàn server không.
3. Thử lệnh `/sethome h1`, `/sethome h2`, `/sethome h3`, `/sethome h4` để kiểm tra đủ 4 Home.
4. Thử lệnh `/ec 1`, `/ec 2`, `/ec 3`, `/ec 4`, `/ec 5` và bỏ đồ vào rồi đóng lại. Mở lại để kiểm tra đồ còn nguyên vẹn.
5. Kiểm tra tài khoản rank thường khác xem có bị chặn khi gõ `/ec 2` hay không.
================================================================================
