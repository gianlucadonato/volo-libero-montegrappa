import { exportJsonAsXlsx } from "@/lib/export-xlsx";
import { prisma } from "@/lib/prisma";

async function main() {
	const users = await prisma.user.findMany({
		where: {
			memberships: {
				some: {
					year: 2026,
				},
			},
		},
		select: {
			firstName: true,
			lastName: true,
			size: true,
		},
		orderBy: {
			lastName: "asc",
		},
	});

	console.log(`Found ${users.length} members with 2026 membership:\n`);

	const rows = users.map((user) => ({
		Cognome: user.lastName,
		Nome: user.firstName,
		Taglia: user.size ?? "N/A",
		Consegnata: "",
	}));

	const fileName = "soci-2026-tshirts.xlsx";
	await exportJsonAsXlsx(rows, fileName, "Members 2026");
	console.log(`\nExported to ${fileName}`);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
