import Boom from "@hapi/boom";
import { headers } from "next/headers";
import { auth } from "@/auth";
import {
	EVENT_COVER_ACCEPTED_TYPES,
	EVENT_COVER_MAX_UPLOAD_MB,
	NEWS_IMAGES_PREFIX,
} from "@/config/constants";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { uploadPublicImage } from "@/lib/public-images";

/**
 * /news/images
 * @description Upload a news image (cover or body) to the public bucket and return its URL
 * @body NewsImageUploadBodySchema
 * @contentType multipart/form-data
 * @response NewsImageUploadResponseSchema
 * @auth
 * @openapi
 */
export async function POST(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session) {
			return APIErrorResponse(Boom.unauthorized());
		}
		if (session.user.role !== "ADMIN") {
			return APIErrorResponse(Boom.forbidden());
		}

		const formData = await request.formData();
		const file = formData.get("file");

		if (!(file instanceof File)) {
			return APIErrorResponse(Boom.badRequest("No file provided"));
		}
		if (!EVENT_COVER_ACCEPTED_TYPES.includes(file.type)) {
			return APIErrorResponse(
				Boom.unsupportedMediaType("Only JPEG, PNG or WebP images are allowed"),
			);
		}
		if (file.size > EVENT_COVER_MAX_UPLOAD_MB * 1024 * 1024) {
			return APIErrorResponse(
				Boom.entityTooLarge(
					`Image must be under ${EVENT_COVER_MAX_UPLOAD_MB} MB`,
				),
			);
		}

		const url = await uploadPublicImage(
			new Uint8Array(await file.arrayBuffer()),
			NEWS_IMAGES_PREFIX,
		);
		return Response.json({ url });
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "POST /api/news/images",
			message: "Failed to upload news image",
		});
	}
}
