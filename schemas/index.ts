import * as z from "zod";

export const LoginSchema = z.object({
	email: z.string().email({
		message: "Email is required",
	}),
	password: z.string().min(3, {
		message: "Password is required",
	}),
	code: z.optional(z.string()),
});

export const ResetPasswordSchema = z.object({
	email: z.string().email({
		message: "Email is required",
	}),
});

export const NewPasswordSchema = z.object({
	password: z.string().min(5, {
		message: "Password is required",
	}),
	confirmPassword: z.string().min(5, {
		message: "Confirm Password is required",
	}),
});

export const EventSchema = z.object({
	title: z.string(),
	description: z.string(),
	information: z.string().optional(),
	imageUrl: z.string().optional(),
	eventDate: z.string(),
	optionalDate: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	price: z.coerce.number().optional(),
	location: z.string().optional(),
	locationUrl: z.string().optional(),
	maxAvailability: z.coerce.number().optional(),
	isMemberOnly: z.boolean(),
});

export const PaymentSchema = z.object({
	userId: z.string().optional(),
	paymentMethod: z.string(),
	description: z.string(),
	amount: z.number(),
	slug: z.string(),
	note: z.string().optional(),
});

export const ChangePasswordSchema = z.object({
	newPassword: z.string().min(5),
	confirmPassword: z.string().min(5),
});

export const SignupSchema = z.object({
	email: z.string().email({
		message: "Email is required",
	}),
	password: z.string().min(5),
	firstName: z.string().min(2),
	lastName: z.string().min(2),
	dateOfBirth: z.string().min(10),
	placeOfBirth: z.string(),
	streetAddress: z.string(),
	city: z.string(),
	zipCode: z.string(),
	province: z.string(),
	state: z.string(),
	phone: z.string(),
	fiscalCode: z.string().optional(),
	size: z.string().optional(),
	gender: z.string().optional(),
	sport: z.string().optional(),
	vdsNumber: z.string().optional(),
	vdsReleaseDate: z.string().optional(),
	fivlNumber: z.string().optional(),
	medicalExamValidDate: z.string().optional(),
	privacyPolicy: z.boolean().refine((val) => val === true, {
		message:
			"Please read and accept the privacy policy and terms and conditions",
	}),
	emailConsent: z.boolean().refine((val) => val === true, {
		message: "Please read and accept the MOG document",
	}),
});

export const UserDetailsSchema = z.object({
	firstName: z.string().min(2),
	lastName: z.string().min(2),
	dateOfBirth: z.string(),
	placeOfBirth: z.string(),
	streetAddress: z.string(),
	city: z.string(),
	zipCode: z.string(),
	province: z.string(),
	state: z.string(),
	phone: z.string(),
	fiscalCode: z.string().optional(),
	size: z.string().optional(),
	sport: z.string().optional(),
	vdsNumber: z.string().optional(),
	vdsReleaseDate: z.string().optional(),
	fivlNumber: z.string().optional(),
	medicalExamValidDate: z.string().optional(),
});
