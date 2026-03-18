"use client";

import { useTranslations } from "next-intl";
import type { User } from "@/prisma/generated/client";

export default function ProfileDetails({ user }: { user: User }) {
	const t = useTranslations("ProfileDetails");
	return (
		<div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("email")}:</strong>
				</div>
				<div>{user.email}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("first_name")}:</strong>
				</div>
				<div>{user.firstName}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("last_name")}:</strong>
				</div>
				<div>{user.lastName}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("fiscal_code")}:</strong>
				</div>
				<div>{user.fiscalCode}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("place_of_birth")}:</strong>
				</div>
				<div>{user.placeOfBirth}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("date_of_birth")}:</strong>
				</div>
				<div>{user.dateOfBirth}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("street_address")}:</strong>
				</div>
				<div>{user.streetAddress}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("city")}:</strong>
				</div>
				<div>{user.city}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("zip_code")}:</strong>
				</div>
				<div>{user.zipCode}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("province")}:</strong>
				</div>
				<div>{user.province}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("state")}:</strong>
				</div>
				<div>{user.state}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("phone")}:</strong>
				</div>
				<div>{user.phone}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("size")}:</strong>
				</div>
				<div>{user.size}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("sport")}:</strong>
				</div>
				<div>{user.sport}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("vds_number")}:</strong>
				</div>
				<div>{user.vdsNumber}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("vds_release_date")}:</strong>
				</div>
				<div>{user.vdsReleaseDate}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("medical_exam_valid_date")}:</strong>
				</div>
				<div>{user.medicalExamValidDate}</div>
			</div>
			<div className="flex justify-between gap-2 border-b-2 p-2">
				<div>
					<strong>{t("fivl_number")}:</strong>
				</div>
				<div>{user.fivlNumber}</div>
			</div>
		</div>
	);
}
