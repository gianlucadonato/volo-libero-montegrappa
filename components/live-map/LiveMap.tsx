"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/live-map/live-map.css";
import { Crosshair, Layers, Radio, Search, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdOutlineParagliding } from "react-icons/md";
import { toast } from "sonner";
import {
	dropOlderThan,
	formatClock,
	formatCoords,
	formatDuration,
	googleMapsUrl,
	PLAYBACK_DELAY_MS,
	playbackAt,
	pushPoint,
	toDMS,
} from "@/components/live-map/live-map-geo";
import {
	aircraftIcon,
	escapeHtml,
	markerLines,
	sosIcon,
	TRAIL_COLORS,
} from "@/components/live-map/live-map-icons";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	LIVE_MAP_CENTER,
	LIVE_MAP_HISTORY_MS,
	type LiveAircraft,
	type LiveMapScope,
	type LiveSos,
	normalizeCallsign,
	type TrackPoint,
} from "@/lib/live-map";
import { cn } from "@/lib/utils";

const POSITIONS_POLL_MS = 5000;
const MEMBERS_POLL_MS = 5 * 60 * 1000;
const SOS_POLL_MS = 10_000;
const TICK_MS = 200;
const LIST_REFRESH_MS = 2000;
const TRAILS_STORAGE_KEY = "vlm-live-map-trails";

const SCOPE_ITEM =
	"px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

type BaseLayer = "satellite" | "osm" | "topo" | "none";

type Entry = {
	id: string;
	historyKey: string;
	label: string;
	name: string | null;
	member: boolean;
	source: string;
	color: string;
	track: TrackPoint[];
	historyRequested: boolean;
	arrival: number;
	visible: boolean;
	marker: L.Marker | null;
	trail: L.Polyline | null;
	trailIndex: number;
	iconKey: string;
	popupIndex: number;
};

type Row = {
	id: string;
	label: string;
	name: string | null;
	color: string;
	member: boolean;
	source: string;
	last: TrackPoint;
	points: number;
	sos: boolean;
	arrival: number;
};

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const TILE_OPTIONS = { maxNativeZoom: 17, maxZoom: 17 };

function baseTileLayer(base: Exclude<BaseLayer, "none">) {
	if (base === "satellite") {
		return L.tileLayer(`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, {
			...TILE_OPTIONS,
			attribution: "© Esri",
		});
	}
	if (base === "osm") {
		return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			...TILE_OPTIONS,
			attribution: "© OpenStreetMap",
		});
	}
	return L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
		...TILE_OPTIONS,
		attribution: "© OpenTopoMap",
	});
}

function entryKeys(entry: Entry) {
	return [entry.id, entry.historyKey, entry.label]
		.flatMap((key) => [key.toUpperCase(), normalizeCallsign(key)])
		.filter(Boolean);
}

function readStoredTrails() {
	try {
		const stored = JSON.parse(localStorage.getItem(TRAILS_STORAGE_KEY) ?? "[]");
		return new Set<string>(Array.isArray(stored) ? stored : []);
	} catch {
		return new Set<string>();
	}
}

type Translator = ReturnType<typeof useTranslations<"LiveMapPage">>;

function shareLabels(t: Translator) {
	return { maps: t("open_maps"), share: t("share") };
}

// Coordinates in DMS plus the "Maps" and "Share" buttons, which are wired by
// the delegated click handler on the map container.
function shareBlock(
	labels: { maps: string; share: string },
	name: string,
	point: { lat: number; lon: number; alt: number | null },
) {
	const data = `data-name="${escapeHtml(name)}" data-lat="${point.lat.toFixed(6)}" data-lon="${point.lon.toFixed(6)}" data-alt="${point.alt == null ? "" : Math.round(point.alt)}"`;
	return `<div class="live-map-popup-coords">
		<div class="live-map-popup-dms">${toDMS(point.lat, true)}&nbsp;&nbsp;${toDMS(point.lon, false)}</div>
		<div class="live-map-popup-actions">
			<button type="button" data-live-action="maps" ${data}>${escapeHtml(labels.maps)}</button>
			<button type="button" data-live-action="share" ${data}>${escapeHtml(labels.share)}</button>
		</div>
	</div>`;
}

async function getJson<T>(url: string): Promise<T> {
	const response = await fetch(url, { cache: "no-store" });
	if (!response.ok) throw new Error(`${url} answered ${response.status}`);
	return (await response.json()) as T;
}

export default function LiveMap() {
	const t = useTranslations("LiveMapPage");
	const locale = useLocale();

	// `?scope=all` opens the page on all traffic, e.g. from a shared link.
	const [scope, setScope] = useState<LiveMapScope>(() =>
		new URLSearchParams(window.location.search).get("scope") === "all"
			? "all"
			: "members",
	);
	const [tab, setTab] = useState<"flying" | "offline">("flying");
	const [query, setQuery] = useState("");
	const [base, setBase] = useState<BaseLayer>("topo");
	const [hillshade, setHillshade] = useState(true);
	const [topoOverlay, setTopoOverlay] = useState(false);
	const [thermals, setThermals] = useState(false);
	const [trails, setTrails] = useState<Set<string>>(() => new Set());
	const [followed, setFollowed] = useState<string | null>(null);
	const [rows, setRows] = useState<{ flying: Row[]; offline: Row[] }>({
		flying: [],
		offline: [],
	});
	const [loaded, setLoaded] = useState(false);
	const [feedError, setFeedError] = useState(false);
	const [clock, setClock] = useState<number | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<L.Map | null>(null);
	const entriesRef = useRef(new Map<string, Entry>());
	const colorIndexRef = useRef(0);
	const arrivalRef = useRef(0);
	const scopeRef = useRef(scope);
	const trailsRef = useRef(trails);
	const followRef = useRef<string | null>(null);
	const clickOrderRef = useRef<string[]>([]);
	const sosKeysRef = useRef(new Set<string>());
	const sosLayersRef = useRef(
		new Map<string, { marker: L.Marker; trail: L.LayerGroup | null }>(),
	);
	const lastSeenMarkerRef = useRef<L.CircleMarker | null>(null);
	const layersRef = useRef<{
		base: L.TileLayer | null;
		hillshade: L.TileLayer;
		topo: L.TileLayer;
		thermals: L.TileLayer;
	} | null>(null);
	const tRef = useRef(t);
	tRef.current = t;

	const hasSos = useCallback(
		(entry: Entry) => entryKeys(entry).some((k) => sosKeysRef.current.has(k)),
		[],
	);

	const popupHtml = useCallback((entry: Entry, point: TrackPoint) => {
		const tr = tRef.current;
		const vz = Number(point.vz.toFixed(1));
		const glide =
			vz < -0.3 && point.spd > 0
				? (point.spd / 3.6 / Math.abs(vz)).toFixed(1)
				: "—";
		const row = (label: string, value: string) =>
			`<tr><td class="live-map-popup-key">${label}</td><td class="live-map-popup-value">${value}</td></tr>`;
		const title = entry.name ?? entry.label;
		return `<div class="live-map-popup">
			<div class="live-map-popup-title" style="color:${entry.color}">${escapeHtml(title)}</div>
			<table>${row("ALT", `${Math.round(point.alt)} m`)}${row("GND", `${Math.round(point.spd)} km/h`)}${row("HDG", `${Math.round(point.hdg)}°`)}${row("Vz", `${vz >= 0 ? "+" : ""}${vz} m/s`)}${row("L/D", glide)}</table>
			${shareBlock(shareLabels(tRef.current), title, point)}
			<div class="live-map-popup-meta">${escapeHtml(entry.label)} · ${escapeHtml(entry.source.toUpperCase())} · ${escapeHtml(tr("ago", { time: formatDuration(Date.now() - point.ts) }))}</div>
		</div>`;
	}, []);

	const sharePosition = useCallback(
		(name: string, lat: number, lon: number, alt: number | null) => {
			const tr = tRef.current;
			const lines = [
				name,
				`${toDMS(lat, true)}  ${toDMS(lon, false)}`,
				`${lat.toFixed(6)}, ${lon.toFixed(6)}`,
				alt == null ? null : tr("altitude_line", { alt }),
				googleMapsUrl(lat, lon),
			].filter(Boolean);
			const text = lines.join("\n");
			// No `url` field: some share targets append it to the text, which
			// would put the Maps link in twice.
			if (navigator.share) {
				navigator
					.share({ title: tr("share_title", { name }), text })
					.catch(() => {});
			} else if (navigator.clipboard) {
				navigator.clipboard
					.writeText(text)
					.then(() => toast.success(tr("copied")))
					.catch(() => window.open(googleMapsUrl(lat, lon), "_blank"));
			} else {
				window.open(googleMapsUrl(lat, lon), "_blank");
			}
		},
		[],
	);

	const ensureEntry = useCallback(
		(id: string, init: Pick<Entry, "historyKey" | "label">) => {
			let entry = entriesRef.current.get(id);
			if (!entry) {
				entry = {
					id,
					historyKey: init.historyKey,
					label: init.label,
					name: null,
					member: false,
					source: "ogn",
					color: TRAIL_COLORS[colorIndexRef.current++ % TRAIL_COLORS.length],
					track: [],
					historyRequested: false,
					arrival: arrivalRef.current++,
					visible: false,
					marker: null,
					trail: null,
					trailIndex: -1,
					iconKey: "",
					popupIndex: -1,
				};
				entriesRef.current.set(id, entry);
			}
			return entry;
		},
		[],
	);

	// Recorded track of an aircraft seen for the first time, so its trail
	// starts where it took off rather than where this page was opened.
	const loadHistory = useCallback((entry: Entry) => {
		if (entry.historyRequested) return;
		entry.historyRequested = true;
		getJson<{ points: TrackPoint[] }>(
			`/api/live-map/track?key=${encodeURIComponent(entry.historyKey)}`,
		)
			.then(({ points }) => {
				for (const point of points) pushPoint(entry.track, point);
			})
			.catch(() => {
				entry.historyRequested = false;
			});
	}, []);

	const ingestPositions = useCallback(
		(aircraft: LiveAircraft[]) => {
			for (const a of aircraft) {
				const entry = ensureEntry(a.id, a);
				entry.historyKey = a.historyKey;
				entry.label = a.label;
				entry.name = a.name;
				entry.member = a.member;
				entry.source = a.source;
				pushPoint(entry.track, a);
				if (scopeRef.current === "all" || entry.member) loadHistory(entry);
			}
		},
		[ensureEntry, loadHistory],
	);

	// ── Map setup ────────────────────────────────────────────────────────────
	useEffect(() => {
		if (!containerRef.current || mapRef.current) return;
		const map = L.map(containerRef.current, { zoomControl: true, maxZoom: 17 });
		map.setView([LIVE_MAP_CENTER.lat, LIVE_MAP_CENTER.lon], 11);
		L.control.scale({ imperial: false }).addTo(map);
		layersRef.current = {
			base: null,
			hillshade: L.tileLayer(
				`${ESRI}/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}`,
				{ ...TILE_OPTIONS, opacity: 0.5, attribution: "© Esri Hillshade" },
			),
			topo: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
				...TILE_OPTIONS,
				opacity: 0.4,
				attribution: "© OpenTopoMap",
			}),
			// Thermal hotspots by thermal.kk7.ch, served as TMS tiles.
			thermals: L.tileLayer(
				"https://thermal.kk7.ch/tiles/thermals_all_all/{z}/{x}/{y}.png?src=vololiberomontegrappa.it",
				{
					tms: true,
					maxNativeZoom: 12,
					maxZoom: 17,
					opacity: 0.55,
					attribution:
						'Termiche © <a href="https://thermal.kk7.ch">thermal.kk7.ch</a> (CC-BY-NC-SA)',
				},
			),
		};
		map.createPane("sosTrail").style.zIndex = "449";

		const unfollow = () => {
			followRef.current = null;
			clickOrderRef.current = [];
			setFollowed(null);
		};
		// Panning by hand leaves follow mode. Pinch-zooming fires dragstart too,
		// so the last-seen pin stays.
		map.on("dragstart", unfollow);
		map.on("click", () => {
			unfollow();
			if (lastSeenMarkerRef.current) {
				lastSeenMarkerRef.current.remove();
				lastSeenMarkerRef.current = null;
			}
		});

		// Popup buttons are delegated: popup content is replaced as the pilot
		// moves, so a handler bound to the button itself would be lost.
		const container = containerRef.current;
		const onAction = (event: MouseEvent) => {
			const button = (event.target as HTMLElement).closest<HTMLElement>(
				"[data-live-action]",
			);
			if (!button) return;
			event.preventDefault();
			event.stopPropagation();
			const lat = Number(button.dataset.lat);
			const lon = Number(button.dataset.lon);
			if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
			if (button.dataset.liveAction === "maps") {
				window.open(googleMapsUrl(lat, lon), "_blank", "noopener");
			} else {
				const alt = button.dataset.alt ? Number(button.dataset.alt) : null;
				sharePosition(button.dataset.name ?? "", lat, lon, alt);
			}
		};
		container.addEventListener("click", onAction);
		mapRef.current = map;

		return () => {
			container.removeEventListener("click", onAction);
			map.remove();
			mapRef.current = null;
			for (const entry of entriesRef.current.values()) {
				entry.marker = null;
				entry.trail = null;
			}
			sosLayersRef.current.clear();
			lastSeenMarkerRef.current = null;
		};
	}, [sharePosition]);

	useEffect(() => {
		const map = mapRef.current;
		const layers = layersRef.current;
		if (!map || !layers) return;
		layers.base?.remove();
		layers.base = base === "none" ? null : baseTileLayer(base).addTo(map);
		layers.base?.bringToBack();
	}, [base]);

	useEffect(() => {
		const map = mapRef.current;
		const layers = layersRef.current;
		if (!map || !layers) return;
		const toggle = (layer: L.TileLayer, on: boolean) =>
			on ? layer.addTo(map) : layer.remove();
		toggle(layers.hillshade, hillshade);
		toggle(layers.topo, topoOverlay);
		toggle(layers.thermals, thermals);
		if (thermals) layers.thermals.bringToFront();
	}, [hillshade, topoOverlay, thermals]);

	// ── Preferences ─────────────────────────────────────────────────────────
	useEffect(() => {
		setTrails(readStoredTrails());
	}, []);

	useEffect(() => {
		trailsRef.current = trails;
	}, [trails]);

	useEffect(() => {
		scopeRef.current = scope;
		if (scope === "all") {
			for (const entry of entriesRef.current.values()) loadHistory(entry);
		}
	}, [scope, loadHistory]);

	// ── Polling ─────────────────────────────────────────────────────────────
	useEffect(() => {
		let cancelled = false;
		const poll = () =>
			getJson<{ aircraft: LiveAircraft[] }>("/api/live-map/positions")
				.then(({ aircraft }) => {
					if (cancelled) return;
					ingestPositions(aircraft);
					setFeedError(false);
				})
				.catch(() => !cancelled && setFeedError(true))
				.finally(() => !cancelled && setLoaded(true));
		poll();
		const timer = setInterval(poll, POSITIONS_POLL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [ingestPositions]);

	// Members' recorded tracks, so a member who landed or lost signal before
	// the page was opened still shows up under "out of signal".
	useEffect(() => {
		let cancelled = false;
		type MemberTrack = {
			id: string;
			historyKey: string;
			name: string;
			label: string;
			points: TrackPoint[];
		};
		const poll = () =>
			getJson<{ members: MemberTrack[] }>("/api/live-map/members")
				.then(({ members }) => {
					if (cancelled) return;
					for (const m of members) {
						const entry = ensureEntry(m.id, m);
						entry.name = m.name;
						entry.member = true;
						entry.historyRequested = true;
						for (const point of m.points) pushPoint(entry.track, point);
					}
				})
				.catch(() => {});
		poll();
		const timer = setInterval(poll, MEMBERS_POLL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [ensureEntry]);

	useEffect(() => {
		let cancelled = false;
		const poll = () =>
			getJson<{ sos: LiveSos[] }>("/api/live-map/sos")
				.then(({ sos }) => {
					const map = mapRef.current;
					if (cancelled || !map) return;
					const tr = tRef.current;
					sosKeysRef.current = new Set(
						sos.flatMap((s) =>
							s.keys.flatMap((k) => [k, normalizeCallsign(k)]),
						),
					);
					const seen = new Set<string>();
					for (const s of sos) {
						seen.add(s.id);
						const html = `<div class="live-map-popup live-map-sos-popup">
							<div class="live-map-sos-title">${escapeHtml(tr("sos_title"))}</div>
							<div class="live-map-popup-title">${escapeHtml(s.name ?? "—")}</div>
							${s.ts ? `<div class="live-map-popup-meta">${escapeHtml(tr("ago", { time: formatDuration(Date.now() - s.ts) }))} · ${formatClock(s.ts)}</div>` : ""}
							<div class="live-map-popup-meta">${s.alt == null ? "—" : `${Math.round(s.alt)} m`} · ${formatCoords(s.lat, s.lon)}</div>
							${shareBlock(shareLabels(tRef.current), s.name ?? "", s)}
						</div>`;
						const existing = sosLayersRef.current.get(s.id);
						if (existing) {
							existing.marker.setPopupContent(html);
							continue;
						}
						const marker = L.marker([s.lat, s.lon], {
							icon: sosIcon(tr("sos_label")),
							zIndexOffset: 2000,
						})
							.bindPopup(html, { maxWidth: 260 })
							.addTo(map);
						const trail =
							s.trail.length >= 2
								? L.layerGroup([
										L.polyline(s.trail, {
											pane: "sosTrail",
											color: "#fff",
											weight: 8,
											opacity: 0.95,
											interactive: false,
										}),
										L.polyline(s.trail, {
											pane: "sosTrail",
											color: "#dc2626",
											weight: 4.5,
											interactive: false,
										}),
									]).addTo(map)
								: null;
						sosLayersRef.current.set(s.id, { marker, trail });
					}
					for (const [id, layers] of sosLayersRef.current) {
						if (seen.has(id)) continue;
						layers.marker.remove();
						layers.trail?.remove();
						sosLayersRef.current.delete(id);
					}
				})
				.catch(() => {});
		poll();
		const timer = setInterval(poll, SOS_POLL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);

	// ── Playback tick: move markers and trails ─────────────────────────────────
	useEffect(() => {
		const tick = () => {
			const map = mapRef.current;
			if (!map) return;
			const now = Date.now();
			const cursor = now - PLAYBACK_DELAY_MS;
			const showAll = scopeRef.current === "all";
			for (const entry of entriesRef.current.values()) {
				dropOlderThan(entry.track, now - LIVE_MAP_HISTORY_MS);
				const inScope = showAll || entry.member;
				const state = inScope ? playbackAt(entry.track, cursor) : null;
				const trailOn = inScope && trailsRef.current.has(entry.id);

				if (!state) {
					entry.visible = false;
					entry.marker?.remove();
					entry.marker = null;
					// Out of signal: keep the whole recorded track on request.
					if (trailOn && entry.track.length) {
						entry.trail ??= L.polyline([], {
							color: entry.color,
							weight: 2.5,
							opacity: 0.65,
						}).addTo(map);
						if (entry.trailIndex !== entry.track.length) {
							entry.trailIndex = entry.track.length;
							entry.trail.setLatLngs(entry.track.map((p) => [p.lat, p.lon]));
						}
					} else if (entry.trail) {
						entry.trail.remove();
						entry.trail = null;
						entry.trailIndex = -1;
					}
					continue;
				}

				entry.visible = true;
				const sos = hasSos(entry);
				const heading = Math.round(state.base.hdg);
				const iconKey = `${heading}|${sos}|${entry.label}|${entry.name}`;
				if (!entry.marker) {
					const marker = L.marker([state.lat, state.lon]).addTo(map);
					marker.bindPopup("", { maxWidth: 230 });
					const id = entry.id;
					marker.on("click", () => {
						followRef.current = id;
						clickOrderRef.current = [
							id,
							...clickOrderRef.current.filter((x) => x !== id),
						];
						setFollowed(id);
					});
					entry.marker = marker;
					entry.iconKey = "";
					entry.popupIndex = -1;
				}
				if (entry.iconKey !== iconKey) {
					entry.iconKey = iconKey;
					entry.marker.setIcon(
						aircraftIcon({
							color: entry.color,
							heading,
							lines: markerLines(entry.label, entry.name),
							sosLabel: sos ? tRef.current("sos_label") : null,
						}),
					);
				}
				entry.marker.setLatLng([state.lat, state.lon]);
				entry.marker.setOpacity(state.opacity);
				// Refreshed only when a new beacon is reached, so the buttons are
				// not replaced under the user's finger.
				if (entry.popupIndex !== state.index) {
					entry.popupIndex = state.index;
					entry.marker.setPopupContent(popupHtml(entry, state.base));
				}
				if (followRef.current === entry.id) {
					map.setView([state.lat, state.lon], map.getZoom(), {
						animate: false,
					});
				}

				if (trailOn) {
					entry.trail ??= L.polyline([], {
						color: entry.color,
						weight: 2.5,
						opacity: 0.65,
					}).addTo(map);
					if (entry.trailIndex !== state.index) {
						entry.trailIndex = state.index;
						entry.trail.setLatLngs(
							entry.track.slice(0, state.index + 1).map((p) => [p.lat, p.lon]),
						);
					}
				} else if (entry.trail) {
					entry.trail.remove();
					entry.trail = null;
					entry.trailIndex = -1;
				}
			}
		};
		const timer = setInterval(tick, TICK_MS);
		return () => clearInterval(timer);
	}, [hasSos, popupHtml]);

	// ── Lists and clock ───────────────────────────────────────────────────────
	useEffect(() => {
		const refresh = () => {
			const showAll = scopeRef.current === "all";
			const flying: Row[] = [];
			const offline: Row[] = [];
			for (const entry of entriesRef.current.values()) {
				if (!(showAll || entry.member) || !entry.track.length) continue;
				const row: Row = {
					id: entry.id,
					label: entry.label,
					name: entry.name,
					color: entry.color,
					member: entry.member,
					source: entry.source,
					last: entry.track[entry.track.length - 1],
					points: entry.track.length,
					sos: hasSos(entry),
					arrival: entry.arrival,
				};
				(entry.visible ? flying : offline).push(row);
			}
			const trailsOn = trailsRef.current;
			const clicked = clickOrderRef.current;
			flying.sort((a, b) => {
				const ta = trailsOn.has(a.id) ? 1 : 0;
				const tb = trailsOn.has(b.id) ? 1 : 0;
				if (ta !== tb) return tb - ta;
				const ia = clicked.indexOf(a.id);
				const ib = clicked.indexOf(b.id);
				if (ia >= 0 || ib >= 0) {
					return (ia < 0 ? 9999 : ia) - (ib < 0 ? 9999 : ib);
				}
				return a.arrival - b.arrival;
			});
			offline.sort((a, b) => b.last.ts - a.last.ts);
			setRows({ flying, offline });
			setClock(Date.now() - PLAYBACK_DELAY_MS);
		};
		refresh();
		const timer = setInterval(refresh, LIST_REFRESH_MS);
		return () => clearInterval(timer);
	}, [hasSos]);

	// ── Actions ─────────────────────────────────────────────────────────────
	const toggleTrail = (id: string, on: boolean) => {
		setTrails((current) => {
			const next = new Set(current);
			if (on) next.add(id);
			else next.delete(id);
			try {
				localStorage.setItem(TRAILS_STORAGE_KEY, JSON.stringify([...next]));
			} catch {
				// Private mode: the choice just isn't remembered.
			}
			trailsRef.current = next;
			return next;
		});
	};

	const focusFlying = (id: string) => {
		const map = mapRef.current;
		const entry = entriesRef.current.get(id);
		if (!map || !entry?.marker) return;
		followRef.current = id;
		clickOrderRef.current = [
			id,
			...clickOrderRef.current.filter((x) => x !== id),
		];
		setFollowed(id);
		map.closePopup();
		map.flyTo(entry.marker.getLatLng(), 14, { duration: 0.8 });
	};

	const focusOffline = (row: Row) => {
		const map = mapRef.current;
		if (!map) return;
		const tr = tRef.current;
		followRef.current = null;
		setFollowed(row.id);
		map.closePopup();
		lastSeenMarkerRef.current?.remove();
		const { last } = row;
		const title = row.name ?? row.label;
		lastSeenMarkerRef.current = L.circleMarker([last.lat, last.lon], {
			radius: 10,
			color: "#fff",
			weight: 2.5,
			fillColor: row.color,
			fillOpacity: 0.92,
			pane: "markerPane",
		})
			.bindPopup(
				`<div class="live-map-popup">
					<div class="live-map-popup-title" style="color:${row.color}">${escapeHtml(title)}</div>
					<div class="live-map-popup-meta">${escapeHtml(tr("ago", { time: formatDuration(Date.now() - last.ts) }))} · ${formatClock(last.ts)}</div>
					<div class="live-map-popup-meta">${Math.round(last.alt)} m · ${formatCoords(last.lat, last.lon)}</div>
					${shareBlock(shareLabels(tRef.current), title, last)}
				</div>`,
				{ maxWidth: 230 },
			)
			.addTo(map)
			.openPopup();
		map.flyTo([last.lat, last.lon], 13, { duration: 0.8 });
	};

	const recenter = () => {
		followRef.current = null;
		setFollowed(null);
		const dLat = 10 / 111.32;
		const dLon =
			10 / (111.32 * Math.cos((LIVE_MAP_CENTER.lat * Math.PI) / 180));
		mapRef.current?.fitBounds([
			[LIVE_MAP_CENTER.lat - dLat, LIVE_MAP_CENTER.lon - dLon],
			[LIVE_MAP_CENTER.lat + dLat, LIVE_MAP_CENTER.lon + dLon],
		]);
	};

	const changeScope = (value: string) => {
		if (value !== "all" && value !== "members") return;
		followRef.current = null;
		clickOrderRef.current = [];
		setFollowed(null);
		scopeRef.current = value;
		setScope(value);
	};

	const visibleRows = useMemo(() => {
		const list = tab === "flying" ? rows.flying : rows.offline;
		const q = query.trim().toLowerCase();
		if (!q) return list;
		return list.filter(
			(row) =>
				row.label.toLowerCase().includes(q) ||
				(row.name ?? "").toLowerCase().includes(q),
		);
	}, [rows, tab, query]);

	const emptyText = query.trim()
		? t("no_results", { query: query.trim() })
		: tab === "flying"
			? t("no_flying")
			: t("no_offline");

	return (
		<div className="flex h-[calc(100dvh-4.5rem)] min-h-[560px] flex-col">
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-white px-4 py-3">
				<div className="mr-auto min-w-0">
					<h1 className="font-heading text-xl uppercase sm:text-2xl">
						{t("title")}
					</h1>
					<p className="text-muted-foreground text-xs">{t("subtitle")}</p>
				</div>
				<ToggleGroup
					type="single"
					variant="outline"
					size="sm"
					value={scope}
					onValueChange={changeScope}
				>
					<ToggleGroupItem value="all" className={SCOPE_ITEM}>
						<Radio className="size-4" />
						{t("scope_all")}
					</ToggleGroupItem>
					<ToggleGroupItem value="members" className={SCOPE_ITEM}>
						<Users className="size-4" />
						{t("scope_members")}
					</ToggleGroupItem>
				</ToggleGroup>
				<div className="text-center" title={t("playback_note")}>
					<div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
						{clock
							? new Date(clock).toLocaleDateString(locale, {
									weekday: "short",
									day: "2-digit",
									month: "short",
								})
							: " "}
					</div>
					<div className="font-bold text-lg tabular-nums leading-none">
						{clock ? formatClock(clock) : "--:--:--"}
					</div>
				</div>
				<Badge className="bg-green-100 text-green-700 hover:bg-green-100">
					{t("flying_count", { count: rows.flying.length })}
				</Badge>
			</div>

			<div className="flex min-h-0 flex-1 flex-col md:flex-row">
				<aside className="order-2 flex min-h-0 flex-1 flex-col border-t bg-white md:order-1 md:w-80 md:flex-none md:border-t-0 md:border-r">
					<div className="flex border-b">
						{(["flying", "offline"] as const).map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => setTab(key)}
								className={cn(
									"-mb-px flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-1 py-2 text-xs font-bold transition-colors",
									tab === key
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground hover:text-foreground",
								)}
							>
								{key === "flying" ? (
									<MdOutlineParagliding className="size-4" />
								) : (
									<Radio className="size-4" />
								)}
								{key === "flying"
									? scope === "members"
										? t("tab_flying_members")
										: t("tab_flying")
									: t("tab_offline")}
								<span className="rounded-full bg-muted px-1.5 text-[10px]">
									{key === "flying" ? rows.flying.length : rows.offline.length}
								</span>
							</button>
						))}
					</div>
					<div className="relative p-2">
						<Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
						<Input
							type="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={t("search_placeholder")}
							className="h-8 pl-8 text-sm"
						/>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto">
						{visibleRows.length === 0 ? (
							<p className="text-muted-foreground px-4 py-6 text-center text-xs">
								{emptyText}
							</p>
						) : (
							visibleRows.map((row) => (
								<PilotRow
									key={row.id}
									row={row}
									offline={tab === "offline"}
									selected={followed === row.id}
									trail={trails.has(row.id)}
									onToggleTrail={(on) => toggleTrail(row.id, on)}
									onSelect={() =>
										tab === "flying" ? focusFlying(row.id) : focusOffline(row)
									}
								/>
							))
						)}
					</div>
					<div className="text-muted-foreground border-t px-4 py-2 text-center text-[10px]">
						{t.rich("source_footer", {
							link: (chunks) => (
								<a
									href="https://easyxcscore.com"
									target="_blank"
									rel="noopener noreferrer"
									className="underline"
								>
									{chunks}
								</a>
							),
						})}
					</div>
				</aside>

				<div className="relative order-1 isolate h-[45vh] shrink-0 md:order-2 md:h-auto md:flex-1">
					<div ref={containerRef} className="absolute inset-0 bg-white" />
					{!loaded && (
						<div className="text-muted-foreground absolute inset-0 z-[500] flex flex-col items-center justify-center gap-2 bg-slate-50/85 text-sm">
							<div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
							<span>{t("loading")}</span>
							<span className="text-xs">{t("loading_hint")}</span>
						</div>
					)}
					{feedError && (
						<div className="absolute top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 shadow">
							{t("feed_error")}
						</div>
					)}
					<div className="absolute top-2.5 right-2.5 z-[1000]">
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="flex items-center gap-1.5 rounded-lg border bg-white/95 px-3 py-1.5 text-xs font-bold shadow"
								>
									<Layers className="size-4" />
									{t("layers")}
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="z-[1100] w-56">
								<DropdownMenuLabel>{t("base_layer")}</DropdownMenuLabel>
								<DropdownMenuRadioGroup
									value={base}
									onValueChange={(v) => setBase(v as BaseLayer)}
								>
									<DropdownMenuRadioItem value="satellite">
										{t("base_satellite")}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="osm">
										{t("base_osm")}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="topo">
										{t("base_topo")}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="none">
										{t("base_none")}
									</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>{t("overlays")}</DropdownMenuLabel>
								<DropdownMenuCheckboxItem
									checked={hillshade}
									onCheckedChange={setHillshade}
									onSelect={(e) => e.preventDefault()}
								>
									{t("overlay_hillshade")}
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={topoOverlay}
									onCheckedChange={setTopoOverlay}
									onSelect={(e) => e.preventDefault()}
								>
									{t("overlay_topo")}
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={thermals}
									onCheckedChange={setThermals}
									onSelect={(e) => e.preventDefault()}
								>
									{t("overlay_thermals")}
								</DropdownMenuCheckboxItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<button
						type="button"
						onClick={recenter}
						className="absolute bottom-10 left-2.5 z-[1000] flex items-center gap-1.5 rounded-lg border bg-white/95 px-3 py-1.5 text-xs font-bold shadow"
					>
						<Crosshair className="size-4" />
						{t("recenter")}
					</button>
				</div>
			</div>
		</div>
	);
}

function PilotRow({
	row,
	offline,
	selected,
	trail,
	onToggleTrail,
	onSelect,
}: {
	row: Row;
	offline: boolean;
	selected: boolean;
	trail: boolean;
	onToggleTrail: (on: boolean) => void;
	onSelect: () => void;
}) {
	const t = useTranslations("LiveMapPage");
	const { last } = row;
	const vz = Number(last.vz.toFixed(1));
	const vzClass =
		Math.abs(vz) < 0.2
			? "text-muted-foreground"
			: vz > 0
				? "text-green-600"
				: "text-red-600";
	const title = row.name ?? row.label;

	return (
		<div
			className={cn(
				"flex items-start gap-2 border-b border-l-[3px] border-l-transparent py-2 pl-3 hover:bg-slate-50",
				selected && "border-l-blue-500 bg-blue-50",
			)}
		>
			<input
				type="checkbox"
				checked={trail}
				aria-label={t("show_trail")}
				title={t("show_trail")}
				onChange={(e) => onToggleTrail(e.target.checked)}
				className="mt-1 size-3.5 shrink-0 cursor-pointer accent-blue-500"
			/>
			<button
				type="button"
				onClick={onSelect}
				className="min-w-0 flex-1 cursor-pointer pr-3 text-left"
			>
				<div className="flex items-center gap-2">
					<span
						className="size-2.5 shrink-0 rounded-full ring-2 ring-black/10"
						style={{ background: row.color }}
					/>
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-bold">
							{title}
							{row.source === "extk" && (
								<span className="ml-1 rounded border border-orange-200 bg-orange-50 px-1 text-[8px] font-extrabold text-orange-500">
									EXTK
								</span>
							)}
						</div>
						{row.name && row.label && row.label !== row.name && (
							<div className="text-muted-foreground truncate text-[10px] font-semibold">
								{row.label}
							</div>
						)}
					</div>
					{row.sos && (
						<span className="live-map-sos-pill">{t("sos_label")}</span>
					)}
					{offline && (
						<span className="shrink-0 text-[10px] font-bold text-amber-500">
							{t("ago", { time: formatDuration(Date.now() - last.ts) })}
						</span>
					)}
				</div>
				{offline && (
					<div className="pt-0.5 pl-[18px] font-mono text-[10px] text-slate-700">
						{formatCoords(last.lat, last.lon)}
					</div>
				)}
				<div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 pl-[18px] text-[11px] font-bold">
					<span>
						{Math.round(last.alt)}
						<span className="text-[8px]">m</span>
					</span>
					{offline ? (
						<span className="font-normal">
							{t("points", { count: row.points })}
						</span>
					) : (
						<>
							<span>
								{Math.round(last.spd)}
								<span className="text-[8px]">km/h</span>
							</span>
							<span className={vzClass}>
								{vz >= 0 ? "+" : ""}
								{vz}
								<span className="text-[8px]">m/s</span>
							</span>
						</>
					)}
				</div>
			</button>
		</div>
	);
}
