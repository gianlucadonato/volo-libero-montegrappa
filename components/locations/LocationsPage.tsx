import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LocationCard, { MESSAGE_GROUPS } from "@/components/LocationCard";
import LocationsMapLoader from "@/components/locations/LocationsMapLoader";
import type { LocationKind } from "@/components/locations/location-kinds";
import { allLocationPins } from "@/components/locations/location-pins";
import { Button } from "@/components/ui/button";
import { LANDINGS } from "@/config/landings";
import { TAKEOFFS } from "@/config/takeoffs";

const LOCATIONS = { takeoff: TAKEOFFS, landing: LANDINGS };
/** The page of the other kind, for the button at the bottom. */
const OTHER_PAGE: Record<LocationKind, string> = {
	takeoff: "/atterraggi",
	landing: "/decolli",
};

/** /decolli and /atterraggi: banner, map of every location, then the cards. */
export default function LocationsPage({ kind }: { kind: LocationKind }) {
	const t = useTranslations("Locations");
	const page = `pages.${MESSAGE_GROUPS[kind]}` as const;
	const pins = allLocationPins((pinKind, name) =>
		t(`${pinKind}Title`, { name }),
	);

	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/bg-montegrappa.webp')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							{t(`${page}.title`)}
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							{t(`${page}.subtitle`)}
						</h3>
					</div>
				</div>
			</div>
			<section className="px-4 pt-10">
				<div className="container mx-auto">
					<LocationsMapLoader pins={pins} focus={kind} />
				</div>
			</section>
			<section className="px-4 py-20">
				<div className="container mx-auto flex flex-col items-center gap-16">
					<div className="grid gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20">
						{LOCATIONS[kind].map((location) => (
							<LocationCard key={location.id} location={location} kind={kind} />
						))}
					</div>
				</div>
			</section>
			<section className="flex justify-center">
				<Link href={OTHER_PAGE[kind]}>
					<Button>
						<span>{t(`${page}.seeOther`)}</span>
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</Link>
			</section>
		</div>
	);
}
