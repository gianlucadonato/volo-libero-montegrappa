import {
	BookOpenText,
	Calendar,
	CalendarFold,
	Car,
	CreditCard,
	Home,
	Laptop,
	LayoutDashboard,
	Mail,
	MapPinHouse,
	MapPinned,
	MountainSnow,
	Newspaper,
	PencilLine,
	Settings,
	SunSnow,
	Trophy,
	User,
	Users,
} from "lucide-react";
import { FaRoute } from "react-icons/fa";
import { MdOutlineParagliding } from "react-icons/md";
import { UserRole } from "@/prisma/generated/enums";
import type { NavMainItem } from "@/types";

export const navbarLinks = [
	{
		title: "club",
		url: "/club",
		icon: MapPinHouse,
	},
	{
		title: "flying_area.title",
		url: "/area-volo",
		icon: MdOutlineParagliding,
		items: [
			{
				title: "flying_area.title",
				description: "flying_area.description",
				url: "/area-volo",
				icon: MdOutlineParagliding,
			},
			{
				title: "takeoffs.title",
				description: "takeoffs.description",
				url: "/decolli",
				icon: MountainSnow,
			},
			{
				title: "landings.title",
				description: "landings.description",
				url: "/atterraggi",
				icon: MapPinned,
			},
			{
				title: "directions.title",
				description: "directions.description",
				url: "/directions",
				icon: Car,
			},
		],
	},
	{
		title: "weather",
		url: "/meteo",
		icon: SunSnow,
	},
	{
		title: "events",
		url: "/events",
		icon: Calendar,
		image: "/bg-home.jpg",
		description: "events_description",
		items: [
			{
				title: "trofeo_montegrappa",
				description: `Montegrappa Trophy ${new Date().getFullYear()}`,
				url: "https://www.trofeomontegrappa.it/",
				target: "_blank",
				icon: Trophy,
			},
			{
				title: "xc_montegrappa",
				description: "Brevetto XC Montegrappa",
				url: "/xc",
				icon: FaRoute,
			},
			{
				title: "all_events",
				description: "Visualizza tutti gli eventi",
				url: "/events",
				icon: CalendarFold,
			},
		],
	},
	{
		title: "news",
		url: "/news",
		icon: Newspaper,
	},
	{
		title: "contacts",
		url: "/contatti",
		icon: Mail,
	},
];

export const sidebarLinks = {
	menu: [
		{
			title: "homepage",
			url: "/",
			icon: Home,
		},
		...navbarLinks,
		{
			title: "membership",
			url: "/membership",
			icon: PencilLine,
		},
	] as NavMainItem[],

	options: [
		{
			title: "admin",
			url: "/admin",
			icon: Laptop,
			authorizeOnly: [UserRole.ADMIN],
			items: [
				{
					title: "dashboard",
					icon: LayoutDashboard,
					url: "/admin",
				},
				{
					title: "users",
					icon: Users,
					url: "/admin/users",
				},
				{
					title: "payments",
					icon: CreditCard,
					url: "/admin/payments",
				},
				{
					title: "news",
					icon: Newspaper,
					url: "/keystatic",
				},
			],
		},
		{
			title: "documentation",
			url: "/documents",
			icon: BookOpenText,
			authorizeOnly: [UserRole.ADMIN],
		},
	] as NavMainItem[],
};

export const navUserLinks = [
	{
		title: "profile",
		url: "/profile",
		icon: User,
	},
	{
		title: "settings",
		url: "/settings",
		icon: Settings,
	},
] as NavMainItem[];
