import { notFound } from "next/navigation";
import MarkdocContent from "@/components/content/MarkdocContent";
import { constructMetadata, siteConfig } from "@/config/site";
import { getPage, listPageSlugs } from "@/lib/pages";

type Params = Promise<{ slug: string }>;

/**
 * Catch-all for the static markdown pages in content/pages: /privacy-policy,
 * /terms-conditions, /about, /contact, /mog.
 *
 * Being the only dynamic segment at the root of (public), this also swallows
 * every unmatched single-segment path — static routes such as /decolli win, and
 * anything else falls through to notFound(), which is the 404 it would have
 * got anyway.
 */

// The set of pages is fixed at build time and the files never change at
// runtime, so prerender them and drop the dynamic fallback.
export const dynamicParams = false;

export function generateStaticParams() {
	return listPageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
	const { slug } = await params;
	const page = getPage(slug);
	if (!page) return constructMetadata();
	return constructMetadata({
		title: `${page.title} - ${siteConfig.name}`,
		description: page.description,
	});
}

export default async function ContentPage({ params }: { params: Params }) {
	const { slug } = await params;
	const page = getPage(slug);
	if (!page) notFound();

	return (
		<article className="container mx-auto max-w-3xl px-4 py-10">
			<header className="mb-8">
				<h1 className="font-heading text-3xl leading-tight md:text-4xl">
					{page.title}
				</h1>
				{page.description && (
					<p className="mt-3 text-lg text-gray-600">{page.description}</p>
				)}
			</header>

			<div className="prose prose-slate max-w-none prose-headings:font-heading prose-img:rounded-lg">
				<MarkdocContent node={page.node} />
			</div>
		</article>
	);
}
