"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Timeline from "@/components/Timeline";
import { Button } from "@/components/ui/button";

// Names stay as they are in every language; only the roles are translated
// (ClubPage.board in messages/*.json).
const board = [
	{ name: "Lorenzo Zamprogno", role: "president" },
	{ name: "Deivi Gavril", role: "vice_president" },
	{ name: "Nadia Moretto", role: "secretary" },
	{ name: "Nicola Antico", role: "youth_local_xc" },
	{ name: "Alessandro Cerato", role: "triveneto_xc" },
	{ name: "Daniele Matteazzi", role: "hang_gliding" },
	{ name: "Gianluca Donato", role: "it_events" },
] as const;

export default function ClubPage() {
	const t = useTranslations("ClubPage");

	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[50vh] flex-col bg-slate-50 bg-[url('/club.webp')] bg-cover bg-center">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						{/* <h1 className="font-heading text-4xl uppercase text-white">IL CLUB</h1> */}
					</div>
				</div>
			</div>
			<section className="px-4 py-20">
				<div className="container mx-auto flex min-h-[310px] flex-col items-center gap-16">
					<div>
						<h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
							<span className="block">{t("title_line1")}</span>
							<span className="highlight block">{t("title_line2")}</span>
						</h1>

						<div className="py-10">
							<p className="mx-auto max-w-3xl text-left">
								{t.rich("intro", { br: () => <br /> })}
							</p>

							<div className="mt-8 flex justify-center">
								<Link href="/directions">
									<Button variant="outline">
										{t("our_seat")}
										<ArrowRight className="ml-2 size-4" />
									</Button>
								</Link>
							</div>
						</div>

						<h1 className="mt-10 text-center font-heading text-2xl uppercase sm:text-3xl">
							<span className="mr-2">{t("board_title_line1")}</span>
							<span className="highlight">{t("board_title_line2")}</span>
						</h1>

						<div className="py-10">
							<div className="mx-auto max-w-3xl">
								<ul className="mx-auto text-left">
									{board.map(({ name, role }) => (
										<li key={name} className="mb-2">
											{name} ({t(`board.${role}`)})
										</li>
									))}
								</ul>
							</div>
						</div>

						<h1 className="mt-20 text-center font-heading text-2xl uppercase sm:text-3xl">
							<span className="mr-2">{t("history_title_line1")}</span>
							<span className="highlight">{t("history_title_line2")}</span>
						</h1>
						<div className="py-10">
							<p className="mx-auto max-w-6xl text-left">
								{t.rich("history_intro", { br: () => <br /> })}
							</p>
							<div>
								<Timeline />
							</div>
						</div>

						<div className="mt-10 pb-20">
							<h1 className="text-center font-heading text-2xl uppercase">
								{t("to_be_continued")}
							</h1>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
