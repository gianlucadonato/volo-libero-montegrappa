"use client";

import { motion } from "framer-motion";
import { Check, Info, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { NEXT_YEAR } from "@/config/constants";
import { cn } from "@/lib/utils";

export default function PricingCard({
	features,
	price,
	selected,
	onClick,
}: {
	features: { title: string; info?: boolean }[];
	price: number;
	selected?: boolean;
	onClick?: () => void;
}) {
	const t = useTranslations("PurchaseMembershipCard.PricingCard");
	return (
		<div className="col-span-1 mt-12">
			<div className="z-1 relative flex h-full flex-col text-start">
				{selected && (
					<motion.div
						className="absolute -top-7 left-0"
						variants={{
							hidden: {
								opacity: 0,
								y: 50,
							},
							visible: {
								opacity: 1,
								y: 0,
								transition: { delay: 0.3 },
							},
						}}
						initial="hidden"
						animate="visible"
						transition={{ duration: 1 }}
					>
						<div className="rounded-l-3xl rounded-r-xl bg-green-700 px-4 py-1.5 pb-12 pl-6 text-sm font-medium text-white">
							{t("selected", { NEXT_YEAR })}
						</div>
					</motion.div>
				)}
				<motion.div
					className={cn(
						"z-10 size-full max-w-md cursor-pointer rounded-3xl border bg-white bg-gradient-to-b p-6 shadow-xl",
						selected && "border-primary",
					)}
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					onClick={onClick}
				>
					<div>
						<h2 className="mb-2 text-center">{t("membership_price")}</h2>
						<div className="flex items-baseline justify-center">
							<span className="text-5xl font-bold">{price}&euro;</span>
						</div>
					</div>
					<div className="mt-6">
						<p className="mb-2 text-sm text-gray-400">{t("includes")}</p>
						<ul className="space-y-1">
							{features.map((feature, index) => (
								<div key={index}>
									{index !== 0 && (
										<div className="mb-2 flex items-center justify-center">
											<Plus className="size-4" />
										</div>
									)}
									<motion.li
										className="flex items-center space-x-3"
										initial={{ opacity: 0, x: -50 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.5, delay: index * 0.1 }}
									>
										<motion.span
											className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent"
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											transition={{
												type: "spring",
												stiffness: 500,
												delay: index * 0.1 + 0.2,
											}}
										>
											<Check className="size-4" />
										</motion.span>
										<div>{feature.title}</div>
									</motion.li>
									{feature.info && (
										<motion.li
											key={index}
											className="flex w-full items-center"
											initial={{ opacity: 0, x: -50 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.5, delay: index * 0.1 }}
										>
											<div className="flex w-full justify-center text-center">
												<Link
													target="_blank"
													href="https://flycard.vivereilgrappa.it/home"
												>
													<Button
														className="mr-2 gap-2 px-5"
														variant="link"
														size="sm"
													>
														<Info className="size-4" />
														<span className="text-xs">info</span>
													</Button>
												</Link>
											</div>
										</motion.li>
									)}
								</div>
							))}
						</ul>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
