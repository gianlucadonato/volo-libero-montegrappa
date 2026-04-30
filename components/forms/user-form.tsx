"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isValid, parse } from "date-fns";
import { it } from "date-fns/locale";
import {
	BookOpenText,
	Check,
	ChevronsUpDown,
	HelpCircle,
	Loader2,
	Phone,
	Shirt,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { useForm } from "react-hook-form";
import { PiGenderIntersexBold } from "react-icons/pi";
import { toast } from "sonner";
import { withMask } from "use-mask-input";
import type * as z from "zod";
import updateUser from "@/actions/updateUser";
import { Input } from "@/components/extendui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/extendui/select";
import { FormMessageI18N } from "@/components/forms/form-message-i18n";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { countries } from "@/i18n/countries";
import { cn } from "@/lib/utils";
import type { User } from "@/prisma/generated/client";
import { UserFormSchema } from "@/schemas";

type PartialUser = Partial<User>;
type FormData = z.infer<typeof UserFormSchema>;
type CountryCode = keyof typeof countries;
type MaskField = Pick<
	ControllerRenderProps<FormData, keyof FormData>,
	"name" | "value"
>;

function formatUser(user: Partial<User>) {
	return {
		...user,
		firstName: user.firstName ?? "",
		lastName: user.lastName ?? "",
		fiscalCode: user.fiscalCode ?? "",
		placeOfBirth: user.placeOfBirth ?? "",
		dateOfBirth: user.dateOfBirth
			? new Date(user.dateOfBirth).toLocaleDateString("it-IT")
			: "",
		streetAddress: user.streetAddress ?? "",
		city: user.city ?? "",
		zipCode: user.zipCode ?? "",
		province: user.province ?? "",
		state: user.state ?? "ITA",
		size: user.size ?? "M",
		gender: user.gender ?? "M",
		phone: user.phone ?? "",
		sport: user.sport ?? "paragliding",
		fivlNumber: user.fivlNumber ?? undefined,
		vdsNumber: user.vdsNumber ?? undefined,
		vdsReleaseDate: user.vdsReleaseDate
			? new Date(user.vdsReleaseDate).toLocaleDateString("it-IT")
			: "",
		medicalExamValidDate: user.medicalExamValidDate
			? new Date(user.medicalExamValidDate).toLocaleDateString("it-IT")
			: "",
		xcontestId: user.xcontestId ?? undefined,
		ognCallsign: user.ognCallsign ?? undefined,
		ognHex: user.ognHex ?? undefined,
	};
}

export function UserForm({
	user,
	callbackUrl,
	onSave,
	onCancel,
}: {
	user: PartialUser;
	callbackUrl?: string;
	onSave?: (user: FormData) => void;
	onCancel?: () => void;
}) {
	const t = useTranslations("UserForm");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const router = useRouter();

	const form = useForm<FormData>({
		resolver: zodResolver(UserFormSchema),
		values: formatUser(user),
		mode: "onChange",
	});

	const countryCodes = Object.keys(countries) as CountryCode[];

	const getCountry = (code: string | undefined) => {
		if (!code || !(code in countries)) return undefined;
		return countries[code as CountryCode];
	};

	const isValidDate = (field: MaskField) => {
		const parsedDate = parse(field.value ?? "", "P", new Date(), {
			locale: it,
		});
		const isValidDate = isValid(parsedDate);
		if (!isValidDate) {
			form.setError(field.name, {
				type: "invalid_date",
				message: "Invalid date",
			});
		} else {
			form.clearErrors(field.name);
		}
	};

	const clearMask = (field: MaskField) => {
		const cleared = (field.value ?? "")
			.split("/")
			.map((value: string) => value.replaceAll("_", ""))
			.filter((value: string) => Boolean(value))
			.join("/");
		form.setValue(field.name, cleared, { shouldValidate: true });
	};

	async function onSubmit(data: FormData) {
		setIsLoading(true);
		if (!user.id)
			return toast.error(t("error.title"), {
				description: t("error.description"),
			});

		const res = await updateUser(user.id, data);
		if (!res.success) {
			return toast.error(t("error.title"), {
				description: res.message || t("error.description"),
			});
		}
		setIsLoading(false);
		callbackUrl && router.push(callbackUrl);
		onSave?.(data);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<div className="space-y-8">
					<div className="space-y-6">
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>
											{t("first_name")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessageI18N name="firstName" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>
											{t("last_name")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessageI18N name="lastName" />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							<FormField
								control={form.control}
								name="placeOfBirth"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>
											{t("place_of_birth")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessageI18N name="placeOfBirth" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="dateOfBirth"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>
											{t("date_of_birth")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="text"
												inputMode="numeric"
												ref={withMask("99/99/9999", {
													onincomplete: () => clearMask(field),
													oncomplete: () => isValidDate(field),
												})}
											/>
										</FormControl>
										<FormMessageI18N name="dateOfBirth" />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							<FormField
								control={form.control}
								name="fiscalCode"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>
											{t("fiscal_code")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												maxLength={16}
												minLength={16}
												style={{ textTransform: "uppercase" }}
												onChange={(e) => {
													const upperValue = e.target.value.toUpperCase();
													field.onChange(upperValue);
												}}
											/>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="streetAddress"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>
											{t("street_address")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							<FormField
								control={form.control}
								name="city"
								render={({ field }) => (
									<FormItem className="col-span-4 md:col-span-1">
										<FormLabel>
											{t("city")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="zipCode"
								render={({ field }) => (
									<FormItem className="col-span-4 md:col-span-1">
										<FormLabel>
											{t("zip_code")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input {...field} type="number" inputMode="numeric" />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="province"
								render={({ field }) => (
									<FormItem className="col-span-4 md:col-span-1">
										<FormLabel>
											{t("province")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="state"
								render={({ field }) => (
									<FormItem className="col-span-4 md:col-span-1">
										<FormLabel>
											{t("state")}
											<RequiredMark />
										</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant="outline"
														role="combobox"
														className={cn(
															"w-full justify-between",
															!field.value && "text-muted-foreground",
														)}
													>
														{field.value
															? getCountry(field.value)?.italian_country_name
															: "Select Country"}
														<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-50 p-0">
												<Command>
													<CommandInput placeholder="Search country..." />
													<CommandList>
														<CommandEmpty>No country found.</CommandEmpty>
														<CommandGroup>
															{countryCodes.map((countryCode) => {
																const country = getCountry(countryCode);
																if (!country) return null;

																return (
																	<CommandItem
																		value={country.italian_country_name}
																		key={country.italian_country_name}
																		onSelect={() => {
																			form.setValue(
																				"state",
																				country.iso3361_3_characters,
																			);
																		}}
																	>
																		<Check
																			className={cn(
																				"mr-2 size-4",
																				country.iso3361_3_characters ===
																					field.value
																					? "opacity-100"
																					: "opacity-0",
																			)}
																		/>
																		{country.italian_country_name}
																	</CommandItem>
																);
															})}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-8">
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>
											{t("phone")}
											<RequiredMark />
										</FormLabel>
										<FormControl>
											<Input {...field} type="number" inputMode="numeric">
												<Input.Group>
													<Input.RightIcon>
														<Phone />
													</Input.RightIcon>
												</Input.Group>
											</Input>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="size"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>{t("size")}</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger
													icon={
														<Shirt
															size={16}
															strokeWidth={2}
															aria-hidden="true"
														/>
													}
												>
													<SelectValue placeholder={t("select_size")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="XS">XS</SelectItem>
												<SelectItem value="S">S</SelectItem>
												<SelectItem value="M">M</SelectItem>
												<SelectItem value="L">L</SelectItem>
												<SelectItem value="XL">XL</SelectItem>
												<SelectItem value="XXL">XXL</SelectItem>
												<SelectItem value="3XL">3XL</SelectItem>
												<SelectItem value="4XL">4XL</SelectItem>
											</SelectContent>
										</Select>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="gender"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>
											{t("gender")}
											<RequiredMark />
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger
													icon={
														<PiGenderIntersexBold
															size={16}
															strokeWidth={2}
															aria-hidden="true"
														/>
													}
												>
													<SelectValue placeholder={t("select_gender")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="M">{t("male")}</SelectItem>
												<SelectItem value="F">{t("female")}</SelectItem>
											</SelectContent>
										</Select>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="sport"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>Sport</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("select_sport")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="paragliding">
													{t("paragliding")}
												</SelectItem>
												<SelectItem value="hang-gliding">
													{t("hang_gliding")}
												</SelectItem>
												<SelectItem value="paramotor">
													{t("paramotor")}
												</SelectItem>
												<SelectItem value="nothing">{t("nothing")}</SelectItem>
											</SelectContent>
										</Select>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
						</div>
					</div>
					<div className="space-y-6">
						<div className="flex items-center border-b-2">
							<h3 className="text-lg font-medium">{t("vds_license")}</h3>
							<span className="ml-2 text-muted-foreground text-xs">
								({t("optional")})
							</span>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-6">
							<FormField
								control={form.control}
								name="vdsNumber"
								render={({ field }) => (
									<FormItem className="col-span-1 md:col-span-2">
										<FormLabel>{t("vds_number")}</FormLabel>
										<FormControl>
											<Input {...field} type="number" inputMode="numeric" />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="vdsReleaseDate"
								render={({ field }) => (
									<FormItem className="col-span-1 md:col-span-2">
										<FormLabel>{t("vds_release_date")}</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="text"
												inputMode="numeric"
												ref={withMask("99/99/9999")}
											/>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="medicalExamValidDate"
								render={({ field }) => (
									<FormItem className="col-span-1 md:col-span-2">
										<FormLabel>{t("medical_exam_valid_date")}</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="text"
												inputMode="numeric"
												ref={withMask("99/99/9999")}
											/>
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
						</div>
					</div>
					<div className="space-y-6">
						<div className="flex items-center border-b-2">
							<h3 className="text-lg font-medium">{t("integrations")}</h3>
							<span className="ml-2 text-muted-foreground text-xs">
								({t("optional")})
							</span>
						</div>
						<div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
							<FormField
								control={form.control}
								name="fivlNumber"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>{t("fivl_number")}</FormLabel>
										<FormControl>
											<Input {...field} type="number" inputMode="numeric" />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="xcontestId"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<div className="flex items-center gap-1.5">
											<FormLabel>{t("xcontest_id")}</FormLabel>
											<FieldHelpButton
												title={t("xcontest_id")}
												description={t("xcontest_id_description")}
												helpContent={<HelpXContestId />}
												srLabel={t("more_info")}
											/>
										</div>
										<FormControl>
											<Input {...field} type="text" />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="ognCallsign"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<div className="flex items-center gap-1.5">
											<FormLabel>{t("ogn_callsign")}</FormLabel>
											<FieldHelpButton
												title={t("ogn_callsign")}
												description={t("ogn_callsign_description")}
												helpContent={<HelpOgnFields />}
												srLabel={t("more_info")}
											/>
										</div>
										<FormControl>
											<Input {...field} type="text" />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="ognHex"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<div className="flex items-center gap-1.5">
											<FormLabel>{t("ogn_hex")}</FormLabel>
											<FieldHelpButton
												title={t("ogn_hex")}
												description={t("ogn_hex_description")}
												helpContent={<HelpOgnFields />}
												srLabel={t("more_info")}
											/>
										</div>
										<FormControl>
											<Input {...field} type="text" />
										</FormControl>
										<FormMessageI18N />
									</FormItem>
								)}
							/>
						</div>
					</div>
				</div>
				<div
					className={cn(
						"mt-8 gap-2",
						onCancel ? "flex items-center justify-end " : "grid",
					)}
				>
					{onCancel && (
						<Button
							variant="outline"
							className="w-50"
							onClick={() => onCancel?.()}
						>
							{t("cancel")}
						</Button>
					)}
					<Button
						type="submit"
						variant="default"
						className={cn("", onCancel && "w-50")}
						disabled={isLoading}
					>
						{isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
						{t("save")}
					</Button>
				</div>
			</form>
		</Form>
	);
}

function RequiredMark() {
	return (
		<span aria-hidden="true" className="ml-0.5 text-destructive">
			*
		</span>
	);
}

function FieldHelpButton({
	title,
	description,
	helpContent,
	srLabel,
}: {
	title: string;
	description: string;
	helpContent?: React.ReactNode;
	srLabel: string;
}) {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<button
					type="button"
					className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
				>
					<HelpCircle className="size-4" />
					<span className="sr-only">{srLabel}</span>
				</button>
			</SheetTrigger>
			<SheetContent side="right" className="sm:max-w-[35%] pt-[72px]">
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
					<SheetDescription>{description}</SheetDescription>
					{helpContent && <div className="mt-4">{helpContent}</div>}
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
}

function HelpXContestId() {
	return (
		<div>
			<div className="font-bold">Come fare?</div>
			<div>
				Vai su{" "}
				<a href="https://www.xcontest.org/" className="underline">
					xcontest.org
				</a>{" "}
				scegli un username e segui le istruzioni per registrarti.
			</div>
			<Image
				src="/xcontest_example.png"
				alt="xcontest example"
				width={800}
				height={400}
				className="mt-4 rounded-md border"
			/>
		</div>
	);
}

function HelpOgnFields() {
	return (
		<div>
			<div className="font-bold">Come fare?</div>
			<div className="flex items-center">
				<span>Scarica la </span>
				<Link
					href="/docs/Guida registrazione Safesky su rete OGN.pdf"
					download
					className="flex items-center underline ml-1"
				>
					guida
					<BookOpenText className="ml-1 size-4" />
				</Link>
			</div>
		</div>
	);
}
