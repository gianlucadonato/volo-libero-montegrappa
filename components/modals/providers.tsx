"use client";

import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react";
import { useEnrollXcEditionModal } from "@/components/modals/enroll-xcedition-modal";
import { useMemberOnlyModal } from "@/components/modals/member-only-event-modal";
import { useSignInModal } from "@/components/modals/sign-in-modal";
import { useDeleteAccountModal } from "./delete-account-modal";

export const ModalContext = createContext<{
	setShowSignInModal: Dispatch<SetStateAction<boolean>>;
	setShowMemberOnlyModal: Dispatch<SetStateAction<boolean>>;
	setShowDeleteAccountModal: Dispatch<SetStateAction<boolean>>;
	setShowEnrollXcEditionModal: Dispatch<SetStateAction<boolean>>;
}>({
	setShowSignInModal: () => {},
	setShowMemberOnlyModal: () => {},
	setShowDeleteAccountModal: () => {},
	setShowEnrollXcEditionModal: () => {},
});

export default function ModalProvider({ children }: { children: ReactNode }) {
	const { SignInModal, setShowSignInModal } = useSignInModal();
	const { Modal: MemberOnlyModal, setShowModal: setShowMemberOnlyModal } =
		useMemberOnlyModal();
	const { DeleteAccountModal, setShowDeleteAccountModal } =
		useDeleteAccountModal();
	const { EnrollXcEditionModal, setShowModal: setShowEnrollXcEditionModal } =
		useEnrollXcEditionModal();
	return (
		<ModalContext.Provider
			value={{
				setShowSignInModal,
				setShowMemberOnlyModal,
				setShowDeleteAccountModal,
				setShowEnrollXcEditionModal,
			}}
		>
			<SignInModal />
			<MemberOnlyModal />
			<DeleteAccountModal />
			<EnrollXcEditionModal />
			{children}
		</ModalContext.Provider>
	);
}
