import type { LocationType } from "@/components/LocationCard";
import { PUBLIC_MEDIA_BASE_URL } from "@/config/constants";

// Take-offs of the Monte Grappa flying area, shown as cards on /decolli and as
// pins on the locations map. Only language-neutral data lives here: the texts
// (title, description, warnings) are in messages/*.json under
// Locations.takeoffs.<id>. `table.direction` ("Direzione vento") stays in
// Italian: it feeds the wind rose (lib/wind-directions.ts) and is translated
// word by word for display.
export const TAKEOFFS: LocationType[] = [
	{
		id: "stella",
		name: "Stella Alpina",
		area: "Borso del Grappa - TV",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-stella-alpina.jpg`,
		table: {
			location: "Prai di Semonzo",
			altitude: "702 m",
			direction: "Sud",
			topLanding: false,
			gps: "45.81948, 11.76342",
			food: false,
			toilets: true,
			parking: false,
		},
	},
	{
		id: "tappeti",
		name: "Tappeti",
		area: "Borso del Grappa - TV",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-tappeti.jpg`,
		table: {
			location: "Col del Puppolo",
			altitude: "830 m",
			direction: "sud - sud/est - sud/ovest",
			topLanding: false,
			gps: "45.8235, 11.76875",
			food: "100 m",
			toilets: true,
			parking: "100 m",
		},
	},
	{
		id: "pedana-delta",
		name: "Pedana Delta",
		area: "Borso del Grappa - TV",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-pedana.jpg`,
		table: {
			location: "Col del Puppolo",
			altitude: "866 m",
			direction: "est - sud/est",
			topLanding: false,
			gps: "45.82441, 11.77124",
			food: true,
			parking: true,
		},
	},
	{
		id: "casette",
		name: "Casette",
		area: "Borso del Grappa - TV",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-casette.jpg`,
		table: {
			location: "Col Serai",
			altitude: "1000 m",
			direction: "ovest - sud/ovest",
			topLanding: true,
			gps: "45.82814, 11.7683",
			food: false,
			parking: false,
		},
	},
	{
		id: "camol",
		name: "Baita Camol",
		area: "Camol",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-baita-camol.jpg`,
		table: {
			location: "Camol",
			altitude: "1230 m",
			direction: "sud - sud/ovest",
			topLanding: false,
			gps: "45.83964, 11.78608",
			food: "400 m",
			parking: "400 m",
		},
	},
	{
		id: "panettone",
		name: "Panettone",
		area: "Cima Grappa",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-panettone.jpg`,
		table: {
			location: "Monte Meda - Cima Grappa",
			altitude: "1550 m",
			direction: "est - sud/est - ovest",
			topLanding: true,
			gps: "45.86126, 11.8043",
			food: false,
			parking: true,
		},
	},
	{
		id: "campeggia",
		name: "Col Campeggia",
		area: "Col Campeggia",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-col-campeggia.jpg`,
		table: {
			location: "Col Campeggia",
			altitude: "1080 m",
			direction: "sud/sud est",
			topLanding: true,
			gps: "45.83708, 11.74869",
			food: false,
			toilets: false,
			parking: true,
		},
	},
	{
		id: "antenne",
		name: "Antenne",
		area: "Costalunga",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/decollo-antenne.jpg`,
		table: {
			location: "Costalunga",
			altitude: "750 m",
			direction: "est",
			topLanding: true,
			gps: "45.81195, 11.74501",
			food: false,
			parking: true,
		},
	},
];
