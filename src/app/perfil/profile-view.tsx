"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { hasPasswordProvider } from "@/services/auth-service";
import { ROLE_LABELS } from "@/types/user";
import { ProfileForm } from "./profile-form";
import { ChangeEmailForm } from "./change-email-form";
import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccountCard } from "./delete-account-card";

export function ProfileView() {
  const { user, profile, claims } = useAuth();
  if (!user) return null;
  const usesPassword = hasPasswordProvider(user);

  return (
    <main className="mx-auto grid w-full max-w-2xl gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl">Mi perfil</h1>
        <Badge variant="secondary">{ROLE_LABELS[claims.role]}</Badge>
      </div>
      <ProfileForm uid={user.uid} currentName={profile?.displayName ?? user.displayName ?? ""} />
      <ChangeEmailForm currentEmail={user.email ?? ""} usesPassword={usesPassword} />
      {usesPassword ? <ChangePasswordForm /> : null}
      <DeleteAccountCard usesPassword={usesPassword} />
    </main>
  );
}
