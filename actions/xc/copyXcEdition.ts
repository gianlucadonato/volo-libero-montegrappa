import { prisma } from "@/lib/prisma";

export default async function copyXcEdition(year: number, newYear: number) {
	console.log(
		`🌱 Creating new XC edition from year ${year} to year ${newYear}...`,
	);
	const existingTasks = await prisma.xcTask.findMany({
		where: { editionTasks: { every: { edition: { year } } } },
	});
	if (!existingTasks.length) {
		console.warn(
			`⚠️ No tasks found for edition ${year}. Creating empty edition?`,
		);
		return;
	}
	console.log("🐞 > existingTasks:", existingTasks.length);

	// Update active status of existing editions
	await prisma.xcEdition.updateMany({
		where: { isActive: true },
		data: { isActive: false },
	});
	// Create new edition with copied tasks
	const newEdition = await prisma.xcEdition.create({
		data: {
			year: newYear,
			title: `XC Montegrappa ${newYear}`,
			isActive: true,
			startsAt: new Date(`${newYear}-01-01T00:00:00Z`),
			endsAt: new Date(`${newYear}-12-31T23:59:59Z`),
		},
	});
	console.log("✅ New edition created!", newEdition.year);

	const editionTasks = await prisma.xcEditionTasks.createMany({
		data: existingTasks.map((task) => ({
			editionId: newEdition.id,
			taskId: task.id,
		})),
	});
	console.log("✅ editionTasks created:", editionTasks.count);

	return newEdition;
}
