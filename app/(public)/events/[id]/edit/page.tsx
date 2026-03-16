import { getTranslations } from "next-intl/server";
import getEventById from "@/actions/getEventById";
import { DashboardHeader } from "@/components/dashboard/header";
// import { EventForm } from "@/components/forms/event-form";
import Spinner from "@/components/Spinner";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Modifica Evento - ${siteConfig.name}`,
	description: "Edit Event",
});

export default async function EditEventPage({
	params,
}: {
	params: { id: string };
}) {
	const t = await getTranslations("NewEventPage");
	const event = await getEventById(params.id);
	if (!event) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div>
			<DashboardHeader
				heading={t("header_title_edit")}
				text={t("header_description_edit")}
			/>
			<div className="mt-4 flex flex-col gap-5">
				{/* <EventForm event={event} /> */}
				TODO: Event form
			</div>
		</div>
	);
}
