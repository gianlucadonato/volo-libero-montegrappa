import { NextResponse } from "next/server";
import enrollInXcEdition from "@/actions/xc/enrollInXcEdition";

export async function POST() {
	try {
		const enrollment = await enrollInXcEdition();
		return NextResponse.json({ enrollment }, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 400 },
		);
	}
}
