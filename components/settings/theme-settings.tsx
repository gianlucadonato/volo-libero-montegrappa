"use client";

import { Laptop, Moon, SunMedium } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { SectionColumns } from "@/components/dashboard/section-columns";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "../ui/button";

export function ThemeSettings() {
  const t = useTranslations("SettingsPage.theme");
  const { theme, setTheme } = useTheme();
  const [_, startTransition] = useTransition();

  function onSelect(value: string) {
    startTransition(() => {
      setTheme(value);
    });
  }

  return (
    <SectionColumns title={t("title")} description={t("description")}>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex-1">
          <Select defaultValue={theme} onValueChange={onSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("select_theme")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="light">{t("light")}</SelectItem>
                <SelectItem value="dark">{t("dark")}</SelectItem>
                <SelectItem value="system">{t("system")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button variant="outline">
            {theme === "dark" ? (
              <Moon className="size-4" />
            ) : theme === "light" ? (
              <SunMedium className="size-4" />
            ) : (
              <Laptop className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </SectionColumns>
  );
}
