import { ArrowRight } from "lucide-react";
import Link from "next/link";
import LocationCard, { type LocationType } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { PUBLIC_MEDIA_BASE_URL } from "@/config/constants";

const locations: LocationType[] = [
	{
		id: "garden",
		title: "Atterraggio Garden Relais",
		location: "Semonzo del Grappa - TV",
		description: (
			<div>
				<div>
					Ampio atterraggio situato nella frazione di Semonzo presso la
					struttura alberghiera Garden Relais, in via Casa 22, Borso del Grappa,
					Treviso.
				</div>
				<div>
					È adatto per l&apos;atterraggio di deltaplani e parapendio. Offre la
					possibilità di atterrare nelle quattro direzioni: nord, sud, ovest e
					est.
				</div>
				<div>
					Si raccomanda di prestare particolare attenzione negli atterraggi con
					vento sostenuto da ovest perché in sottovento rispetto alle colline e
					alla struttura dell&apos;albergo. Attenzione anche agli alberi e
					vigneti che circondano il campo, nonché al parcheggio auto situato
					lungo il lato nord. Le aree atterrabili sono contrassegnate sulla foto
					con le lettere A, B e C.
				</div>
				<div>
					Nel caso di atterraggio fuori campo, si prega di spostarsi verso le
					aree di piegamento il più velocemente possibile.
				</div>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/atterraggi-garden-vento-sud-est-ovest.jpg`,
		table: {
			location: "Semonzo",
			altitude: "130 m",
			parking: "Si",
			gps: "45.80653, 11.78532",
			ristoro: "Si",
			wc: "Si",
		},
	},
	{
		id: "paradiso",
		title: "Atterraggio Paradiso",
		location: "Semonzo del Grappa - TV",
		description: (
			<div>
				L&apos;atterraggio Paradiso è situato nella frazione di Semonzo, in via
				Casale Nuovo, all&apos;incrocio con via Giovanni da Semonzo.
				<div>
					È adatto solo ed esclusivamente per gli atterraggi in parapendio. Si
					raccomanda di prestare particolare attenzione alla rete elettrica e
					telefonica situata a sud del campo, così come ai vigneti e alberi che
					lo circondano. Nella foto, sono indicate le aree atterrabili
					contrassegnate con le lettere A e B.
				</div>
				<div>
					Si invita a rispettare le aree private e, in caso di atterraggio fuori
					campo, uscire senza arrecare danni.
				</div>
				<div>
					L&apos;atterraggio dispone di un ampio parcheggio, di servizi igienici
					e di aree di ristoro a poche centinaia di metri di distanza,
					raggiungibili a piedi.
				</div>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/atterraggi-paradiso-vento-sud-est-ovest.jpg`,
		table: {
			location: "Semonzo del Grappa",
			altitude: "190 m",
			parking: "Si",
			gps: "45.80818, 11.7699",
			ristoro: "100m",
			wc: "Si",
		},
	},
];

export default function AtterraggiPage() {
	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/bg-montegrappa.webp')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							Atterraggi Atterraggi
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							Visualizza i punti di atterraggio
						</h3>
					</div>
				</div>
			</div>
			<section className="px-4 py-20">
				<div className="container mx-auto flex flex-col items-center gap-16">
					<div className="grid gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20">
						{locations.map((location) => (
							<LocationCard key={location.id} location={location} />
						))}
					</div>
				</div>
			</section>
			<section className="flex justify-center">
				<Link href="/decolli">
					<Button>
						<span>Vedi Decolli</span>
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</Link>
			</section>
		</div>
	);
}
