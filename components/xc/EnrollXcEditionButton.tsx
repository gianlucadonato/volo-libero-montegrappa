import { Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useContext } from "react";
import { ModalContext } from "@/components/modals/providers";
import { Button, buttonVariants } from "@/components/ui/button";
import { useGetXcEnrollment } from "@/hooks/use-query-api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const BUTTON_CLASS = "btn-lime w-full uppercase sm:w-auto";

export default function EnrollXcEditionButton() {
	const t = useTranslations("XcMontegrappaPage");
	const { data: session } = authClient.useSession();
	const { data: enrollment } = useGetXcEnrollment(!!session?.user);
	const { setShowSignInModal, setShowEnrollXcEditionModal } =
		useContext(ModalContext);

	// Already enrolled for this season: nothing to sign up for, so point to
	// the pilot's own profile instead.
	if (session?.user && enrollment) {
		return (
			<Link
				href={`/xc/users/${session.user.id}`}
				className={cn(
					buttonVariants({ variant: "default", size: "lg" }),
					BUTTON_CLASS,
				)}
			>
				<UserRound className="mr-2 size-4" />
				{t("myProfileButton")}
			</Link>
		);
	}

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
			className={BUTTON_CLASS}
			onClick={handleEnrollClick}
		>
			<Trophy className="mr-2 size-4" />
			{t("enrollButton")}
		</Button>
	);
}
