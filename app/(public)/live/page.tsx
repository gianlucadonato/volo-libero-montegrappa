import LiveMapLoader from "@/components/live-map/LiveMapLoader";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Live - ${siteConfig.name}`,
	description:
		"Mappa live dei piloti in volo sul Monte Grappa dalla rete OGN, con il filtro per vedere solo i soci del club.",
});

export default function LivePage() {
	return <LiveMapLoader />;
}
