import { Role, TicketKind, TicketStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAct, requireDbUser } from "@/lib/helpers";
import { AdvanceForm } from "@/components/advance-form";
import { PageHeader } from "@/components/page-header";
import { SettlementForm } from "@/components/settlement-form";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; error?: string }>;
}) {
  const user = await requireDbUser();
  if (!canAct(user.role, [Role.USER])) redirect("/dashboard");
  const { kind, error } = await searchParams;
  const settlement = kind === "hoan_ung";
  const departments = user.role === Role.ADMIN ? await prisma.department.findMany({ orderBy: { name: "asc" } }) : [];

  const advances = settlement
    ? await prisma.ticket.findMany({
        where: {
          kind: TicketKind.tam_ung,
          status: TicketStatus.da_chi,
          ...(user.role === Role.ADMIN ? {} : { createdById: user.id }),
          settlements: { none: { status: { not: TicketStatus.tu_choi } } },
        },
        orderBy: { paidAt: "desc" },
      })
    : [];

  const openAdvances = settlement
    ? []
    : await prisma.ticket.findMany({
        where: {
          kind: TicketKind.tam_ung,
          status: TicketStatus.da_chi,
          createdById: user.id,
        },
      });
  const now = new Date();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={settlement ? "Đề nghị hoàn ứng" : "Đề nghị tạm ứng"}
        description={
          settlement
            ? "Chọn một phiếu tạm ứng đã chi của bạn, kê chi phí thực tế. Hệ thống tính phần thừa hoặc thiếu."
            : "Tiền nội bộ: công tác, tiếp khách, sự kiện. Không dùng cho mua sắm thiết bị."
        }
      />
      {error ? <p className="mb-4 rounded-lg bg-[#f8e8e6] px-3 py-2 text-sm text-[#8a3b32]">{error}</p> : null}
      {settlement ? (
        <SettlementForm advances={advances} />
      ) : (
        <AdvanceForm
          departments={departments}
          role={user.role}
          openAdvances={openAdvances.map((ticket) => ({
            code: ticket.code,
            title: ticket.title,
            settleDueOn: ticket.settleDueOn,
            overdue: Boolean(ticket.settleDueOn && ticket.settleDueOn < now),
          }))}
        />
      )}
    </div>
  );
}
