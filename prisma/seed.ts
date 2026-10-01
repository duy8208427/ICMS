import { PrismaClient, Role, TicketKind, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function day(offset: number) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

async function main() {
  await prisma.timelineEvent.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.expenseLine.deleteMany();
  await prisma.ticket.updateMany({ data: { advanceId: null, paidById: null } });
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = await bcrypt.hash("demo123", 10);
  const [kinhDoanh, kyThuat] = await Promise.all([
    prisma.department.create({ data: { name: "Kinh doanh" } }),
    prisma.department.create({ data: { name: "Kỹ thuật" } }),
    prisma.department.create({ data: { name: "Hành chính" } }),
  ]);

  const vendor = await prisma.vendor.create({
    data: {
      name: "Công ty TNHH ABC Technology",
      taxCode: "0312345678",
      address: "12 Nguyễn Huệ, Quận 1, TP.HCM",
    },
  });

  const [nhanVien, truongKd, truongKt, keToan, lanhDao, nhaThau] = await Promise.all([
    prisma.user.create({
      data: {
        username: "user",
        passwordHash,
        name: "Nguyễn Văn An",
        email: "an.nguyen@congty.vn",
        role: Role.USER,
        departmentId: kinhDoanh.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "truong_kd",
        passwordHash,
        name: "Lê Thị Mai",
        email: "mai.le@congty.vn",
        role: Role.TRUONG_BO_PHAN,
        departmentId: kinhDoanh.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "truong_kt",
        passwordHash,
        name: "Phạm Quốc Dũng",
        email: "dung.pham@congty.vn",
        role: Role.TRUONG_BO_PHAN,
        departmentId: kyThuat.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "ke_toan",
        passwordHash,
        name: "Trần Thị Bình",
        email: "binh.tran@congty.vn",
        role: Role.KE_TOAN,
      },
    }),
    prisma.user.create({
      data: {
        username: "lanh_dao",
        passwordHash,
        name: "Nguyễn Đức Thành",
        email: "thanh.nguyen@congty.vn",
        role: Role.LANH_DAO,
      },
    }),
    prisma.user.create({
      data: {
        username: "nha_thau",
        passwordHash,
        name: "Nguyễn Thị Hoa",
        email: "hoa@abc-tech.vn",
        role: Role.NCC,
        vendorId: vendor.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "admin",
        passwordHash,
        name: "Quản trị hệ thống",
        email: "admin@congty.vn",
        role: Role.ADMIN,
      },
    }),
  ]);

  const choDuyet = await prisma.ticket.create({
    data: {
      code: "TU-2026-0001",
      kind: TicketKind.tam_ung,
      status: TicketStatus.cho_truong_bp,
      title: "Công tác Đà Nẵng",
      content: "Đi gặp khách hàng 3 ngày, gồm vé máy bay, khách sạn và công tác phí.",
      amount: 8000000,
      purpose: "cong_tac",
      neededOn: day(3),
      settleDueOn: day(20),
      receiveMethod: "chuyen_khoan",
      bankAccount: "VCB 0123456789 - Nguyễn Văn An",
      departmentId: kinhDoanh.id,
      createdById: nhanVien.id,
    },
  });

  const quaHan = await prisma.ticket.create({
    data: {
      code: "TU-2026-0002",
      kind: TicketKind.tam_ung,
      status: TicketStatus.da_chi,
      title: "Tiếp khách cuối tháng 8",
      content: "Ăn tối với đoàn khách miền Trung.",
      amount: 3000000,
      purpose: "tiep_khach",
      neededOn: day(-25),
      settleDueOn: day(-2),
      receiveMethod: "tien_mat",
      paidAt: day(-20),
      paymentRef: "PC-0821",
      paidById: keToan.id,
      departmentId: kinhDoanh.id,
      createdById: nhanVien.id,
    },
  });

  const daChi = await prisma.ticket.create({
    data: {
      code: "TU-2026-0003",
      kind: TicketKind.tam_ung,
      status: TicketStatus.da_chi,
      title: "Sự kiện ra mắt sản phẩm",
      content: "Tạm ứng chi phí hội trường và tiếp khách tại sự kiện.",
      amount: 15000000,
      purpose: "su_kien",
      neededOn: day(-10),
      settleDueOn: day(12),
      receiveMethod: "chuyen_khoan",
      bankAccount: "VCB 0123456789 - Nguyễn Văn An",
      paidAt: day(-8),
      paymentRef: "UNC-0902",
      paidById: keToan.id,
      departmentId: kinhDoanh.id,
      createdById: nhanVien.id,
    },
  });

  const choLanhDao = await prisma.ticket.create({
    data: {
      code: "TU-2026-0004",
      kind: TicketKind.tam_ung,
      status: TicketStatus.cho_lanh_dao,
      title: "Công tác Hà Nội",
      content: "Hai ngày làm việc với đối tác phân phối.",
      amount: 6000000,
      purpose: "cong_tac",
      neededOn: day(5),
      settleDueOn: day(25),
      receiveMethod: "chuyen_khoan",
      bankAccount: "VCB 0123456789 - Nguyễn Văn An",
      departmentId: kinhDoanh.id,
      createdById: nhanVien.id,
    },
  });

  const choChi = await prisma.ticket.create({
    data: {
      code: "TU-2026-0005",
      kind: TicketKind.tam_ung,
      status: TicketStatus.cho_chi,
      title: "Tiếp khách tuần này",
      content: "Bữa trưa làm việc với khách mới.",
      amount: 2000000,
      purpose: "tiep_khach",
      neededOn: day(1),
      settleDueOn: day(15),
      receiveMethod: "tien_mat",
      departmentId: kinhDoanh.id,
      createdById: nhanVien.id,
    },
  });

  const hoanUng = await prisma.ticket.create({
    data: {
      code: "HU-2026-0001",
      kind: TicketKind.hoan_ung,
      status: TicketStatus.cho_ke_toan,
      title: "Hoàn ứng sự kiện ra mắt",
      content: "Chi vượt tạm ứng vì phát sinh backdrop.",
      amount: 17500000,
      advanceId: daChi.id,
      departmentId: kinhDoanh.id,
      createdById: nhanVien.id,
      lines: {
        create: [
          { content: "Thuê hội trường", spentOn: day(-9), amount: 12000000, invoiceNote: "HĐ 0911" },
          { content: "Backdrop và in ấn", spentOn: day(-8), amount: 5500000, invoiceNote: "HĐ 0914" },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "TT-2026-0001",
      kind: TicketKind.thanh_toan,
      status: TicketStatus.da_thanh_toan,
      title: "Thanh toán đợt 1 hợp đồng camera",
      content: "Đợt 1 theo biên bản nghiệm thu phần móng và đi dây.",
      amount: 200000000,
      contractNumber: "HD-2026-09",
      contractValue: 500000000,
      installment: 1,
      paidAt: day(-15),
      paymentRef: "UNC-0888",
      paidById: keToan.id,
      departmentId: kyThuat.id,
      vendorId: vendor.id,
      createdById: nhaThau.id,
    },
  });

  const choXacNhan = await prisma.ticket.create({
    data: {
      code: "TT-2026-0002",
      kind: TicketKind.thanh_toan,
      status: TicketStatus.cho_truong_bp,
      title: "Thanh toán đợt 2 hợp đồng camera",
      content: "Đợt 2 sau khi lắp đặt xong tầng 1 và tầng 2.",
      amount: 150000000,
      contractNumber: "HD-2026-09",
      contractValue: 500000000,
      installment: 2,
      departmentId: kyThuat.id,
      vendorId: vendor.id,
      createdById: nhaThau.id,
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        ticketId: choDuyet.id,
        userId: nhanVien.id,
        action: "submit",
        message: "Gửi đề nghị tạm ứng, chờ trưởng bộ phận duyệt",
      },
      {
        ticketId: quaHan.id,
        userId: keToan.id,
        action: "pay",
        message: "Đã chi tạm ứng, chứng từ PC-0821. Hạn hoàn ứng đã qua.",
      },
      {
        ticketId: hoanUng.id,
        userId: truongKd.id,
        action: "approve",
        message: "Trưởng bộ phận duyệt, chuyển kế toán kiểm tra chứng từ",
      },
      {
        ticketId: choLanhDao.id,
        userId: keToan.id,
        action: "approve",
        message: "Kế toán đồng ý, chuyển lãnh đạo duyệt",
      },
      {
        ticketId: choChi.id,
        userId: lanhDao.id,
        action: "approve",
        message: "Lãnh đạo duyệt, chuyển kế toán chi tiền",
      },
      {
        ticketId: choXacNhan.id,
        userId: nhaThau.id,
        action: "submit",
        message: "Gửi đề nghị thanh toán đợt 2, chờ bộ phận kỹ thuật xác nhận",
      },
    ],
  });

  void truongKt;
  console.log("Seed xong. Mật khẩu demo: demo123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
