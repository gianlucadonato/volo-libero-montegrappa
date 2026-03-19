import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useMemo,
	useState,
} from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { authClient } from "@/lib/auth-client";

function DeleteAccountModal({
	showDeleteAccountModal,
	setShowDeleteAccountModal,
}: {
	showDeleteAccountModal: boolean;
	setShowDeleteAccountModal: Dispatch<SetStateAction<boolean>>;
}) {
	const { data: session } = authClient.useSession();
	const [deleting, setDeleting] = useState(false);
	const t = useTranslations("SettingsPage.delete_account");
	const router = useRouter();

	async function deleteAccount() {
		setDeleting(true);
		await fetch(`/api/user`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
		}).then(async (res) => {
			if (res.status === 200) {
				// delay to allow for the route change to complete
				await new Promise((resolve) =>
					setTimeout(() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									setShowDeleteAccountModal(false);
									router.push("/login");
								},
							},
						});
						resolve(null);
					}, 500),
				);
			} else {
				setDeleting(false);
				const error = await res.text();
				throw error;
			}
		});
	}

	return (
		<Modal
			showModal={showDeleteAccountModal}
			setShowModal={setShowDeleteAccountModal}
			className="gap-0"
		>
			<div className="flex flex-col items-center justify-center space-y-3 border-b p-4 pt-8 sm:px-16">
				<UserAvatar
					user={{
						firstName: session?.user?.firstName || "",
						image: session?.user?.image || null,
					}}
					icon={User}
				/>
				<h3 className="text-lg font-semibold">{t("delete_account_btn")}</h3>
				<p className="text-center text-sm text-muted-foreground">
					<b>{t("modal_warning")}</b> {t("modal_warning_description")}
				</p>
			</div>

			<form
				onSubmit={async (e) => {
					e.preventDefault();
					toast.promise(deleteAccount(), {
						loading: t("deleting_account"),
						success: t("deleting_success"),
						error: (err) => err,
					});
				}}
				className="flex flex-col space-y-6 bg-accent px-4 py-8 text-left sm:px-16"
			>
				<div>
					<label htmlFor="verification" className="block text-sm">
						{t("verify_text_1")}{" "}
						<span className="font-semibold text-black dark:text-white">
							{t("verify_text_type")}
						</span>{" "}
						{t("verify_text_2")}
					</label>
					<Input
						type="text"
						name="verification"
						id="verification"
						pattern={t("verify_text_type")}
						required
						autoFocus={false}
						autoComplete="off"
						className="mt-1 w-full border bg-background"
					/>
				</div>

				<Button
					variant={deleting ? "disable" : "destructive"}
					className="text-white"
					disabled={deleting}
				>
					{t("confirm_delete_account")}
				</Button>
			</form>
		</Modal>
	);
}

export function useDeleteAccountModal() {
	const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

	const DeleteAccountModalCallback = useCallback(() => {
		return (
			<DeleteAccountModal
				showDeleteAccountModal={showDeleteAccountModal}
				setShowDeleteAccountModal={setShowDeleteAccountModal}
			/>
		);
	}, [showDeleteAccountModal]);

	return useMemo(
		() => ({
			setShowDeleteAccountModal,
			DeleteAccountModal: DeleteAccountModalCallback,
		}),
		[DeleteAccountModalCallback],
	);
}
