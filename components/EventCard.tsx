"use client";

import { format, getDate, isBefore } from "date-fns";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { EventWithRegistrations } from "@/types";
import { SubscribeButton } from "./SubscribeButton";

export default function EventCard({
	event,
}: {
	event: EventWithRegistrations;
}) {
	const t = useTranslations("EventCard");
	const router = useRouter();

	const participants = useMemo(() => {
		if (!event?.registrations) return [];
		return event.registrations.filter((r) => r.status !== "CANCELLED");
	}, [event]);

	if (!event) {
		return null;
	}

	const isPastEvent = isBefore(event.eventDate, new Date());
	const isSoldOut = Boolean(
		event.maxAvailability &&
			Number(participants.length) >= Number(event.maxAvailability),
	);
	const getEventDate = () => {
		if (event.optionalDate) {
			const evtDate = getDate(new Date(event.eventDate));
			const optDate = getDate(new Date(event.optionalDate));
			return `${evtDate}-${optDate}/${format(new Date(event.eventDate), "MM/yyyy")}`;
		}
		return format(new Date(event.eventDate), "dd/MM/yyyy");
	};

	const handleCardClick = (
		e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
	) => {
		e.stopPropagation();
		router.push(`/events/${event.id}`);
	};

	return (
		<div
			onClick={handleCardClick}
			onKeyDown={handleCardClick}
			className={`relative cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg ${
				isPastEvent ? "opacity-75 hover:opacity-100" : ""
			}`}
		>
			<div className="relative h-48 w-full">
				<Image
					src={event.imageUrl || "/events/default.jpg"}
					alt={event.title}
					fill
					className="object-cover"
					priority
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
			</div>

			<div className="relative p-5">
				<div className="mb-2 flex items-center justify-between gap-2">
					{/* Event Date */}
					<div className="flex items-center text-gray-600">
						<CalendarDays className="mr-2 size-4" />
						<span>{getEventDate()} </span>
					</div>

					<div className="flex flex-1 items-center justify-end">
						{/* Event Ended */}
						{isPastEvent && (
							<span className="mr-1 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
								{t("ended")}
							</span>
						)}
						{/* Event Price */}
						<div
							className={cn(
								"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
								isPastEvent
									? "bg-gray-50 text-gray-500"
									: "bg-green-50 text-green-700",
							)}
						>
							{event.price ? `${(event.price / 100).toFixed(2)}€` : t("free")}
						</div>
					</div>
				</div>

				<div className="min-h-[224px]">
					{/* Event Title */}
					<div className="line-clamp-2 flex items-start justify-between">
						<h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
					</div>

					{/* Event Description */}
					<div className="mt-4 space-y-3">
						{/* Location */}
						<div className="flex items-center text-gray-600">
							<MapPin className="mr-2 size-4" />
							{event.locationUrl ? (
								<Link
									href={event.locationUrl}
									target="_blank"
									className="text-xs underline"
								>
									<span className="text-xs">{event.location}</span>
								</Link>
							) : (
								<span className="text-xs">{event.location}</span>
							)}
						</div>

						{/* Start/End Time */}
						{Boolean(event.startTime) && (
							<div className="flex items-center text-xs text-gray-600">
								<Clock className="mr-2 size-4" />
								<span className="mr-1">
									{t("from_time")} {event.startTime}
								</span>{" "}
								{Boolean(event.endTime) && (
									<span>
										{t("to_time")} {event.endTime}
									</span>
								)}
							</div>
						)}

						{/* Participants */}
						{Boolean(participants?.length) && (
							<div className="flex items-center text-xs text-gray-600">
								<Users className="mr-2 size-4" />
								<span>
									{event.maxAvailability ? (
										<div className="flex items-center">
											<div className="mr-2">
												{Number(participants?.length)}/{event.maxAvailability}{" "}
												{t("participants")}
											</div>
											{/* Event Sold Out */}
											{isSoldOut && (
												<div className="mr-2 inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
													SOLD OUT!
												</div>
											)}
										</div>
									) : (
										<span>
											{Number(participants?.length)} {t("participants")}
										</span>
									)}
								</span>
							</div>
						)}
					</div>

					<div
						className={cn(
							"mt-4 text-sm text-gray-600",
							participants?.length ? "line-clamp-2" : "line-clamp-3",
						)}
					>
						{/** biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe because the content is sanitized */}
						<div dangerouslySetInnerHTML={{ __html: event.description }} />
					</div>
				</div>

				<div className="mt-4 w-full">
					<SubscribeButton
						className="w-full"
						disabled={isPastEvent || isSoldOut}
						actionText1={isPastEvent ? t("event_ended") : t("join_event")}
						actionText2={t("registered")}
						event={event}
					/>
				</div>
			</div>
		</div>
	);
}
