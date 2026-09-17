"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	type ElmeteoMapGroup,
	type ElmeteoMapId,
	elmeteoMapGroupLabels,
	elmeteoMaps,
} from "@/lib/elmeteo-maps";
import { cn } from "@/lib/utils";

const groupOrder: ElmeteoMapGroup[] = [
	"termica",
	"vento",
	"precipitazioni",
	"quota",
];

type MapPickerProps = {
	value: ElmeteoMapId;
	usedMaps: readonly ElmeteoMapId[];
	onSelect: (map: ElmeteoMapId) => void;
	children: React.ReactNode;
};

export function MapPicker({
	value,
	usedMaps,
	onSelect,
	children,
}: MapPickerProps) {
	const t = useTranslations("MeteoPage.Maps");
	const [open, setOpen] = useState(false);

	function handleSelect(map: ElmeteoMapId) {
		onSelect(map);
		setOpen(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			{/* Offset below the layout's fixed header, which stacks above the
			    dialog — see the same treatment in MapQuadrant. */}
			<DialogContent className="top-22 grid max-h-[calc(100dvh-6.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] translate-y-0 overflow-hidden sm:top-1/2 sm:max-h-[calc(100dvh-10rem)] sm:max-w-2xl sm:-translate-y-1/2">
				{/* Padded on the end so the header never runs under the close button,
				    which sits in the same row. */}
				<DialogHeader className="pe-10">
					<DialogTitle>{t("picker_title")}</DialogTitle>
					<DialogDescription>{t("picker_description")}</DialogDescription>
				</DialogHeader>

				{/* Only the list scrolls, so the close button stays reachable at the
				    top right and the cancel button stays visible at the bottom. */}
				<div className="-mx-4 space-y-5 overflow-y-auto px-4">
					{groupOrder.map((group) => (
						<div key={group}>
							<p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
								{elmeteoMapGroupLabels[group]}
							</p>
							<div className="grid gap-2 sm:grid-cols-2">
								{elmeteoMaps
									.filter((map) => map.group === group)
									.map((map) => {
										const isSelected = map.id === value;
										// Already shown in another quadrant: still selectable, but
										// worth flagging so the user does not duplicate by mistake.
										const isUsedElsewhere =
											!isSelected && usedMaps.includes(map.id);

										return (
											<button
												key={map.id}
												type="button"
												onClick={() => handleSelect(map.id)}
												className={cn(
													"rounded-lg border p-3 text-left transition-colors hover:bg-muted",
													isSelected
														? "border-primary bg-primary/5"
														: "border-border",
												)}
											>
												<span className="flex items-start justify-between gap-2">
													<span className="font-medium text-sm">
														{map.label}
													</span>
													{isSelected && (
														<Check className="mt-0.5 size-4 shrink-0 text-primary" />
													)}
												</span>
												<span className="mt-1 block text-muted-foreground text-xs leading-snug">
													{map.description}
												</span>
												{isUsedElsewhere && (
													<span className="mt-1 block text-[11px] text-muted-foreground/70 italic">
														{t("already_used")}
													</span>
												)}
											</button>
										);
									})}
							</div>
						</div>
					))}
				</div>

				<div className="flex justify-end">
					<Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
						{t("cancel")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
