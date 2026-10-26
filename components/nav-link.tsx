"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function NavLink({
  href,
  label,
  icon,
  nested,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  nested?: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = isActive(href, pathname, params.get("kind"), params.get("status"));

  return (
    <Link
      href={href}
      className={
        nested
          ? active
            ? "flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-forest"
            : "flex items-center rounded-lg px-3 py-1.5 text-sm text-ink/70 hover:bg-cream"
          : active
            ? "flex items-center gap-2.5 rounded-lg border-l-2 border-gold bg-forest-soft px-3 py-2 text-sm font-medium text-forest"
            : "flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-ink/80 hover:bg-cream"
      }
    >
      {icon ? <span className="text-forest">{icon}</span> : null}
      {label}
    </Link>
  );
}

export function NavGroup({
  label,
  icon,
  items,
}: {
  label: string;
  icon: React.ReactNode;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const kind = params.get("kind");
  const status = params.get("status");
  const open = items.some((item) => isActive(item.href, pathname, kind, status));

  return (
    <div>
      <div
        className={
          open
            ? "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-forest"
            : "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink/80"
        }
      >
        <span className="text-forest">{icon}</span>
        {label}
      </div>
      <div className="space-y-0.5 pl-7">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} nested />
        ))}
      </div>
    </div>
  );
}

function isActive(href: string, pathname: string, kind: string | null, status: string | null) {
  const [path, query] = href.split("?");
  const params = new URLSearchParams(query ?? "");
  const hrefKind = params.get("kind");
  const hrefStatus = params.get("status");

  if (path === "/dashboard") return pathname === "/dashboard";
  if (path === "/requests" && !hrefKind) {
    const draftList = kind === "hoan_ung" && status === "draft";
    return (
      !draftList &&
      (pathname === "/requests" || (pathname.startsWith("/requests/") && !pathname.startsWith("/requests/new")))
    );
  }
  if (path === "/requests" && hrefKind === "hoan_ung" && hrefStatus === "draft") {
    return pathname === "/requests" && kind === "hoan_ung" && status === "draft";
  }
  if (path === "/requests/new" && !hrefKind) return pathname === "/requests/new" && kind !== "hoan_ung";
  if (path === "/requests/new" && hrefKind === "hoan_ung") return pathname === "/requests/new" && kind === "hoan_ung";
  return pathname === href;
}
