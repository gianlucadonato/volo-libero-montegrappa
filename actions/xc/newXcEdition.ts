import { prisma } from "@/lib/prisma";

export default async function newXcEdition(year: number, isActive?: boolean) {
	console.log(`🌱 Creating new XC edition for year ${year}...`);
	const newEdition = await prisma.xcEdition.create({
		data: {
			id: year,
			title: `XC Montegrappa ${year}`,
			isActive,
			startsAt: new Date(`${year}-01-01T00:00:00Z`),
			endsAt: new Date(`${year}-12-31T23:59:59Z`),
		},
	});
	console.log("✅ New edition created!", newEdition.id);
	return newEdition;
}
