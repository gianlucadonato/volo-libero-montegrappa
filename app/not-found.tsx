import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
	const t = useTranslations("NotFoundPage");
	return (
		<div className="flex min-h-screen flex-col items-center justify-center">
			<h1 className="text-6xl font-bold">404</h1>
			<h1 className="text-2xl font-bold">{t("title")}</h1>
			<Image
				src="/_static/illustrations/rocket-crashed.svg"
				alt="404"
				width={400}
				height={400}
				className="pointer-events-none mb-5 mt-6 dark:invert"
			/>
			<p className="text-balance px-4 text-center text-2xl font-medium">
				{t("description")}
			</p>
			<p className="mt-2 text-balance px-4 text-center text-xl font-medium">
				{t("back_to")}{" "}
				<Link
					href="/"
					className="text-muted-foreground underline underline-offset-4 hover:text-purple-500"
				>
					Home
				</Link>
				.
			</p>
		</div>
	);
}
