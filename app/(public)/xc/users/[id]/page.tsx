import { notFound } from "next/navigation";
import { getXcPilotIdentity } from "@/actions/xc/getXcPilotProfile";
import XcPilotProfile from "@/components/xc/XcPilotProfile";
import { constructMetadata, siteConfig } from "@/config/site";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const pilot = await getXcPilotIdentity(id);
	const name = pilot ? `${pilot.firstName} ${pilot.lastName}` : "Pilota";

	return constructMetadata({
		title: `${name} - XC Montegrappa - ${siteConfig.name}`,
		description: `Profilo XC Montegrappa di ${name}: punti, progressi e voli`,
		// Public via direct link (from the leaderboard), but kept out of search
		// engines: the page carries a pilot's name and GPS tracks.
		noIndex: true,
	});
}

export default async function XcPilotProfilePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const pilot = await getXcPilotIdentity(id);
	if (!pilot) notFound();

	return (
		<XcPilotProfile
			userId={pilot.id}
			fallbackName={`${pilot.firstName} ${pilot.lastName}`}
		/>
	);
}
