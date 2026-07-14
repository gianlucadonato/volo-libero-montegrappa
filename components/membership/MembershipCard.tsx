"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import QRCode from "react-qr-code";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

export interface MembershipCardProps {
	firstName: string;
	lastName: string;
	memberId: number;
	sinceYear: number;
	year: number;
	isActive: boolean;
	/** When set, a QR code linking to the public verification page is shown. */
	verifyUrl?: string;
	variant?: "current" | "past";
	className?: string;
	/** QR code side length in px (larger in the fullscreen dialog). */
	qrSize?: number;
}

const LIME = "#c2e71f";

export default function MembershipCard({
	firstName,
	lastName,
	memberId,
	sinceYear,
	year,
	isActive,
	verifyUrl,
	variant = "current",
	className,
	qrSize = 72,
}: MembershipCardProps) {
	const t = useTranslations("MembershipCard");
	const isPast = variant === "past";

	return (
		<div
			className={cn(
				"relative aspect-[1.6/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2744] via-[#22304f] to-[#0f1830] shadow-xl ring-1 ring-white/10",
				isPast && "shadow-md [filter:grayscale(0.55)_brightness(0.9)]",
				className,
			)}
		>
			{/* subtle texture + lime glow */}
			<DotPattern className="fill-white/[0.06]" width={22} height={22} cr={1} />
			<div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#c2e71f]/20 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-20 -left-16 size-48 rounded-full bg-[#22304f]/60 blur-3xl" />

			<div className="relative flex h-full flex-col justify-between p-5 text-white sm:p-6">
				{/* header */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<Image
							src="/logo/LOGO_CLUB.png"
							alt=""
							width={44}
							height={44}
							className={cn("size-9 shrink-0 sm:size-10", isPast && "size-8")}
						/>
						<div className="leading-tight">
							<p
								className={cn(
									"font-heading uppercase tracking-wide",
									isPast ? "text-xs" : "text-sm sm:text-base",
								)}
							>
								Volo Libero Montegrappa
							</p>
							<p className="text-[10px] uppercase tracking-[0.2em] text-white/60 sm:text-xs">
								{t("tessera_socio")}
							</p>
						</div>
					</div>
					<StatusBadge
						isActive={isActive}
						label={isActive ? t("attiva") : t("scaduta")}
					/>
				</div>

				{/* year + member details + QR */}
				<div className="flex items-end justify-between gap-4">
					<div className="min-w-0">
						<p
							className={cn(
								"font-heading leading-none text-[#c2e71f]",
								isPast ? "text-3xl" : "text-4xl sm:text-5xl",
							)}
						>
							{year}
						</p>
						<p
							className={cn(
								"mt-2 truncate font-semibold",
								isPast ? "text-base" : "text-lg sm:text-xl",
							)}
						>
							{firstName} {lastName}
						</p>
						<p className="mt-1 text-[11px] text-white/60 sm:text-xs">
							{t("numero")} {memberId} · {t("socio_dal")} {sinceYear}
						</p>
					</div>

					{verifyUrl && (
						<div className="shrink-0 rounded-lg bg-white p-1.5 shadow-sm">
							<QRCode
								value={verifyUrl}
								size={qrSize}
								fgColor="#0f1830"
								bgColor="#ffffff"
								level="M"
								style={{ height: `${qrSize}px`, width: `${qrSize}px` }}
							/>
						</div>
					)}
				</div>
			</div>

			{/* expired stamp */}
			{isPast && !isActive && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<span
						className="-rotate-12 rounded-md border-2 px-4 py-1 font-heading text-2xl uppercase tracking-widest"
						style={{
							color: "rgba(248,113,113,0.75)",
							borderColor: "rgba(248,113,113,0.6)",
						}}
					>
						{t("scaduta")}
					</span>
				</div>
			)}
		</div>
	);
}

function StatusBadge({
	isActive,
	label,
}: {
	isActive: boolean;
	label: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
				isActive
					? "border-[#c2e71f]/40 text-[#c2e71f]"
					: "border-white/20 text-white/50",
			)}
		>
			<span
				className="size-1.5 rounded-full"
				style={{ backgroundColor: isActive ? LIME : "rgba(255,255,255,0.4)" }}
			/>
			{label}
		</span>
	);
}
