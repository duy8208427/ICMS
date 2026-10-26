"use client";

import { useState } from "react";
import { createAccountAction } from "@/app/actions/admin";
import { btnPrimary, cardClass, fieldClass, labelClass } from "@/components/ui";
import { Role, ROLE_LABEL } from "@/lib/enums";

export function CreateAccountForm({
  departments,
  vendors,
}: {
  departments: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}) {
  const [role, setRole] = useState<string>(Role.USER);
  const vendorAccount = role === Role.NCC;
  const departmentRequired = role === Role.USER || role === Role.TRUONG_BO_PHAN;

  return (
    <form action={createAccountAction} className={`${cardClass} space-y-4 p-5`}>
      <h2 className="font-semibold">Tạo tài khoản</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className={labelClass}>Tên đăng nhập</span>
          <input name="username" required autoComplete="off" className={fieldClass} placeholder="nguyen.van.a" />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Mật khẩu</span>
          <input name="password" type="password" required minLength={6} autoComplete="new-password" className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Họ tên</span>
          <input name="name" required className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Vai trò</span>
          <select name="role" required value={role} onChange={(event) => setRole(event.target.value)} className={fieldClass}>
            {Object.values(Role).map((value) => (
              <option key={value} value={value}>
                {ROLE_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        {vendorAccount ? (
          <label className="block text-sm sm:col-span-2">
            <span className={labelClass}>Nhà thầu</span>
            <select name="vendorId" required defaultValue="" className={fieldClass}>
              <option value="">Chọn nhà thầu</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block text-sm sm:col-span-2">
            <span className={labelClass}>Bộ phận{departmentRequired ? "" : " (không bắt buộc)"}</span>
            <select name="departmentId" required={departmentRequired} defaultValue="" className={fieldClass}>
              <option value="">Chưa gán</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <button className={btnPrimary}>Tạo tài khoản</button>
    </form>
  );
}
