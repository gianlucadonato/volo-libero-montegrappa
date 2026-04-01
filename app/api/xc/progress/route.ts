import { NextResponse } from "next/server";
import getMyXcProgress from "@/actions/xc/getMyXcProgress";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const yearParam = searchParams.get("year");
	const year = yearParam ? Number(yearParam) : undefined;

	if (yearParam && Number.isNaN(year)) {
		return NextResponse.json({ error: "Invalid year" }, { status: 400 });
	}

	const progress = await getMyXcProgress(year);
	if (!progress) {
		return NextResponse.json({ error: "Progress not found" }, { status: 404 });
	}

	return NextResponse.json(progress);
}
