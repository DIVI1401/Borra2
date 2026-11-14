import type { Metadata } from "next";
import { UsersAdmin } from "./users-admin";

export const metadata: Metadata = { title: "Usuarios" };

export default function UsersPage() {
  return <UsersAdmin />;
}
