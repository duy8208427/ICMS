import Link from "next/link";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { formatVnd, inboxWhere, overdueWhere, requireDbUser } from "@/lib/helpers";
import { PageHeader } from "@/components/page-header";
import { TicketTable } from "@/components/ticket-table";
import { cardClass } from "@/components/ui";

export default async function DashboardPage() {
  const user = await requireDbUser();
  const [tickets, overdue] = await Promise.all([
    prisma.ticket.findMany({
      where: inboxWhere(user),
      include: { createdBy: true, department: true },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    overdueWhere(user)
      ? prisma.ticket.findMany({
          where: overdueWhere(user)!,
          orderBy: { settleDueOn: "asc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);
  const waitingAmount = tickets.reduce((total, ticket) => total + ticket.amount, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Hôm nay"
        title="Hộp việc"
        description={
          user.role === Role.USER
            ? "Phiếu nháp, tạm ứng đã chi cần hoàn, và các phiếu đang chờ bạn."
            : user.role === Role.TRUONG_BO_PHAN
              ? "Phiếu của bộ phận đang chờ bạn duyệt hoặc xác nhận khối lượng."
              : user.role === Role.KE_TOAN
                ? "Phiếu chờ kiểm tra chứng từ hoặc chờ chi / thu tiền."
                : user.role === Role.LANH_DAO
                  ? "Phiếu chờ bạn duyệt."
                  : user.role === Role.NCC
                    ? "Đề nghị thanh toán của nhà thầu."
                    : "Mọi phiếu chưa kết thúc. Quản trị thao tác được thay các vai trò."
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Đang chờ" value={String(tickets.length)} />
        <Stat label="Tổng tiền đang chờ" value={formatVnd(waitingAmount)} />
        <Stat label="Quá hạn" value={String(overdue.length)} warn={overdue.length > 0} />
      </div>
      {overdue.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-[#e4d2a8] bg-gold-soft p-4 text-sm text-[#5c4314]">
          <p className="font-medium">Tạm ứng quá hạn chưa có hoàn ứng</p>
          <ul className="mt-2 space-y-1">
            {overdue.map((ticket) => (
              <li key={ticket.id}>
                <Link className="font-medium text-forest" href={`/requests/${ticket.id}`}>
                  {ticket.code}
                </Link>{" "}
                {ticket.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <TicketTable rows={tickets} />
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`${cardClass} px-5 py-4`}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`font-display mt-1 text-3xl font-semibold tabular-nums ${warn ? "text-gold" : "text-ink"}`}>{value}</p>
    </div>
  );
}
