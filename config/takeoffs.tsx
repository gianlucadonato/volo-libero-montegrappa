import type { LocationType } from "@/components/LocationCard";
import { PUBLIC_MEDIA_BASE_URL } from "@/config/constants";

// Take-offs of the Monte Grappa flying area, shown as cards on /decolli and as
// pins on the locations map. `table.direction` ("Direzione vento") also feeds
// the map's wind rose, see lib/wind-directions.ts.
export const TAKEOFFS: LocationType[] = [
	{
		id: "stella",
		title: "Decollo Stella Alpina",
		location: "Borso del Grappa - TV",
		description: (
			<div>
				<p>
					Decollo erboso, adatto all&apos;uso del parapendio, situato nel comune
					di Borso del Grappa lungo la strada Generale Giardino SP 140, circa
					200 mt dopo il 13° tornante. <br />
					Il decollo è adatto prevalentemente con vento da sud e leggeri venti
					da est e da ovest. <br />
					Per raggiungere questo decollo si consiglia vivamente l&apos;uso del
					servizio navette, a causa della scarsa disponibilità di parcheggio.
				</p>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-stella-alpina.jpg`,
		table: {
			location: "Prai di Semonzo",
			altitude: "702 m",
			direction: "Sud",
			top_landing: "No",
			gps: "45.81948, 11.76342",
			ristoro: "No",
			parking: "No",
			wc: "Si",
		},
	},
	{
		id: "tappeti",
		title: "Decollo Tappeti",
		location: "Borso del Grappa - TV",
		description: (
			<div>
				<p>
					Decollo principale della zona, con tappeto sintetico adatto
					all&apos;uso con il parapendio, situato nel comune di Borso del Grappa
					lungo la strada Generale Giardino SP 140, circa 200 mt prima del 17°
					tornante dove si trova il Decollo Pedana per i deltaplani, in
					corrispondenza del bar trattoria Puppolo. <br />
					Il decollo è adatto prevalentemente con vento da sud e leggeri venti
					da est e da ovest. <br />
					Per raggiungere questo decollo si consiglia vivamente l&apos;uso del
					servizio navette, a causa della scarsa disponibilità di parcheggio.{" "}
					<br />
					Attenzione, con vento da est si possono creare turbolenze. Preparare
					la vela solo dopo essersi imbragati per evitare di occupare
					l&apos;area per un tempo eccessivo.
				</p>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-tappeti.jpg`,
		table: {
			location: "Col del Puppolo",
			altitude: "830 m",
			direction: "sud - sud/est - sud/ovest",
			top_landing: "No",
			gps: "45.8235, 11.76875",
			ristoro: "Si /100m",
			parking: "Si /100m",
			wc: "Si",
		},
	},
	{
		id: "pedana-delta",
		title: "Decollo Pedana Delta",
		location: "Borso del Grappa - TV",
		description: (
			<div>
				<p>
					Decollo riservato ai deltaplani situato nel comune di Borso del Grappa
					lungo la strada Generale Giardino SP 140 in corrispondenza del 17°
					tornante. <br />
					Il decollo è costituito da una rampa di lancio in ferro e legno, con
					area riservata al montaggio dei mezzi nello spazio erboso
					all&apos;interno del tornante. <br />
					La zona antistante il bar va lasciata libera per il passaggio dei
					deltaplani prima del decollo. <br />
					Si consiglia quindi vivamente di ottimizzare i trasporti o di
					usufruire dei servizi navetta causa scarsità di parcheggi. <br />
				</p>
				<p className="mt-4 rounded-md border border-red-500 bg-red-100 p-2 text-red-500">
					È SEVERAMENTE VIETATO decollare con il parapendio dalla pedana
					riservata ai delta.
				</p>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-pedana.jpg`,
		table: {
			location: "Col del Puppolo",
			altitude: "866 m",
			direction: "est - sud/est",
			top_landing: "No",
			gps: "45.82441, 11.77124",
			ristoro: "Si",
			parking: "Si",
		},
	},
	{
		id: "casette",
		title: "Decollo Casette",
		location: "Borso del Grappa - TV",
		description: (
			<div>
				<p>
					Decollo erboso adatto all&apos;uso con il parapendio, situato nel
					comune di Borso del Grappa lungo la strada Generale Giardino SP 140.{" "}
					<br />
					Circa 300 metri dopo il 20° tornante, imboccare la stradina in salita
					sulla sinistra in direzione di Col Serai. Dopo 100 metri, oltrepassato
					un piccolo tornante sulla destra, il decollo si troverà sulla
					sinistra. <br />
					Il decollo è adatto con vento da ovest. <br />È vivamente consigliato
					l&apos;uso del servizio navette a causa dell&apos;assenza di
					parcheggi. <br />È importante infatti rispettare le aree private
					evitando di lasciare le macchine in sosta a bordo strada.
				</p>
				<p className="mt-4 rounded-md border border-red-500 bg-red-100 p-2 text-red-500">
					Divieto tassativo di decollo verso est, pericolo di morte ☠️
				</p>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-casette.jpg`,
		table: {
			location: "Col Serai",
			altitude: "1000 m",
			direction: "ovest - sud/ovest",
			top_landing: "Si",
			gps: "45.82814, 11.7683",
			ristoro: "No",
			parking: "No",
		},
	},
	{
		id: "camol",
		title: "Decollo Baita Camol",
		location: "Camol",
		description: (
			<div>
				<p>
					Decollo erboso adatto al parapendio situato lungo la strada Generale
					Giardino SP 140. <br />
					Per raggiungerlo, seguire le indicazioni per Cima Grappa e, 800 mt
					dopo il 21° tornante, parcheggiare l&apos;auto presso la Baita Camol
					procedendo per l&apos;imbocco del sentiero n. 100 verso Cima Grappa.
					Dopo 400 mt dall&apos;imboccatura del sentiero, l&apos;ampio prato del
					decollo sarà riconoscibile dalla manica a vento. È adatto
					prevalentemente con venti da sud - sudovest. <br />
				</p>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-baita-camol.jpg`,
		table: {
			location: "Camol",
			altitude: "1230 m",
			direction: "sud - sud/ovest",
			top_landing: "No",
			gps: "45.83964, 11.78608",
			ristoro: "Si / 400 m",
			parking: "Si / 400 m",
		},
	},
	{
		id: "panettone",
		title: "Decollo Panettone",
		location: "Cima Grappa",
		description: (
			<div>
				<p>
					Suggestivo decollo erboso situato sotto Cima Grappa. <br />
					Raggiungibile percorrendo la strada Generale Giardino SP 140: circa
					500 mt dopo il 27° tornante, all&apos;attraversamento del sentiero n.
					100, c&apos;è un piccolo parcheggio dove è possibile sostare. Sulla
					destra, sulla cima della collinetta svetta la manica a vento del
					decollo Panettone. <br />
					Questo decollo molto ampio, rivolto in direzione est - sudest, è
					adatto sia ai parapendio sia ai deltaplani. <br />
					Il decollo in direzione ovest è invece di dimensioni più ridotte, e
					adatto ai parapendio. <br />
					In particolare in questo secondo decollo, si raccomanda di fare
					attenzione ad alcune buche di origine bellica nascoste tra
					l&apos;erba. <br />
				</p>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-panettone.jpg`,
		table: {
			location: "Monte Meda - Cima Grappa",
			altitude: "1550 m",
			direction: "est - sud/est - ovest",
			top_landing: "Si",
			gps: "45.86126, 11.8043",
			ristoro: "No",
			parking: "Si",
		},
	},
	{
		id: "campeggia",
		title: "Decollo Col Campeggia",
		location: "Col Campeggia",
		description: (
			<div>
				<p>
					Percorrendo la strada Cadorna SP 148, seguire per Cima Grappa fino
					alla località Campo Solagna. 300 mt dopo aver oltrepassato il bar
					ristorante, imboccare la stradina sulla destra seguendo le indicazioni
					per Col Campeggia. Dopo il secondo tornate, arrivati ad un piccolo
					incrocio, si raggiunge il decollo di Col Campeggia. <br />È adatto con
					venti Sud/Sud Est e leggeri Sud/Sud Ovest. <br />
					Si consiglia di fare molta attenzione all&apos;intensità del vento,
					vista la posizione del decollo all&apos;interno di una stretta valle.{" "}
					<br />
					Nel pomeriggio possibilità di sottovento da sud-ovest.
				</p>
				<p className="mt-2 font-bold uppercase">
					Decollo destinato in particolare alle giornate di manifestazione, non
					rivolto ad un uso quotidiano. In caso di esigenza di utilizzo è
					necessario inviare richiesta d&apos;uso con preavviso.
				</p>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-col-campeggia.jpg`,
		table: {
			location: "Col Campeggia",
			altitude: "1080 m",
			direction: "sud/sud est",
			top_landing: "Si",
			parking: "Si",
			gps: "45.83708, 11.74869",
			ristoro: "No",
			wc: "No",
		},
	},
	{
		id: "antenne",
		title: "Decollo Antenne",
		location: "Costalunga",
		description: (
			<div>
				<p>
					Decollo erboso adatto ai parapendio. <br />
					Dopo il settimo tornante lungo la strada Cadorna SP 148, il decollo,
					conosciuto anche come Costa Lunga, si trova sulla sinistra. <br />
					Da utilizzare con venti da est. <br />
					Si consiglia vivamente di usufruire del servizio navette perché il
					parcheggio situato in prossimità del prato è di piccole dimensioni.{" "}
					<br />
					Attenzione alle zone di turbolenza evidenziate. <br />
					Nel pomeriggio possibile sottovento da sud e/o da ovest.
				</p>
			</div>
		),
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-antenne.jpg`,
		table: {
			location: "Costalunga",
			altitude: "750 m",
			direction: "est",
			top_landing: "Si",
			parking: "Si",
			gps: "45.81195, 11.74501",
			ristoro: "No",
		},
	},
];
