import { getTranslations } from "next-intl/server";
import ComingSoon from "@/components/ComingSoon";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Weather - ${siteConfig.name}`,
	description: "Weather forecast",
});

export default async function MeteoPage() {
	const t = await getTranslations("MeteoPage");
	return (
		<div>
			<div className="overflow-hidden rounded font-mono">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/bg-montegrappa.webp')] bg-cover bg-top">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="text-2xl font-bold text-white">
							{t("header_title")}
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							{t("header_description")}
						</h3>
					</div>
				</div>
			</div>

			<div className="mb-12 min-h-[470px]">
				<div className="pt-12">
					<ComingSoon />
				</div>
			</div>
		</div>
	);
}
