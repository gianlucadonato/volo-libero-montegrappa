import { ArrowRight } from "lucide-react";
import Link from "next/link";
import LocationCard from "@/components/LocationCard";
import LocationsMapLoader from "@/components/locations/LocationsMapLoader";
import { allLocationPins } from "@/components/locations/location-pins";
import { Button } from "@/components/ui/button";
import { TAKEOFFS } from "@/config/takeoffs";

export default function DecolliPage() {
	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/bg-montegrappa.webp')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							Decolli
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							Visualizza i punti di decollo
						</h3>
					</div>
				</div>
			</div>
			<section className="px-4 pt-10">
				<div className="container mx-auto">
					<LocationsMapLoader pins={allLocationPins()} focus="takeoff" />
				</div>
			</section>
			<section className="px-4 py-20">
				<div className="container mx-auto flex flex-col items-center gap-16">
					<div className="grid gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20">
						{TAKEOFFS.map((location) => (
							<LocationCard key={location.id} location={location} />
						))}
					</div>
				</div>
			</section>
			<section className="flex justify-center">
				<Link href="/atterraggi">
					<Button>
						<span>Vedi Atterraggi</span>
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</Link>
			</section>
		</div>
	);
}
