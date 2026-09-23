"use server";

import { revalidatePath } from "next/cache";
import { isSocio } from "@/helpers/isSocio";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { EventRegistrationStatus } from "@/prisma/generated/client";

export async function registerToEvent(
	eventId: string,
	status: EventRegistrationStatus,
) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return { status: "error", message: "Unauthorized", code: 401 };
		}
		const event = await prisma.event.findUnique({
			where: { id: eventId },
		});
		if (!event) {
			return { status: "error", message: "Event not found!", code: 404 };
		}
		// Admins get in regardless: they run the events. `isSocio` used to let them
		// through itself, but it answers "does this user hold a membership", and
		// folding a permission into that made every caller inherit the exception.
		if (event.isMemberOnly && user.role !== "ADMIN") {
			const socio = await prisma.user.findFirst({
				where: { id: user.id },
				include: { memberships: true },
			});
			if (socio && !isSocio(socio)) {
				return {
					status: "error",
					message: "The event is for members only!",
					code: 409,
				};
			}
		}
		const res = await prisma.eventRegistration.upsert({
			where: { userId_eventId: { eventId, userId: user.id } },
			update: {
				status,
			},
			create: {
				eventId,
				userId: user.id,
				status: EventRegistrationStatus.REGISTERED,
			},
		});
		revalidatePath("/events");
		revalidatePath(`/events/${eventId}`);
		return { status: "success", registration: res };
	} catch (error) {
		return { status: "error", message: (error as Error).message, code: 500 };
	}
}
