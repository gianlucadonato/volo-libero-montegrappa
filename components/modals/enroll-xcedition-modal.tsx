import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";
import { NEXT_YEAR } from "@/config/constants";
import { useGetXcEnrollment } from "@/hooks/use-query-api";
import { createXcEnrollmentApi } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { ModalContext } from "./providers";

function EnrollXcEditionModal({
	showModal,
	setShowModal,
}: {
	showModal: boolean;
	setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
	const t = useTranslations("EnrollXcEditionModal");
	const { setShowMemberOnlyModal } = useContext(ModalContext);
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const { data: enrollment } = useGetXcEnrollment(!!session?.user);
	const isAlreadyEnrolled = !!enrollment;

	const handleConfirmEnrollment = async () => {
		setIsLoading(true);
		const { response } = await createXcEnrollmentApi();
		if (response.ok) {
			await queryClient.invalidateQueries({
				queryKey: ["get", "/xc/enroll"],
			});
			toast.success(t("toast.success"));
			setShowModal(false);
		} else {
			if (response.status === 403) {
				setShowModal(false);
				setShowMemberOnlyModal(true);
			} else if (response.status === 409) {
				toast.error(t("toast.alreadyEnrolled"));
			} else {
				toast.error(t("toast.genericError"));
			}
		}
		setIsLoading(false);
	};

	return (
		<Modal
			className="max-w-lg"
			showModal={showModal}
			setShowModal={setShowModal}
		>
			<div className="w-full px-4 py-5">
				<DialogHeader>
					<DialogTitle className="pr-4 py-2">
						{t("dialog.title", { year: NEXT_YEAR })}
					</DialogTitle>
					<DialogDescription className="py-2">
						{t("dialog.description", { year: NEXT_YEAR })}
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4 flex flex-col gap-2">
					{isAlreadyEnrolled && (
						<p className="text-sm font-medium text-green-600">
							{t("dialog.alreadyEnrolledMessage")}
						</p>
					)}
					<div className="flex gap-2 justify-end">
						<Button variant="outline" onClick={() => setShowModal(false)}>
							{t("dialog.cancel")}
						</Button>
						<Button
							onClick={handleConfirmEnrollment}
							disabled={isLoading || isAlreadyEnrolled}
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
