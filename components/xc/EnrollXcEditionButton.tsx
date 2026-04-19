import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useContext } from "react";
import { ModalContext } from "@/components/modals/providers";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function EnrollXcEditionButton() {
	const t = useTranslations("XcMontegrappaPage");
	const { data: session } = authClient.useSession();
	const { setShowSignInModal, setShowEnrollXcEditionModal } =
		useContext(ModalContext);

	const handleEnrollClick = () => {
		if (!session) {
			setShowSignInModal(true);
			return;
		}
		setShowEnrollXcEditionModal(true);
	};

	return (
		<Button
			variant="default"
			size="lg"
			className="btn-lime w-full uppercase sm:w-auto"
			onClick={handleEnrollClick}
		>
			<Trophy className="mr-2 size-4" />
			{t("enrollButton")}
		</Button>
	);
}
