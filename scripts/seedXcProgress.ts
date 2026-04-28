import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { XcCategoryLevel } from "@/prisma/generated/enums";

const EDITION_YEAR = NEXT_YEAR;
const MAX_USERS = 35;

function rand(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
	return Math.floor(rand(min, max + 1));
}

function pickPoints(edition: { minPoints: number; maxPoints: number }) {
	// Some users above min (completed), some below
	const completed = Math.random() < 0.5;
	if (completed) {
		return randInt(edition.minPoints, edition.maxPoints);
	}
	return randInt(Math.max(50, edition.minPoints - 400), edition.minPoints - 1);
}

async function ensureEnrollment(userId: string, editionId: number) {
	await prisma.xcEnrollment.upsert({
		where: { userId_editionId: { userId, editionId } },
		update: {},
		create: { userId, editionId },
	});
}

async function seedProgress() {
	const edition = await prisma.xcEdition.findUnique({
		where: { id: EDITION_YEAR },
	});
	if (!edition) {
		throw new Error(
			`XcEdition ${EDITION_YEAR} not found. Run db:seed (seedXcTasks) first.`,
		);
	}

	const users = await prisma.user.findMany({
		where: { deletedAt: null },
		orderBy: { createdAt: "desc" },
		take: MAX_USERS,
	});

	if (users.length === 0) {
		throw new Error("No users found in the database.");
	}
	console.log(`👥 Loaded ${users.length} real users`);

	const categories: XcCategoryLevel[] = [
		XcCategoryLevel.BASIC,
		XcCategoryLevel.INTERMEDIATE,
		XcCategoryLevel.ADVANCED,
	];

	let created = 0;
	for (const user of users) {
		await ensureEnrollment(user.id, edition.id);

		for (const category of categories) {
			// 70% chance the user has progress in this category
			if (Math.random() > 0.7) continue;

			const points = pickPoints(edition);
			const isCompleted = points >= edition.minPoints;
			// Spread completedAt over the last 6 months for tie-breaking variety
			const completedAt = isCompleted
				? new Date(Date.now() - randInt(1, 180) * 24 * 60 * 60 * 1000)
				: null;

			await prisma.xcProgress.upsert({
				where: {
					userId_editionId_category: {
						userId: user.id,
						editionId: edition.id,
						category,
					},
				},
				update: {
					points,
					minPoints: edition.minPoints,
					totalDistanceKm: Math.round(rand(20, 600) * 10) / 10,
					flightTimeHrs: Math.round(rand(1, 80) * 10) / 10,
					maxAltM: Math.round(rand(1500, 3500)),
					completedAt,
				},
				create: {
					userId: user.id,
					editionId: edition.id,
					category,
					points,
					minPoints: edition.minPoints,
					totalDistanceKm: Math.round(rand(20, 600) * 10) / 10,
					flightTimeHrs: Math.round(rand(1, 80) * 10) / 10,
					maxAltM: Math.round(rand(1500, 3500)),
					completedAt,
				},
			});
			created++;
		}
	}

	// Force at least one tie at the top of each category to verify completedAt tie-break
	for (const category of categories) {
		const tieUsers = users.slice(0, 2);
		const tiePoints = edition.maxPoints;
		for (let i = 0; i < tieUsers.length; i++) {
			const user = tieUsers[i];
			const completedAt = new Date(
				Date.now() - (10 + i * 5) * 24 * 60 * 60 * 1000,
			);
			await prisma.xcProgress.upsert({
				where: {
					userId_editionId_category: {
						userId: user.id,
						editionId: edition.id,
						category,
					},
				},
				update: { points: tiePoints, completedAt },
				create: {
					userId: user.id,
					editionId: edition.id,
					category,
					points: tiePoints,
					minPoints: edition.minPoints,
					totalDistanceKm: 500,
					flightTimeHrs: 50,
					maxAltM: 3000,
					completedAt,
				},
			});
		}
	}

	console.log(
		`✅ Seeded ~${created} XcProgress rows for edition ${edition.id}`,
	);
}

seedProgress()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
