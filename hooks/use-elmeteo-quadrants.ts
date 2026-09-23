"use client";

import { useCallback, useEffect, useState } from "react";
import {
	defaultQuadrantMaps,
	type ElmeteoMapId,
	maxQuadrants,
	parseQuadrantMaps,
} from "@/lib/elmeteo-maps";

const storageKey = "vlm.meteo.quadrants";

function readStored(): ElmeteoMapId[] | undefined {
	try {
		const raw = window.localStorage.getItem(storageKey);
		if (!raw) {
			return undefined;
		}
		return parseQuadrantMaps(JSON.parse(raw));
	} catch {
		return undefined;
	}
}

function store(maps: readonly ElmeteoMapId[]) {
	try {
		window.localStorage.setItem(storageKey, JSON.stringify(maps));
	} catch {
		// Private mode or a full quota: the selection still applies for this
		// visit, it just will not be remembered.
	}
}

/**
 * The maps on show, one per quadrant, persisted in localStorage.
 *
 * The list is free-length: quadrants can be added and removed, so it is not
 * only the content of a fixed six that is remembered. The first render always
 * uses the defaults so server and client markup match; the stored selection is
 * applied in an effect. `hydrated` lets the UI avoid flashing the wrong labels
 * before that happens.
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
			// Already somewhere on the page — including in this very quadrant.
			if (!current[index] || current.includes(map)) {
				return current;
			}
			const next = current.with(index, map);
			store(next);
			return next;
		});
	}, []);

	const addQuadrant = useCallback((map: ElmeteoMapId) => {
		setMaps((current) => {
			if (current.length >= maxQuadrants || current.includes(map)) {
				return current;
			}
			const next = [...current, map];
			store(next);
			return next;
		});
	}, []);

	const removeQuadrant = useCallback((index: number) => {
		setMaps((current) => {
			// The grid would have nothing left to show, and the empty state here is
			// the defaults, not a blank page — so the last quadrant stays put.
			if (current.length <= 1 || !current[index]) {
				return current;
			}
			const next = current.toSpliced(index, 1);
			store(next);
			return next;
		});
	}, []);

	const resetQuadrants = useCallback(() => {
		setMaps([...defaultQuadrantMaps]);
		try {
			window.localStorage.removeItem(storageKey);
		} catch {
			// Ignore: see `store`.
		}
	}, []);

	return {
		maps,
		setQuadrantMap,
		addQuadrant,
		removeQuadrant,
		resetQuadrants,
		hydrated,
	};
}
