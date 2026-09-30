import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** The dashed "add news" card admins see at the top of the news list. */
export default async function CreateNewsCard() {
	const t = await getTranslations("NewsPage");
	return (
		<Link
			href="/news/new"
			className="group flex h-full min-h-72 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 text-gray-500 transition-all duration-300 hover:border-primary hover:bg-gray-50 hover:text-primary"
		>
			<div className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-current transition-transform duration-300 group-hover:scale-110">
				<Plus className="size-7" />
			</div>
			<span className="text-lg font-semibold">{t("add_news")}</span>
		</Link>
	);
}
