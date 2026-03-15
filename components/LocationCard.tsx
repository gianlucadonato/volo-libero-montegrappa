import Image from "next/image";
import type { ReactNode } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@/components/ui/table";

export type LocationType = {
	id: string;
	title: string;
	location: string;
	description: string | ReactNode;
	image?: string;
	table: {
		location: string;
		altitude?: string;
		direction?: string;
		top_landing?: string;
		gps: string;
		parking?: string;
		ristoro?: string;
		wc?: string;
	};
};

export default function LocationCard({ location }: { location: LocationType }) {
	return (
		<div
			key={location.id}
			className="group order-last grid gap-y-6 sm:order-first sm:col-span-12 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:col-span-10 lg:col-start-2 lg:gap-x-12"
		>
			<div className="sm:col-span-5">
				<div className="mb-4 md:mb-6">
					<div className="flex text-xs uppercase tracking-wider text-muted-foreground">
						<span className="mr-3 md:mr-5 lg:mr-6">{location.location}</span>
					</div>
				</div>
				<h3 className="text-xl font-semibold md:text-2xl lg:text-3xl">
					{location.title}
				</h3>
				<div className="mt-4 flex items-center space-x-2 md:mt-5">
					<span className="md:text-base">{location.description}</span>
				</div>
				<div className="mt-4 flex items-center space-x-2 md:mt-5">
					<LocationTable location={location.table} />
				</div>
			</div>
			{location.image && (
				<div className="order-first sm:order-last sm:col-span-5">
					<div className="text-clip rounded-lg border border-border">
						<Image
							src={location.image}
							alt={location.title}
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

function LocationTable({ location }: { location: LocationType["table"] }) {
	return (
		<Table>
			<TableBody>
				<TableRow className="w-full">
					<TableHead>Località Decollo</TableHead>
					<TableCell>{location.location}</TableCell>
				</TableRow>
				{location.altitude && (
					<TableRow className="w-full">
						<TableHead>Altezza</TableHead>
						<TableCell>{location.altitude}</TableCell>
					</TableRow>
				)}
				{location.direction && (
					<TableRow className="w-full">
						<TableHead>Direzione vento</TableHead>
						<TableCell>{location.direction}</TableCell>
					</TableRow>
				)}
				{location.top_landing && (
					<TableRow className="w-full">
						<TableHead>Top landing</TableHead>
						<TableCell>{location.top_landing}</TableCell>
					</TableRow>
				)}
				<TableRow className="w-full">
					<TableHead>Coordinate Gps</TableHead>
					<TableCell>{location.gps}</TableCell>
				</TableRow>
				{location.ristoro && (
					<TableRow className="w-full">
						<TableHead>Strutture ristoro</TableHead>
						<TableCell>{location.ristoro}</TableCell>
					</TableRow>
				)}
				{location.wc && (
					<TableRow className="w-full">
						<TableHead>Servizi igienici</TableHead>
						<TableCell>{location.wc}</TableCell>
					</TableRow>
				)}
				{location.parking && (
					<TableRow className="w-full">
						<TableHead>Parcheggio</TableHead>
						<TableCell>{location.parking}</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
