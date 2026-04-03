import type { LucideIcon } from "lucide-react";
import type {
	Event,
	EventRegistration,
	User,
	UserMembership,
} from "@/prisma/generated/client";
import type { UserRole } from "@/prisma/generated/enums";

export type SiteConfig = {
	name: string;
	description: string;
	url: string;
	ogImage: string;
	mailSupport: string;
	links: {
		instagram: string;
		facebook: string;
	};
	keywords: string[];
};

export type NavMainItem = {
	title: string;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	disabled?: boolean;
	authorizeOnly?: UserRole[];
	items?: NavMainItem[];
	hidden?: boolean;
};

export type InfoList = {
	icon: LucideIcon;
	title: string;
	description: string;
	link?: string;
};

export type SessionUser = {
	id: string;
	firstName: string;
	lastName: string | null;
	email: string | null;
	image?: string | null;
	role: UserRole;
};

export type EventRegistrationWithUser = EventRegistration & {
	user?: { id: string; firstName: string; lastName: string; email: string };
};
export type EventWithRegistrations = Event & {
	registrations: EventRegistrationWithUser[];
};

export type UserWithMemberships = User & {
	memberships: UserMembership[];
};

export type PaymentWithUser = Payment & { user: User; creator?: User };

export interface XcTaskData {
	id: string;
	name: string;
	description?: string | null;
	points: number;
	distanceKm?: number | null;
	taskFileUrl?: string | null;
	imageUrl?: string | null;
	isPublished: boolean;
}
