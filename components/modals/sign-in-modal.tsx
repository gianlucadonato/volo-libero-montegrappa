import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useMemo,
	useState,
} from "react";
import Login from "@/components/auth/Login";
import { DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";

function SignInModal({
	showSignInModal,
	setShowSignInModal,
}: {
	showSignInModal: boolean;
	setShowSignInModal: Dispatch<SetStateAction<boolean>>;
}) {
	return (
		<Modal
			className="h-[500px] max-w-lg"
			setShowModal={setShowSignInModal}
			showModal={showSignInModal}
		>
			<DialogTitle className="sr-only">Sign In</DialogTitle>
			<div className="w-full px-4 pt-5">
				<Login onClick={() => setShowSignInModal(false)} />
			</div>
		</Modal>
	);
}

export function useSignInModal() {
	const [showSignInModal, setShowSignInModal] = useState(false);

	const SignInModalCallback = useCallback(() => {
		return (
			<SignInModal
				showSignInModal={showSignInModal}
				setShowSignInModal={setShowSignInModal}
			/>
		);
	}, [showSignInModal]);

	return useMemo(
		() => ({
			setShowSignInModal,
			SignInModal: SignInModalCallback,
		}),
		[SignInModalCallback],
	);
}
