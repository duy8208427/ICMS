import { TicketStatus } from "@/lib/enums";

const STEPS: Record<string, string[]> = {
  tam_ung: ["Gửi", "Trưởng BP", "Kế toán", "Lãnh đạo", "Chi tiền"],
  hoan_ung: ["Gửi", "Trưởng BP", "Kế toán", "Lãnh đạo", "Quyết toán"],
  thanh_toan: ["Gửi", "Xác nhận KL", "Kế toán", "Lãnh đạo", "Chi tiền"],
};

export function ProgressTrack({
  kind,
  status,
  skippedLeader,
}: {
  kind: string;
  status: string;
  skippedLeader?: boolean;
}) {
  const steps = STEPS[kind] ?? STEPS.tam_ung;
  const current = stepIndex(status);
  const rejected = status === TicketStatus.tu_choi;

  return (
    <ol className="grid grid-cols-5 gap-2">
      {steps.map((label, index) => {
        const skipped = skippedLeader && index === 3 && current > 3;
        const done = !rejected && current > index;
        const active = !rejected && current === index;
        return (
          <li key={label} className="min-w-0">
            <div
              className={
                skipped
                  ? "h-1 rounded-full bg-line"
                  : done || active
                    ? "h-1 rounded-full bg-forest"
                    : "h-1 rounded-full bg-line"
              }
            />
            <p
              className={
                active
                  ? "mt-2 truncate text-xs font-medium text-forest"
                  : skipped
                    ? "mt-2 truncate text-xs text-muted line-through"
                    : done
                      ? "mt-2 truncate text-xs text-ink"
                      : "mt-2 truncate text-xs text-muted"
              }
            >
              {skipped ? "Bỏ qua lãnh đạo" : label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function stepIndex(status: string) {
  if (status === TicketStatus.draft || status === TicketStatus.tra_lai) return 0;
  if (status === TicketStatus.cho_truong_bp) return 1;
  if (status === TicketStatus.cho_ke_toan) return 2;
  if (status === TicketStatus.cho_lanh_dao) return 3;
  if (status === TicketStatus.cho_chi) return 4;
  if (
    status === TicketStatus.da_chi ||
    status === TicketStatus.da_hoan_ung ||
    status === TicketStatus.da_quyet_toan ||
    status === TicketStatus.da_thanh_toan
  ) {
    return 5;
  }
  return -1;
}
