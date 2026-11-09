import { describe, expect, it } from "vitest";
import {
	isProfileComplete,
	ONBOARDING_ERRORS,
	ONBOARDING_SELECT,
	onboardingErrorRedirect,
	onboardingStatus,
	REQUIRED_PROFILE_FIELDS,
} from "@/helpers/onboarding";

const completeProfile = {
	firstName: "Anna",
	lastName: "Rossi",
	dateOfBirth: "01/02/1990",
	placeOfBirth: "Bassano del Grappa",
	streetAddress: "Via Roma 1",
	city: "Bassano del Grappa",
	zipCode: "36061",
	province: "VI",
	state: "ITA",
	phone: "3330000000",
	fiscalCode: "RSSNNA90B41A703X",
	gender: "F",
};

describe("isProfileComplete", () => {
	it("accepts a profile with every required field", () => {
		expect(isProfileComplete(completeProfile)).toBe(true);
	});

	it.each(REQUIRED_PROFILE_FIELDS)("rejects a profile missing %s", (field) => {
		expect(isProfileComplete({ ...completeProfile, [field]: null })).toBe(
			false,
		);
	});

	it("rejects blank values, not just missing ones", () => {
		expect(isProfileComplete({ ...completeProfile, city: "   " })).toBe(false);
	});

	it("rejects a fiscal code of the wrong length", () => {
		expect(
			isProfileComplete({ ...completeProfile, fiscalCode: "RSSNNA90" }),
		).toBe(false);
	});

	it("covers the fields a freshly signed-up account lacks", () => {
		// What step one of the signup form fills in: the rest is the profile form.
		const justSignedUp = Object.fromEntries(
			REQUIRED_PROFILE_FIELDS.map((field) => [field, null]),
		) as unknown as typeof completeProfile;
		expect(
			isProfileComplete({
				...justSignedUp,
				firstName: "Anna",
				lastName: "Rossi",
				gender: "M",
			}),
		).toBe(false);
	});
});

describe("onboardingStatus", () => {
	it("is unverified until the email is confirmed, however full the profile", () => {
		expect(onboardingStatus({ ...completeProfile, emailVerified: false })).toBe(
			"unverified",
		);
	});

	it("is incomplete for a verified user with missing data", () => {
		expect(
			onboardingStatus({
				...completeProfile,
				emailVerified: true,
				phone: null,
			}),
		).toBe("incomplete");
	});

	it("is complete once both steps are done", () => {
		expect(onboardingStatus({ ...completeProfile, emailVerified: true })).toBe(
			"complete",
		);
	});

	it("selects exactly the fields it reads", () => {
		expect(Object.keys(ONBOARDING_SELECT).sort()).toEqual(
			["emailVerified", ...REQUIRED_PROFILE_FIELDS].sort(),
		);
	});
});

describe("onboardingErrorRedirect", () => {
	it("sends an unverified user to the verify page", () => {
		expect(onboardingErrorRedirect(ONBOARDING_ERRORS.unverified, "/xc")).toBe(
			"/verify-email?callbackUrl=%2Fxc",
		);
	});

	it("sends an incomplete profile to the profile form", () => {
		expect(onboardingErrorRedirect(ONBOARDING_ERRORS.incomplete, "/xc")).toBe(
			"/profile/edit?callbackUrl=%2Fxc",
		);
	});

	it("ignores any other error", () => {
		expect(onboardingErrorRedirect("Already enrolled", "/xc")).toBeNull();
		expect(onboardingErrorRedirect(undefined)).toBeNull();
	});
});
