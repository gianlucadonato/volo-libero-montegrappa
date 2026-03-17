import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (user) {
    if (user.role === "ADMIN") redirect("/admin");
    redirect("/profile");
  }
  return children;
}
