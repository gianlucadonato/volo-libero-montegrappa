"use client";

import { EditIcon, UndoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  Coupon,
  Payment,
  User,
  UserMembership,
} from "@/prisma/generated/client";
import CouponsTable from "./CouponsTable";
import { DashboardHeader } from "./dashboard/header";
import MembershipsTable from "./MembershipsTable";
import PaymentsTable from "./PaymentsTable";
import ProfileDetails from "./ProfileDetails";
import ProfileEdit from "./ProfileEdit";

type Member = User & {
  payments: Payment[];
  memberships: UserMembership[];
  coupons: Coupon[];
};

export default function ProfileView({ user }: { user: Member }) {
  const t = useTranslations("ProfileView");
  const [editMode, setEditMode] = useState(false);

  function getMemberDetails({ user }: { user: Member }) {
    return (
      <div className="mt-10">
        <div>
          <DashboardHeader
            heading={t("your_memberships")}
            text={t("your_memberships_description")}
          />
          <MembershipsTable title={null} memberships={user.memberships} />
        </div>
        <PaymentsTable title={t("payments")} payments={user.payments} />
        <CouponsTable coupons={user.coupons} />
      </div>
    );
  }

  return (
    <>
      <div className="my-4 flex items-center justify-between">
        <div className="grid gap-1">
          <h1 className="highlight font-heading text-3xl uppercase">
            {t("profile_details")}
          </h1>
        </div>
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
      </div>
      <div className="mb-8">
        {editMode ? (
          <ProfileEdit user={user} onSave={() => setEditMode(false)} />
        ) : (
          <ProfileDetails user={user} />
        )}
      </div>
      <div className="mt-8">
        {user.role === "MEMBER" && getMemberDetails({ user })}
      </div>
    </>
  );
}
