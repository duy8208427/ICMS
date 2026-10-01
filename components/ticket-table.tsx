import Link from "next/link";
import { TicketKind, TicketStatus } from "@prisma/client";
import { KIND_DOT, KIND_LABEL, formatVnd } from "@/lib/helpers";
import { StatusBadge } from "@/components/status-badge";
import { cardClass } from "@/components/ui";

export function TicketTable({
  rows,
}: {
  rows: {
    id: string;
    code: string;
    title: string;
    kind: TicketKind;
    amount: number;
    status: TicketStatus;
    createdBy?: { name: string } | null;
    department?: { name: string } | null;
  }[];
}) {
  return (
    <div className={`${cardClass} overflow-x-auto`}>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-cream-deep/70 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Mã</th>
            <th className="px-4 py-3 font-medium">Nội dung</th>
            <th className="px-4 py-3 font-medium">Loại</th>
            <th className="px-4 py-3 text-right font-medium">Số tiền</th>
            <th className="px-4 py-3 font-medium">Người tạo</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-muted">
                Không có phiếu.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-t border-line hover:bg-cream">
                <td className="px-4 py-4 font-medium text-gold">
                  <Link href={`/requests/${row.id}`}>{row.code}</Link>
                </td>
                <td className="px-4 py-4">
                  <p className="text-ink">{row.title}</p>
                  {row.department ? <p className="text-xs text-muted">{row.department.name}</p> : null}
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span className={`size-2 rounded-full ${KIND_DOT[row.kind]}`} />
                    {KIND_LABEL[row.kind]}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-medium tabular-nums text-ink">{formatVnd(row.amount)}</td>
                <td className="px-4 py-4 text-muted">{row.createdBy?.name ?? "—"}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={row.status} kind={row.kind} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
