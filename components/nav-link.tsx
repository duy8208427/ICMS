"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const kind = useSearchParams().get("kind");
  const active = isActive(href, pathname, kind);

  return (
    <Link
      href={href}
      className={
        active
          ? "flex items-center gap-2.5 rounded-lg border-l-2 border-gold bg-forest-soft px-3 py-2 text-sm font-medium text-forest"
          : "flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-ink/80 hover:bg-cream"
      }
    >
      <span className="text-forest">{icon}</span>
      {label}
    </Link>
  );
}

function isActive(href: string, pathname: string, kind: string | null) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/requests") {
    return pathname === "/requests" || (pathname.startsWith("/requests/") && !pathname.startsWith("/requests/new"));
  }
  if (href === "/requests/new") return pathname === "/requests/new" && kind !== "hoan_ung";
  if (href === "/requests/new?kind=hoan_ung") return pathname === "/requests/new" && kind === "hoan_ung";
  return pathname === href;
}
