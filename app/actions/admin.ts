"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/helpers";

const ROLES = new Set<string>(Object.values(Role));
const NEEDS_DEPARTMENT = new Set<string>([Role.USER, Role.TRUONG_BO_PHAN]);

function fail(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

async function requireAdmin() {
  const user = await requireDbUser();
  if (user.role !== Role.ADMIN) fail("Chỉ quản trị thao tác phần này");
  return user;
}

export async function assignDepartmentAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const departmentId = String(formData.get("departmentId") || "");
  const account = await prisma.user.findUnique({ where: { id: userId } });
  if (!account) fail("Không thấy tài khoản");
  if (account.role === Role.NCC) fail("Nhà thầu gắn với nhà thầu, không gán bộ phận");
  if (NEEDS_DEPARTMENT.has(account.role) && !departmentId) {
    fail("Nhân viên và trưởng bộ phận cần một bộ phận");
  }
  if (departmentId) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) fail("Bộ phận không tồn tại");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { departmentId: departmentId || null },
  });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createAccountAction(formData: FormData) {
  await requireAdmin();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "");
  const departmentId = String(formData.get("departmentId") || "");
  const vendorId = String(formData.get("vendorId") || "");

  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    fail("Tên đăng nhập 3–32 ký tự, chỉ chữ, số, dấu chấm, gạch ngang hoặc gạch dưới");
  }
  if (password.length < 6) fail("Mật khẩu ít nhất 6 ký tự");
  if (!name) fail("Nhập họ tên");
  if (!ROLES.has(role)) fail("Chọn vai trò");

  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) fail("Tên đăng nhập đã có");

  let department: string | null = null;
  let vendor: string | null = null;
  if (role === Role.NCC) {
    if (!vendorId) fail("Nhà thầu cần chọn đơn vị");
    const found = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!found) fail("Nhà thầu không tồn tại");
    vendor = vendorId;
  } else {
    if (NEEDS_DEPARTMENT.has(role) && !departmentId) fail("Nhân viên và trưởng bộ phận cần một bộ phận");
    if (departmentId) {
      const found = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!found) fail("Bộ phận không tồn tại");
      department = departmentId;
    }
  }

  await prisma.user.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, 10),
      name,
      role,
      departmentId: department,
      vendorId: vendor,
    },
  });
  revalidatePath("/admin");
  redirect("/admin");
}
