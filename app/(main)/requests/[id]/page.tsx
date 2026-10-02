import Link from "next/link";
import { notFound } from "next/navigation";
import { Role, TicketKind, TicketStatus } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { decideAction, payAction } from "@/app/actions/tickets";
import { AdvanceForm } from "@/components/advance-form";
import { PaymentForm } from "@/components/payment-form";
import { SettlementForm } from "@/components/settlement-form";
import { ProgressTrack } from "@/components/progress-track";
import { StatusBadge } from "@/components/status-badge";
import { btnGhost, btnPrimary, cardClass, fieldClass } from "@/components/ui";
import {
  KIND_LABEL,
  PURPOSE_LABEL,
  RECEIVE_LABEL,
  canAct,
  canSeeTicket,
  committedPaymentStatuses,
  formatDate,
  formatDay,
  formatVnd,
  requireDbUser,
  settlementDiff,
  statusHint,
  ticketInclude,
} from "@/lib/helpers";

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await requireDbUser();
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
  if (!ticket || !canSeeTicket(user, ticket)) notFound();

  const editable =
    (ticket.status === TicketStatus.draft || ticket.status === TicketStatus.tra_lai) &&
    (user.role === Role.ADMIN ||
      (ticket.kind !== TicketKind.thanh_toan && ticket.createdById === user.id) ||
      (ticket.kind === TicketKind.thanh_toan && user.role === Role.NCC && ticket.vendorId === user.vendorId));

  const waiting =
    ticket.status === TicketStatus.cho_truong_bp ||
    ticket.status === TicketStatus.cho_ke_toan ||
    ticket.status === TicketStatus.cho_lanh_dao;
  const canDecide =
    waiting &&
    ((ticket.status === TicketStatus.cho_truong_bp &&
      canAct(user.role, [Role.TRUONG_BO_PHAN]) &&
      (user.role !== Role.TRUONG_BO_PHAN || user.departmentId === ticket.departmentId)) ||
      (ticket.status === TicketStatus.cho_ke_toan && canAct(user.role, [Role.KE_TOAN])) ||
      (ticket.status === TicketStatus.cho_lanh_dao && canAct(user.role, [Role.LANH_DAO])));
  const canPay = ticket.status === TicketStatus.cho_chi && canAct(user.role, [Role.KE_TOAN]);

  const openAdvances =
    ticket.kind === TicketKind.tam_ung && ticket.status === TicketStatus.cho_ke_toan
      ? await prisma.ticket.findMany({
          where: {
            kind: TicketKind.tam_ung,
            status: TicketStatus.da_chi,
            createdById: ticket.createdById,
            id: { not: ticket.id },
          },
        })
      : [];

  const siblings =
    ticket.kind === TicketKind.thanh_toan && ticket.contractNumber && ticket.vendorId
      ? await prisma.ticket.findMany({
          where: {
            kind: TicketKind.thanh_toan,
            vendorId: ticket.vendorId,
            contractNumber: ticket.contractNumber,
            id: { not: ticket.id },
            status: { in: committedPaymentStatuses() },
          },
          orderBy: { installment: "asc" },
        })
      : [];
  const committed = siblings.reduce((total, item) => total + item.amount, 0);
  const diff =
    ticket.kind === TicketKind.hoan_ung && ticket.advance
      ? settlementDiff(ticket.amount, ticket.advance.amount)
      : null;

  const departments = editable ? await prisma.department.findMany({ orderBy: { name: "asc" } }) : [];
  const vendors = editable && user.role === Role.ADMIN ? await prisma.vendor.findMany({ orderBy: { name: "asc" } }) : [];
  const myAdvances =
    editable && ticket.kind === TicketKind.hoan_ung
      ? await prisma.ticket.findMany({
          where: {
            kind: TicketKind.tam_ung,
            status: TicketStatus.da_chi,
            OR: [{ id: ticket.advanceId ?? "__none__" }, { createdById: ticket.createdById }],
            settlements: { none: { status: { notIn: [TicketStatus.tu_choi, TicketStatus.draft] }, id: { not: ticket.id } } },
          },
        })
      : [];

  const approveLabel =
    ticket.kind === TicketKind.thanh_toan && ticket.status === TicketStatus.cho_truong_bp
      ? "Xác nhận khối lượng"
      : ticket.kind === TicketKind.hoan_ung && ticket.status === TicketStatus.cho_ke_toan && diff != null && diff <= 0
        ? diff === 0
          ? "Quyết toán"
          : "Chuyển thu tiền thừa"
        : "Đồng ý";

  const skippedLeader =
    ticket.kind === TicketKind.hoan_ung &&
    ticket.status !== TicketStatus.cho_lanh_dao &&
    !ticket.approvals.some((item) => item.stage === TicketStatus.cho_lanh_dao) &&
    (ticket.status === TicketStatus.cho_chi || ticket.status === TicketStatus.da_quyet_toan);

  return (
    <div className="space-y-6">
      <div className={`${cardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-wide text-gold">{ticket.code}</p>
            <h1 className="font-display mt-1 text-3xl font-semibold text-ink">{ticket.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {KIND_LABEL[ticket.kind]} · {ticket.createdBy.name}
              {ticket.department ? ` · ${ticket.department.name}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-semibold tabular-nums text-ink">{formatVnd(ticket.amount)}</p>
            <div className="mt-2">
              <StatusBadge status={ticket.status} kind={ticket.kind} />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <ProgressTrack kind={ticket.kind} status={ticket.status} skippedLeader={skippedLeader} />
        </div>
      </div>
      {error ? <p className="rounded-lg bg-[#f8e8e6] px-3 py-2 text-sm text-[#8a3b32]">{error}</p> : null}
      <p className="rounded-xl bg-forest-soft px-4 py-3 text-sm text-forest">{statusHint(ticket)}</p>

      {canDecide ? (
        <form action={decideAction} className={`${cardClass} space-y-3 border-forest/30 p-6`}>
          <h2 className="font-display text-xl font-semibold">Việc của bạn</h2>
          <input type="hidden" name="id" value={ticket.id} />
          <label className="block text-sm">
            <span className="font-medium">Ý kiến</span>
            <textarea name="comment" rows={2} className={fieldClass} placeholder="Bắt buộc khi trả lại hoặc từ chối" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button name="decision" value="approve" className={btnPrimary}>
              {approveLabel}
            </button>
            <button name="decision" value="return" className={btnGhost}>
              Trả lại để sửa
            </button>
            <button name="decision" value="reject" className="rounded-lg border border-[#e7c4bf] px-4 py-2 text-sm text-[#8a3b32]">
              Từ chối
            </button>
          </div>
        </form>
      ) : null}

      {canPay ? (
        <form action={payAction} className={`${cardClass} space-y-3 border-forest/30 p-6`}>
          <h2 className="font-display text-xl font-semibold">
            {ticket.kind === TicketKind.hoan_ung
              ? diff != null && diff < 0
                ? "Xác nhận đã thu tiền thừa"
                : "Chi phần thiếu"
              : "Ghi nhận chi tiền"}
          </h2>
          <input type="hidden" name="id" value={ticket.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">Ngày</span>
              <input name="paidAt" type="date" required className={fieldClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">{ticket.kind === TicketKind.thanh_toan ? "Số ủy nhiệm chi" : "Số chứng từ"}</span>
              <input name="paymentRef" required className={fieldClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium">Ghi chú</span>
            <input name="paidNote" className={fieldClass} />
          </label>
          <button className={btnPrimary}>Xác nhận</button>
        </form>
      ) : null}

      <section className={`${cardClass} grid gap-4 p-6 sm:grid-cols-2`}>
        <Fact label="Số tiền" value={formatVnd(ticket.amount)} />
        {ticket.purpose ? <Fact label="Mục đích" value={PURPOSE_LABEL[ticket.purpose] ?? ticket.purpose} /> : null}
        {ticket.neededOn ? <Fact label="Ngày cần tiền" value={formatDay(ticket.neededOn)} /> : null}
        {ticket.settleDueOn ? <Fact label="Hạn hoàn ứng" value={formatDay(ticket.settleDueOn)} /> : null}
        {ticket.receiveMethod ? (
          <Fact label="Hình thức nhận" value={RECEIVE_LABEL[ticket.receiveMethod] ?? ticket.receiveMethod} />
        ) : null}
        {ticket.bankAccount ? <Fact label="Tài khoản" value={ticket.bankAccount} /> : null}
        {ticket.vendor ? <Fact label="Nhà thầu" value={ticket.vendor.name} /> : null}
        {ticket.contractNumber ? <Fact label="Số hợp đồng" value={ticket.contractNumber} /> : null}
        {ticket.contractValue != null ? <Fact label="Giá trị hợp đồng" value={formatVnd(ticket.contractValue)} /> : null}
        {ticket.installment ? <Fact label="Đợt" value={String(ticket.installment)} /> : null}
        {ticket.paymentRef ? <Fact label="Chứng từ chi" value={ticket.paymentRef} /> : null}
        {ticket.paidAt ? <Fact label="Ngày chi / thu" value={formatDay(ticket.paidAt)} /> : null}
        <div className="sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-muted">Nội dung</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{ticket.content}</p>
        </div>
      </section>

      {ticket.advance ? (
        <p className="text-sm">
          Hoàn cho phiếu{" "}
          <Link className="font-medium text-forest" href={`/requests/${ticket.advance.id}`}>
            {ticket.advance.code}
          </Link>{" "}
          ({formatVnd(ticket.advance.amount)}).{" "}
          {diff == null
            ? null
            : diff > 0
              ? `Chi vượt ${formatVnd(diff)}, công ty trả thêm.`
              : diff < 0
                ? `Chi thiếu ${formatVnd(Math.abs(diff))}, nộp lại tiền thừa.`
                : "Chi đúng số đã ứng."}
        </p>
      ) : null}

      {ticket.settlements.length > 0 ? (
        <section>
          <h2 className="font-semibold">Hoàn ứng liên quan</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {ticket.settlements.map((item) => (
              <li key={item.id}>
                <Link className="text-gold" href={`/requests/${item.id}`}>
                  {item.code}
                </Link>{" "}
                {item.title} · {formatVnd(item.amount)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {openAdvances.length > 0 ? (
        <section className="rounded-2xl border border-[#e4d2a8] bg-gold-soft p-4 text-sm text-[#5c4314]">
          <p className="font-medium">Khoản tạm ứng khác của người này chưa hoàn</p>
          <ul className="mt-2 space-y-1">
            {openAdvances.map((item) => (
              <li key={item.id}>
                <Link className="text-gold" href={`/requests/${item.id}`}>
                  {item.code}
                </Link>{" "}
                {formatVnd(item.amount)}
                {item.settleDueOn && item.settleDueOn < new Date() ? " · quá hạn" : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {ticket.kind === TicketKind.thanh_toan && ticket.contractValue != null ? (
        <section className={`${cardClass} p-5 text-sm`}>
          <p>
            Lũy kế các đợt đang xử lý hoặc đã trả: {formatVnd(committed)}. Cộng phiếu này:{" "}
            {formatVnd(committed + ticket.amount)} / {formatVnd(ticket.contractValue)}.
          </p>
          {siblings.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {siblings.map((item) => (
                <li key={item.id}>
                  <Link className="text-gold" href={`/requests/${item.id}`}>
                    {item.code}
                  </Link>{" "}
                  đợt {item.installment} · {formatVnd(item.amount)}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {ticket.lines.length > 0 ? (
        <section className={`${cardClass} overflow-hidden`}>
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-deep/70 text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Nội dung</th>
                <th className="px-4 py-2 font-medium">Ngày</th>
                <th className="px-4 py-2 font-medium">Số tiền</th>
                <th className="px-4 py-2 font-medium">Chứng từ</th>
              </tr>
            </thead>
            <tbody>
              {ticket.lines.map((line) => (
                <tr key={line.id} className="border-t border-line">
                  <td className="px-4 py-2">{line.content}</td>
                  <td className="px-4 py-2">{formatDay(line.spentOn)}</td>
                  <td className="px-4 py-2">{formatVnd(line.amount)}</td>
                  <td className="px-4 py-2">{line.invoiceNote || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {ticket.attachments.length > 0 ? (
        <section className={`${cardClass} p-5`}>
          <h2 className="font-semibold">File đính kèm</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {ticket.attachments.map((file) => (
              <li key={file.id}>
                <a className="text-forest hover:underline" href={file.filePath} target="_blank" rel="noreferrer">
                  {file.fileName}
                </a>
                <span className="text-muted"> · {file.uploadedBy.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {editable && ticket.kind === TicketKind.tam_ung ? (
        <AdvanceForm ticket={ticket} departments={departments} role={user.role} openAdvances={[]} />
      ) : null}
      {editable && ticket.kind === TicketKind.hoan_ung ? (
        <SettlementForm ticket={ticket} advances={myAdvances} />
      ) : null}
      {editable && ticket.kind === TicketKind.thanh_toan ? (
        <PaymentForm ticket={ticket} departments={departments} vendors={vendors} role={user.role} />
      ) : null}

      <section className={`${cardClass} p-6`}>
        <h2 className="font-display text-xl font-semibold">Nhật ký</h2>
        <ol className="mt-4 space-y-0">
          {ticket.timeline.map((event) => (
            <li key={event.id} className="relative border-l border-line pb-5 pl-5 text-sm last:pb-0">
              <span className="absolute -left-1 top-1 size-2 rounded-full bg-gold" />
              <p className="text-xs text-muted">
                {formatDate(event.createdAt)} · {event.user.name}
              </p>
              <p className="mt-1 text-ink">{event.message}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-sm font-medium ${label === "Số tiền" ? "font-display text-xl text-gold" : "text-ink"}`}>{value}</p>
    </div>
  );
}
