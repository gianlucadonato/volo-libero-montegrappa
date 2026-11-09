import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useMemo,
	useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { useGetXcEnrollment } from "@/hooks/use-query-api";
import { createXcEnrollmentApi } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { xcSeasonYear } from "@/lib/xc-season";

function EnrollXcEditionModal({
	showModal,
	setShowModal,
}: {
	showModal: boolean;
	setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
	const t = useTranslations("EnrollXcEditionModal");
	const [isLoading, setIsLoading] = useState(false);
	const [acceptedLiability, setAcceptedLiability] = useState(false);
	const [acceptedRegolamento, setAcceptedRegolamento] = useState(false);
	const queryClient = useQueryClient();
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const { data: enrollment } = useGetXcEnrollment(!!session?.user);
	const isAlreadyEnrolled = !!enrollment;
	const seasonYear = xcSeasonYear();

	const handleConfirmEnrollment = async () => {
		setIsLoading(true);
		const { response } = await createXcEnrollmentApi();
		if (response.ok) {
			await queryClient.invalidateQueries({
				queryKey: ["get", "/xc/enroll"],
			});
			// The profile lists enrolled editions: refresh it in case we're on it.
			await queryClient.invalidateQueries({
				queryKey: ["get", "/xc/users/{id}"],
			});
			posthog.capture("xc_enrollment_created", {
				edition_year: seasonYear,
			});
			toast.success(t("toast.success"));
			setShowModal(false);
			// Land on the pilot's own XC profile, where their progress will show up.
			if (session?.user) router.push(`/xc/users/${session.user.id}`);
		} else {
			if (response.status === 409) {
				toast.error(t("toast.alreadyEnrolled"));
			} else {
				toast.error(t("toast.genericError"));
			}
		}
		setIsLoading(false);
	};

	return (
		<Modal
			className="md:max-w-2xl"
			showModal={showModal}
			setShowModal={setShowModal}
		>
			<div className="w-full px-4 py-5">
				<DialogHeader>
					<DialogTitle className="pr-4 py-2">
						{t("dialog.title", { year: seasonYear })}
					</DialogTitle>
					<DialogDescription className="py-2">
						{t("dialog.description", { year: seasonYear })}
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4 flex flex-col gap-3">
					{isAlreadyEnrolled && (
						<p className="text-sm font-medium text-green-600">
							{t("dialog.alreadyEnrolledMessage")}
						</p>
					)}
					<div className="flex items-start gap-2">
						<Checkbox
							id="accept-liability"
							checked={acceptedLiability}
							onCheckedChange={(v) => setAcceptedLiability(v === true)}
							disabled={isAlreadyEnrolled}
						/>
						<Label htmlFor="accept-liability" className="text-sm leading-snug">
							{t.rich("dialog.acceptLiability", {
								link: (chunks) => (
									<a
										href="/xc/Dichiarazione%20e%20scarico%20responsabilita.pdf"
										target="_blank"
										rel="noopener noreferrer"
										className="underline text-primary"
									>
										{chunks}
									</a>
								),
							})}
						</Label>
					</div>
					<div className="flex items-start gap-2">
						<Checkbox
							id="accept-regolamento"
							checked={acceptedRegolamento}
							onCheckedChange={(v) => setAcceptedRegolamento(v === true)}
							disabled={isAlreadyEnrolled}
						/>
						<Label
							htmlFor="accept-regolamento"
							className="text-sm leading-snug"
						>
							{t.rich("dialog.acceptRegolamento", {
								link: (chunks) => (
									<a
										href="/docs/REGOLAMENTO%20v.1.4.pdf"
										target="_blank"
										rel="noopener noreferrer"
										className="underline text-primary"
									>
										{chunks}
									</a>
								),
							})}
						</Label>
					</div>
					<div className="flex gap-2 justify-end">
						<Button variant="outline" onClick={() => setShowModal(false)}>
							{t("dialog.cancel")}
						</Button>
						<Button
							onClick={handleConfirmEnrollment}
							disabled={
								isLoading ||
								isAlreadyEnrolled ||
								!acceptedLiability ||
								!acceptedRegolamento
							}
							className="bg-lime-500 hover:bg-lime-600"
						>
							{isLoading ? t("dialog.loading") : t("dialog.confirm")}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}

export function useEnrollXcEditionModal() {
	const [showModal, setShowModal] = useState(false);

	const ModalCallback = useCallback(() => {
		return (
			<EnrollXcEditionModal showModal={showModal} setShowModal={setShowModal} />
		);
	}, [showModal]);

	return useMemo(
		() => ({
			setShowModal,
			EnrollXcEditionModal: ModalCallback,
		}),
		[ModalCallback],
	);
}
