import { Department } from "@prisma/client";
import { Role } from "@/lib/enums";
import { saveAdvanceAction } from "@/app/actions/tickets";
import { FilePicker } from "@/components/file-picker";
import { MoneyInput } from "@/components/money-input";
import { btnGhost, btnPrimary, cardClass, fieldClass, labelClass } from "@/components/ui";
import { PURPOSE_LABEL, RECEIVE_LABEL, dayInput, formatDay } from "@/lib/helpers";

type Defaults = {
  id?: string;
  purpose?: string | null;
  title?: string;
  content?: string;
  amount?: number;
  neededOn?: Date | null;
  settleDueOn?: Date | null;
  receiveMethod?: string | null;
  bankAccount?: string | null;
  departmentId?: string | null;
};

export function AdvanceForm({
  ticket,
  departments,
  role,
  needsDepartment,
  openAdvances = [],
}: {
  ticket?: Defaults;
  departments: Department[];
  role: string;
  needsDepartment?: boolean;
  openAdvances?: { code: string; settleDueOn: Date | null; overdue: boolean }[];
}) {
  const overdue = openAdvances.filter((item) => item.overdue);
  return (
    <form action={saveAdvanceAction} className={`${cardClass} space-y-5 p-6`}>
      {ticket?.id ? <input type="hidden" name="id" value={ticket.id} /> : null}
      {overdue.length > 0 ? (
        <p className="rounded-lg border border-[#e4d2a8] bg-gold-soft px-3 py-2 text-sm text-[#5c4314]">
          Bạn còn {overdue.length} khoản tạm ứng quá hạn chưa hoàn: {overdue.map((item) => item.code).join(", ")}.
          Vẫn tạo được phiếu mới. Kế toán sẽ thấy cảnh báo này khi kiểm tra.
        </p>
      ) : openAdvances.length > 0 ? (
        <p className="rounded-lg bg-forest-soft px-3 py-2 text-sm text-forest">
          Đang còn {openAdvances.length} phiếu tạm ứng đã chi chưa hoàn (
          {openAdvances.map((item) => `${item.code}, hạn ${formatDay(item.settleDueOn)}`).join("; ")}).
        </p>
      ) : null}
      <label className="block text-sm">
        <span className={labelClass}>Mục đích</span>
        <select name="purpose" required defaultValue={ticket?.purpose ?? "cong_tac"} className={fieldClass}>
          {Object.entries(PURPOSE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className={labelClass}>Tiêu đề</span>
        <input name="title" required defaultValue={ticket?.title} className={fieldClass} placeholder="Công tác Đà Nẵng tháng 9" />
      </label>
      <label className="block text-sm">
        <span className={labelClass}>Nội dung</span>
        <textarea name="content" required rows={3} defaultValue={ticket?.content} className={fieldClass} />
      </label>
      <p className="text-xs uppercase tracking-[0.16em] text-gold">Số tiền và hạn</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className={labelClass}>Số tiền (đ)</span>
          <MoneyInput name="amount" required defaultValue={ticket?.amount} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Hình thức nhận</span>
          <select name="receiveMethod" required defaultValue={ticket?.receiveMethod ?? "chuyen_khoan"} className={fieldClass}>
            {Object.entries(RECEIVE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Ngày cần tiền</span>
          <input name="neededOn" type="date" required defaultValue={dayInput(ticket?.neededOn)} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Hạn hoàn ứng</span>
          <input name="settleDueOn" type="date" required defaultValue={dayInput(ticket?.settleDueOn)} className={fieldClass} />
        </label>
      </div>
      <label className="block text-sm">
        <span className={labelClass}>Số tài khoản (nếu chuyển khoản)</span>
        <input name="bankAccount" defaultValue={ticket?.bankAccount ?? ""} className={fieldClass} placeholder="VCB 0123456789 - Nguyễn Văn An" />
      </label>
      {needsDepartment || role === Role.ADMIN ? (
        <label className="block text-sm">
          <span className={labelClass}>Bộ phận</span>
          <select name="departmentId" required defaultValue={ticket?.departmentId ?? ""} className={fieldClass}>
            <option value="">Chọn bộ phận</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="text-sm">
        <span className={labelClass}>Đính kèm kế hoạch, dự trù</span>
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
}
