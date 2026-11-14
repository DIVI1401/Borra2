"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, ShieldIcon, StoreIcon, UserIcon, HeartIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { signOut } from "@/services/auth-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu() {
  const { loading, user, profile, claims } = useAuth();
  const router = useRouter();

  if (loading) return <Skeleton className="size-8 rounded-full" />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/entrar" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Entrar
        </Link>
        <Link href="/registro" className={buttonVariants({ size: "sm" })}>
          Crear cuenta
        </Link>
      </div>
    );
  }

  const name = profile?.displayName ?? user.displayName ?? "Mi cuenta";

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Cerraste sesión.");
      router.push("/");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Abrir el menú de tu cuenta"
      >
        <Avatar>
          {user.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate font-medium text-foreground">{name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/perfil")}>
          <UserIcon aria-hidden="true" /> Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/favoritos")}>
          <HeartIcon aria-hidden="true" /> Favoritos
        </DropdownMenuItem>
        {claims.role === "venue" ? (
          <DropdownMenuItem onClick={() => router.push("/panel")}>
            <StoreIcon aria-hidden="true" /> Panel de mi local
          </DropdownMenuItem>
        ) : null}
        {claims.role === "admin" ? (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <ShieldIcon aria-hidden="true" /> Administración
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOutIcon aria-hidden="true" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
