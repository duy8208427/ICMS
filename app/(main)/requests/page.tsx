import { Role, TicketKind, TicketStatus } from "@/lib/enums";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireDbUser, visibleTicketWhere } from "@/lib/helpers";
import { TicketTable } from "@/components/ticket-table";
import { PageHeader } from "@/components/page-header";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; kind?: string; status?: string }>;
}) {
  const user = await requireDbUser();
  if (user.role === Role.NCC) redirect("/ncc");
  const { error, kind, status } = await searchParams;
  const drafts = kind === TicketKind.hoan_ung && status === TicketStatus.draft;
  const tickets = await prisma.ticket.findMany({
    where: drafts
      ? { kind: TicketKind.hoan_ung, status: TicketStatus.draft, createdById: user.id }
      : visibleTicketWhere(user),
    include: { createdBy: true, department: true },
    orderBy: { createdAt: "desc" },
  });
  const seeAll = user.role === Role.KE_TOAN || user.role === Role.LANH_DAO || user.role === Role.ADMIN;

  return (
    <div>
      <PageHeader
        title={drafts ? "Nháp hoàn ứng" : seeAll ? "Tất cả phiếu" : "Phiếu của bạn"}
        description={
          drafts
            ? "Phiếu hoàn ứng bạn đã lưu. Mở phiếu để bổ sung chứng từ và gửi duyệt."
            : user.role === Role.TRUONG_BO_PHAN
              ? "Phiếu nội bộ của bộ phận và đề nghị thanh toán được giao bộ phận bạn theo dõi."
              : seeAll
                ? "Kế toán, ban lãnh đạo và quản trị xem mọi phiếu."
                : "Chỉ các phiếu do bạn tạo."
        }
      />
      {error ? <p className="mb-4 rounded-lg bg-[#f8e8e6] px-3 py-2 text-sm text-[#8a3b32]">{error}</p> : null}
      <TicketTable rows={tickets} />
    </div>
  );
}
