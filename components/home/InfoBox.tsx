"use client";

import { Info, MapPinned, SunSnow } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const infos = [
	{
		title: "Meteo",
		description: (
			<div>Consulta i dati meteo e pianifica il tuo volo in sicurezza</div>
		),
		link: "/meteo",
		icon: <SunSnow className="size-6" />,
	},
	{
		title: "Area di volo",
		description: (
			<div>
				Decolli, atterraggi e informazioni pratiche per volare sul Grappa
			</div>
		),
		link: "/decolli",
		icon: <MapPinned className="size-6" />,
	},
	{
		title: "Info pratiche",
		description: (
			<div>
				Tutte le informazioni per i soci: iscrizioni, rinnovi, visite mediche…
			</div>
		),
		link: "/info",
		icon: <Info className="size-6" />,
	},
];

export default function InfoBox() {
	return (
		<section className="mt-10 p-10">
			<div className="container mx-auto">
				<div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
					{infos.map((info, i) => (
						<div key={i} className="flex flex-col items-center text-center">
							<div className="mb-5 flex size-16 items-center justify-center rounded-full bg-accent">
								{info.icon}
							</div>
							<h3 className="mb-2 text-xl font-semibold">{info.title}</h3>
							<div className="text-muted-foreground">{info.description}</div>
							{info.link && (
								<Link href={info.link} className="mt-5">
									<Button variant="outline">
										<span>Scopri di più</span>
									</Button>
								</Link>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
