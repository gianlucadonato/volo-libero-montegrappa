import newXcEdition from "@/actions/xc/newXcEdition";
import { prisma } from "@/lib/prisma";
import { XcTasks } from "./input/xc-tasks";

async function main() {
	const EDITION_YEAR = 2025;
	await seedEditionWithTasks(EDITION_YEAR, true);
	console.log(`\n✨ Seed completed successfully!`);
}

async function seedEditionWithTasks(year: number, isActive: boolean) {
	console.log(`\n📅 Seeding edition ${year} with tasks...`);

	// 1. Create or get edition
	let edition = await prisma.xcEdition.findFirst({
		where: { id: year },
	});

	if (!edition) {
		edition = await newXcEdition(year, isActive);
	}
	// 2. Seed tasks
	const slugMap = { BASIC: "B", INTERMEDIATE: "S", ADVANCED: "G" };

	const newTasks = await prisma.xcTask.createManyAndReturn({
		data: XcTasks.map((task) => ({
			...task,
			index: undefined,
			slug: `${slugMap[task.category]}${task.index}`,
		})),
	});
	console.log("🐞 > Total Tasks:", newTasks.length);

	if (newTasks.length > 0) {
		const editionWithTasks = await prisma.xcEditionTasks.createMany({
			data: newTasks.map((task) => ({
				editionId: edition.id,
				taskId: task.id,
			})),
		});
		console.log(
			`🐞 > Linked ${editionWithTasks.count} tasks to edition ${year}`,
		);
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
