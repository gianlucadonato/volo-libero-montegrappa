import { prisma } from "@/lib/prisma";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import TaskBrevetto from "@/scripts/TaskBrevetto";

// Creates both a historical 2025 edition and the active 2026 edition (NEXT_YEAR)
const HISTORICAL_YEAR = 2025;
const ACTIVE_YEAR = 2026;

async function seedEditionWithTasks(year: number, isActive: boolean) {
	console.log(
		`\n📅 Seeding edition ${year} (${isActive ? "ACTIVE" : "historical"})...`,
	);

	// 1. Create or get edition
	let edition = await prisma.xcEdition.findFirst({
		where: { year },
	});

	if (!edition) {
		// If creating active edition, deactivate others first
		if (isActive) {
			await prisma.xcEdition.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			});
		}

		edition = await prisma.xcEdition.create({
			data: {
				year,
				title: `XC Montegrappa ${year}`,
				isActive,
				basicMinPoints: 50,
				interMinPoints: 70,
				advMinPoints: 90,
				startsAt: new Date(`${year}-04-01`),
				endsAt: new Date(`${year}-12-01`),
			},
		});
		console.log(`  ✅ Created edition ${year}`);
	} else {
		// Update active status
		if (edition.isActive !== isActive) {
			if (isActive) {
				await prisma.xcEdition.updateMany({
					where: { isActive: true },
					data: { isActive: false },
				});
			}
			edition = await prisma.xcEdition.update({
				where: { id: edition.id },
				data: { isActive },
			});
		}
		console.log(`  ✅ Edition ${year} already exists`);
	}

	// 2. Create categories
	const categories = await Promise.all([
		prisma.xcCategory.upsert({
			where: {
				editionId_level: {
					editionId: edition.id,
					level: XcCategoryLevel.BASIC,
				},
			},
			update: {},
			create: {
				editionId: edition.id,
				level: XcCategoryLevel.BASIC,
				minPoints: 50,
				title: "Bronze",
				description:
					"Percorsi brevi ideali per chi si avvicina al volo cross-country.",
			},
		}),
		prisma.xcCategory.upsert({
			where: {
				editionId_level: {
					editionId: edition.id,
					level: XcCategoryLevel.INTERMEDIATE,
				},
			},
			update: {},
			create: {
				editionId: edition.id,
				level: XcCategoryLevel.INTERMEDIATE,
				minPoints: 70,
				title: "Silver",
				description: "Percorsi più lunghi e tecnici per piloti con esperienza.",
			},
		}),
		prisma.xcCategory.upsert({
			where: {
				editionId_level: {
					editionId: edition.id,
					level: XcCategoryLevel.ADVANCED,
				},
			},
			update: {},
			create: {
				editionId: edition.id,
				level: XcCategoryLevel.ADVANCED,
				minPoints: 90,
				title: "Gold",
				description: "Percorsi per piloti esperti con difficoltà elevata.",
			},
		}),
	]);

	// 3. Seed tasks
	const typeToCategory: Record<string, (typeof categories)[0]> = {
		basic: categories[0],
		intermediate: categories[1],
		advanced: categories[2],
	};

	let createdCount = 0;
	let skippedCount = 0;

	for (const task of TaskBrevetto) {
		const category = typeToCategory[task.type];
		if (!category) continue;

		const existingTask = await prisma.xcTask.findFirst({
			where: { categoryId: category.id, name: task.name },
		});

		if (!existingTask) {
			await prisma.xcTask.create({
				data: {
					categoryId: category.id,
					slug: `${task.id}-${task.name
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-")
						.replace(/^-+|-+$/g, "")}`,
					name: task.name,
					description: task.description,
					points: task.points,
					distanceKm: task.distance,
					taskFileUrl: task.gpx,
					imageUrl: task.image,
					isPublished: true,
				},
			});
			createdCount++;
		} else {
			skippedCount++;
		}
	}

	console.log(
		`  ✅ Tasks: ${createdCount} created, ${skippedCount} already existed`,
	);
	return { edition, categories, createdCount };
}

async function seedXcTasks() {
	try {
		console.log(`🌱 Starting XC Tasks seed...`);

		// Create historical 2025 edition
		await seedEditionWithTasks(HISTORICAL_YEAR, false);

		// Create active 2026 edition
		await seedEditionWithTasks(ACTIVE_YEAR, true);

		// Summary stats
		const totalTasks = await prisma.xcTask.count();
		const totalCategories = await prisma.xcCategory.count();
		const totalEditions = await prisma.xcEdition.count();
		const activeEdition = await prisma.xcEdition.findFirst({
			where: { isActive: true },
		});

		console.log(`
📊 Final Statistics:
  - Editions: ${totalEditions} (Active: ${activeEdition?.year ?? "none"})
  - Categories: ${totalCategories}
  - Total Tasks: ${totalTasks}
		`);

		console.log(`\n✨ Seed completed successfully!`);
		process.exit(0);
	} catch (error) {
		console.error("❌ Seed failed:", error);
		process.exit(1);
	}
}

seedXcTasks();
