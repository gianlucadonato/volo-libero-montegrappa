import { format } from "date-fns";
import { it } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NewsListItem } from "@/store/news";

type Props = {
	news: NewsListItem;
	sizes: string;
	className?: string;
	/** Shown to admins, who also see drafts and scheduled news. */
	badge?: string;
	headingLevel?: "h2" | "h3";
};

export default function NewsCard({
	news,
	sizes,
	className,
	badge,
	headingLevel: Heading = "h2",
}: Props) {
	return (
		<Link
			href={`/news/${news.slug}`}
			className={cn(
				"group flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md",
				className,
			)}
		>
			{news.coverUrl ? (
				<div className="relative aspect-video w-full overflow-hidden bg-slate-100">
					<Image
						src={news.coverUrl}
						alt={news.title}
						fill
						sizes={sizes}
						className="object-cover transition group-hover:scale-105"
					/>
				</div>
			) : (
				<div className="aspect-video w-full bg-linear-to-br from-slate-100 to-slate-200" />
			)}
			<div className="flex flex-1 flex-col gap-2 p-4">
				<div className="flex items-center justify-between gap-2">
					<time className="text-xs uppercase text-gray-500">
						{format(news.publishedAt, "d MMMM yyyy", { locale: it })}
					</time>
					{badge && (
						<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
							{badge}
						</span>
					)}
				</div>
				<Heading
					className={cn(
						"font-heading leading-snug",
						Heading === "h2" ? "text-lg" : "text-base line-clamp-2",
					)}
				>
					{news.title}
				</Heading>
				{news.excerpt && (
					<p
						className={cn(
							"text-sm text-gray-600",
							Heading === "h2" ? "line-clamp-3" : "line-clamp-2",
						)}
					>
						{news.excerpt}
					</p>
				)}
			</div>
		</Link>
	);
}
