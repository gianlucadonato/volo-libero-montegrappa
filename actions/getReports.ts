import { prisma } from "@/lib/prisma";

export default async function getReports() {
	const reports = await prisma.report.findMany({
		orderBy: { createdAt: "desc" },
		take: 28,
	});
	return reports;
}
