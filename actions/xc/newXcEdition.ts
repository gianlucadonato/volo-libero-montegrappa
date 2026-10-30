import { prisma } from "@/lib/prisma";
import { xcSeasonRange } from "@/lib/xc-season";

export default async function newXcEdition(year: number, isActive?: boolean) {
	console.log(`🌱 Creating new XC edition for year ${year}...`);
	const newEdition = await prisma.xcEdition.create({
		data: {
			id: year,
			title: `XC Montegrappa ${year}`,
			isActive,
			...xcSeasonRange(year),
		},
	});
	console.log("✅ New edition created!", newEdition.id);
	return newEdition;
}
