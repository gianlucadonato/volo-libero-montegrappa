"use client";

import { ArrowLeft, EditIcon, UndoIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import CouponsTable from "@/components/CouponsTable";
import { DashboardHeader } from "@/components/dashboard/header";
import { UserForm } from "@/components/forms/user-form";
import MembershipsTable from "@/components/MembershipsTable";
import PaymentsTable from "@/components/PaymentsTable";
import ProfileDetails from "@/components/ProfileDetails";
import { Button } from "@/components/ui/button";
import { isSocio } from "@/helpers/isSocio";
import type {
	Coupon,
	Payment,
	User,
	UserMembership,
} from "@/prisma/generated/client";

type Member = User & {
	payments: Payment[];
	memberships: UserMembership[];
	coupons: Coupon[];
};

export default function AdminUserView({ user }: { user: Member }) {
	const t = useTranslations("AdminUserView");
	const [editMode, setEditMode] = useState(false);

	function getMemberDetails({ user }: { user: Member }) {
		return (
			<div>
				<MembershipsTable
					title={t("member_cards")}
					memberships={user.memberships}
				/>
				<PaymentsTable
					title={t("payments")}
					payments={user.payments}
					showAdminFields={true}
				/>
				<CouponsTable coupons={user.coupons} />
			</div>
		);
	}

	return (
		<div className="pb-8">
			<div className="mb-4 flex justify-start">
				<Link href="/admin/users">
					<Button variant="outline" size="sm">
						<ArrowLeft className="mr-2 size-4" />
						{t("back")}
					</Button>
				</Link>
			</div>
			<DashboardHeader
				heading={`${user.firstName} ${user.lastName}`}
				// Reads the memberships rather than the role, so this agrees with the
				// badge in the users table. The role only survives here for admins,
				// where it is the thing being reported; it said "SOCIO" for anyone who
				// had ever paid, whether or not they renewed.
				text={
					user.role === "ADMIN"
						? t("ADMIN")
						: isSocio(user)
							? t("MEMBER")
							: t("USER")
				}
			>
				<div>
					{editMode ? (
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setEditMode(false)}>
								<UndoIcon className="size-4"></UndoIcon>
								<span className="ml-2 hidden sm:inline-block">
									{t("cancel")}
								</span>
							</Button>
						</div>
					) : (
						<Button variant="outline" onClick={() => setEditMode(true)}>
							<EditIcon className="size-4"></EditIcon>
							<span className="ml-2 hidden sm:inline-block">{t("edit")}</span>
						</Button>
					)}
				</div>
			</DashboardHeader>
			<div className="my-4 flex flex-col gap-5">
				{editMode ? (
					<UserForm user={user} onSave={() => setEditMode(false)} />
				) : (
					<ProfileDetails user={user} />
				)}
			</div>
			<div className="mt-8">{getMemberDetails({ user })}</div>
		</div>
	);
}
