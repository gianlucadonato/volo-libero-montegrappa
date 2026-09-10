import { NextResponse } from "next/server";
import getXcTaskById from "@/actions/xc/getXcTaskById";
import { getObjectBytes } from "@/lib/s3";
import { getXcPublicBucket, xcAssetObjectKey } from "@/lib/xc-assets";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const task = await getXcTaskById(id);

		if (!task || !task.taskFileUrl) {
			return NextResponse.json(
				{ error: "Task not found or no file available" },
				{ status: 404 },
			);
		}

		// Rows store the .tsk; the file pilots import into XCTrack is the .xctsk
		// sitting next to it in the bucket.
		const xctskUrl = task.taskFileUrl.replace(/\.tsk$/, ".xctsk");
		const objectKey = xcAssetObjectKey(xctskUrl);
		if (!objectKey) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		const fileContent = await getObjectBytes({
			bucket: getXcPublicBucket(),
			objectKey,
		});
		if (!fileContent) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		// Extract filename from the key (e.g. 'g30.xctsk').
		const filename = objectKey.split("/").pop() || "task.xctsk";

		return new NextResponse(new Uint8Array(fileContent), {
			headers: {
				"Content-Type": "application/octet-stream",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Cache-Control": "public, max-age=3600",
			},
		});
	} catch (error) {
		console.error("Download error:", error);
		return NextResponse.json(
			{ error: "Failed to download file" },
			{ status: 500 },
		);
	}
}
