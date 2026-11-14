import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Las pruebas de reglas comparten el emulador: se corren en orden.
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
