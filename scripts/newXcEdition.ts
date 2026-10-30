import copyXcEdition from "@/actions/xc/copyXcEdition";
import { prisma } from "@/lib/prisma";

// Create the XC edition for a season (1 Oct – 30 Sep, named after the year it
// ends in), copying the tasks of the previous one. Deactivates older editions.
async function main() {
	const EDITION_YEAR = 2027;
	await copyXcEdition(EDITION_YEAR - 1, EDITION_YEAR);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
