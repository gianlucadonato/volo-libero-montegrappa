import { prisma } from "@/lib/prisma";

export default async function getEventById(id: string) {
	const event = await prisma.event.findUnique({
		where: { id },
		include: {
			registrations: {
				include: {
					user: {
						select: { id: true, email: true, firstName: true, lastName: true },
					},
				},
			},
		},
	});
	return event;
}
