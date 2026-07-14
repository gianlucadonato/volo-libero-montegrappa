import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import getMembershipVerification from "@/actions/getMembershipVerification";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Verifica tessera - ${siteConfig.name}`,
	description: "Verifica dello stato della tessera socio",
	noIndex: true,
});

export default async function VerifyMembershipPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const t = await getTranslations("MembershipVerify");
	const data = await getMembershipVerification(id);

	return (
		<div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-16">
			<div className="w-full max-w-md">
				{!data ? (
					<div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
						<p className="font-heading text-xl uppercase">{t("non_trovata")}</p>
						<p className="mt-2 text-sm text-muted-foreground">
							{t("non_trovata_desc")}
						</p>
					</div>
				) : (
					<div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2744] via-[#22304f] to-[#0f1830] p-8 text-white shadow-xl ring-1 ring-white/10">
						<div className="flex flex-col items-center text-center">
							<Image
								src="/logo/LOGO_CLUB.png"
								alt=""
								width={72}
								height={72}
								className="size-16"
							/>
							<p className="mt-2 font-heading text-base uppercase tracking-wide">
								Volo Libero Montegrappa
							</p>
							<p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
								{t("title")}
							</p>
						</div>

						<div className="mt-6 text-center">
							<p className="text-2xl font-semibold">
								{data.firstName} {data.lastName}
							</p>
							<p className="mt-1 text-sm text-white/60">
								{t("numero")} {data.memberId} · {t("socio_dal")}{" "}
								{data.sinceYear}
							</p>
						</div>

						<div className="mt-6 flex justify-center">
							<span
								className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${
									data.isActive
										? "border-[#c2e71f]/40 text-[#c2e71f]"
										: "border-white/20 text-white/60"
								}`}
							>
								<ShieldCheck className="size-4" />
								{data.isActive
									? t("tessera_attiva", { year: data.currentYear })
									: t("tessera_non_attiva", { year: data.currentYear })}
							</span>
						</div>

						{data.years.length > 0 && (
							<div className="mt-8">
								<p className="text-center text-[10px] uppercase tracking-widest text-white/40">
									{t("anni_iscrizione")}
								</p>
								<div className="mt-2 flex flex-wrap justify-center gap-2">
									{data.years.map((year) => (
										<span
											key={year}
											className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 ring-1 ring-white/10"
										>
											{year}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
