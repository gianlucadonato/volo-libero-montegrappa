import {
	BookOpenText,
	Calendar,
	Car,
	CreditCard,
	Home,
	Laptop,
	LayoutDashboard,
	Mail,
	MapPinHouse,
	MapPinned,
	MountainSnow,
	PencilLine,
	Settings,
	SunSnow,
	User,
	Users,
} from "lucide-react";
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
		hidden: true,
	},
	{
		title: "events",
		url: "/events",
		icon: Calendar,
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
		authorizeOnly: [UserRole.USER, UserRole.MEMBER],
	},
	{
		title: "settings",
		url: "/settings",
		icon: Settings,
		authorizeOnly: [UserRole.USER, UserRole.MEMBER],
	},
] as NavMainItem[];
