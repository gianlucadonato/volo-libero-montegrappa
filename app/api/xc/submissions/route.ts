import { NextResponse } from "next/server";
import createXcSubmission from "@/actions/xc/createXcSubmission";
import { XcCreateSubmissionSchema } from "@/schemas/xc";

export async function POST(request: Request) {
	try {
		const body = XcCreateSubmissionSchema.parse(await request.json());
		const submission = await createXcSubmission(body);
		return NextResponse.json({ submission }, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 400 },
		);
	}
}
