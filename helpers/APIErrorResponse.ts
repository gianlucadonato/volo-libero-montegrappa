import { randomUUID } from "node:crypto";
import Boom from "@hapi/boom";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export default function APIErrorResponse(
	error: unknown,
	meta?: Record<string, unknown>,
) {
	if (Boom.isBoom(error)) {
		return Response.json(
			{ error: error.message },
			{
				status: error.output.statusCode,
				statusText: error.output.payload.error,
			},
		);
	}
	let unhandledError: Boom.Boom;
	if (error instanceof ZodError) {
		unhandledError = Boom.badRequest("Validation response error");
	} else {
		unhandledError = Boom.boomify(error as Error, {
			statusCode: 500,
			message: (meta?.message as string) || "Internal Server Error",
		});
	}
	logger.error(
		{
			error,
			meta: {
				requestId: randomUUID(),
				...(meta || {}),
			},
		},
		unhandledError.message,
	);
	return Response.json(
		{ error: unhandledError.message },
		{
			status: unhandledError.output.statusCode,
			statusText: unhandledError.output.payload.error,
		},
	);
}
