import { Role, TicketKind } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireDbUser, visibleTicketWhere } from "@/lib/helpers";
import { PageHeader } from "@/components/page-header";
import { PaymentForm } from "@/components/payment-form";
import { TicketTable } from "@/components/ticket-table";

export default async function ContractorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireDbUser();
  if (user.role !== Role.NCC && user.role !== Role.ADMIN) redirect("/dashboard");
  const { error } = await searchParams;
  const [tickets, departments, vendors] = await Promise.all([
    prisma.ticket.findMany({
      where: user.role === Role.ADMIN ? { kind: TicketKind.thanh_toan } : visibleTicketWhere(user),
      include: { createdBy: true, department: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cổng nhà thầu"
        description="Gửi đề nghị thanh toán theo hợp đồng đã ký ngoài hệ thống. Không tạo tạm ứng tại đây."
      />
      {error ? <p className="rounded-lg bg-[#f8e8e6] px-3 py-2 text-sm text-[#8a3b32]">{error}</p> : null}
      <PaymentForm departments={departments} vendors={vendors} role={user.role} />
      <TicketTable rows={tickets} />
    </div>
  );
}
