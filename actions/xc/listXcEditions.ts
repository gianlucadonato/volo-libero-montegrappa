"use server";

import { prisma } from "@/lib/prisma";

export async function listXcEditions() {
	return prisma.xcEdition.findMany({
		select: {
			id: true,
			title: true,
			isActive: true,
			startsAt: true,
			endsAt: true,
		},
		orderBy: { id: "desc" },
	});
}
