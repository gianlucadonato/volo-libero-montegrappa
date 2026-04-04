"use client";

import { useTranslations } from "next-intl";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
	const t = useTranslations("XcMontegrappaFAQ");
	const faqIds = ["whoCan", "howMany", "whenFly", "whenCollect", "prizes"];

	return (
		<section className="w-full">
			<div>
				{faqIds.map((faqId, index) => (
					<Accordion key={index} type="single" collapsible>
						<AccordionItem value={`item-${index}`}>
							<AccordionTrigger className="hover:text-foreground/60 hover:no-underline">
								{t(`items.${faqId}.question`)}
							</AccordionTrigger>
							<AccordionContent>{t(`items.${faqId}.answer`)}</AccordionContent>
						</AccordionItem>
					</Accordion>
				))}
			</div>
		</section>
	);
}
