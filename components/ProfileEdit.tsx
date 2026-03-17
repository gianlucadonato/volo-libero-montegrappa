"use client";

import type { User } from "@/prisma/generated/client";
import { UserForm } from "./forms/user-form";

export default function ProfileEdit({
  user,
  onSave,
}: {
  user: User;
  onSave?: () => void;
}) {
  return <UserForm user={user} onSave={onSave} />;
}
