"use client";

import "react-flagpack/dist/style.css";
import { Check, Languages } from "lucide-react";
import * as React from "react";
import Flag from "react-flagpack";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/i18n/config";
import { setUserLocale } from "@/i18n/locale";

type Props = {
  defaultValue: string;
  items: Array<{ value: string; label: string }>;
};

export function LocaleToggle({ defaultValue, items }: Props) {
  const [_, startTransition] = React.useTransition();

  function onSelect(value: string) {
    const locale = value as Locale;
    startTransition(() => {
      setUserLocale(locale);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" size="sm" className="px-0 size-8">
          <Languages className="size-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Languages className="size-6 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-200 min-w-35 p-1">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => onSelect(item.value)}
          >
            <Flag
              code={item.value.toUpperCase()}
              size="m"
              hasBorder={false}
              className="mr-2 size-4"
            />
            <span>{item.label}</span>
            {item.value === defaultValue && <Check className="ml-2 size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
