"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import deleteNews from "@/actions/news/deleteNews";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export default function DeleteNewsButton({ id }: { id: string }) {
	const t = useTranslations("NewsPage");
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleDelete() {
		setIsDeleting(true);
		try {
			await deleteNews(id);
			posthog.capture("news_deleted", { news_id: id });
			toast.success("OK!", { description: t("delete_success") });
			router.push("/news");
		} catch {
			toast.error("Errore", { description: t("delete_error") });
			setIsDeleting(false);
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Trash2 className="mr-2 size-4" />
					{t("delete_news")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("delete_confirm_title")}</DialogTitle>
					<DialogDescription>
						{t("delete_confirm_description")}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">{t("cancel")}</Button>
					</DialogClose>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
						{t("delete_news")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
