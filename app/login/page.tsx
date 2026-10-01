import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./login-form";

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
      <p className="text-sm font-medium text-gold-soft">{title}</p>
      <p className="mt-1 text-sm text-white/80">{text}</p>
    </div>
  );
}

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
    if (account) redirect("/dashboard");
    await signOut({ redirectTo: "/login" });
  }
  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden w-[46%] flex-col justify-between bg-forest p-12 text-white lg:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Sổ quỹ nội bộ</p>
          <h1 className="font-display mt-4 max-w-md text-5xl font-semibold leading-tight">
            Tạm ứng, hoàn ứng và thanh toán nhà thầu
          </h1>
        </div>
        <div className="grid gap-3">
          <InfoCard title="Tạm ứng" text="Nhân viên xin tiền công tác, tiếp khách, sự kiện." />
          <InfoCard title="Hoàn ứng" text="Quyết toán một phiếu đã chi, tính phần thừa hoặc thiếu." />
          <InfoCard title="Thanh toán" text="Nhà thầu gửi theo hợp đồng, nhiều đợt, không vượt giá trị." />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-line bg-card p-8 shadow-[0_12px_40px_rgba(43,37,32,0.06)]">
          <h2 className="font-display text-3xl font-semibold text-ink">Đăng nhập</h2>
          <p className="mb-6 mt-2 text-sm text-muted">Chọn tài khoản demo bên dưới, mật khẩu là demo123.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
