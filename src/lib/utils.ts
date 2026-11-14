export { cn } from "cn"

/**
 * Solo acepta rutas internas para el parámetro ?next= (evita redirecciones abiertas
 * hacia sitios externos, ej. ?next=https://sitio-malo.com).
 */
export function safeNextPath(value: string | null, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback
  return value
}
