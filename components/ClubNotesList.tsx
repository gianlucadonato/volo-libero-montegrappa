"use client";

import { format } from "date-fns";
import { DownloadIcon, NotebookPen } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type Note = {
	id: number;
	title: string;
	link: string;
	createdAt: Date;
};

export default function ClubNotesList({ notes }: { notes: Note[] }) {
	const t = useTranslations("DocumentsPage.ClubNotesList");
	return (
		<Card className="mt-4 xl:col-span-2">
			<CardHeader className="flex flex-row items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<NotebookPen className="size-9" />
					<h1 className="mb-4 mt-3 text-2xl">{t("verbali")}</h1>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("title")}</TableHead>
							<TableHead>{t("data")}</TableHead>
							<TableHead className="text-right">{t("actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{notes.map((note) => (
							<TableRow key={note.id}>
								<TableCell>{note.title}</TableCell>
								<TableCell>{format(note.createdAt, "dd/MM/yyyy")}</TableCell>
								<TableCell>
									<Link href={note.link} target="_blank">
										<div className="mt-1 flex items-center justify-end">
											<DownloadIcon className="mr-1 inline-block size-4" />
											{t("download")}
										</div>
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
