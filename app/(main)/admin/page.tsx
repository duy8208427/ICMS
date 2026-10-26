import { Role } from "@/lib/enums";
import { redirect } from "next/navigation";
import { assignDepartmentAction } from "@/app/actions/admin";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL, requireDbUser } from "@/lib/helpers";
import { CreateAccountForm } from "@/components/create-account-form";
import { PageHeader } from "@/components/page-header";
import { btnGhost, cardClass, fieldClass } from "@/components/ui";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireDbUser();
  if (user.role !== Role.ADMIN) redirect("/dashboard");
  const { error } = await searchParams;
  const [users, vendors, departments, count] = await Promise.all([
    prisma.user.findMany({ include: { vendor: true, department: true }, orderBy: { username: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.ticket.count(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Quản trị"
        description={`${count} phiếu. Tạo tài khoản và gán bộ phận cho nhân sự nội bộ.`}
      />
      {error ? <p className="rounded-lg bg-[#f8e8e6] px-3 py-2 text-sm text-[#8a3b32]">{error}</p> : null}
      <CreateAccountForm departments={departments} vendors={vendors} />
      <section className={`${cardClass} overflow-x-auto p-5`}>
        <h2 className="font-semibold">Người dùng</h2>
        <table className="mt-3 w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 font-medium">Tài khoản</th>
              <th className="font-medium">Họ tên</th>
              <th className="font-medium">Vai trò</th>
              <th className="font-medium">Bộ phận / nhà thầu</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.id} className="border-t border-line">
                <td className="py-2 font-medium">{account.username}</td>
                <td>{account.name}</td>
                <td>{ROLE_LABEL[account.role]}</td>
                <td className="py-2">
                  {account.role === Role.NCC ? (
                    account.vendor?.name ?? "—"
                  ) : (
                    <form action={assignDepartmentAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={account.id} />
                      <select
                        name="departmentId"
                        defaultValue={account.departmentId ?? ""}
                        required={account.role === Role.USER || account.role === Role.TRUONG_BO_PHAN}
                        className={`${fieldClass} mt-0`}
                      >
                        <option value="">Chưa gán</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                      <button className={`${btnGhost} shrink-0 px-3 py-2`}>Lưu</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className={`${cardClass} p-5`}>
        <h2 className="font-semibold">Nhà thầu</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <strong>{vendor.name}</strong>
              {vendor.taxCode ? ` · MST ${vendor.taxCode}` : ""} · {vendor.address}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
