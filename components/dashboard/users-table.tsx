import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { User } from "@/prisma/generated/client";

export default function UsersTable({
	title,
	description,
	users,
	path,
}: {
	title: string;
	description?: string;
	users: User[];
	path: string;
}) {
	const t = useTranslations("UsersList");
	return (
		<Card className="xl:col-span-2">
			<CardHeader className="flex flex-row items-center">
				<div className="grid gap-2">
					<CardTitle>{title}</CardTitle>
					<CardDescription className="text-balance">
						{description}
					</CardDescription>
				</div>
				<Button size="sm" className="ml-auto shrink-0 gap-1 px-4">
					<Link href={path} className="flex items-center gap-2">
						<span>{t("view_all")}</span>
						<ArrowUpRight className="hidden size-4 sm:block" />
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12.5">ID</TableHead>
							<TableHead>{t("name")}</TableHead>
							<TableHead className="text-right">{t("created_at")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user) => (
							<TableRow key={user.id}>
								<TableCell>{user.memberId}</TableCell>
								<TableCell className="cursor-pointer">
									<Link
										href={`/admin/users/${user.id}`}
										className="block w-full"
									>
										<div className="font-medium">
											{user.firstName} {user.lastName}
										</div>
										<div className="hidden text-sm text-muted-foreground md:inline">
											{user.email}
										</div>
									</Link>
								</TableCell>
								<TableCell className="text-right">
									{format(user.createdAt, "dd/MM/yyyy HH:mm")}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
