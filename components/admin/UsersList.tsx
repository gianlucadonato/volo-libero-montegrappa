"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { UserWithMemberships } from "@/types";
import UsersDataTable from "./UsersDataTable";

export default function UsersList({ data }: { data: UserWithMemberships[] }) {
	return (
		<Card className="mt-2 xl:col-span-2">
			<CardContent>
				<UsersDataTable data={data} />
			</CardContent>
		</Card>
	);
}
