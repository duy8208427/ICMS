"use client";

import { useState } from "react";
import { saveSettlementAction } from "@/app/actions/tickets";
import { FilePicker } from "@/components/file-picker";
import { btnGhost, btnPrimary, cardClass, fieldClass, labelClass } from "@/components/ui";
import { dayInput, formatVnd } from "@/lib/helpers";

type AdvanceOption = { id: string; code: string; title: string; amount: number; settleDueOn: Date | null };
type Line = { content: string; spentOn: string; amount: string; invoiceNote: string };

export function SettlementForm({
  ticket,
  advances,
}: {
  ticket?: {
    id: string;
    title: string;
    content: string;
    advanceId: string | null;
    lines: { content: string; spentOn: Date | null; amount: number; invoiceNote: string | null }[];
  };
  advances: AdvanceOption[];
}) {
  const [advanceId, setAdvanceId] = useState(ticket?.advanceId ?? "");
  const [rows, setRows] = useState<Line[]>(
    ticket?.lines.length
      ? ticket.lines.map((line) => ({
          content: line.content,
          spentOn: dayInput(line.spentOn),
          amount: String(line.amount),
          invoiceNote: line.invoiceNote ?? "",
        }))
      : [{ content: "", spentOn: "", amount: "", invoiceNote: "" }],
  );
  const spent = rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
  const advanced = advances.find((item) => item.id === advanceId)?.amount ?? 0;
  const diff = advanceId ? spent - advanced : null;

  return (
    <form action={saveSettlementAction} className={`${cardClass} space-y-5 p-6`}>
      {ticket ? <input type="hidden" name="id" value={ticket.id} /> : null}
      <label className="block text-sm">
        <span className={labelClass}>Phiếu tạm ứng đã chi</span>
        <select
          name="advanceId"
          required
          value={advanceId}
          onChange={(event) => setAdvanceId(event.target.value)}
          className={fieldClass}
        >
          <option value="">Chọn phiếu của bạn</option>
          {advances.map((advance) => (
            <option key={advance.id} value={advance.id}>
              {advance.code} — {advance.title} — {formatVnd(advance.amount)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className={labelClass}>Tiêu đề hoàn ứng</span>
        <input name="title" required defaultValue={ticket?.title} className={fieldClass} />
      </label>
      <label className="block text-sm">
        <span className={labelClass}>Ghi chú</span>
        <textarea name="content" rows={2} defaultValue={ticket?.content} className={fieldClass} />
      </label>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Khoản chi thực tế</p>
          <button
            type="button"
            className="text-sm text-forest hover:underline"
            onClick={() => setRows((current) => [...current, { content: "", spentOn: "", amount: "", invoiceNote: "" }])}
          >
            Thêm dòng
          </button>
        </div>
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-xl border border-line bg-cream/50 p-3 sm:grid-cols-4">
            <input name="lineContent" value={row.content} placeholder="Nội dung" className={fieldClass} onChange={(event) => update(index, "content", event.target.value)} />
            <input name="lineDate" type="date" value={row.spentOn} className={fieldClass} onChange={(event) => update(index, "spentOn", event.target.value)} />
            <input name="lineAmount" type="number" min={1} value={row.amount} placeholder="Số tiền" className={fieldClass} onChange={(event) => update(index, "amount", event.target.value)} />
            <input name="lineInvoice" value={row.invoiceNote} placeholder="Hóa đơn / chứng từ" className={fieldClass} onChange={(event) => update(index, "invoiceNote", event.target.value)} />
          </div>
        ))}
      </div>
      {diff != null ? (
        <div className="rounded-xl bg-gold-soft px-4 py-3 text-sm text-[#5c4314]">
          <p>
            Tổng chi <span className="font-display text-lg font-semibold tabular-nums">{formatVnd(spent)}</span>
            {" · "}đã ứng {formatVnd(advanced)}
          </p>
          <p className="mt-1">
            {diff > 0
              ? `Chi vượt ${formatVnd(diff)}, công ty sẽ trả thêm sau khi lãnh đạo duyệt.`
              : diff < 0
                ? `Còn thừa ${formatVnd(Math.abs(diff))}, nộp lại khi quyết toán.`
                : "Chi đúng số đã ứng."}
          </p>
        </div>
      ) : null}
      <div className="text-sm">
        <span className={labelClass}>File hóa đơn</span>
        <FilePicker name="files" multiple />
      </div>
      <div className="flex gap-2">
        <button name="intent" value="submit" className={btnPrimary}>
          Gửi duyệt
        </button>
        <button name="intent" value="draft" className={btnGhost}>
          Lưu nháp
        </button>
      </div>
    </form>
  );

  function update(index: number, key: keyof Line, value: string) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }
}
