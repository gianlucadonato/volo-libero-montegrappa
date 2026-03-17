import * as z from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .email({
      message: "Email is required",
    })
    .trim()
    .toLowerCase(),
  password: z.string().min(3, {
    message: "Password is required",
  }),
});

export const SignupSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name is required",
  }),
  lastName: z.string().min(2, {
    message: "Last name is required",
  }),
  email: z
    .string()
    .email({
      message: "Email is required",
    })
    .trim()
    .toLowerCase(),
  password: z.string().min(8, {
    message: "Password is required",
  }),
  confirmPassword: z.string().min(8, {
    message: "Confirm Password is required",
  }),
});

export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .email({
      message: "Email is required",
    })
    .trim()
    .toLowerCase(),
});

export const NewPasswordSchema = z.object({
  password: z.string().min(8, {
    message: "Password is required",
  }),
  confirmPassword: z.string().min(8, {
    message: "Confirm Password is required",
  }),
});

export const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8, {
    message: "New password is required",
  }),
  confirmPassword: z.string().min(8, {
    message: "Confirm password is required",
  }),
});

export const UserFormSchema = z.object({
  firstName: z.string().trim().min(2, {
    message: "First name is required",
  }),
  lastName: z.string().trim().min(2, {
    message: "Last name is required",
  }),
  dateOfBirth: z.string().trim().min(1, {
    message: "Date of birth is required",
  }),
  placeOfBirth: z.string().trim().min(1, {
    message: "Place of birth is required",
  }),
  streetAddress: z.string().trim().min(1, {
    message: "Street address is required",
  }),
  city: z.string().trim().min(1, {
    message: "City is required",
  }),
  zipCode: z.string().trim().min(1, {
    message: "Zip code is required",
  }),
  province: z.string().trim().min(1, {
    message: "Province is required",
  }),
  state: z.string().trim().min(1, {
    message: "State is required",
  }),
  phone: z.string().trim().min(1, {
    message: "Phone is required",
  }),
  fiscalCode: z.string().trim().length(16, {
    message: "Fiscal code is required",
  }),
  size: z.string().optional(),
  gender: z.string().trim().min(1, {
    message: "Gender is required",
  }),
  sport: z.string().optional(),
  vdsNumber: z.string().optional(),
  vdsReleaseDate: z.string().optional(),
  fivlNumber: z.string().optional(),
  medicalExamValidDate: z.string().optional(),
});

export const RegisterMembershipSchema = z.object({
  privacyPolicy: z.boolean().refine((val) => val === true, {
    message:
      "Please read and accept the privacy policy and terms and conditions",
  }),
  emailConsent: z.boolean().refine((val) => val === true, {
    message: "Please read and accept the MOG document",
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
