import Image from "next/image";
import { useTranslations } from "next-intl";
import type { LocationKind } from "@/components/locations/location-kinds";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@/components/ui/table";
import { formatWindDirection } from "@/lib/wind-directions";

/** Whether a facility is there: yes, no, or the distance it's at ("100 m"). */
export type Facility = boolean | string;

/**
 * A take-off or landing. Only language-neutral data: the title, description
 * and any warning or notice are in messages/*.json, under
 * Locations.takeoffs.<id> or Locations.landings.<id>.
 */
export type LocationType = {
	id: string;
	/** Proper name, the same in every language: "Tappeti". */
	name: string;
	/** Shown above the title: "Borso del Grappa - TV". */
	area: string;
	image?: string;
	table: {
		location: string;
		altitude?: string;
		/**
		 * "Direzione vento", written in Italian ("sud - sud/est"): shown as compass
		 * abbreviations ("S - SE") and drawn on the map's wind rose.
		 */
		direction?: string;
		topLanding?: boolean;
		gps: string;
		food?: Facility;
		toilets?: Facility;
		parking?: Facility;
	};
};

/** Where a location's texts live in the messages. */
export const MESSAGE_GROUPS: Record<LocationKind, "takeoffs" | "landings"> = {
	takeoff: "takeoffs",
	landing: "landings",
};

const RICH = { br: () => <br /> };

export default function LocationCard({
	location,
	kind,
}: {
	location: LocationType;
	kind: LocationKind;
}) {
	const t = useTranslations("Locations");
	const key = `${MESSAGE_GROUPS[kind]}.${location.id}`;
	const title = t(`${kind}Title`, { name: location.name });

	return (
		<div
			key={location.id}
			// Target of the map's "details" links (/decolli#tappeti).
			id={location.id}
			className="group order-last scroll-mt-8 grid gap-y-6 sm:order-first sm:col-span-12 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:col-span-10 lg:col-start-2 lg:gap-x-12"
		>
			<div className="sm:col-span-5">
				<div className="mb-4 md:mb-6">
					<div className="flex text-xs uppercase tracking-wider text-muted-foreground">
						<span className="mr-3 md:mr-5 lg:mr-6">{location.area}</span>
					</div>
				</div>
				<h3 className="text-xl font-semibold md:text-2xl lg:text-3xl">
					{title}
				</h3>
				<div className="mt-4 md:mt-5 md:text-base">
					<p>{t.rich(`${key}.description`, RICH)}</p>
					{t.has(`${key}.warning`) && (
						<p className="mt-4 rounded-md border border-red-500 bg-red-100 p-2 text-red-500">
							{t(`${key}.warning`)}
						</p>
					)}
					{t.has(`${key}.notice`) && (
						<p className="mt-2 font-bold uppercase">{t(`${key}.notice`)}</p>
					)}
				</div>
				<div className="mt-4 flex items-center space-x-2 md:mt-5">
					<LocationTable table={location.table} />
				</div>
			</div>
			{location.image && (
				<div className="order-first sm:order-last sm:col-span-5">
					<div className="text-clip rounded-lg border border-border">
						<Image
							src={location.image}
							alt={title}
							className="size-full object-cover transition-transform group-hover:scale-105"
							width={555}
							height={555}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

function LocationTable({ table }: { table: LocationType["table"] }) {
	const t = useTranslations("Locations");

	const yesNo = (value: boolean) => t(value ? "table.yes" : "table.no");
	const facility = (value: Facility) =>
		typeof value === "string"
			? t("table.nearby", { distance: value })
			: yesNo(value);

	const rows: [label: string, value: string | undefined][] = [
		[t("table.location"), table.location],
		[t("table.altitude"), table.altitude],
		[
			t("table.direction"),
			table.direction && formatWindDirection(table.direction),
		],
		[
			t("table.topLanding"),
			table.topLanding === undefined ? undefined : yesNo(table.topLanding),
		],
		[t("table.gps"), table.gps],
		[
			t("table.food"),
			table.food === undefined ? undefined : facility(table.food),
		],
		[
			t("table.toilets"),
			table.toilets === undefined ? undefined : facility(table.toilets),
		],
		[
			t("table.parking"),
			table.parking === undefined ? undefined : facility(table.parking),
		],
	];

	return (
		<Table>
			<TableBody>
				{rows
					.filter(([, value]) => value !== undefined)
					.map(([label, value]) => (
						<TableRow key={label} className="w-full">
							<TableHead>{label}</TableHead>
							<TableCell>{value}</TableCell>
						</TableRow>
					))}
			</TableBody>
		</Table>
	);
}
