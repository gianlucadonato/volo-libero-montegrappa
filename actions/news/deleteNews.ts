"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

/** Soft-deletes a news: it disappears from the site but its row is kept. */
export default async function deleteNews(id: string) {
	const user = await getSessionUser();
	if (!user || user.role !== "ADMIN") {
		throw new Error("Unauthorized");
	}

	const news = await prisma.news.update({
		where: { id },
		data: { deletedAt: new Date() },
	});

	revalidatePath("/news");
	revalidatePath(`/news/${news.slug}`);
	revalidatePath("/");
}
