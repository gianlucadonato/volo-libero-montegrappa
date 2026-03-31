"use client";

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
	type InitialConfigType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import {
	$createParagraphNode,
	$getRoot,
	$insertNodes,
	type EditorState,
	type LexicalEditor,
	type SerializedEditorState,
} from "lexical";
import { useEffect } from "react";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { TooltipProvider } from "@/components/ui/tooltip";

import { nodes } from "./nodes";
import { Plugins } from "./plugins";

const editorConfig: InitialConfigType = {
	namespace: "Editor",
	theme: editorTheme,
	nodes,
	onError: (error: Error) => {
		console.error(error);
	},
};

function HtmlValueSyncPlugin({ htmlValue }: { htmlValue?: string }) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (htmlValue === undefined) {
			return;
		}

		let currentHtml = "";
		editor.getEditorState().read(() => {
			currentHtml = $generateHtmlFromNodes(editor, null);
		});

		if (currentHtml === htmlValue) {
			return;
		}

		editor.update(() => {
			const parser = new DOMParser();
			const dom = parser.parseFromString(htmlValue, "text/html");
			const htmlNodes = $generateNodesFromDOM(editor, dom);
			const root = $getRoot();

			root.clear();
			root.select();

			if (htmlNodes.length > 0) {
				$insertNodes(htmlNodes);
				return;
			}

			root.append($createParagraphNode());
		});
	}, [editor, htmlValue]);

	return null;
}

export function Editor({
	editorState,
	editorSerializedState,
	htmlValue,
	onChange,
	onSerializedChange,
	onHtmlChange,
	placeholder,
	className,
}: {
	editorState?: EditorState;
	editorSerializedState?: SerializedEditorState;
	htmlValue?: string;
	onChange?: (editorState: EditorState) => void;
	onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
	onHtmlChange?: (html: string) => void;
	placeholder?: string;
	className?: string;
}) {
	const initialState =
		editorState ??
		(editorSerializedState
			? JSON.stringify(editorSerializedState)
			: htmlValue !== undefined
				? (editor: LexicalEditor) => {
						const parser = new DOMParser();
						const dom = parser.parseFromString(htmlValue, "text/html");
						const nodes = $generateNodesFromDOM(editor, dom);
						const root = $getRoot();

						root.clear();
						root.select();

						if (nodes.length > 0) {
							$insertNodes(nodes);
							return;
						}

						root.append($createParagraphNode());
					}
				: undefined);

	return (
		<div
			className={
				className ?? "bg-background overflow-hidden rounded-lg border shadow"
			}
		>
			<LexicalComposer
				initialConfig={{
					...editorConfig,
					...(initialState ? { editorState: initialState } : {}),
				}}
			>
				<TooltipProvider>
					<HtmlValueSyncPlugin htmlValue={htmlValue} />
					<Plugins placeholder={placeholder} />

					<OnChangePlugin
						ignoreSelectionChange={true}
						onChange={(editorState, editor) => {
							onChange?.(editorState);
							onSerializedChange?.(editorState.toJSON());
							editorState.read(() => {
								onHtmlChange?.($generateHtmlFromNodes(editor, null));
							});
						}}
					/>
				</TooltipProvider>
			</LexicalComposer>
		</div>
	);
}
