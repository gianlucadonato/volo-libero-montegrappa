import copyXcEdition from "@/actions/xc/copyXcEdition";
import { prisma } from "@/lib/prisma";

// Crea una nuova edizione XC per il prossimo anno
async function main() {
	const EDITION_YEAR = 2026;
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
