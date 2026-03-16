"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Report } from "@/prisma/generated/client";

function formatDate(date: Date) {
	return (
		<span className="capitalize">
			{format(date, "	E dd/MM/yy HH:mm:ss", { locale: it })}
		</span>
	);
}

export default function Reports({ reports }: { reports: Report[] }) {
	const lastReport = reports[0];
	return (
		<>
			<div className="mb-2 flex items-center justify-center gap-2">
				<div
					className={cn(
						"size-4 rounded-full bg-gray-500",
						lastReport.error ? "bg-red-500" : "bg-green-700",
					)}
				/>
				<span className="font-bold">Ultimo Aggiornamento:</span>
				{lastReport ? formatDate(lastReport.createdAt) : "N/A"}
			</div>
			<Card>
				<CardHeader>
					<CardTitle></CardTitle>
				</CardHeader>
				<CardContent>
					<Accordion type="single" collapsible>
						{reports.map((report) => (
							<AccordionItem value={report.id} key={report.id}>
								<AccordionTrigger>
									<div className="flex items-center gap-2">
										<StatusBadge error={report.error} />
										<span>{formatDate(report.createdAt)}</span>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<ReportTable report={report} />
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</CardContent>
			</Card>
		</>
	);
}

function StatusBadge({ error }: { error: boolean }) {
	return error ? (
		<Badge variant="destructive">Errore</Badge>
	) : (
		<Badge
			variant="default"
			className="border-green-700 bg-green-50 text-green-700"
		>
			OK
		</Badge>
	);
}

function ReportTable({ report }: { report: Report }) {
	return (
		<Table>
			<TableBody>
				<TableRow>
					<TableHead>Ora Inizio</TableHead>
					<TableCell>{formatDate(report.startTime)}</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>Ora Fine</TableHead>
					<TableCell>
						{report.endTime ? formatDate(report.endTime) : "N/A"}
					</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>Durata Totale</TableHead>
					<TableCell>{report.duration ? report.duration : "N/A"}</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>MegaBytes</TableHead>
					<TableCell>
						{report.totalMegaBytes ? report.totalMegaBytes : "N/A"}
					</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>Num. Files</TableHead>
					<TableCell>
						{`${report.totalUploadedFiles}/${report.totalFiles}`}
					</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>S3 Start Time</TableHead>
					<TableCell>
						{report.s3startTime ? formatDate(report.s3startTime) : "N/A"}
					</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>S3 End Time</TableHead>
					<TableCell>
						{report.s3endTime ? formatDate(report.s3endTime) : "N/A"}
					</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>S3 Duration</TableHead>
					<TableCell>{report.s3duration ? report.s3duration : "N/A"}</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>S3 Error</TableHead>
					<TableCell>
						<StatusBadge error={Boolean(report.s3error)} />
					</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>FTP Start Time</TableHead>
					<TableCell>
						{report.ftpStartTime ? formatDate(report.ftpStartTime) : "N/A"}
					</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>FTP End Time</TableHead>
					<TableCell>
						{report.ftpEndTime ? formatDate(report.ftpEndTime) : "N/A"}
					</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>FTP Duration</TableHead>
					<TableCell>
						{report.ftpDuration ? report.ftpDuration : "N/A"}
					</TableCell>
				</TableRow>
				<TableRow>
					<TableHead>FTP Error</TableHead>
					<TableCell>
						<StatusBadge error={Boolean(report.ftpError)} />
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}
