import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import DeleteNewsButton from "@/components/news/DeleteNewsButton";
import { buttonVariants } from "@/components/ui/button";
import { constructMetadata, siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";
import { getNewsBySlug, getPublishedNewsBySlug } from "@/store/news";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }) {
	const { slug } = await params;
	const entry = await getPublishedNewsBySlug(slug);
	if (!entry) return constructMetadata({ title: `News - ${siteConfig.name}` });
	return constructMetadata({
		title: `${entry.title} - ${siteConfig.name}`,
		description: entry.excerpt || undefined,
		image: entry.coverUrl || undefined,
		path: `/news/${entry.slug}`,
		type: "article",
	});
}

export default async function NewsDetailPage({ params }: { params: Params }) {
	const { slug } = await params;
	const t = await getTranslations("NewsPage");
	const user = await getSessionUser();
	const isAdmin = user?.role === "ADMIN";

	// Admins can open drafts and scheduled news to preview them.
	const entry = isAdmin
		? await getNewsBySlug(slug)
		: await getPublishedNewsBySlug(slug);
	if (!entry) notFound();

	const isHidden = entry.draft || entry.publishedAt > new Date();

	return (
		<article className="container mx-auto max-w-3xl px-4 py-10">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<Link
					href="/news"
					className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
				>
					<ChevronLeft className="h-4 w-4" />
					{t("back_to_news")}
				</Link>
				{isAdmin && (
					<div className="flex gap-2">
						<Link
							href={`/news/${entry.slug}/edit`}
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							<Pencil className="mr-2 size-4" />
							{t("edit_news")}
						</Link>
						<DeleteNewsButton id={entry.id} />
					</div>
				)}
			</div>

			{isAdmin && isHidden && (
				<p className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
					{entry.draft ? t("draft_notice") : t("scheduled_notice")}
				</p>
			)}

			<header className="mb-8">
				<time className="text-xs uppercase text-gray-500">
					{format(entry.publishedAt, "d MMMM yyyy", { locale: it })}
				</time>
				<h1 className="mt-2 font-heading text-3xl leading-tight md:text-4xl">
					{entry.title}
				</h1>
				{entry.excerpt && (
					<p className="mt-3 text-lg text-gray-600">{entry.excerpt}</p>
				)}
			</header>

			{entry.coverUrl && (
				<div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
					<Image
						src={entry.coverUrl}
						alt={entry.title}
						fill
						sizes="(max-width: 768px) 100vw, 768px"
						className="object-cover"
						priority
					/>
				</div>
			)}

			<div
				className="news-content prose prose-slate max-w-none prose-img:rounded-lg prose-headings:font-heading"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: contentHtml is sanitised with an allowlist in renderNewsHtml when the news is saved.
				dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
			/>
		</article>
	);
}
