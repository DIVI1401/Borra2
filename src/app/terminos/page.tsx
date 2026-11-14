import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Reglas para usar Borra2.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <article className="space-y-5 leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:text-foreground">
        <h1 className="text-4xl text-foreground">Términos de uso</h1>
        <p>Borra2 es un proyecto académico para ayudarte a decidir a dónde salir en la zona norte de Montería.</p>

        <h2>Uso de la app</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Debes ser mayor de 18 años.</li>
          <li>La información de los sitios la aportan los locales y otros usuarios; puede no ser exacta en todo momento.</li>
          <li>No publiques reportes ni reseñas falsas, ofensivas o con datos personales de otras personas.</li>
          <li>Podemos ocultar contenido o suspender cuentas que incumplan estas reglas.</li>
        </ul>

        <h2>Consumo responsable</h2>
        <p>
          Borra2 no promueve el consumo excesivo de alcohol. Cuídate, no manejes si tomaste y usa el botón de seguridad si
          lo necesitas.
        </p>
      </article>
    </main>
  );
}
