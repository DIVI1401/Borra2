import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * Inicio provisional (fase 1). En la fase 3 aquí va el mapa en vivo.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm font-medium tracking-wide text-gold uppercase">Montería · Zona Norte</p>
      <h1 className="text-5xl leading-tight sm:text-6xl">Tu noche, mejor dirigida.</h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Mira antes de salir qué tan lleno está cada bar y discoteca, cuánto vale entrar y qué música está sonando.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/registro" className={buttonVariants({ size: "lg" })}>
          Crear cuenta
        </Link>
        <Link href="/entrar" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Ya tengo cuenta
        </Link>
      </div>
    </main>
  );
}
