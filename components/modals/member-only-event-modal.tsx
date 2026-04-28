import { NotebookPen, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useMemo,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";
import PrimaryButton from "../PrimaryButton";

function MemberOnlyModal({
	showModal,
	setShowModal,
}: {
	showModal: boolean;
	setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
	const t = useTranslations("MemberOnlyModal");
	return (
		<Modal
			className="max-w-lg"
			showModal={showModal}
			setShowModal={setShowModal}
		>
			<div className="w-full px-4 py-5">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<TriangleAlert className="mr-2 size-5" />
						{t("title")}
					</DialogTitle>
					<DialogDescription className="py-4">
						{t("description")}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="flex gap-2 p-4">
					<Button variant="outline" onClick={() => setShowModal(false)}>
						{t("cancel")}
					</Button>
					<Link href="/membership" onClick={() => setShowModal(false)}>
						<PrimaryButton>
							<NotebookPen className="mr-2 size-4" />
							{t("join_the_club")}
						</PrimaryButton>
					</Link>
				</DialogFooter>
			</div>
		</Modal>
	);
}

export function useMemberOnlyModal() {
	const [showModal, setShowModal] = useState(false);

	const ModalCallback = useCallback(() => {
		return (
			<MemberOnlyModal showModal={showModal} setShowModal={setShowModal} />
		);
	}, [showModal]);

	return useMemo(
		() => ({
			setShowModal,
			Modal: ModalCallback,
		}),
		[ModalCallback],
	);
}
