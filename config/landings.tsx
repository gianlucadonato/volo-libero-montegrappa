import type { LocationType } from "@/components/LocationCard";
import { PUBLIC_MEDIA_BASE_URL } from "@/config/constants";

// Landings of the Monte Grappa flying area, shown as cards on /atterraggi and as
// pins on the locations map.
export const LANDINGS: LocationType[] = [
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
