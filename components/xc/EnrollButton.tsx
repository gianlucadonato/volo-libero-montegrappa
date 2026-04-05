import { useQueryClient } from "@tanstack/react-query";
import { NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useContext, useState } from "react";
import { toast } from "sonner";
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
import { createXcEnrollmentApi } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

export default function EnrollButton({ callback }: { callback?: string }) {
	const t = useTranslations("XcMontegrappaPage");
	const { data: session } = authClient.useSession();
	const { setShowSignInModal, setShowMemberOnlyModal } =
		useContext(ModalContext);
	const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const queryClient = useQueryClient();

	const handleEnrollClick = () => {
		if (!session) {
			setShowSignInModal(true);
			return;
		}
		setIsEnrollDialogOpen(true);
	};

	const handleConfirmEnrollment = async () => {
		setIsLoading(true);
		const { response } = await createXcEnrollmentApi();
		if (response.ok) {
			await queryClient.invalidateQueries({
				queryKey: ["get", "/xc/{category}/progress"],
			});
			toast.success(t("toast.success"));
			setIsEnrollDialogOpen(false);
			callback && router.push(callback);
		} else {
			if (response.status === 403) {
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
		<>
			<Button
				variant="default"
				size="lg"
				className="btn-lime uppercase"
				onClick={handleEnrollClick}
			>
				<NotebookPen className="mr-2 size-4" />
				{t("enrollButton")}
			</Button>
			{/* Enrollment Dialog */}
			<Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="pr-4 py-2">
							{t("dialog.title", { year: NEXT_YEAR })}
						</DialogTitle>
						<DialogDescription className="py-2">
							{t("dialog.description", { year: NEXT_YEAR })}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{/* <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
							<p className="text-sm text-blue-800">
								{t("dialog.info", { year: NEXT_YEAR })}
							</p>
						</div> */}
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
		</>
	);
}
