import { Role } from "@/lib/enums";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL, requireDbUser } from "@/lib/helpers";
import { PageHeader } from "@/components/page-header";
import { cardClass } from "@/components/ui";

export default async function AdminPage() {
  const user = await requireDbUser();
  if (user.role !== Role.ADMIN) redirect("/dashboard");
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
        description={`${count} phiếu. Tài khoản quản trị xem mọi phiếu và thao tác thay các vai trò trên phiếu đang chờ.`}
      />
      <section className={`${cardClass} p-5`}>
        <h2 className="font-semibold">Bộ phận</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {departments.map((department) => (
            <li key={department.id}>{department.name}</li>
          ))}
        </ul>
      </section>
      <section className={`${cardClass} p-5`}>
        <h2 className="font-semibold">Người dùng</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2">Tài khoản</th>
              <th>Họ tên</th>
              <th>Vai trò</th>
              <th>Bộ phận / nhà thầu</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.id} className="border-t border-line">
                <td className="py-2 font-medium">{account.username}</td>
                <td>{account.name}</td>
                <td>{ROLE_LABEL[account.role]}</td>
                <td>{account.department?.name ?? account.vendor?.name ?? "—"}</td>
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
