import { TicketKind } from "@/lib/enums";
import { STATUS_TONE, statusLabel } from "@/lib/helpers";

export function StatusBadge({ status, kind }: { status: string; kind?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[status]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel(kind ?? TicketKind.tam_ung, status)}
    </span>
  );
}
