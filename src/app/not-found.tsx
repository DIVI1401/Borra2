import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="font-heading text-7xl text-gold">404</p>
      <h1 className="text-3xl">Esta página se fue de rumba</h1>
      <p className="text-muted-foreground">No encontramos lo que buscas. Puede que el enlace esté mal escrito o ya no exista.</p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        Volver al inicio
      </Link>
    </main>
  );
}
