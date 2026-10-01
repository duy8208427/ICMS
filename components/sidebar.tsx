import { Role } from "@prisma/client";
import { Suspense } from "react";
import { logoutAction } from "@/app/actions/auth";
import { NavLink } from "@/components/nav-link";
import { ROLE_LABEL } from "@/lib/helpers";

const NAV: { href: string; label: string; icon: IconName; roles: Role[] }[] = [
  { href: "/dashboard", label: "Hộp việc", icon: "inbox", roles: [Role.USER, Role.TRUONG_BO_PHAN, Role.KE_TOAN, Role.LANH_DAO, Role.NCC, Role.ADMIN] },
  { href: "/requests", label: "Danh sách phiếu", icon: "list", roles: [Role.USER, Role.TRUONG_BO_PHAN, Role.KE_TOAN, Role.LANH_DAO, Role.ADMIN] },
  { href: "/requests/new", label: "Tạm ứng", icon: "advance", roles: [Role.USER, Role.ADMIN] },
  { href: "/requests/new?kind=hoan_ung", label: "Hoàn ứng", icon: "settle", roles: [Role.USER, Role.ADMIN] },
  { href: "/ncc", label: "Cổng nhà thầu", icon: "vendor", roles: [Role.NCC, Role.ADMIN] },
  { href: "/admin", label: "Quản trị", icon: "admin", roles: [Role.ADMIN] },
];

type IconName = "inbox" | "list" | "advance" | "settle" | "vendor" | "admin";

export function Sidebar({
  user,
}: {
  user: { name?: string | null; role: Role; username: string };
}) {
  const initial = (user.name ?? user.username).trim().charAt(0).toUpperCase();
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-cream-deep text-ink">
      <div className="px-5 py-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Thanh toán</p>
        <p className="font-display mt-1 text-2xl font-semibold text-forest">Sổ quỹ</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        <Suspense fallback={<div className="h-40" />}>
          {NAV.filter((item) => item.roles.includes(user.role)).map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={<Icon name={item.icon} />} />
          ))}
        </Suspense>
      </nav>
      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-forest text-sm font-medium text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button className="mt-3 text-xs text-forest hover:underline" type="submit">
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  );
}

function Icon({ name }: { name: IconName }) {
  const common = "size-4";
  if (name === "inbox") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 13h4l2 3h4l2-3h4v6H4z" />
        <path d="M4 13l2-8h12l2 8" />
      </svg>
    );
  }
  if (name === "list") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M8 7h12M8 12h12M8 17h12" />
        <path d="M4 7h.01M4 12h.01M4 17h.01" />
      </svg>
    );
  }
  if (name === "advance") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  if (name === "settle") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 7h10v10H7z" />
        <path d="M9 11h6M9 14h4" />
      </svg>
    );
  }
  if (name === "vendor") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 9h16l-1 10H5z" />
        <path d="M8 9V7a4 4 0 0 1 8 0v2" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" />
    </svg>
  );
}
