import { Department, Vendor } from "@prisma/client";
import { Role } from "@/lib/enums";
import { savePaymentAction } from "@/app/actions/tickets";
import { FilePicker } from "@/components/file-picker";
import { MoneyInput } from "@/components/money-input";
import { btnGhost, btnPrimary, cardClass, fieldClass, labelClass } from "@/components/ui";

type Defaults = {
  id?: string;
  title?: string;
  content?: string;
  contractNumber?: string | null;
  contractValue?: number | null;
  installment?: number | null;
  amount?: number;
  departmentId?: string | null;
  vendorId?: string | null;
};

export function PaymentForm({
  ticket,
  departments,
  vendors,
  role,
}: {
  ticket?: Defaults;
  departments: Department[];
  vendors: Vendor[];
  role: string;
}) {
  return (
    <form action={savePaymentAction} className={`${cardClass} space-y-5 p-6`}>
      {ticket?.id ? <input type="hidden" name="id" value={ticket.id} /> : null}
      <label className="block text-sm">
        <span className={labelClass}>Nội dung đề nghị</span>
        <input name="title" required defaultValue={ticket?.title} className={fieldClass} placeholder="Thanh toán đợt 1 hợp đồng thi công" />
      </label>
      <label className="block text-sm">
        <span className={labelClass}>Diễn giải</span>
        <textarea name="content" rows={2} defaultValue={ticket?.content} className={fieldClass} />
      </label>
      <p className="text-xs uppercase tracking-[0.16em] text-gold">Hợp đồng và đợt</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className={labelClass}>Số hợp đồng</span>
          <input name="contractNumber" required defaultValue={ticket?.contractNumber ?? ""} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Giá trị hợp đồng (đ)</span>
          <MoneyInput name="contractValue" required defaultValue={ticket?.contractValue} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Đợt thanh toán</span>
          <input name="installment" type="number" min={1} required defaultValue={ticket?.installment ?? 1} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Số tiền đề nghị (đ)</span>
          <MoneyInput name="amount" required defaultValue={ticket?.amount} className={fieldClass} />
        </label>
      </div>
      <label className="block text-sm">
        <span className={labelClass}>Bộ phận phụ trách xác nhận khối lượng</span>
        <select name="departmentId" required defaultValue={ticket?.departmentId ?? ""} className={fieldClass}>
          <option value="">Chọn bộ phận</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
      {role === Role.ADMIN ? (
        <label className="block text-sm">
          <span className={labelClass}>Nhà thầu</span>
          <select name="vendorId" required defaultValue={ticket?.vendorId ?? ""} className={fieldClass}>
            <option value="">Chọn nhà thầu</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="text-sm">
        <span className={labelClass}>
          Hồ sơ: công văn đề nghị, biên bản nghiệm thu, bảng giá trị thanh toán, hóa đơn VAT
        </span>
        <FilePicker name="files" multiple />
      </div>
      <div className="flex gap-2">
        <button name="intent" value="submit" className={btnPrimary}>
          Gửi đề nghị
        </button>
        <button name="intent" value="draft" className={btnGhost}>
          Lưu nháp
        </button>
      </div>
    </form>
  );
}
