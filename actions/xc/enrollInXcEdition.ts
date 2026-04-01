"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getActiveXcEdition } from "@/lib/xc";
import { XcEnrollmentStatus } from "@/prisma/generated/enums";

export default async function enrollInXcEdition() {
	const user = await getSessionUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	const edition = await getActiveXcEdition();

	if (!edition) {
		throw new Error("Nessuna edizione XC attiva");
	}

	// Check if user is already enrolled in this edition
	const existingEnrollment = await prisma.xcEnrollment.findUnique({
		where: {
			userId_editionId: {
				userId: user.id,
				editionId: edition.id,
			},
		},
	});

	if (existingEnrollment) {
		throw new Error("Sei già iscritto al brevetto XC per quest'anno");
	}

	const enrollment = await prisma.xcEnrollment.create({
		data: {
			userId: user.id,
			editionId: edition.id,
			status: XcEnrollmentStatus.ACTIVE,
		},
	});

	return enrollment;
}
