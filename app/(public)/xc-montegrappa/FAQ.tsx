"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
	const faqs = [
		{
			question: "Chi può partecipare?",
			answer:
				"Al Brevetto Volo di Cross dal Grappa possono partecipare tutti i piloti Italiani e stranieri in regola con le attuali normative sul volo libero nazionale, e nel rispetto dei regolamenti locali.",
		},
		{
			question: "Quanti brevetti posso ottenere?",
			answer:
				"Non esiste distinzione o limite di categoria di vela. Ogni pilota può iscriversi e scegliere di completare uno o più livelli, e quindi volendo può ottenere anche tutti e tre i brevetti: basico, intermedio e avanzato.",
		},
		{
			question: "Quando si possono fare i voli?",
			answer:
				"Verranno considerati i voli fatti dal 1° ottobre al 30 settembre dell'anno successivo. Si può volare in tutti i giorni disponibili, dal lunedì alla domenica, compatibilmente con le condizioni meteorologiche.",
		},
		{
			question:
				"Se raggiungo il punteggio richiesto, quando posso ritirare il mio brevetto? ",
			answer:
				"Nel mese di ottobre, in occasione della cena sociale del Volo Libero Montegrappa, verranno consegnati gli attestati di conseguimento del Brevetto Volo di Cross dal Grappa. ",
		},
		{
			question: "Sono previsti premi in palio? ",
			answer: `Il Brevetto Volo di Cross dal Grappa non è un evento competitivo e non prevede alcun tipo di classifica finalizzata all’ottenimento di premi specifici; tuttavia, in concomitanza con la cena sociale, verranno estratti a sorteggio dei premi di valore tra tutti i piloti che hanno conseguito il Brevetto Volo di Cross dal Grappa in qualsiasi livello. Riconoscimenti speciali verranno riconosciuti per i piloti che riusciranno a completare più brevetti nel corso della stessa stagione. I premi a sorteggio verranno consegnati solo ai piloti presenti.`,
		},
	];

	return (
		<section className="w-full">
			<div>
				{faqs.map((faq, index) => (
					<Accordion key={index} type="single" collapsible>
						<AccordionItem value={`item-${index}`}>
							<AccordionTrigger className="hover:text-foreground/60 hover:no-underline">
								{faq.question}
							</AccordionTrigger>
							<AccordionContent>{faq.answer}</AccordionContent>
						</AccordionItem>
					</Accordion>
				))}
			</div>
		</section>
	);
}
