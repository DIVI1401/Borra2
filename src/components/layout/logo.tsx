import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("font-heading text-2xl leading-none tracking-tight text-foreground", className)}
      aria-label="Borra2, ir al inicio"
    >
      Borra<span className="text-gold">2</span>
    </Link>
  );
}
