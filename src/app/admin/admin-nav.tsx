"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/locales", label: "Locales" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/resenas", label: "Reseñas" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administración" className="flex gap-1 overflow-x-auto border-b pb-2 [scrollbar-width:none]">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
