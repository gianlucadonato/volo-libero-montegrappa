"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useMemberOnlyModal } from "@/components/modals/member-only-event-modal";
import { useSignInModal } from "@/components/modals/sign-in-modal";
import { useDeleteAccountModal } from "./delete-account-modal";

export const ModalContext = createContext<{
  setShowSignInModal: Dispatch<SetStateAction<boolean>>;
  setShowMemberOnlyModal: Dispatch<SetStateAction<boolean>>;
  setShowDeleteAccountModal: Dispatch<SetStateAction<boolean>>;
}>({
  setShowSignInModal: () => {},
  setShowMemberOnlyModal: () => {},
  setShowDeleteAccountModal: () => {},
});

export default function ModalProvider({ children }: { children: ReactNode }) {
  const { SignInModal, setShowSignInModal } = useSignInModal();
  const { Modal: MemberOnlyModal, setShowModal: setShowMemberOnlyModal } =
    useMemberOnlyModal();
  const { DeleteAccountModal, setShowDeleteAccountModal } =
    useDeleteAccountModal();
  return (
    <ModalContext.Provider
      value={{
        setShowSignInModal,
        setShowMemberOnlyModal,
        setShowDeleteAccountModal,
      }}
    >
      <SignInModal />
      <MemberOnlyModal />
      <DeleteAccountModal />
      {children}
    </ModalContext.Provider>
  );
}
