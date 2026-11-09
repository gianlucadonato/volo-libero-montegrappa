"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EuroIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { withMask } from "use-mask-input";
import type * as z from "zod";
import upsertEvent from "@/actions/upsertEvent";
import { Editor } from "@/components/blocks/editor-00/editor";
import EventFileUpload from "@/components/EventFileUpload";
import { Button as CloseBtn } from "@/components/extendui/button";
import { Input } from "@/components/extendui/input";
import { FormMessageI18N } from "@/components/forms/form-message-i18n";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
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
import { uploadEventCoverApi } from "@/lib/api-client";
import type { Event } from "@/prisma/generated/client";
import { EventSchema } from "@/schemas";

// The schema coerces price and maxAvailability, so its input type (what the
// fields hold) differs from its output type (what handleSubmit receives).
type FormInput = z.input<typeof EventSchema>;
type FormData = z.output<typeof EventSchema>;

function formatEvent(event: Event): FormData {
	return {
		...event,
		eventDate: event.eventDate
			? new Date(event.eventDate).toISOString().split("T")[0]
			: "",
		optionalDate: event.optionalDate
			? new Date(event.optionalDate).toISOString().split("T")[0]
			: "",
		price: event.price ? Number((event.price || 0) / 100) : undefined,
		information: event.information || "",
		imageUrl: event.imageUrl || undefined,
		startTime: event.startTime || "",
		endTime: event.endTime || "",
		location: event.location || "",
		locationUrl: event.locationUrl || "",
		maxAvailability: event.maxAvailability || undefined,
	};
}

export function EventForm({
	event,
	onSubmit,
}: {
	event?: Event;
	onSubmit?: () => void;
}) {
	const form = useForm<FormInput, unknown, FormData>({
		resolver: zodResolver(EventSchema),
		values: event ? formatEvent(event) : undefined,
		defaultValues: {
			isMemberOnly: false,
		},
	});
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const [isUploadingCover, setIsUploadingCover] =
		React.useState<boolean>(false);
	// Not part of EventSchema: it is a one-off choice made when creating the
	// event, not something stored on it.
	const [announceOnTelegram, setAnnounceOnTelegram] =
		React.useState<boolean>(true);
	const [coverImage, setCoverImage] = React.useState<boolean>(
		Boolean(event?.imageUrl),
	);
	const t = useTranslations("NewEventPage");
	const router = useRouter();

	async function handleSubmit(data: FormData) {
		setIsLoading(true);
		try {
			const res = await upsertEvent({
				...data,
				id: event?.id,
				announceOnTelegram: !event && announceOnTelegram,
			});
			posthog.capture(event ? "event_updated" : "event_created", {
				event_id: res.id,
				is_member_only: data.isMemberOnly,
				has_cover_image: Boolean(data.imageUrl),
				...(event ? {} : { announced_on_telegram: announceOnTelegram }),
			});
			onSubmit?.();
			toast.success("OK!", {
				description: t(event ? "edit_success" : "create_success"),
			});
			return router.push(`/events/${res.id}`);
		} catch {
			return toast.error("Errore", { description: t("event_error") });
		} finally {
			setIsLoading(false);
		}
	}

	const onUploadComplete = async (file: File) => {
		setIsUploadingCover(true);
		try {
			const { data, error } = await uploadEventCoverApi(file);
			if (error || !data) throw error;
			form.setValue("imageUrl", data.url);
		} catch {
			form.setValue("imageUrl", undefined);
			toast.error("Errore", { description: t("cover_upload_error") });
		} finally {
			setIsUploadingCover(false);
		}
	};

	const onUploadDelete = () => form.setValue("imageUrl", undefined);

	const showCoverImage = () => {
		if (!event?.imageUrl) return null;
		return (
			<div className="mb-6 mt-2 flex flex-col items-center justify-center">
				<CloseBtn
					variant="outline"
					size="sm"
					className="mb-2"
					onClick={() => {
						setCoverImage(false);
						form.setValue("imageUrl", undefined);
					}}
				>
					<X className="mr-2 size-4" />
					<span>Rimuovi immagine</span>
				</CloseBtn>
				<div className="relative w-75">
					<Image
						src={event.imageUrl}
						alt="event cover image"
						className="rounded-md object-cover"
						width={300}
						height={550}
					/>
				</div>
			</div>
		);
	};

	return (
		<div className="mb-8 grid gap-6">
			{coverImage ? (
				showCoverImage()
			) : (
				<div className="mb-6">
					<EventFileUpload
						multiple={false}
						acceptedFileTypes={EVENT_COVER_ACCEPTED_TYPES}
						maxSizeInMB={EVENT_COVER_MAX_UPLOAD_MB}
						onUploadComplete={onUploadComplete}
						onDelete={onUploadDelete}
					/>
				</div>
			)}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
					<div className="space-y-6">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("event.title")} (*)</FormLabel>
									<FormControl>
										<Input placeholder={t("event.title")} {...field} />
									</FormControl>
									<FormMessageI18N />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("event.description")} (*)</FormLabel>
									<FormControl>
										<div className="border rounded-md">
											<Editor
												htmlValue={field.value}
												onHtmlChange={field.onChange}
												className="w-full"
												placeholder={t("event.description")}
											/>
										</div>
									</FormControl>
									<FormMessageI18N />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="eventDate"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>{t("event.eventDate")} (*)</FormLabel>
										<FormControl>
											<Input
												type="date"
												placeholder={t("event.eventDate")}
												{...field}
											/>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="optionalDate"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>{t("event.optionalDate")}</FormLabel>
										<FormControl>
											<Input
												type="date"
												placeholder={t("event.optionalDate")}
												{...field}
											/>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="startTime"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>{t("event.startTime")}</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder={t("event.startTime")}
												ref={withMask("99:99")}
											/>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="endTime"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>{t("event.endTime")}</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder={t("event.endTime")}
												ref={withMask("99:99")}
											/>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="location"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>{t("event.location")}</FormLabel>
										<FormControl>
											<Input placeholder={t("event.location")} {...field} />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="locationUrl"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>{t("event.locationUrl")}</FormLabel>
										<FormControl>
											<Input placeholder={t("event.locationUrl")} {...field} />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="price"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>{t("event.price")}</FormLabel>
										<FormControl>
											<Input
												type="number"
												inputMode="numeric"
												placeholder={t("event.price")}
												{...field}
											>
												<Input.Group>
													<Input.RightIcon>
														<EuroIcon />
													</Input.RightIcon>
												</Input.Group>
											</Input>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="maxAvailability"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>{t("event.maxAvailability")}</FormLabel>
										<FormControl>
											<Input
												type="number"
												inputMode="numeric"
												placeholder={t("event.maxAvailability")}
												{...field}
											/>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="information"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("event.information")}</FormLabel>
									<FormControl>
										<Textarea placeholder={t("event.information")} {...field} />
									</FormControl>
									<FormMessageI18N />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="isMemberOnly"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("event.isMemberOnly")}</FormLabel>
									<FormControl>
										<div>
											<Switch
												id="isMemberOnly"
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
											{/* <Label htmlFor="isMemberOnly">{t('event.isMemberOnly')}</Label> */}
										</div>
									</FormControl>
									<FormMessageI18N />
								</FormItem>
							)}
						/>
						{!event && (
							<FormItem>
								<FormLabel htmlFor="announceOnTelegram">
									{t("event.announceOnTelegram")}
								</FormLabel>
								<div>
									<Switch
										id="announceOnTelegram"
										checked={announceOnTelegram}
										onCheckedChange={setAnnounceOnTelegram}
									/>
								</div>
							</FormItem>
						)}
					</div>
					<div className="mt-8 grid gap-2">
						<Button type="submit" disabled={isLoading || isUploadingCover}>
							{(isLoading || isUploadingCover) && (
								<Loader2 className="mr-2 size-4 animate-spin" />
							)}
							{event ? t("edit_event") : t("create_event")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
