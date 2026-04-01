import { NextResponse } from "next/server";
import reviewXcSubmission from "@/actions/xc/reviewXcSubmission";
import { XcSubmissionStatus } from "@/prisma/generated/enums";
import { XcReviewSubmissionSchema } from "@/schemas/xc";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = XcReviewSubmissionSchema.parse(await request.json());
		const submission = await reviewXcSubmission({
			submissionId: id,
			status:
				body.status === "APPROVED"
					? XcSubmissionStatus.APPROVED
					: XcSubmissionStatus.REJECTED,
			notes: body.notes,
			pointsAwarded: body.pointsAwarded,
		});
		return NextResponse.json({ submission });
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 400 },
		);
	}
}
