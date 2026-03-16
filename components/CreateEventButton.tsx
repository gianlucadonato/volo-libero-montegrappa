"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function CreateEventButton() {
  const t = useTranslations("EventsPage");
  const { data: session } = authClient.useSession();
  if (!session || session?.user?.role !== "ADMIN") return null;
  return (
    <Link href="/events/new">
      <Button variant="outline" className="rounded-full">
        <Plus className="size-4" />
        <span className="ml-2 hidden sm:block">{t("create_event")}</span>
      </Button>
    </Link>
  );
}
