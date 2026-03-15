import { prisma } from "@/lib/prisma";

async function main() {
	// Fetch all users
	const allUsers = await prisma.user.findMany({});
	console.log("All users:", allUsers.length);
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
