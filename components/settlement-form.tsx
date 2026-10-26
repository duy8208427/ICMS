"use client";

import { useState } from "react";
import { saveSettlementAction } from "@/app/actions/tickets";
import { FilePicker } from "@/components/file-picker";
import { MoneyInput } from "@/components/money-input";
import { btnGhost, btnPrimary, cardClass, fieldClass, labelClass } from "@/components/ui";
import { dayInput, formatVnd } from "@/lib/helpers";

type AdvanceOption = { id: string; code: string; title: string; amount: number; settleDueOn: Date | null };
type Line = {
  key: string;
  content: string;
  spentOn: string;
  amount: string;
  fileName: string;
  filePath: string;
};

function blankLine(key: string): Line {
  return { key, content: "", spentOn: "", amount: "", fileName: "", filePath: "" };
}

export function SettlementForm({
  ticket,
  advances,
}: {
  ticket?: {
    id: string;
    title: string;
    content: string;
    advanceId: string | null;
    lines: {
      content: string;
      spentOn: Date | null;
      amount: number;
      fileName: string | null;
      filePath: string | null;
    }[];
  };
  advances: AdvanceOption[];
}) {
  const [advanceId, setAdvanceId] = useState(ticket?.advanceId ?? "");
  const [rows, setRows] = useState<Line[]>(
    ticket?.lines.length
      ? ticket.lines.map((line, index) => ({
          key: `saved-${index}`,
          content: line.content,
          spentOn: dayInput(line.spentOn),
          amount: line.amount ? String(line.amount) : "",
          fileName: line.fileName ?? "",
          filePath: line.filePath ?? "",
        }))
      : [blankLine("line-0")],
  );
  const [seq, setSeq] = useState(ticket?.lines.length ?? 1);
  const spent = rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
  const advanced = advances.find((item) => item.id === advanceId)?.amount ?? 0;
  const diff = advanceId ? spent - advanced : null;

  return (
    <form action={saveSettlementAction} className={`${cardClass} space-y-5 p-6`}>
      {ticket ? <input type="hidden" name="id" value={ticket.id} /> : null}
      <label className="block text-sm">
        <span className={labelClass}>Phiếu tạm ứng đã chi</span>
        <select name="advanceId" value={advanceId} onChange={(event) => setAdvanceId(event.target.value)} className={fieldClass}>
          <option value="">Chọn phiếu của bạn — bắt buộc khi gửi duyệt</option>
          {advances.map((advance) => (
            <option key={advance.id} value={advance.id}>
              {advance.code} — {advance.title} — {formatVnd(advance.amount)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className={labelClass}>Tiêu đề hoàn ứng</span>
        <input name="title" defaultValue={ticket?.title} className={fieldClass} placeholder="Để trống khi lưu nháp sẽ thành Hoàn ứng nháp" />
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
            onClick={() => {
              setRows((current) => [...current, blankLine(`line-${seq}`)]);
              setSeq((current) => current + 1);
            }}
          >
            Thêm dòng
          </button>
        </div>
        {rows.map((row, index) => (
          <div key={row.key} className="space-y-2 rounded-xl border border-line bg-cream/50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">Khoản {index + 1}</p>
              <button type="button" className="text-sm text-[#8a3b32] hover:underline" onClick={() => removeRow(index)}>
                Xóa
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                name="lineContent"
                value={row.content}
                placeholder="Nội dung"
                className={fieldClass}
                onChange={(event) => update(index, "content", event.target.value)}
              />
              <input
                name="lineDate"
                type="date"
                value={row.spentOn}
                className={fieldClass}
                onChange={(event) => update(index, "spentOn", event.target.value)}
              />
              <MoneyInput
                name="lineAmount"
                value={row.amount}
                placeholder="Số tiền"
                className={fieldClass}
                onValueChange={(raw) => update(index, "amount", raw)}
              />
            </div>
            <div className="text-sm">
              <span className={labelClass}>Chứng từ</span>
              <FilePicker name="lineFile" existingName={row.fileName} />
              <input type="hidden" name="lineFileName" value={row.fileName} />
              <input type="hidden" name="lineFilePath" value={row.filePath} />
            </div>
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

  function removeRow(index: number) {
    setRows((current) => {
      if (current.length === 1) return [blankLine(`line-${seq}`)];
      return current.filter((_, rowIndex) => rowIndex !== index);
    });
    setSeq((current) => current + 1);
  }
}
