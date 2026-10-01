# Hệ thống tạm ứng, hoàn ứng và thanh toán

Web app Next.js cho ba loại phiếu tiền: tạm ứng nội bộ, hoàn ứng nội bộ, thanh toán nhà thầu.

Hướng dẫn: [USERGUIDE_HeThongThanhToan.html](USERGUIDE_HeThongThanhToan.html) · [USERGUIDE.md](USERGUIDE.md).

## Chạy local

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Mở http://localhost:3000 — mật khẩu demo: `demo123`

| Tài khoản | Vai trò |
| --- | --- |
| user | Nhân viên |
| truong_kd | Trưởng bộ phận Kinh doanh |
| truong_kt | Trưởng bộ phận Kỹ thuật |
| ke_toan | Kế toán |
| lanh_dao | Ban lãnh đạo |
| nha_thau | Nhà thầu |
| admin | Quản trị |
