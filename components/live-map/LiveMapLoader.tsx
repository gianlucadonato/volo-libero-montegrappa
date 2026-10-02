"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` on import, so the map only loads in the browser.
const LiveMap = dynamic(() => import("@/components/live-map/LiveMap"), {
	ssr: false,
	loading: () => (
		<div className="h-[calc(100dvh-4.5rem)] w-full animate-pulse bg-muted" />
	),
});

export default function LiveMapLoader() {
	return <LiveMap />;
}
