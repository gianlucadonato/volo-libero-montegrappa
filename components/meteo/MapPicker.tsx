"use client";

import { Check } from "lucide-react";
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
	const [open, setOpen] = useState(false);

	function handleSelect(map: ElmeteoMapId) {
		onSelect(map);
		setOpen(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Scegli la mappa</DialogTitle>
					<DialogDescription>
						La scelta resta salvata su questo dispositivo.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
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
														Già visibile in un altro riquadro
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
						Annulla
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
