"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { it } from "@blocknote/core/locales";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { uploadNewsImageApi } from "@/lib/api-client";
import {
	type NewsBlock,
	type NewsPartialBlock,
	newsSchema,
} from "@/lib/news-schema";

type Props = {
	/** Read once on mount: the editor owns the document from then on. */
	initialContent?: NewsPartialBlock[];
	onChange: (blocks: NewsBlock[]) => void;
	onUploadError?: () => void;
};

/**
 * The Notion-like news body editor. Browser only: load it through
 * next/dynamic with `ssr: false`.
 */
export default function NewsEditor({
	initialContent,
	onChange,
	onUploadError,
}: Props) {
	const editor = useCreateBlockNote({
		schema: newsSchema,
		dictionary: it,
		// An empty array is not a valid document; undefined gives one empty paragraph.
		initialContent: initialContent?.length ? initialContent : undefined,
		uploadFile: async (file) => {
			const { data, error } = await uploadNewsImageApi(file);
			if (error || !data) {
				onUploadError?.();
				throw new Error("News image upload failed");
			}
			return data.url;
		},
	});

	return (
		<BlockNoteView
			editor={editor}
			theme="light"
			className="min-h-80 py-4"
			onChange={() => onChange(editor.document)}
		/>
	);
}
