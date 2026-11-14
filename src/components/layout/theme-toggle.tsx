"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Cambiar entre modo claro y oscuro"
      title={isDark ? "Modo claro" : "Modo oscuro"}
      suppressHydrationWarning
    >
      <SunIcon className="hidden dark:block" aria-hidden="true" />
      <MoonIcon className="block dark:hidden" aria-hidden="true" />
    </Button>
  );
}
