import Image from "next/image";
import { useTranslations } from "next-intl";
import { Timeline } from "@/components/ui/timeline";

// Each period's heading and text live in messages/*.json under
// ClubPage.history.<id>.
const periods = [
	{ id: "origins", years: "1973 - 1979", image: "/storia/STORIA_1.png" },
	{ id: "eighties", years: "1980 - 1990", image: "/storia/STORIA_1980.png" },
	{ id: "boom", years: "1990 - 2009", image: "/storia/STORIA_1990.png" },
	{
		id: "story_continues",
		years: "2009 - 2014",
		image: "/storia/STORIA_2014.png",
	},
	{ id: "farewell", years: "2015 - 2019", image: "/storia/STORIA_2019.png" },
] as const;

export default function TimelineBox() {
	const t = useTranslations("ClubPage.history");

	const data = periods.map(({ id, years, image }) => ({
		title: years,
		content: (
			<div>
				<h1 className="mb-2 text-2xl font-bold italic">{t(`${id}.title`)}</h1>
				<p className="mb-8 text-neutral-800 dark:text-neutral-200">
					{t.rich(`${id}.body`, {
						strong: (chunks) => <strong>{chunks}</strong>,
						br: () => <br />,
					})}
				</p>
				<div className="grid grid-cols-1 gap-4">
					<Image src={image} alt={`STORIA_${years}`} width={500} height={400} />
				</div>
			</div>
		),
	}));

	return (
		<div className="w-full">
			<Timeline data={data} />
		</div>
	);
}
