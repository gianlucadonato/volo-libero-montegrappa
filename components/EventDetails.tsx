"use client";

import { format, getDate, isBefore } from "date-fns";
import {
  ArrowLeft,
  BadgeEuro,
  CalendarDays,
  Clock,
  Download,
  Edit,
  MapPin,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/extendui/button";
import Spinner from "@/components/Spinner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { authClient } from "@/lib/auth-client";
import { exportJsonAsXlsx } from "@/lib/export-xlsx";
import type { EventWithRegistrations } from "@/types";
import { SubscribeButton } from "./SubscribeButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

export default function EventDetails({
  event,
}: {
  event: EventWithRegistrations;
}) {
  const t = useTranslations("EventCard");
  const { data: session } = authClient.useSession();
  const { isSm, isMobile } = useMediaQuery();
  const [_, setIsDownloading] = useState(false);

  const participants = useMemo(() => {
    if (!event?.registrations) return [];
    return event.registrations
      .filter((r) => r.status !== "CANCELLED" && Boolean(r.user))
      .map((r) => ({ ...r.user, subscribedAt: r.createdAt }));
  }, [event]);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  const isPastEvent = isBefore(event.eventDate, new Date());
  const isSoldOut = Boolean(
    event.maxAvailability &&
    Number(event.registrations?.length) >= Number(event.maxAvailability),
  );
  const getEventDate = () => {
    if (event.optionalDate) {
      const evtDate = getDate(new Date(event.eventDate));
      const optDate = getDate(new Date(event.optionalDate));
      return `${evtDate}-${optDate}/${format(new Date(event.eventDate), "MM/yyyy")}`;
    }
    return format(new Date(event.eventDate), "dd/MM/yyyy");
  };

  const exportExcel = async () => {
    setIsDownloading(true);
    try {
      const date = format(new Date(), "ddMMyyyy");

      await exportJsonAsXlsx(
        participants.map((participant) => ({
          Nome: participant.firstName,
          Cognome: participant.lastName,
          Email: participant.email,
          "Data Iscrizione": format(
            participant.subscribedAt,
            "dd/MM/yyyy HH:mm",
          ),
        })),
        `partecipanti_${date}.xlsx`,
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-2">
        <Link href="/events" className="mb-2">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            {t("back_to_events")}
          </Button>
        </Link>
        <Link href={`/events/${event.id}/edit`} className="mb-2">
          <Button variant="ghost" size="sm">
            <Edit className="mr-2 size-4" />
            {t("edit_event")}
          </Button>
        </Link>
      </div>
      <div className="container max-w-7xl overflow-hidden rounded-xl bg-white shadow-lg">
        {isSm || isMobile ? (
          <div className="relative h-48 w-full">
            <Image
              src={event.imageUrl || "/events/default.jpg"}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : (
          <div className="relative flex aspect-[21/9] size-full max-h-[300px] justify-center overflow-hidden bg-gradient-to-b from-blue-200">
            <div
              className="absolute inset-0 left-1/2 top-1/2 h-full max-w-[50%]"
              style={{ transform: "translate(-50%, -50%)" }}
            >
              <Image
                src={event.imageUrl || "/events/default.jpg"}
                alt={event.title}
                fill
                priority
                className="object-cover"
                // width={0}
                // height={0}
                // sizes="100vh"
                // style={{ width: 'auto', height: '100%' }} // optional
              />
            </div>
          </div>
        )}

        <div className="p-4 sm:p-8">
          {isSm ||
            (isMobile && (
              <div
                className="mb-6 mt-2 w-full"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <SubscribeButton
                  className="w-full"
                  disabled={isPastEvent || isSoldOut}
                  actionText1={isPastEvent ? t("event_ended") : t("join_event")}
                  actionText2={t("registered")}
                  event={event}
                />
              </div>
            ))}
          <div className="grid grid-cols-1 sm:gap-12 lg:grid-cols-2">
            {/* Left Column - Event Details */}
            <div className="space-y-8">
              <div>
                <h1 className="mb-4 text-3xl font-bold text-gray-900">
                  {event.title}
                </h1>
                <div
                  className="text-md text-gray-600"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe because the content is sanitized
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="col-span-1 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-1 flex items-center text-gray-600">
                    <CalendarDays className="mr-2 size-5 text-blue-600" />
                    <span className="text-sm font-medium">
                      {t("event_date")}
                    </span>
                  </div>
                  <div className="pl-7 pt-1 text-gray-900">
                    {getEventDate()}
                  </div>
                  {/* Start/End Time */}
                  {Boolean(event.startTime) && (
                    <div className="mt-3 flex items-center text-xs text-gray-600">
                      <Clock className="mr-2 size-5 text-blue-600" />
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
                </div>

                <div className="col-span-1 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-1 flex items-center text-gray-600">
                    <MapPin className="mr-2 size-5 text-blue-600" />
                    <span className="text-sm font-medium">
                      {t("event_location")}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-gray-900">
                    {event.locationUrl ? (
                      <Link
                        href={event.locationUrl}
                        target="_blank"
                        className="underline"
                      >
                        <span>{event.location}</span>
                      </Link>
                    ) : (
                      <span>{event.location}</span>
                    )}
                  </div>
                </div>

                <div className="col-span-1 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-1 flex items-center text-gray-600">
                    <BadgeEuro className="mr-2 size-5 text-blue-600" />
                    <span className="text-sm font-medium">
                      {t("event_price")}
                    </span>
                  </div>
                  <div className="mt-2 pl-7 text-gray-900">
                    {event.price
                      ? `${(event.price / 100).toFixed(2)}€`
                      : t("free")}
                  </div>
                </div>

                {/* Participants */}
                <Dialog>
                  <DialogTrigger>
                    <div className="col-span-1 rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <div className="mb-1 flex items-center justify-between text-gray-600">
                        <div className="flex items-center">
                          <Users className="mr-2 size-5 text-blue-600" />
                          <span className="text-sm font-medium">
                            {t("event_participants")}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-gray-900">
                        {event.maxAvailability ? (
                          <div>
                            <div className="flex items-center justify-start">
                              {Number(event.registrations?.length) || 0}/
                              {event.maxAvailability} {t("participants")}
                            </div>
                            {isSoldOut && (
                              <div className="mx-2 inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                SOLD OUT!
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>
                            {Number(participants.length) || 0}{" "}
                            {t("participants")}
                          </span>
                        )}
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-h-[400px]">
                    <DialogHeader>
                      <DialogTitle>
                        <div className="flex items-center justify-between">
                          <span className="capitalize">
                            {t("participants")}
                          </span>
                          {session?.user?.role === "ADMIN" && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => exportExcel()}
                            >
                              <Download className="mr-2 size-5 text-blue-600" />
                              {t("export_csv")}
                            </Button>
                          )}
                        </div>
                      </DialogTitle>
                      <DialogDescription>
                        <ScrollArea className="mt-2 h-72 w-full rounded-md border">
                          <div className="p-4">
                            {participants.map((user) => (
                              <div key={user.id}>
                                <div className="text-sm">
                                  {user.firstName} {user.lastName}
                                </div>
                                <Separator className="my-2" />
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Additional Event Information */}
              {event.information && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
                  <h3 className="mb-2 text-lg font-semibold text-blue-900">
                    {t("event_information")}
                  </h3>
                  <div className="space-y-2 text-blue-700">
                    <div
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe because the content is sanitized
                      dangerouslySetInnerHTML={{ __html: event.information }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Ticket Purchase Card */}
            <div className="mb-8">
              <div className="sticky top-8 sm:space-y-4">
                <div className="hidden sm:block">
                  <EventCard event={event} />
                </div>
                {isSm ||
                  (isMobile && (
                    <div
                      className="mb-4 mt-8 w-full"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <SubscribeButton
                        className="w-full"
                        disabled={isPastEvent || isSoldOut}
                        actionText1={
                          isPastEvent ? t("event_ended") : t("join_event")
                        }
                        actionText2={t("registered")}
                        event={event}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
