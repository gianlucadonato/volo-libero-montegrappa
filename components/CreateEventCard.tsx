"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";

export default function CreateEventCard() {
	const t = useTranslations("EventsPage");
	const { data: session } = authClient.useSession();
	if (!session || session?.user?.role !== "ADMIN") return null;
	return (
		<Link
			href="/events/new"
			className="group flex h-full min-h-80 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 text-gray-500 transition-all duration-300 hover:border-primary hover:bg-gray-50 hover:text-primary"
		>
			<div className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-current transition-transform duration-300 group-hover:scale-110">
				<Plus className="size-7" />
			</div>
			<span className="text-lg font-semibold">{t("add_event")}</span>
		</Link>
	);
}
