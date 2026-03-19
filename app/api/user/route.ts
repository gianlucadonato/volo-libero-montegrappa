import { headers } from "next/headers";
import { auth } from "@/auth"; // path to your Better Auth server instance
import { prisma } from "@/lib/prisma";

export const DELETE = async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		return new Response("Not authenticated", { status: 401 });
	}
	if (!session.user) {
		return new Response("Invalid user", { status: 401 });
	}
	try {
		await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				deletedAt: new Date(),
			},
		});
		console.log("User deleted successfully!");
	} catch (_error) {
		return new Response("Internal server error", { status: 500 });
	}
	return new Response("User deleted successfully!", { status: 200 });
};
