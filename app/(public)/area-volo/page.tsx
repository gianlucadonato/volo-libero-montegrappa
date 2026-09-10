"use client";

import Image from "next/image";
import Link from "next/link";
import { BsPersonVcard } from "react-icons/bs";
import { FaBusSimple } from "react-icons/fa6";
import { GiWindsock } from "react-icons/gi";
import { GrTarget } from "react-icons/gr";
import { LuRadioTower } from "react-icons/lu";
import { MdFlight } from "react-icons/md";
import { TiWeatherPartlySunny } from "react-icons/ti";
import { PUBLIC_MEDIA_BASE_URL } from "@/config/constants";

export default function AreadiVolo() {
	const downloadFile = (file: string) => {
		const url = `${PUBLIC_MEDIA_BASE_URL}/waypoints/${file}.zip`;
		window.open(url, "_blank");
	};

	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/bg-montegrappa.webp')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							Area di Volo
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							Informazioni pratiche per volare sul Grappa
						</h3>
					</div>
				</div>
			</div>
			<section className="px-4 pb-10 pt-20">
				<div className="container mx-auto flex min-h-[310px] flex-col items-center gap-16">
					<div>
						<h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
							<span className="block">L&apos;ESSENZIALE PER</span>
							<span className="highlight block">PIANIFICARE IL VOLO</span>
						</h1>

						<div className="grid grid-cols-1 gap-y-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
							<div className="col-span-1 px-6">
								<div className="flex items-center justify-start sm:flex-col sm:items-start">
									<div className="mb-4 sm:min-h-[75px]">
										<GiWindsock className="text-lime mr-4 text-5xl sm:text-[75px]" />
									</div>
									<h2 className="font-heading text-xl uppercase sm:text-2xl">
										DECOLLI
									</h2>
								</div>
								<p className="pb-2 pt-4">
									La nostra zona di volo è ricca di decolli che permettono di
									volare con ogni tipo di vento, escluso il Nord.
								</p>
								<Link
									href="/decolli"
									className="text-sm font-bold uppercase italic underline"
								>
									Vedi i Decolli
								</Link>
							</div>

							<div className="col-span-1 px-6">
								<div className="flex items-center justify-start sm:flex-col sm:items-start">
									<div className="mb-4 sm:min-h-[75px]">
										<GrTarget className="text-lime mr-4 text-5xl sm:text-[65px]" />
									</div>
									<h2 className="font-heading text-xl uppercase sm:text-2xl">
										ATTERRAGGI
									</h2>
								</div>
								<p className="pb-2 pt-4">
									Due sono gli atterraggi ufficiali dell&apos;area. Al link
									trovi tutte le informazioni sull&apos;orientamento e i
									circuiti di atterraggio.
								</p>
								<Link
									href="/atterraggi"
									className="text-sm font-bold uppercase italic underline"
								>
									Scopri gli Atterraggi
								</Link>
							</div>

							<div className="col-span-1 px-6">
								<div className="flex items-center justify-start sm:flex-col sm:items-start">
									<div className="mb-4 sm:min-h-[75px]">
										<MdFlight className="text-lime mr-4 text-5xl sm:text-[70px]" />
									</div>
									<h2 className="font-heading text-xl uppercase sm:text-2xl">
										SPAZI AEREI
									</h2>
								</div>
								<p className="pb-2 pt-4">
									Scarica i file tridimensionali KMZ degli spazi aerei vietati e
									regolamentati del triveneto.
								</p>
								<Link
									href="#"
									onClick={(e) => {
										e.preventDefault();
										downloadFile("spazi-aerei");
									}}
									className="text-sm font-bold uppercase italic underline"
								>
									SCARICA IL FILE .ZIP
								</Link>
							</div>

							<div className="col-span-1 px-6">
								<div className="flex items-center justify-start sm:flex-col sm:items-start">
									<div className="mb-4 sm:min-h-[75px]">
										<TiWeatherPartlySunny className="text-lime mr-4 text-5xl sm:text-[75px]" />
									</div>
									<h2 className="font-heading text-xl uppercase sm:text-2xl">
										Meteo
									</h2>
								</div>
								<p className="pb-2 pt-4">
									Visita l&apos;area dedicata alla meteo con le previsioni
									specifiche per il volo libero, i meteogrammi e altre risorse
									utili.
								</p>
								<Link
									href="/meteo"
									className="text-sm font-bold uppercase italic underline"
								>
									CONSULTA LA METEO
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="px-4 py-10">
				<div className="container mx-auto flex min-h-[320px] flex-col items-center gap-16">
					<div>
						<h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
							<span className="block">ALTRE</span>
							<span className="highlight block">INFORMAZIONI UTILI</span>
						</h1>

						<div className="grid grid-cols-1 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-5">
							<div className="col-span-1 px-6 lg:col-start-2">
								<div className="flex items-center justify-start sm:flex-col sm:items-start">
									<div className="mb-4 sm:min-h-[75px]">
										<BsPersonVcard className="text-lime mr-4 text-5xl sm:text-[65px]" />
									</div>
									<h2 className="font-heading text-xl uppercase sm:text-2xl">
										FLYCARD
									</h2>
								</div>
								<p className="pb-2 pt-4">
									La FlyCard è un documento obbligatorio per utilizzare tutti i
									terreni di decollo e atterraggio della zona di volo del Monte
									Grappa, gestiti dal Consorzio Turistico Vivere il Grappa.
								</p>
								<Link
									href="https://flycard.vivereilgrappa.it"
									target="_blank"
									className="text-sm font-bold uppercase italic underline"
								>
									Vai al sito
								</Link>
							</div>

							<div className="col-span-1 px-6 lg:col-start-3">
								<div className="flex items-center justify-start sm:flex-col sm:items-start">
									<div className="mb-4 sm:min-h-[75px]">
										<FaBusSimple className="text-lime mr-4 text-5xl sm:text-[65px]" />
									</div>
									<h2 className="font-heading text-xl uppercase sm:text-2xl">
										NAVETTE
									</h2>
								</div>
								<p className="pb-2 pt-4">
									I decolli dell&apos;area di Borso del Grappa sono comodamente
									raggiungibili in navetta. Il tempo di risalita verso i
									principali decolli “Stella” e “Puppolo-Tappeti” è di circa 20
									minuti. Nell&apos;area contatti trovi i riferimenti degli
									autisti autorizzati.
								</p>
								<Link
									href="/contatti"
									className="text-sm font-bold uppercase italic underline"
								>
									Vai ai contatti
								</Link>
							</div>

							<div className="col-span-1 px-6 lg:col-start-4">
								<div className="flex items-center justify-start sm:flex-col sm:items-start">
									<div className="mb-4 sm:min-h-[75px]">
										<LuRadioTower className="text-lime mr-4 text-5xl sm:text-[65px]" />
									</div>
									<h2 className="font-heading text-xl uppercase sm:text-2xl">
										RADIO
									</h2>
								</div>
								<p className="pb-2 pt-4">
									Ricordiamo a tutti i piloti che volano nell&apos;area il
									canale di Emergenza 8-16 Rete Radio Montana
									un&apos;infrastruttura per radiocomunicazioni allo scopo di
									aumentare la sicurezza.
								</p>
								<Link
									href="https://www.reteradiomontana.it"
									target="_blank"
									className="text-sm font-bold uppercase italic underline"
								>
									Vai al sito
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="px-4 py-10">
				<div className="container mx-auto flex min-h-[320px] flex-col items-center gap-16">
					<div>
						<h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
							<span>VUOI</span>
							<span className="highlight ml-2">VOLARE?</span>
						</h1>

						<div className="py-10">
							<p className="mx-auto max-w-3xl text-center">
								Vuoi scoprire questa incredibile attività sportiva ma non sei
								(ancora) un pilota? <br />
								<strong>
									Volare in parapendio e deltaplano tandem è il modo più
									semplice
								</strong>
								, non richiede alcuna particolare abilità, solo un paio di
								scarponcini ben allacciati, una giacca a vento, un paio di
								occhiali da sole e voglia di scoprire il cielo! <br />E se poi{" "}
								<strong>hai voglia di diventare un pilota</strong>, partecipa ad
								una delle giornate di avvicinamento al volo organizzate
								dall&apos;ASD Manta e inizia un corso di parapendio!
							</p>
						</div>

						<div className="align-center flex flex-col justify-center sm:flex-row">
							<div className="mx-auto mb-6 max-w-[400px] rounded-lg border-2 p-6">
								<Image
									src="/volare-in-biposto.png"
									alt="Volare in biposto"
									width={350}
									height={350}
								/>
								<div className="p-4">
									Preparati ad un&apos;esperienza unica. Nell&apos;area operano
									diversi team di piloti biposto che ti accompagneranno in volo
									pensando a tutto: decollo atterraggio ed eventuali foto /
									video.
								</div>
								<div className="gap-2 p-4">
									<Link
										href="https://www.montegrappatandemteam.it"
										target="_blank"
										className="mb-4 block text-sm font-bold uppercase italic underline"
									>
										MONTEGRAPPA TANDEM TEAM
									</Link>
									<Link
										href="https://www.airsportsmontegrappa.it"
										target="_blank"
										className="block text-sm font-bold uppercase italic underline"
									>
										AIRSPORTS MONTEGRAPPA
									</Link>
								</div>
							</div>

							<div className="mx-auto mb-6 max-w-[400px] rounded-lg border-2 p-6 sm:ml-6">
								<Image
									src="/corsi-scuola.png"
									alt="Corsi scuola"
									width={350}
									height={350}
								/>
								<div className="p-4">
									L&apos;ASD Manta organizza durante l&apos;anno diversi corsi
									di parapendio base e avanzati. Partecipa alle giornate di
									avvicinamento, tocca con mano i materiali, conosci il gruppo
									di amici e i piloti che ti accompagneranno in questo percorso.
								</div>
								<div className="gap-2 p-4">
									<Link
										href="https://www.mantaonline.it"
										target="_blank"
										className="block text-sm font-bold uppercase italic underline"
									>
										ASD MANTA
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
