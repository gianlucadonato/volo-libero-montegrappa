import Boom from "@hapi/boom";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { getElmeteoFrame } from "@/lib/elmeteo-images";
import { isElmeteoMapId } from "@/lib/elmeteo-maps";
import { elmeteoMaxStep } from "@/lib/elmeteo-run";

const FrameQuerySchema = z.object({
	// The run folder is a UTC timestamp written by the uploader.
	folder: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/),
	map: z.string().refine(isElmeteoMapId, "Unknown map"),
	step: z.coerce.number().int().min(0).max(elmeteoMaxStep),
});

/**
 * /elmeteo/frame
 * @description Serve one ElMeteo forecast frame as WebP. The source bucket is private, so frames are proxied, converted and cached by the app.
 * @auth required
 * @openapi
 */
export const GET = async (request: Request) => {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) {
			return APIErrorResponse(Boom.unauthorized());
		}

		const { searchParams } = new URL(request.url);
		const parsed = FrameQuerySchema.safeParse({
			folder: searchParams.get("folder"),
			map: searchParams.get("map"),
			step: searchParams.get("step"),
		});
		if (!parsed.success) {
			return APIErrorResponse(Boom.badRequest("Invalid frame request"));
		}

		const frame = await getElmeteoFrame(parsed.data);
		if (!frame) {
			return APIErrorResponse(Boom.notFound("Frame not found"));
		}

		return new Response(new Uint8Array(frame.body), {
			headers: {
				"Content-Type": "image/webp",
				// A frame never changes once published, so it can be cached hard by
				// the browser. It stays private: the bucket is not public.
				"Cache-Control": "private, max-age=86400, immutable",
				"X-Cache": frame.cacheHit ? "HIT" : "MISS",
			},
		});
	} catch (error) {
		return APIErrorResponse(error, { endpoint: "GET /elmeteo/frame" });
	}
};
