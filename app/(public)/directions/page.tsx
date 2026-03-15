import { Car, Plane, Train } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@/components/ui/table";

type CentroOperativoType = {
	id: string;
	title: string;
	address: string;
	description: ReactNode;
	image?: string;
	table: {
		location: string;
		url: string;
		address: string;
		parking: string;
		gps: string;
	};
};

const location: CentroOperativoType = {
	id: "sede",
	title: "La nostra sede",
	address: "Borso del Grappa (TV)",
	description: (
		<div>
			La nostra sede si trova presso la casetta dell&apos;Atterraggio Garden
			Relais.
		</div>
	),
	image: "/locations/sede.png",
	table: {
		location: "“Casetta del club” presso Atterraggio Garden Relais",
		url: "https://maps.app.goo.gl/mhgq6irVcyurLzqA8",
		address: "Via Caose 22, 31030 Borso del Grappa (TV)",
		gps: "45.8065529, 11.7846036",
		parking: "Si",
	},
};

export default function DirectionsPage() {
	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/bg-montegrappa.webp')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							Come Arrivare
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							Visualizza le indicazioni per arrivare alla nostra sede
						</h3>
					</div>
				</div>
			</div>

			<section className="px-4 py-20">
				<div className="container mx-auto flex max-w-6xl flex-col items-center gap-16">
					<div className="grid gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20">
						<CentroOperativoCard location={location} />
					</div>
				</div>

				<div className="container mx-auto mt-20 flex max-w-6xl flex-col items-center">
					<div className="flex flex-col items-center justify-center gap-16 sm:flex-row">
						<Link href="/contatti">
							<h1 className="highlight font-heading text-2xl uppercase">
								Contatti
							</h1>
						</Link>
						<Link href="/area-volo">
							<h1 className="highlight font-heading text-2xl uppercase">
								Area di volo
							</h1>
						</Link>
					</div>
				</div>

				<div className="container mx-auto mt-20 max-w-6xl gap-16 pt-10">
					<h2 className="mb-4 text-2xl font-bold">Come Arrivare</h2>
					<h3 className="my-2 flex items-center gap-2 text-lg font-bold">
						<Train className="size-5 shrink-0" />
						In Treno
					</h3>
					<p>
						La stazione più vicina è quella di Bassano del Grappa, raggiungibile
						da Padova, Venezia (Santa Lucia) e Trento. Per maggiori informazioni
						visitare il sito{" "}
						<Link href="https://www.trenitalia.com/it/it.html" target="_blank">
							TreniItalia
						</Link>
					</p>
					<h3 className="my-2 flex items-center gap-2 text-lg font-bold">
						<Plane className="size-5 shrink-0" />
						In Aereo
					</h3>
					<p>Gli aeroporti piu&apos; vicini sono:</p>
					<ul>
						<li>
							Venezia -{" "}
							<Link href="https://www.veniceairport.it/" target="_blank">
								Aeroporto Marco Polo
							</Link>{" "}
							a km 70
						</li>
						<li>
							Treviso -{" "}
							<Link href="https://www.trevisoairport.it/" target="_blank">
								Aeroporto A. Canova
							</Link>{" "}
							a km 50
						</li>
					</ul>
					<h3 className="my-2 flex items-center gap-2 text-lg font-bold">
						<Car className="size-5 shrink-0" />
						In Auto
					</h3>
					<p className="my-2">
						<strong>Da Vicenza</strong> seguire le indicazioni per Bassano del
						Grappa – Trento. Presa la statale 47 Gasparona in prossimità delle
						montagne prendere l’uscita con le indicazioni per ROMANO D’EZZELINO
						CENTRO – CIMA GRAPPA – ZONA INDUSTRIALE NORD. Una volta usciti, alla
						prima rotonda prendere la prima uscita e alla seconda rotonda
						prendere nuovamente la prima uscita in direzione SAN GIACOMO. Il
						Centro Operativo si trova poco dopo sulla destra in Via Benedetto
						Marcello.
					</p>
					<p className="my-2">
						<strong>Da Trento</strong> seguire le indicazioni per Padova.
						Superati i paesi di Solagna e Pove del Grappa seguire le indicazioni
						per ROMANO D’EZZELINO CENTRO – CIMA GRAPPA -ZONA INDUSTRIALE NORD.
						Una volta usciti, alla prima rotonda prendere la prima uscita e alla
						seconda rotonda prendere nuovamente la prima uscita in direzione SAN
						GIACOMO. Il Centro Operativo si trova poco dopo sulla destra in Via
						Benedetto Marcello.
					</p>
					<p className="my-2">
						<strong>Da Padova</strong> seguire le indicazioni per CITTADELLA –
						BASSANO DEL GRAPPA. Superato il semaforo di Rosà seguire le
						indicazioni per Trento, entrati in superstrada prendere l’uscita con
						le indicazioni ROMANO D’EZZELINO CENTRO – CIMA GRAPPA -ZONA
						INDUSTRIALE NORD. Una volta usciti, alla prima rotonda prendere la
						prima uscita e alla seconda rotonda prendere nuovamente la prima
						uscita in direzione SAN GIACOMO. Il Centro Operativo si trova poco
						dopo sulla destra in Via Benedetto Marcello.
					</p>
					<p className="my-2">
						<strong>Da Treviso</strong> seguire le indicazioni per CASTELFRANCO
						VENETO e poi per ASOLO. Arrivati ad Asolo seguire per BASSANO DEL
						GRAPPA. Arrivati al semaforo di SPIN svoltare a destra in direzione
						SAN GIACOMO. Proseguire per circa 1 km, quindi svoltare a sinistra
						in Via Benedetto Marcello. Il Centro Operativo si trova presso gli
						impianti sportivi.
					</p>
				</div>
			</section>
		</div>
	);
}

function CentroOperativoCard({ location }: { location: CentroOperativoType }) {
	return (
		<div
			key={location.id}
			className="group order-last grid gap-y-6 sm:order-first sm:col-span-12 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:col-span-10 lg:col-start-2 lg:gap-x-12"
		>
			<div className="sm:col-span-5">
				<div className="mb-4 md:mb-6">
					<div className="flex text-xs uppercase tracking-wider text-muted-foreground">
						<span className="mr-3 md:mr-5 lg:mr-6">Posizione</span>
					</div>
				</div>
				<h3 className="font-heading text-xl uppercase md:text-2xl lg:text-3xl">
					{location.title}
				</h3>
				<div className="mt-4 flex items-center space-x-2 md:mt-5">
					<span className="md:text-base">{location.description}</span>
				</div>
				<div className="mt-4 flex items-center space-x-2 md:mt-5">
					<CentroOperativoTable location={location.table} />
				</div>
			</div>
			{location.image && (
				<div className="order-first sm:order-last sm:col-span-5">
					<div className="text-clip rounded-lg border border-border">
						<Image
							src={location.image}
							alt={location.title}
							className="size-full object-cover transition-transform group-hover:scale-105"
							width={300}
							height={300}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

function CentroOperativoTable({
	location,
}: {
	location: CentroOperativoType["table"];
}) {
	return (
		<Table>
			<TableBody>
				<TableRow className="w-full">
					<TableHead>Dove</TableHead>
					<TableCell>{location.location}</TableCell>
				</TableRow>
				<TableRow className="w-full">
					<TableHead>Indirizzo</TableHead>
					<TableCell>
						<Link href={location.url} target="_blank">
							{location.address}
						</Link>
					</TableCell>
				</TableRow>
				{location.gps && (
					<TableRow className="w-full">
						<TableHead>Coordinate Gps</TableHead>
						<TableCell>{location.gps}</TableCell>
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
