import { ArrowRight, NotebookPen } from "lucide-react";
import Link from "next/link";
import { IoIosMedal } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { NEXT_YEAR } from "@/config/constants";
import FAQ from "./FAQ";

export default function XcMontegrappaPage() {
	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/banner-panetun.jpg')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							XC Montegrappa
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							Brevetto Cross Country Montegrappa
						</h3>
					</div>
				</div>
			</div>
			<section className="px-4 py-20">
				<div className="container mx-auto flex min-h-[310px] flex-col items-center gap-16">
					<div>
						<h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
							<span className="highlight block">XC Montegrappa</span>
						</h1>

						<div className="py-10">
							<p className="mx-auto max-w-3xl text-left">
								L&apos;iniziativa è organizzata e promossa dal{" "}
								<strong>Club Volo Libero Montegrappa</strong>. <br />
								Non è una competizione, ma una sfida personale che riconosce
								l&apos;impegno e la capacità del pilota nel raggiungere
								obiettivi di volo cross-country. <br />I percorsi hanno come
								riferimento l&apos;area di volo del Monte Grappa, con decollo e
								atterraggio all&apos;interno delle zone stabilite. <br />
								Ogni pilota potrà decidere liberamente i giorni in cui volare
								durante tutto l&apos;anno solare a partire dal{" "}
								<strong>01 aprile {NEXT_YEAR}</strong>.
							</p>
						</div>

						<div className="py-10">
							<h2 className="highlight font-heading text-2xl uppercase">
								OBIETTIVI
							</h2>
							<div className="mx-auto mt-4 max-w-3xl text-left">
								<span>
									Il Brevetto di Cross Country Montegrappa nasce con
									l&apos;intento di:
								</span>
								<ul className="list-disc pl-5 pt-2">
									<li>
										Promuovere e diffondere la pratica di volo in parapendio e
										deltaplano, attraverso percorsi predefiniti nell&apos;area
										della Pedemontana Veneta, con punti di involo sul Monte
										Grappa.
									</li>
									<li>
										Stimolare i piloti a migliorare la propria esperienza,
										favorendo lo scambio di informazioni e incentivando
										l&apos;esplorazione delle aree di volo limitrofe.
									</li>
									<li>
										Avvicinare neo-piloti e piloti con meno esperienza al volo
										di cross-country, attraverso un sistema di percorsi
										progressivi.
									</li>
								</ul>
							</div>
						</div>

						<div className="py-10">
							<h2 className="highlight font-heading text-2xl uppercase">
								COME FUNZIONA
							</h2>
							<p className="mx-auto mt-4 max-w-3xl text-left">
								Il Brevetto XC Montegrappa ha tre livelli di difficoltà (Basico,
								Intermedio, Avanzato) che si compongono di un gruppo di percorsi
								prestabiliti (task) con delle boe da attraversare. <br />
								Ogni task ha un punteggio di valore differente che rispecchia il
								grado di difficoltà da affrontare. Per ottenere il Brevetto si
								dovrà superare il punteggio minimo richiesto dal livello,
								attraverso la somma dei punteggi ottenuti dal completamento
								delle task. <br />
								Ciò vuol dire che per ogni livello di Brevetto che si vuole
								ottenere non è strettamente necessario completare tutti i
								percorsi previsti di quel livello, ma solo raggiungere il
								punteggio minimo richiesto. <br />
								<br />
								<strong>Attenzione!</strong> Ogni percorso è destinato a
								concorrere esclusivamente per un determinato livello di
								brevetto. La singola traccia di volo, che potrebbe includere
								contemporaneamente più percorsi, avrà validità esclusivamente
								per uno solo di questi. Quindi non è possibile completare
								percorsi differenti in una sola sessione di volo.
							</p>
						</div>

						<div className="py-10">
							<h2 className="highlight font-heading text-2xl uppercase">
								LIVELLI DI BREVETTO
							</h2>
							<div className="mx-auto mt-4 max-w-3xl text-left">
								I brevetti si suddividono in tre livelli, con difficoltà
								crescente:
								<ul className="pt-4">
									<li className="mb-2 rounded-md border-2 border-transparent p-4 hover:cursor-pointer hover:border-[#CD7F32]">
										<Link href="/xc-montegrappa/basic">
											<div className="flex items-center gap-2">
												<div className="flex w-[40px] items-center justify-center">
													<IoIosMedal className="size-10 text-[#CD7F32]" />
												</div>
												<div className="gap-1 pl-2">
													<div className="text-lg">
														<strong>BREVETTO BASICO</strong>
													</div>
													<div className="text-md">
														Percorsi brevi e meno impegnativi.
													</div>
													<div className="text-md text-gray-600">
														Ideale per piloti alle prime esperienze nel
														cross-country.
													</div>
													<Button variant="outline" className="mt-2">
														Vedi percorsi
														<ArrowRight className="ml-1 size-4" />
													</Button>
												</div>
											</div>
										</Link>
									</li>
									<li className="mb-2 rounded-md border-2 border-transparent p-4 hover:cursor-pointer hover:border-[#C0C0C0]">
										<Link href="/xc-montegrappa/intermediate">
											<div className="flex items-center gap-2">
												<div className="flex w-[40px] items-center justify-center">
													<IoIosMedal className="size-10 text-[#C0C0C0]" />
												</div>
												<div className="gap-1 pl-2">
													<div className="text-lg">
														<strong>BREVETTO INTERMEDIO</strong>
													</div>
													<div className="text-md">
														Percorsi più lunghi e tecnici
													</div>
													<div className="text-md text-gray-600">
														Prevede il superamento delle principali valli del
														Monte Grappa.
													</div>
													<Button variant="outline" className="mt-2">
														Vedi percorsi
														<ArrowRight className="ml-1 size-4" />
													</Button>
												</div>
											</div>
										</Link>
									</li>
									<li className="mb-2 rounded-md border-2 border-transparent p-4 hover:cursor-pointer hover:border-[#FFD700]">
										<Link href="/xc-montegrappa/advanced">
											<div className="flex items-center gap-2">
												<div className="flex w-[40px] items-center justify-center">
													<IoIosMedal className="size-10 text-[#FFD700]" />
												</div>
												<div className="gap-1 pl-2">
													<div className="text-lg">
														<strong>BREVETTO AVANZATO</strong>
													</div>
													<div className="text-md">
														Percorsi per i più esperti.
													</div>
													<div className="text-md text-gray-600">
														Percorsi con coefficiente di difficoltà più elevato
														sia per la distanza ed il tempo di volo richiesti,
														sia per passaggi che prevedono il superamento di
														diverse valli, e in contesti ambientali differenti.
													</div>
													<Button variant="outline" className="mt-2">
														Vedi percorsi
														<ArrowRight className="ml-1 size-4" />
													</Button>
												</div>
											</div>
										</Link>
									</li>
								</ul>
							</div>
						</div>

						<div className="py-10">
							<h2 className="highlight font-heading text-2xl uppercase">
								DOMANDE FREQUENTI
							</h2>
							<div className="mx-auto mt-4 max-w-3xl text-left">
								<FAQ />
							</div>
						</div>

						<div className="py-10">
							<div className="flex flex-col items-center justify-center">
								<div className="mb-4 text-center text-3xl font-caveat">
									Vola sempre con un obiettivo, <br />
									iscriviti al Brevetto XC Montegrappa
								</div>
								<Button
									variant="default"
									size="lg"
									className="btn-lime uppercase "
								>
									<NotebookPen className="mr-2 size-4" />
									Iscriviti
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
