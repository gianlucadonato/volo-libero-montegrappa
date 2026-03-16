import { prisma } from "@/lib/prisma";

export default async function getEvents() {
	const events = await prisma.event.findMany({
		orderBy: { eventDate: "asc" },
		include: { registrations: true },
	});
	return events;
}
