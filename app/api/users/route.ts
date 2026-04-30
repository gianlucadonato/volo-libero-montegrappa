import Boom from "@hapi/boom";
import { headers } from "next/headers";
import z from "zod";
import getUsers from "@/actions/getUsers";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";

const UsersSchema = z.object({
	id: z.string(),
	firstName: z.string().nullish(),
	lastName: z.string().nullish(),
	email: z.string(),
	xcontestId: z.string().nullish(),
	ognCallsign: z.string().nullish(),
	ognHex: z.string().nullish(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	updatedAt: z.coerce.date().transform((val) => val.toISOString()),
});

/**
 * /users
 * @description Fetch all the users
 * @response UsersSchema[]
 * @auth
 * @openapi
 */

export const GET = async () => {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session) {
			return APIErrorResponse(Boom.unauthorized());
		}

		const users = await getUsers();
		const parsed = UsersSchema.array().parse(users);
		return Response.json(parsed);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /api/users",
		});
	}
};
