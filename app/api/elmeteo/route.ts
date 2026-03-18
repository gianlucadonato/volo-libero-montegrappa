import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
  const report = await prisma.report.findFirst({
    orderBy: {
      createdAt: "desc",
    },
  });
  return new Response(JSON.stringify(report), { status: 200 });
};

export const POST = async (req: Request) => {
  const authorization = (await headers()).get("authorization");
  if (!authorization) {
    return new Response("Not authenticated", { status: 401 });
  }
  const token = authorization.split(" ")[1];
  const authToken = "c2c52177-92e0-4852-a425-e9f521e51d5a";
  if (!token || token !== authToken) {
    return new Response("Not authenticated", { status: 401 });
  }

  const body = await req.json();
  await prisma.report.create({
    data: {
      folder: body.destFolder,
      s3startTime: new Date(body.amazonS3.startTime),
      s3endTime: body.amazonS3.endTime ? new Date(body.amazonS3.endTime) : null,
      s3duration: body.amazonS3.duration,
      s3error: body.amazonS3.error,
      ftpStartTime: new Date(body.ftp.startTime),
      ftpEndTime: body.ftp.endTime ? new Date(body.ftp.endTime) : null,
      ftpDuration: body.ftp.duration,
      ftpError: body.ftp.error,
      totalFiles: body.totalFiles,
      totalUploadedFiles: body.totalUploadedFiles,
      totalBytes: body.totalBytes,
      totalMegaBytes: body.totalUploadedMegaBytes,
      startTime: new Date(body.startTime),
      endTime: body.endTime ? new Date(body.endTime) : null,
      duration: body.duration,
      error: Boolean(body.error),
    },
  });

  console.log("🐞 > Report saved!", body);

  return new Response("Report saved!", { status: 200 });
};
