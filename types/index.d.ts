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
