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
import { createXcEnrollmentApi } from "@/lib/api-client";
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

	const handleConfirmEnrollment = async () => {
		setIsLoading(true);
		const { response } = await createXcEnrollmentApi();
		if (response.ok) {
			await queryClient.invalidateQueries({
				queryKey: ["get", "/xc/{category}/progress"],
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
				<div className="mt-4 flex gap-2 justify-end">
					<Button variant="outline" onClick={() => setShowModal(false)}>
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
