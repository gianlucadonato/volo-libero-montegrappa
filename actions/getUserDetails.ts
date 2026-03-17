import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function getUserDetails() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return undefined;
  }
  const user = await prisma.user.findUnique({
    where: {
      id: sessionUser.id,
    },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
      },
      memberships: {
        orderBy: { membership: { year: "desc" } },
      },
      coupons: {
        orderBy: { year: "desc" },
      },
    },
  });

  return user;
}
