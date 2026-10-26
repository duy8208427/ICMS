import { Prisma, Ticket } from "@prisma/client";
import { Role, TicketKind, TicketStatus } from "@/lib/enums";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireDbUser() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) redirect("/api/clear-session");
  return user!;
}

export function canAct(role: string, roles: readonly string[]) {
  return role === Role.ADMIN || roles.includes(role);
}

export const INTERNAL_ROLES = [Role.USER, Role.TRUONG_BO_PHAN, Role.KE_TOAN, Role.LANH_DAO] as const;

export const ROLE_LABEL: Record<string, string> = {
  USER: "Nhân viên",
  TRUONG_BO_PHAN: "Trưởng bộ phận",
  KE_TOAN: "Kế toán",
  LANH_DAO: "Ban lãnh đạo",
  NCC: "Nhà thầu",
  ADMIN: "Quản trị",
};

export const KIND_LABEL: Record<string, string> = {
  tam_ung: "Đề nghị tạm ứng",
  hoan_ung: "Đề nghị hoàn ứng",
  thanh_toan: "Đề nghị thanh toán",
};

export function statusLabel(kind: string, status: string) {
  if (kind === TicketKind.thanh_toan && status === TicketStatus.cho_truong_bp) return "Chờ xác nhận khối lượng";
  if (kind === TicketKind.thanh_toan && status === TicketStatus.tra_lai) return "Trả lại nhà thầu";
  if (kind === TicketKind.thanh_toan && status === TicketStatus.cho_chi) return "Chờ chi tiền";
  if (kind === TicketKind.tam_ung && status === TicketStatus.cho_chi) return "Chờ chi tiền";
  if (kind === TicketKind.hoan_ung && status === TicketStatus.cho_chi) return "Chờ thu / chi chênh lệch";
  return STATUS_LABEL[status] ?? status;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  cho_truong_bp: "Chờ trưởng bộ phận",
  cho_ke_toan: "Chờ kế toán",
  cho_lanh_dao: "Chờ lãnh đạo duyệt",
  cho_chi: "Chờ chi / thu tiền",
  da_chi: "Đã chi, chờ hoàn ứng",
  da_hoan_ung: "Đã hoàn ứng",
  da_quyet_toan: "Đã quyết toán",
  da_thanh_toan: "Đã thanh toán",
  tu_choi: "Từ chối",
  tra_lai: "Trả lại",
};

export const STATUS_TONE: Record<string, string> = {
  draft: "bg-cream-deep text-muted",
  cho_truong_bp: "bg-gold-soft text-[#7a5b1e]",
  cho_ke_toan: "bg-[#e7eef2] text-[#35515c]",
  cho_lanh_dao: "bg-[#efe8f4] text-[#5c4570]",
  cho_chi: "bg-forest-soft text-forest",
  da_chi: "bg-[#e8eef8] text-[#31456a]",
  da_hoan_ung: "bg-forest-soft text-forest",
  da_quyet_toan: "bg-forest-soft text-forest",
  da_thanh_toan: "bg-forest-soft text-forest",
  tu_choi: "bg-[#f8e8e6] text-[#8a3b32]",
  tra_lai: "bg-cream-deep text-ink",
};

export const KIND_DOT: Record<string, string> = {
  tam_ung: "bg-forest",
  hoan_ung: "bg-gold",
  thanh_toan: "bg-[#8c5a3c]",
};

export const PURPOSE_LABEL: Record<string, string> = {
  cong_tac: "Công tác",
  tiep_khach: "Tiếp khách",
  su_kien: "Sự kiện",
  khac: "Khác",
};

export const RECEIVE_LABEL: Record<string, string> = {
  tien_mat: "Tiền mặt",
  chuyen_khoan: "Chuyển khoản",
};

const CODE_PREFIX: Record<string, string> = {
  tam_ung: "TU",
  hoan_ung: "HU",
  thanh_toan: "TT",
};

export function formatVnd(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const rounded = Math.round(Number(value));
  const sign = rounded < 0 ? "-" : "";
  const body = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${body} đ`;
}

export function parseMoney(value?: FormDataEntryValue | string | number | null) {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "");
  if (!digits) return 0;
  return Number(digits);
}

export function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDay(value?: Date | string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

export function parseDay(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function dayInput(value?: Date | null) {
  if (!value) return "";
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function sumAmounts(lines: { amount: number }[]) {
  return lines.reduce((total, line) => total + line.amount, 0);
}

export function settlementDiff(spent: number, advanced: number) {
  return Math.round(spent) - Math.round(advanced);
}

type Actor = {
  id: string;
  role: string;
  departmentId?: string | null;
  vendorId?: string | null;
};

export function visibleTicketWhere(user: Actor): Prisma.TicketWhereInput {
  switch (user.role) {
    case Role.LANH_DAO:
    case Role.KE_TOAN:
    case Role.ADMIN:
      return {};
    case Role.USER:
      return { createdById: user.id };
    case Role.TRUONG_BO_PHAN:
      return { departmentId: user.departmentId ?? "__none__" };
    case Role.NCC:
      return {
        vendorId: user.vendorId ?? "__none__",
        kind: TicketKind.thanh_toan,
      };
    default:
      return {};
  }
}

export function inboxWhere(user: Actor): Prisma.TicketWhereInput {
  switch (user.role) {
    case Role.USER:
      return {
        createdById: user.id,
        status: { in: [TicketStatus.draft, TicketStatus.tra_lai, TicketStatus.da_chi] },
      };
    case Role.TRUONG_BO_PHAN:
      return {
        departmentId: user.departmentId ?? "__none__",
        status: TicketStatus.cho_truong_bp,
      };
    case Role.KE_TOAN:
      return { status: { in: [TicketStatus.cho_ke_toan, TicketStatus.cho_chi] } };
    case Role.LANH_DAO:
      return { status: TicketStatus.cho_lanh_dao };
    case Role.NCC:
      return {
        vendorId: user.vendorId ?? "__none__",
        kind: TicketKind.thanh_toan,
      };
    case Role.ADMIN:
      return {
        status: {
          notIn: [
            TicketStatus.da_hoan_ung,
            TicketStatus.da_quyet_toan,
            TicketStatus.da_thanh_toan,
            TicketStatus.tu_choi,
          ],
        },
      };
    default:
      return {};
  }
}

export function overdueWhere(user: Actor): Prisma.TicketWhereInput | null {
  if (user.role !== Role.USER && user.role !== Role.KE_TOAN && user.role !== Role.ADMIN) {
    return null;
  }
  const base: Prisma.TicketWhereInput = {
    kind: TicketKind.tam_ung,
    status: TicketStatus.da_chi,
    settleDueOn: { lt: new Date() },
    settlements: { none: { status: { notIn: [TicketStatus.draft, TicketStatus.tu_choi] } } },
  };
  if (user.role === Role.USER) return { ...base, createdById: user.id };
  return base;
}

export function canSeeTicket(user: Actor, ticket: Ticket) {
  switch (user.role) {
    case Role.LANH_DAO:
    case Role.KE_TOAN:
    case Role.ADMIN:
      return true;
    case Role.USER:
      return ticket.createdById === user.id;
    case Role.TRUONG_BO_PHAN:
      return ticket.departmentId === user.departmentId;
    case Role.NCC:
      return ticket.kind === TicketKind.thanh_toan && ticket.vendorId === user.vendorId;
    default:
      return false;
  }
}

export function statusHint(ticket: { kind: string; status: string }) {
  if (ticket.status === TicketStatus.draft) return "Người tạo gửi phiếu để trưởng bộ phận duyệt.";
  if (ticket.status === TicketStatus.tra_lai) {
    return ticket.kind === TicketKind.thanh_toan
      ? "Nhà thầu bổ sung hồ sơ rồi gửi lại."
      : "Người đề nghị sửa phiếu rồi gửi lại.";
  }
  if (ticket.status === TicketStatus.cho_truong_bp) {
    return ticket.kind === TicketKind.thanh_toan
      ? "Trưởng bộ phận phụ trách xác nhận khối lượng."
      : "Trưởng bộ phận duyệt phiếu.";
  }
  if (ticket.status === TicketStatus.cho_ke_toan) {
    if (ticket.kind === TicketKind.tam_ung) return "Kế toán kiểm tra tạm ứng quá hạn và chứng từ.";
    if (ticket.kind === TicketKind.hoan_ung) return "Kế toán kiểm tra chứng từ chi. Phần vượt mới chuyển lãnh đạo.";
    return "Kế toán kiểm hóa đơn và lũy kế không vượt giá trị hợp đồng.";
  }
  if (ticket.status === TicketStatus.cho_lanh_dao) return "Ban lãnh đạo duyệt.";
  if (ticket.status === TicketStatus.cho_chi) {
    if (ticket.kind === TicketKind.hoan_ung) return "Kế toán thu tiền thừa hoặc chi phần thiếu.";
    return "Kế toán chi tiền và ghi chứng từ.";
  }
  if (ticket.status === TicketStatus.da_chi) return "Đã nhận tiền. Lập hoàn ứng trước hạn.";
  if (ticket.status === TicketStatus.da_hoan_ung) return "Tạm ứng đã được quyết toán.";
  if (ticket.status === TicketStatus.da_quyet_toan) return "Hoàn ứng đã quyết toán.";
  if (ticket.status === TicketStatus.da_thanh_toan) return "Đã thanh toán cho nhà thầu.";
  return "Phiếu đã từ chối.";
}

export async function nextTicketCode(kind: string) {
  const year = new Date().getFullYear();
  const prefix = `${CODE_PREFIX[kind] ?? "PH"}-${year}-`;
  const count = await prisma.ticket.count({
    where: { code: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export const ticketInclude = {
  createdBy: { include: { department: true } },
  department: true,
  vendor: true,
  paidBy: true,
  lines: true,
  attachments: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" as const } },
  approvals: { include: { user: true }, orderBy: { createdAt: "asc" as const } },
  timeline: { include: { user: true }, orderBy: { createdAt: "asc" as const } },
  advance: true,
  settlements: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.TicketInclude;

export function committedPaymentStatuses(): string[] {
  return [
    TicketStatus.cho_truong_bp,
    TicketStatus.cho_ke_toan,
    TicketStatus.cho_lanh_dao,
    TicketStatus.cho_chi,
    TicketStatus.da_thanh_toan,
  ];
}
