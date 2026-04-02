"use client";

import { ArrowRight, NotebookPen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useContext, useState } from "react";
import { IoIosMedal } from "react-icons/io";
import { toast } from "sonner";
import enrollInXcEdition from "@/actions/xc/enrollInXcEdition";
import { ModalContext } from "@/components/modals/providers";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { NEXT_YEAR } from "@/config/constants";
import { authClient } from "@/lib/auth-client";
import FAQ from "./FAQ";

export default function XcMontegrappaPage() {
	const router = useRouter();
	const t = useTranslations("XcMontegrappaPage");
	const { data: session } = authClient.useSession();
	const { setShowSignInModal } = useContext(ModalContext);
	const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleEnrollClick = () => {
		if (!session) {
			setShowSignInModal(true);
			return;
		}
		setIsEnrollDialogOpen(true);
	};

	const handleConfirmEnrollment = async () => {
		setIsLoading(true);
		try {
			await enrollInXcEdition();
			toast.success(t("toast.success"));
			setIsEnrollDialogOpen(false);
			router.push("/xc-montegrappa/basic");
		} catch (error) {
			const message = error instanceof Error ? error.message : "";
			if (message.includes("già iscritto")) {
				toast.error(t("toast.alreadyEnrolled"));
			} else {
				toast.error(t("toast.genericError"));
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/banner-panetun.jpg')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							{t("banner.title")}
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							{t("banner.subtitle")}
						</h3>
					</div>
				</div>
			</div>
			<section className="px-4 py-20">
				<div className="container mx-auto flex min-h-[310px] flex-col items-center gap-16">
					<div>
						<h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
							<span className="highlight block">{t("hero.title")}</span>
						</h1>

						<div className="py-10">
							<p className="mx-auto max-w-3xl text-left">
								{t.rich("intro", {
									strong: (chunks) => <strong>{chunks}</strong>,
									br: () => <br />,
									year: NEXT_YEAR,
								})}
							</p>
						</div>

						<div className="py-10">
							<h2 className="highlight font-heading text-2xl uppercase">
								{t("objectives.title")}
							</h2>
							<div className="mx-auto mt-4 max-w-3xl text-left">
								<span>{t("objectives.lead")}</span>
								<ul className="list-disc pl-5 pt-2">
									<li>{t("objectives.items.0")}</li>
									<li>{t("objectives.items.1")}</li>
									<li>{t("objectives.items.2")}</li>
								</ul>
							</div>
						</div>

						<div className="py-10">
							<h2 className="highlight font-heading text-2xl uppercase">
								{t("howItWorks.title")}
							</h2>
							<p className="mx-auto mt-4 max-w-3xl text-left">
								{t.rich("howItWorks.description", {
									strong: (chunks) => <strong>{chunks}</strong>,
									br: () => <br />,
								})}
							</p>
						</div>

						<div className="py-10">
							<h2 className="highlight font-heading text-2xl uppercase">
								{t("levels.title")}
							</h2>
							<div className="mx-auto mt-4 max-w-3xl text-left">
								{t("levels.lead")}
								<ul className="pt-4">
									<li className="mb-2 rounded-md border-2 border-transparent p-4 hover:cursor-pointer hover:border-[#CD7F32]">
										<Link href="/xc-montegrappa/basic">
											<div className="flex items-center gap-2">
												<div className="flex w-[40px] items-center justify-center">
													<IoIosMedal className="size-10 text-[#CD7F32]" />
												</div>
												<div className="gap-1 pl-2">
													<div className="text-lg">
														<strong>{t("levels.basic.title")}</strong>
													</div>
													<div className="text-md">
														{t("levels.basic.description")}
													</div>
													<div className="text-md text-gray-600">
														{t("levels.basic.details")}
													</div>
													<Button variant="outline" className="mt-2">
														{t("levels.viewTasks")}
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
														<strong>{t("levels.intermediate.title")}</strong>
													</div>
													<div className="text-md">
														{t("levels.intermediate.description")}
													</div>
													<div className="text-md text-gray-600">
														{t("levels.intermediate.details")}
													</div>
													<Button variant="outline" className="mt-2">
														{t("levels.viewTasks")}
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
														<strong>{t("levels.advanced.title")}</strong>
													</div>
													<div className="text-md">
														{t("levels.advanced.description")}
													</div>
													<div className="text-md text-gray-600">
														{t("levels.advanced.details")}
													</div>
													<Button variant="outline" className="mt-2">
														{t("levels.viewTasks")}
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
								{t("faqTitle")}
							</h2>
							<div className="mx-auto mt-4 max-w-3xl text-left">
								<FAQ />
							</div>
						</div>

						<div className="py-10">
							<div className="flex flex-col items-center justify-center">
								<div className="mb-4 text-center text-3xl font-caveat">
									{t.rich("cta", { br: () => <br /> })}
								</div>
								<Button
									variant="default"
									size="lg"
									className="btn-lime uppercase"
									onClick={handleEnrollClick}
								>
									<NotebookPen className="mr-2 size-4" />
									{t("enrollButton")}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Enrollment Dialog */}
			<Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("dialog.title", { year: NEXT_YEAR })}</DialogTitle>
						<DialogDescription>
							{t("dialog.description", { year: NEXT_YEAR })}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
							<p className="text-sm text-blue-800">
								{t("dialog.info", { year: NEXT_YEAR })}
							</p>
						</div>
						<div className="flex gap-2 justify-end">
							<Button
								variant="outline"
								onClick={() => setIsEnrollDialogOpen(false)}
							>
								{t("dialog.cancel")}
							</Button>
							<Button
								onClick={handleConfirmEnrollment}
								disabled={isLoading}
								className="bg-lime-500 hover:bg-lime-600"
							>
								{isLoading ? t("dialog.loading") : t("dialog.confirm")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
