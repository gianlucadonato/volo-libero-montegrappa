"use server";

import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { UserFormSchema } from "@/schemas";

type FormData = z.infer<typeof UserFormSchema>;

export default async function updateUser(id: string, payload: FormData) {
	const currentUser = await getSessionUser();
	if (!currentUser) {
		return { error: "Unauthenticated", status: 401 };
	}
	if (currentUser.id !== id && currentUser.role !== "ADMIN") {
		return { error: "Unauthorized", status: 403 };
	}

	try {
		const data = UserFormSchema.parse(payload);
		const user = await prisma.user.update({
			where: { id },
			data,
		});
		return { success: true, data: user };
	} catch (err) {
		return {
			success: false,
			error: "Failed to update user",
			message: err instanceof Error ? err.message : "Unknown error",
		};
	}
}
