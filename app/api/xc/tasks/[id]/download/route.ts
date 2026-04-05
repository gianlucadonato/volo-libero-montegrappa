import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { join } from "path";
import getXcTaskById from "@/actions/xc/getXcTaskById";

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

		// Read the file from the public folder
		const filePath = join(process.cwd(), "public", task.taskFileUrl);
		const fileContent = readFileSync(filePath);

		// Extract filename from path (e.g., 'g30.tsk' from '/events/g30.tsk')
		const filename = task.taskFileUrl.split("/").pop() || "task.tsk";

		return new NextResponse(fileContent, {
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
