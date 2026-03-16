import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const user = await getSessionUser();
  if (user) {
    if (user.role === "ADMIN") redirect("/admin");
    redirect("/profile");
  }
  return <>{children}</>;
}
