import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo Borra2 recoge, usa y protege tus datos personales (Ley 1581 de 2012).",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <article className="space-y-5 leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:text-foreground">
        <h1 className="text-4xl text-foreground">Política de privacidad</h1>
        <p>
          Borra2 es un proyecto académico. Tratamos tus datos personales según la Ley 1581 de 2012 y el Decreto 1377 de 2013
          de Colombia. Al crear una cuenta autorizas el tratamiento descrito aquí.
        </p>

        <h2>Qué datos recogemos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Tu nombre y correo electrónico, para crear y proteger tu cuenta.</li>
          <li>Tus reseñas, reportes y favoritos, que publicas de forma voluntaria.</li>
          <li>
            Tu ubicación, solo cuando tú la compartes: para ordenar los sitios por cercanía, para verificar que estás en un
            local al reportar y cuando decides enviarla a tus amigos.
          </li>
        </ul>

        <h2>Para qué los usamos</h2>
        <p>
          Para que la app funcione: mostrar información confiable de los sitios, evitar reportes falsos y mantener tu
          cuenta segura. No vendemos ni compartimos tus datos con terceros para publicidad.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes conocer, actualizar y rectificar tus datos desde tu perfil, y eliminar tu cuenta con todos sus datos en
          cualquier momento desde <strong className="text-foreground">Mi perfil → Eliminar cuenta</strong>.
        </p>

        <h2>Seguridad</h2>
        <p>
          Tus datos se guardan en Google Firebase con reglas de acceso estrictas: cada persona solo puede ver y cambiar su
          propia información privada.
        </p>
      </article>
    </main>
  );
}
