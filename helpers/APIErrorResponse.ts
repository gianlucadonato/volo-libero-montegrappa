import { randomUUID } from "node:crypto";
import Boom from "@hapi/boom";
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
	const serverError = Boom.boomify(error as Error, {
		statusCode: 500,
		message: (meta?.message as string) || "Internal Server Error",
	});
	logger.error(
		{
			error,
			meta: {
				requestId: randomUUID(),
				...(meta || {}),
			},
		},
		serverError.message,
	);
	return Response.json(
		{ error: serverError.message },
		{
			status: serverError.output.statusCode,
			statusText: serverError.output.payload.error,
		},
	);
}
