import { writeFileSync } from "fs";
import { NextResponse } from "next/server";
import { join } from "path";
import getXcTaskById from "@/actions/xc/getXcTaskById";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const task = await getXcTaskById(id);

		if (!task) {
			return NextResponse.json({ error: "Task not found" }, { status: 404 });
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		if (!file.name.endsWith(".tsk")) {
			return NextResponse.json(
				{ error: "Only .tsk files are allowed" },
				{ status: 400 },
			);
		}

		// Read the file buffer
		const buffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(buffer);

		// Create upload directory inside public/uploads/xc-user-tracks
		const uploadDir = join(
			process.cwd(),
			"public",
			"uploads",
			"xc-user-tracks",
		);
		const fileName = `${id}_${task.name?.replace(/\s+/g, "_")}_${Date.now()}.tsk`;
		const filePath = join(uploadDir, fileName);

		// Save the file
		writeFileSync(filePath, uint8Array);

		return NextResponse.json(
			{
				success: true,
				filename: fileName,
				path: `/uploads/xc-user-tracks/${fileName}`,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 },
		);
	}
}
