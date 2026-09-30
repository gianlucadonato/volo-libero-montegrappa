"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";
import upsertNews from "@/actions/news/upsertNews";
import EventFileUpload from "@/components/EventFileUpload";
import { Button as CloseBtn } from "@/components/extendui/button";
import { Input } from "@/components/extendui/input";
import { FormMessageI18N } from "@/components/forms/form-message-i18n";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	EVENT_COVER_ACCEPTED_TYPES,
	EVENT_COVER_MAX_UPLOAD_MB,
} from "@/config/constants";
import { uploadNewsImageApi } from "@/lib/api-client";
import type { NewsPartialBlock } from "@/lib/news-schema";
import type { News } from "@/prisma/generated/client";
import { NewsSchema } from "@/schemas";

// BlockNote touches the DOM as soon as it is imported.
const NewsEditor = dynamic(() => import("@/components/news/NewsEditor"), {
	ssr: false,
	loading: () => (
		<div className="flex min-h-80 items-center justify-center">
			<Spinner />
		</div>
	),
});

type FormData = z.input<typeof NewsSchema>;

const today = () => new Date().toISOString().split("T")[0];

function formatNews(news: News): FormData {
	return {
		title: news.title,
		excerpt: news.excerpt ?? "",
		coverUrl: news.coverUrl ?? undefined,
		content: news.content as FormData["content"],
		publishedAt: news.publishedAt.toISOString().split("T")[0],
		draft: news.draft,
	};
}

export function NewsForm({ news }: { news?: News }) {
	const form = useForm<FormData>({
		resolver: zodResolver(NewsSchema),
		defaultValues: news
			? formatNews(news)
			: {
					title: "",
					excerpt: "",
					content: [],
					publishedAt: today(),
					draft: false,
				},
	});
	const [isLoading, setIsLoading] = React.useState(false);
	const [isUploadingCover, setIsUploadingCover] = React.useState(false);
	const coverUrl = form.watch("coverUrl");
	const t = useTranslations("NewNewsPage");
	const router = useRouter();

	async function handleSubmit(data: FormData) {
		setIsLoading(true);
		try {
			const res = await upsertNews({ ...data, id: news?.id });
			posthog.capture(news ? "news_updated" : "news_created", {
				news_id: res.id,
				is_draft: data.draft,
				has_cover_image: Boolean(data.coverUrl),
			});
			toast.success("OK!", {
				description: t(news ? "edit_success" : "create_success"),
			});
			router.push(`/news/${res.slug}`);
		} catch {
			toast.error("Errore", { description: t("news_error") });
		} finally {
			setIsLoading(false);
		}
	}

	async function onCoverUpload(file: File) {
		setIsUploadingCover(true);
		try {
			const { data, error } = await uploadNewsImageApi(file);
			if (error || !data) throw error;
			form.setValue("coverUrl", data.url);
		} catch {
			form.setValue("coverUrl", undefined);
			toast.error("Errore", { description: t("image_upload_error") });
		} finally {
			setIsUploadingCover(false);
		}
	}

	const busy = isLoading || isUploadingCover;

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="mb-8 space-y-6"
			>
				<FormItem>
					<FormLabel>{t("news.cover")}</FormLabel>
					{coverUrl ? (
						<div className="flex flex-col items-start gap-2">
							<div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md bg-slate-100">
								<Image
									src={coverUrl}
									alt=""
									fill
									sizes="448px"
									className="object-cover"
								/>
							</div>
							<CloseBtn
								type="button"
								variant="outline"
								size="sm"
								onClick={() => form.setValue("coverUrl", undefined)}
							>
								<X className="mr-2 size-4" />
								<span>{t("news.remove_cover")}</span>
							</CloseBtn>
						</div>
					) : (
						<EventFileUpload
							multiple={false}
							acceptedFileTypes={EVENT_COVER_ACCEPTED_TYPES}
							maxSizeInMB={EVENT_COVER_MAX_UPLOAD_MB}
							onUploadComplete={onCoverUpload}
							onDelete={() => form.setValue("coverUrl", undefined)}
						/>
					)}
				</FormItem>

				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("news.title")} (*)</FormLabel>
							<FormControl>
								<Input placeholder={t("news.title")} {...field} />
							</FormControl>
							<FormMessageI18N />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="excerpt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("news.excerpt")}</FormLabel>
							<FormControl>
								<Textarea
									rows={2}
									placeholder={t("news.excerpt_placeholder")}
									{...field}
								/>
							</FormControl>
							<FormMessageI18N />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("news.content")}</FormLabel>
							<FormDescription>{t("news.content_hint")}</FormDescription>
							<div className="rounded-md border">
								<NewsEditor
									initialContent={field.value as NewsPartialBlock[]}
									onChange={field.onChange}
									onUploadError={() =>
										toast.error("Errore", {
											description: t("image_upload_error"),
										})
									}
								/>
							</div>
							<FormMessageI18N />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<FormField
						control={form.control}
						name="publishedAt"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("news.publishedAt")} (*)</FormLabel>
								<FormControl>
									<Input type="date" {...field} />
								</FormControl>
								<FormDescription>{t("news.publishedAt_hint")}</FormDescription>
								<FormMessageI18N />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="draft"
						render={({ field }) => (
							<FormItem>
								<FormLabel htmlFor="draft">{t("news.draft")}</FormLabel>
								<FormControl>
									<div>
										<Switch
											id="draft"
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</div>
								</FormControl>
								<FormDescription>{t("news.draft_hint")}</FormDescription>
							</FormItem>
						)}
					/>
				</div>

				<div className="grid gap-2 pt-2">
					<Button type="submit" disabled={busy}>
						{busy && <Loader2 className="mr-2 size-4 animate-spin" />}
						{news ? t("edit_news") : t("create_news")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
