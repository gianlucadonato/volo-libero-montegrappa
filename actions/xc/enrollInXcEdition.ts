"use server";

import { isSocio } from "@/helpers/isSocio";
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

	const socio = await prisma.user.findFirst({
		where: { id: user.id },
		include: { memberships: true },
	});
	console.log("🐞 > socio:", socio, socio && !isSocio(socio));
	if (socio && !isSocio(socio)) {
		return {
			success: false,
			message: "The event is for members only!",
			code: 403,
		};
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
		return {
			success: false,
			message: "You are already enrolled in this edition!",
			code: 409,
		};
	}

	const enrollment = await prisma.xcEnrollment.create({
		data: {
			userId: user.id,
			editionId: edition.id,
			status: XcEnrollmentStatus.ACTIVE,
		},
	});

	return { success: true, data: enrollment };
}
