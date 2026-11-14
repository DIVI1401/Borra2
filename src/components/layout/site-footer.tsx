import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground">
        <p>Borra2 · Proyecto académico · Solo mayores de 18 años. Consume con responsabilidad.</p>
        <nav aria-label="Enlaces legales" className="flex gap-4">
          <Link href="/privacidad" className="hover:text-foreground hover:underline">
            Privacidad
          </Link>
          <Link href="/terminos" className="hover:text-foreground hover:underline">
            Términos
          </Link>
          <Link href="/panel/solicitar" className="hover:text-foreground hover:underline">
            ¿Tienes un local?
          </Link>
        </nav>
      </div>
    </footer>
  );
}
