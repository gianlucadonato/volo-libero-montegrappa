import { NextResponse } from "next/server";
import enrollInXcEdition from "@/actions/xc/enrollInXcEdition";
import { XcEnrollSchema } from "@/schemas/xc";

export async function POST(request: Request) {
	try {
		const body = XcEnrollSchema.parse(await request.json());
		const enrollment = await enrollInXcEdition(body.editionId);
		return NextResponse.json({ enrollment }, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 400 },
		);
	}
}
