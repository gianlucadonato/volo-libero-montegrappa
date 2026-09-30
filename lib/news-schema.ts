import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

/**
 * The blocks a news post can hold, shared by the admin editor and the server
 * renderer so both agree on what the stored JSON means.
 *
 * Audio, video, file and code blocks are left out: news is text and photos,
 * and the public page has no player or download UI to show them in.
 */
const { audio, video, file, codeBlock, ...newsBlockSpecs } = defaultBlockSpecs;

export const newsSchema = BlockNoteSchema.create({
	blockSpecs: newsBlockSpecs,
});

export type NewsBlock = typeof newsSchema.Block;
export type NewsPartialBlock = typeof newsSchema.PartialBlock;
