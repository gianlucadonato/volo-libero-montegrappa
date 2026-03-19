"use client";

import { Trash, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { useDeleteAccountModal } from "@/components/modals/delete-account-modal";
import { Button } from "@/components/ui/button";

export function DeleteAccountSection() {
  const t = useTranslations("SettingsPage.delete_account");
  const { setShowDeleteAccountModal, DeleteAccountModal } =
    useDeleteAccountModal();
  const userPaidPlan = false;
  return (
    <>
      <DeleteAccountModal />
      <SectionColumns title={t("title")} description={t("description")}>
        <div className="flex flex-col gap-4 rounded-xl border border-red-400 p-4 dark:border-red-900">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium">
                {t("are_you_sure")}
              </span>

              {userPaidPlan ? (
                <div className="flex items-center gap-1 rounded-md bg-red-600/10 p-1 pr-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-500">
                  <div className="m-0.5 rounded-full bg-red-600 p-[3px]">
                    <X size={10} className="text-background" />
                  </div>
                  Active Subscription
                </div>
              ) : null}
            </div>
            <div className="text-balance text-sm text-muted-foreground">
              {t("delete_account_warning")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="destructive"
              className="text-white"
              onClick={() => setShowDeleteAccountModal(true)}
            >
              <Trash className="mr-2 size-4" />
              <span>{t("delete_account_btn")}</span>
            </Button>
          </div>
        </div>
      </SectionColumns>
    </>
  );
}
