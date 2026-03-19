import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { EventForm } from "@/components/forms/event-form";
import { constructMetadata, siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
  title: `Nuovo Evento - ${siteConfig.name}`,
  description: "Create a new Event",
});

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return null;
  }
  const t = await getTranslations("NewEventPage");
  return (
    <div className="container mt-10">
      <DashboardHeader
        heading={t("header_title")}
        text={t("header_description")}
      />
      <div className="mt-4 flex flex-col gap-5">
        <EventForm />
      </div>
    </div>
  );
}
