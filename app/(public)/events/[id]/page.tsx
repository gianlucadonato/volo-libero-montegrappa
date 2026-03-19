import { Suspense } from "react";
import getEventById from "@/actions/getEventById";
import EventDetails from "@/components/EventDetails";
import Spinner from "@/components/Spinner";

export default async function EventPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const event = await getEventById(id);
	if (!event) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div>
			<Suspense fallback={<Spinner />}>
				<EventDetails event={event} />
			</Suspense>
		</div>
	);
}
