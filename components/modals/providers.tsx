"use client";

import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react";
import { useMemberOnlyModal } from "@/components/modals/member-only-event-modal";
import { useSignInModal } from "@/components/modals/sign-in-modal";

export const ModalContext = createContext<{
	setShowSignInModal: Dispatch<SetStateAction<boolean>>;
	setShowMemberOnlyModal: Dispatch<SetStateAction<boolean>>;
}>({
	setShowSignInModal: () => {},
	setShowMemberOnlyModal: () => {},
});

export default function ModalProvider({ children }: { children: ReactNode }) {
	const { SignInModal, setShowSignInModal } = useSignInModal();
	const { Modal: MemberOnlyModal, setShowModal: setShowMemberOnlyModal } =
		useMemberOnlyModal();

	return (
		<ModalContext.Provider
			value={{
				setShowSignInModal,
				setShowMemberOnlyModal,
			}}
		>
			<SignInModal />
			<MemberOnlyModal />
			{children}
		</ModalContext.Provider>
	);
}
