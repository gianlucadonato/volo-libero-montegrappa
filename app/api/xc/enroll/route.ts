import Boom from "@hapi/boom";
import { headers } from "next/headers";
import createXcEnrollment from "@/actions/xc/createXcEnrollment";
import { auth } from "@/auth";
import ApiErrorResponse from "@/helpers/APIErrorResponse";
import { getSocio } from "@/store/user";
import { getXcEnrollment } from "@/store/xc";

/**
 * /xc/enroll
 * @description Check if the current user is enrolled in the current XC edition
 * @response XcEnrollmentSchema
 * @auth
 * @openapi
 */

export async function GET() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		return ApiErrorResponse(Boom.unauthorized());
	}
	try {
		const enrollment = await getXcEnrollment({ userId: session.user.id });
		return Response.json(enrollment);
	} catch (error) {
		return ApiErrorResponse(error, { endpoint: "GET /xc/enroll" });
	}
}

/**
 * /xc/enroll
 * @description Enroll the current user in the current XC edition
 * @response XcEnrollmentSchema
 * @auth
 * @openapi
 */

export async function POST() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		return ApiErrorResponse(Boom.unauthorized());
	}
	const socio = await getSocio(session.user.id);
	if (!socio) {
		return ApiErrorResponse(Boom.forbidden("User is not a member"));
	}
	try {
		const enrollment = await createXcEnrollment({ userId: socio.id });
		return Response.json(enrollment, { status: 201 });
	} catch (error) {
		return ApiErrorResponse(error, { endpoint: "POST /xc/enroll" });
	}
}
