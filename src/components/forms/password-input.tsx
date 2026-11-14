"use client";

import { useState, type ComponentProps } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { passwordRules } from "@/schemas/auth";
import { cn } from "@/lib/utils";

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function PasswordInput({ className, ...props }: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-10", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
      >
        {visible ? <EyeOffIcon className="size-4" aria-hidden="true" /> : <EyeIcon className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

/** Lista de requisitos que se van marcando mientras la persona escribe. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="grid gap-1 text-xs sm:grid-cols-2" aria-label="Requisitos de la contraseña">
      {passwordRules.map((rule) => {
        const ok = rule.test(value);
        return (
          <li key={rule.label} className={cn("flex items-center gap-1.5", ok ? "text-level-1" : "text-muted-foreground")}>
            {ok ? <CheckIcon className="size-3.5" aria-hidden="true" /> : <XIcon className="size-3.5" aria-hidden="true" />}
            <span>
              {rule.label}
              <span className="sr-only">{ok ? " (cumplido)" : " (pendiente)"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
