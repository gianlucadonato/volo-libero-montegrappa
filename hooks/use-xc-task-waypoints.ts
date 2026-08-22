"use client";

import { useEffect, useMemo, useState } from "react";
import { type ParsedTask, parseTskXml } from "@/lib/tsk-parser";
import { legDistanceBetweenBuoysKm } from "@/lib/xc-geo";

/**
 * Fetches and parses a task `.tsk` file, returning its waypoints and the
 * distance of each leg. Shared by the task detail page and the public pilot
 * profile, which both draw the same task on a map.
 */
export function useXcTaskWaypoints(taskFileUrl?: string | null) {
	const [parsedTask, setParsedTask] = useState<ParsedTask>({ waypoints: [] });
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!taskFileUrl) {
			setParsedTask({ waypoints: [] });
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		fetch(taskFileUrl)
			.then((res) => res.text())
			.then((xml) => {
				if (!cancelled) setParsedTask(parseTskXml(xml));
			})
			.catch(console.error)
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [taskFileUrl]);

	const waypoints = parsedTask.waypoints;

	const legDistancesKm = useMemo(
		() =>
			waypoints.map((wp, idx) =>
				legDistanceBetweenBuoysKm(waypoints[idx - 1], wp),
			),
		[waypoints],
	);

	return {
		waypoints,
		legDistancesKm,
		taskInfo: parsedTask.info,
		isLoading,
	};
}
