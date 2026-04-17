"use client";

import {
	ArrowDownToLine,
	ArrowUpFromLine,
	Clock,
	Compass,
	MapPin,
	Mountain,
	Plane,
	Route,
	Timer,
	User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetXcTrack } from "@/hooks/use-query-api";
import { authClient } from "@/lib/auth-client";

interface XcTrackSubmissionProps {
	taskId: string;
}

export default function XcTrackSubmission({ taskId }: XcTrackSubmissionProps) {
	const t = useTranslations("XcTrackSubmission");
	const { data: session } = authClient.useSession();
	const isLoggedIn = Boolean(session?.user);

	const { data: track, isLoading } = useGetXcTrack(taskId, isLoggedIn);

	if (!isLoggedIn || (!isLoading && !track)) return null;

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="mt-1 h-4 w-64" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={`skel-${i}`} className="h-16 rounded-lg" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!track) return null;

	const { header, stats } = track;

	const items = [
		{
			icon: <Timer className="size-4 text-blue-500" />,
			label: t("duration"),
			value: stats.duration,
		},
		{
			icon: <Route className="size-4 text-purple-500" />,
			label: t("distance"),
			value: `${stats.totalDistanceKm} km`,
		},
		{
			icon: <Mountain className="size-4 text-green-500" />,
			label: t("maxAltitude"),
			value: `${stats.maxAltitude} m`,
		},
		{
			icon: <ArrowDownToLine className="size-4 text-amber-500" />,
			label: t("minAltitude"),
			value: `${stats.minAltitude} m`,
		},
		{
			icon: <ArrowUpFromLine className="size-4 text-emerald-500" />,
			label: t("altGain"),
			value: `${stats.maxAltitude - stats.minAltitude} m`,
		},
		{
			icon: <Compass className="size-4 text-indigo-500" />,
			label: t("fixes"),
			value: stats.fixCount.toLocaleString(),
		},
	];

	const details = [
		header.date && {
			icon: <Clock className="size-4" />,
			label: t("date"),
			value: header.date,
		},
		header.pilot && {
			icon: <User className="size-4" />,
			label: t("pilot"),
			value: header.pilot,
		},
		header.gliderType && {
			icon: <Plane className="size-4" />,
			label: t("glider"),
			value: header.gliderType,
		},
		header.site && {
			icon: <MapPin className="size-4" />,
			label: t("site"),
			value: header.site,
		},
		stats.startTime && {
			icon: <Clock className="size-4" />,
			label: t("startTime"),
			value: stats.startTime,
		},
		stats.endTime && {
			icon: <Clock className="size-4" />,
			label: t("endTime"),
			value: stats.endTime,
		},
	].filter(Boolean) as {
		icon: React.ReactNode;
		label: string;
		value: string;
	}[];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<Route className="size-5" />
					{t("title")}
				</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Stats grid */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{items.map((item) => (
						<div
							key={item.label}
							className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3"
						>
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								{item.icon}
								{item.label}
							</div>
							<span className="font-heading text-lg font-bold">
								{item.value}
							</span>
						</div>
					))}
				</div>

				{/* Flight details */}
				{details.length > 0 && (
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">
							{t("flightDetails")}
						</h4>
						<div className="divide-y rounded-lg border">
							{details.map((d) => (
								<div
									key={d.label}
									className="flex items-center gap-2 px-3 py-2 text-sm"
								>
									<span className="text-muted-foreground">{d.icon}</span>
									<span className="text-muted-foreground">{d.label}</span>
									<span className="ml-auto font-medium">{d.value}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
