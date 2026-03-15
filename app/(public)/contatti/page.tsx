import { Globe, Mail, MailIcon, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaTelegram } from "react-icons/fa";

export default function ContattiPage() {
	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/home/home3.jpg')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					></div>
				</div>
			</div>
			<section className="min-h-[37vh] px-4 py-12">
				<Contact />
			</section>
		</div>
	);
}

const Contact = () => {
	return (
		<section className="px-4">
			<div className="container mx-auto">
				<div className="mb-8">
					<h1 className="highlight mb-3 mt-1 text-balance font-heading text-3xl font-semibold uppercase md:text-4xl">
						Contatti
					</h1>
					<p className="text-lg text-muted-foreground">
						Contattaci per qualsiasi domanda
					</p>
				</div>
				<div className="grid gap-10 md:grid-cols-3">
					<div>
						<span className="mb-3 flex size-12 flex-col items-center justify-center rounded-full bg-accent">
							<Mail className="h-6 w-auto" />
						</span>
						<p className="mb-2 text-lg font-semibold">Email</p>
						<p className="mb-3 text-muted-foreground">
							Scrivici per email all&apos;indirizzo
						</p>
						<a
							href="mailto:presidente@vololiberomontegrappa.it"
							className="block font-semibold hover:underline"
						>
							presidente@vololiberomontegrappa.it
						</a>
						<a
							href="mailto:segreteria@vololiberomontegrappa.it"
							className="mt-2 block font-semibold hover:underline"
						>
							segreteria@vololiberomontegrappa.it
						</a>
					</div>
					<div>
						<span className="mb-3 flex size-12 flex-col items-center justify-center rounded-full bg-accent">
							<MapPin className="h-6 w-auto" />
						</span>
						<p className="mb-2 text-lg font-semibold">Indirizzo</p>
						<div className="mb-3">
							<p className="text-muted-foreground">Sede Ufficiale</p>
							<a
								href="https://maps.app.goo.gl/iFBn8gVfAhSD1kJ49"
								target="_blank"
								className="font-semibold hover:underline"
								rel="noopener"
							>
								Piazza al Paradiso 11, Borso del Grappa (TV)
							</a>
						</div>
						<div className="mb-3">
							<p className="text-muted-foreground">Sede Operativa</p>
							<a
								href="https://maps.app.goo.gl/mhgq6irVcyurLzqA8"
								target="_blank"
								className="font-semibold hover:underline"
								rel="noopener"
							>
								“Casetta del club” presso Atterraggio Garden Relais
							</a>
						</div>
					</div>
					<div>
						<span className="mb-3 flex size-12 flex-col items-center justify-center rounded-full bg-accent">
							<Globe className="h-6 w-auto" />
						</span>
						<div className="mb-3">
							<h3 className="mb-4 font-semibold uppercase">Social</h3>
							<div className="mb-3 text-muted-foreground">
								<Link
									href="https://t.me/+ij425GY_rVg0NjY0"
									target="_blank"
									className="flex items-center font-semibold hover:underline"
									rel="noopener noreferrer"
								>
									<FaTelegram className="mr-2 size-6" />
									<span>Gruppo Telegram</span>
								</Link>
							</div>
							<div className="mb-3 text-muted-foreground">
								<Link
									href="https://www.mantaonline.it"
									target="_blank"
									className="flex items-center font-semibold hover:underline"
									rel="noopener noreferrer"
								>
									<FaFacebook className="mr-2 size-6" />
									<span>Facebook</span>
								</Link>
							</div>
							<div className="mb-3 text-muted-foreground">
								<Link
									href="https://www.mantaonline.it"
									target="_blank"
									className="flex items-center font-semibold hover:underline"
									rel="noopener noreferrer"
								>
									<FaInstagram className="mr-2 size-6" />
									<span>Instagram</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="container mx-auto mt-16">
				<div className="mb-6">
					{/* <span className="text-sm font-semibold">Contatti</span> */}
					<h1 className="mb-3 mt-1 text-balance font-heading text-2xl md:text-3xl">
						<span>Altri</span>
						<span className="highlight ml-2">Riferimenti Utili</span>
					</h1>
				</div>
				<div className="grid gap-10 md:grid-cols-3">
					<div>
						<h2 className="mb-2 font-montserrat text-xl font-semibold italic underline">
							NAVETTE
						</h2>
						<div className="mb-3">
							<h3 className="font-semibold uppercase">FAUSTO BOSA SERVICE</h3>
							<div className="flex items-center text-muted-foreground">
								<Phone className="mr-2 size-4" />
								<span>+(39) 347 1336169</span>
							</div>
						</div>
						<div className="mb-3">
							<h3 className="font-semibold uppercase">ENRICO BRUNELLO</h3>
							<div className="flex items-center text-muted-foreground">
								<Phone className="mr-2 size-4" />
								<span>+(39) 340 5015469</span>
							</div>
						</div>
						<div className="mb-3">
							<h3 className="font-semibold uppercase">
								REGIS (freccia del grappa)
							</h3>
							<div className="flex items-center text-muted-foreground">
								<Phone className="mr-2 size-4" />
								<span>+(39) 331 1558232</span>
							</div>
						</div>
					</div>
					<div>
						<h2 className="mb-2 font-montserrat text-xl font-semibold italic underline">
							FLYCARD
						</h2>
						<div className="mb-3">
							<h3 className="mb-2 font-semibold uppercase">
								Consorzio Vivere il Grappa
							</h3>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Phone className="mr-2 size-4" />
								<span>+(39) 0423 910526</span>
							</div>
							<div className="mb-2 flex items-center text-muted-foreground">
								<MailIcon className="mr-2 size-4" />
								<span>flycard@vivereilgrappa.it</span>
							</div>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Globe className="mr-2 size-4" />
								<Link
									href="https://flycard.vivereilgrappa.it"
									target="_blank"
									className="font-semibold hover:underline"
								>
									flycard.vivereilgrappa.it
								</Link>
							</div>
						</div>
					</div>
					<div>
						<h2 className="mb-2 font-montserrat text-xl font-semibold uppercase italic underline">
							Recupero Vele
						</h2>
						<div className="mb-3">
							<h3 className="mb-2 font-semibold uppercase">GIANLUCA BELLIN</h3>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Phone className="mr-2 size-4" />
								<span>+(39) 345 662 0191</span>
							</div>
						</div>
					</div>
					<div>
						<h2 className="mb-2 font-montserrat text-xl font-semibold uppercase italic underline">
							SCUOLA VOLO
						</h2>
						<div className="mb-3">
							<h3 className="mb-2 font-semibold uppercase">
								Manta Paragliding School
							</h3>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Phone className="mr-2 size-4" />
								<span>+(39) 329 228 6839</span>
							</div>
							<div className="mb-2 flex items-center text-muted-foreground">
								<MailIcon className="mr-2 size-4" />
								<span>mantaparagliding@gmail.com</span>
							</div>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Globe className="mr-2 size-4" />
								<Link
									href="https://www.mantaonline.it"
									target="_blank"
									className="font-semibold hover:underline"
								>
									mantaonline.it
								</Link>
							</div>
						</div>
					</div>
					<div>
						<h2 className="mb-2 font-montserrat text-xl font-semibold uppercase italic underline">
							Para biposto
						</h2>
						<div className="mb-6">
							<h3 className="font-semibold uppercase">
								MONTEGRAPPA TANDEMTEAM
							</h3>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Phone className="mr-2 size-4" />
								<span>+(39) 333 664 8808</span>
							</div>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Globe className="mr-2 size-4" />
								<Link
									href="https://www.montegrappatandemteam.it"
									target="_blank"
									className="font-semibold hover:underline"
								>
									montegrappatandemteam.it
								</Link>
							</div>
						</div>
						<div className="mb-3">
							<h3 className="font-semibold uppercase">AIRSPORTS MONTEGRAPPA</h3>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Phone className="mr-2 size-4" />
								<span>+(39) 379 2135465</span>
							</div>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Globe className="mr-2 size-4" />
								<Link
									href="https://www.airsportsmontegrappa.it"
									target="_blank"
									className="font-semibold hover:underline"
								>
									airsportsmontegrappa.it
								</Link>
							</div>
						</div>
					</div>
					<div>
						<h2 className="mb-2 font-montserrat text-xl font-semibold uppercase italic underline">
							DELTA BIPOSTO
						</h2>
						<div className="mb-3">
							<h3 className="mb-2 font-semibold uppercase">JESUS</h3>
							<div className="mb-2 flex items-center text-muted-foreground">
								<Phone className="mr-2 size-4" />
								<span>+(39) 347 9723080</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
