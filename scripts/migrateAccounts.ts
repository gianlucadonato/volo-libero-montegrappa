import { generateId } from "better-auth";
import { prisma } from "@/lib/prisma";

async function main() {
  // Fetch all users
  const allUsers = await prisma.user.findMany({});

  const accounts = allUsers.map((user) => ({
    id: generateId(),
    userId: user.id,
    accountId: user.id,
    password: user.password,
    providerId: "credential",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  const res = await prisma.account.createMany({
    data: accounts,
    skipDuplicates: true,
  });

  console.log("Accounts to migrate:", accounts.length);
  console.log("Accounts created:", res.count);
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
