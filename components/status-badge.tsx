"use client";

import { useState } from "react";
import { TicketStatus } from "@/lib/enums";

const TONE: Record<string, string> = {
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

function levelOf(status: string) {
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
  return 0;
}

export function StatusBadge({ status, label, hint }: { status: string; label: string; hint: string }) {
  const level = levelOf(status);
  const rejected = status === TicketStatus.tu_choi;
  const returned = status === TicketStatus.tra_lai;
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  return (
    <span
      className="inline-flex items-center gap-2"
      onMouseEnter={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = 280;
        const left = Math.min(rect.left, window.innerWidth - width - 12);
        setTip({ x: Math.max(8, left), y: rect.bottom + 8 });
      }}
      onMouseLeave={() => setTip(null)}
    >
      <span className="inline-flex items-end gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((index) => {
          const on = rejected || (returned ? index === 0 : index < level);
          const color = rejected ? "bg-[#8a3b32]" : returned ? "bg-ink" : "bg-forest";
          return (
            <span
              key={index}
              className={`w-1 rounded-sm ${on ? color : "bg-line"}`}
              style={{ height: `${6 + index * 2}px` }}
            />
          );
        })}
      </span>
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE[status] ?? ""}`}>
        {label}
      </span>
      {tip ? (
        <span
          className="pointer-events-none fixed z-50 w-[280px] rounded-xl border border-line bg-card px-3 py-2 text-left shadow-lg"
          style={{ left: tip.x, top: tip.y }}
        >
          <span className="block text-xs font-medium text-ink">{label}</span>
          <span className="mt-1 block text-xs font-normal leading-5 text-muted">{hint}</span>
        </span>
      ) : null}
    </span>
  );
}
