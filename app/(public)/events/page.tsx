import { isBefore } from "date-fns";
import { getTranslations } from "next-intl/server";
import getEvents from "@/actions/getEvents";
import CreateEventButton from "@/components/CreateEventButton";
import { DashboardHeader } from "@/components/dashboard/header";
import EventCard from "@/components/EventCard";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Events - ${siteConfig.name}`,
	description: "Pagina eventi",
});

export default async function EventsPage() {
	const t = await getTranslations("EventsPage");
	const events = await getEvents();

	const upcomingEvents = events.filter(
		(event) => !isBefore(event.eventDate, new Date()),
	);
	const pastEvents = events
		.filter((event) => isBefore(event.eventDate, new Date()))
		.sort((a, b) => (isBefore(a.eventDate, b.eventDate) ? 1 : -1));

	return (
		<div>
			<div className="overflow-hidden">
				<div className="flex h-[25vh] flex-col bg-slate-50 bg-[url('/home/home1.jpg')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							{t("header_title")}
						</h1>
						<h3 className="pt-2 text-center text-white">
							{t("header_description")}
						</h3>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 pt-10">
				{events.length === 0 && (
					<div className="flex h-96 flex-col items-center justify-center">
						<p className="text-lg text-gray-500">{t("no_events")}</p>
						<div className="mt-2">
							<CreateEventButton />
						</div>
					</div>
				)}

				{upcomingEvents.length > 0 && (
					<div className="mb-12">
						<div className="my-6 pb-4">
							<DashboardHeader heading={t("upcoming_events")}>
								<CreateEventButton />
							</DashboardHeader>
						</div>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
							{upcomingEvents.map((event) => (
								<EventCard key={event.id} event={event} />
							))}
						</div>
					</div>
				)}

				{pastEvents.length > 0 && (
					<div className="mb-12 mt-10">
						<div className="my-6 pb-4">
							<DashboardHeader heading={t("past_events")}>
								{upcomingEvents.length === 0 && <CreateEventButton />}
							</DashboardHeader>
						</div>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
							{pastEvents.map((event) => (
								<EventCard key={event.id} event={event} />
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
