"use client";

import { useCallback, useEffect, useState } from "react";
import {
	defaultQuadrantMaps,
	type ElmeteoMapId,
	isElmeteoMapId,
	quadrantCount,
} from "@/lib/elmeteo-maps";

const storageKey = "vlm.meteo.quadrants";

function readStored(): ElmeteoMapId[] | undefined {
	try {
		const raw = window.localStorage.getItem(storageKey);
		if (!raw) {
			return undefined;
		}
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length !== quadrantCount) {
			return undefined;
		}
		// A stored map may have been removed from the catalogue since: fall back to
		// the default for that slot rather than dropping the whole selection.
		return parsed.map((value, index) =>
			typeof value === "string" && isElmeteoMapId(value)
				? value
				: defaultQuadrantMaps[index],
		);
	} catch {
		return undefined;
	}
}

/**
 * Per-quadrant map selection, persisted in localStorage.
 *
 * The first render always uses the defaults so server and client markup match;
 * the stored selection is applied in an effect. `hydrated` lets the UI avoid
 * flashing the wrong labels before that happens.
 */
export function useElmeteoQuadrants() {
	const [maps, setMaps] = useState<ElmeteoMapId[]>(() => [
		...defaultQuadrantMaps,
	]);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		const stored = readStored();
		if (stored) {
			setMaps(stored);
		}
		setHydrated(true);
	}, []);

	const setQuadrantMap = useCallback((index: number, map: ElmeteoMapId) => {
		setMaps((current) => {
			if (current[index] === map) {
				return current;
			}
			const next = [...current];
			next[index] = map;
			try {
				window.localStorage.setItem(storageKey, JSON.stringify(next));
			} catch {
				// Private mode or a full quota: the selection still applies for this
				// visit, it just will not be remembered.
			}
			return next;
		});
	}, []);

	const resetQuadrants = useCallback(() => {
		const next = [...defaultQuadrantMaps];
		setMaps(next);
		try {
			window.localStorage.removeItem(storageKey);
		} catch {
			// Ignore: see above.
		}
	}, []);

	return { maps, setQuadrantMap, resetQuadrants, hydrated };
}
