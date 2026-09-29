"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import type { EventSchema } from "@/schemas";

type FormData = z.infer<typeof EventSchema>;

const formatData = (data: FormData) => ({
	...data,
	eventDate: new Date(data.eventDate),
	optionalDate: data.optionalDate ? new Date(data.optionalDate) : null,
	// Prisma skips undefined fields on update, so a removed cover must be an
	// explicit null to clear the column.
	imageUrl: data.imageUrl || null,
	price: (data.price || 0) * 100,
});

export default async function upsertEvent(data: FormData & { id?: string }) {
	const user = await getSessionUser();
	if (!user || user.role !== "ADMIN") {
		throw new Error("Unauthorized");
	}

	const event = data.id
		? await prisma.event.update({
				where: { id: data.id },
				data: formatData(data),
			})
		: await prisma.event.create({
				data: {
					...formatData(data),
					createdBy: user.id,
				},
			});

	revalidatePath("/events");
	return event;
}
