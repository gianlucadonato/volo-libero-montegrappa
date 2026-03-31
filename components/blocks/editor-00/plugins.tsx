import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";

import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { ActionsPlugin } from "@/components/editor/plugins/actions/actions-plugin";
import { CounterCharacterPlugin } from "@/components/editor/plugins/actions/counter-character-plugin";
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list";
import { FormatCheckList } from "@/components/editor/plugins/toolbar/block-format/format-check-list";
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading";
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list";
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph";
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote";
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin";

export function Plugins({ placeholder }: { placeholder?: string }) {
	const onRef = (_floatingAnchorElem: HTMLDivElement) => {
		if (_floatingAnchorElem !== null) {
			return;
		}
	};

	return (
		<div className="relative">
			{/* toolbar plugins */}
			<ToolbarPlugin>
				{() => (
					<div className="vertical-align-middle sticky top-0 z-10 flex gap-2 overflow-auto border-b p-1">
						<BlockFormatDropDown>
							<FormatParagraph />
							<FormatHeading levels={["h1", "h2", "h3"]} />
							<FormatNumberedList />
							<FormatBulletedList />
							<FormatCheckList />
							<FormatQuote />
						</BlockFormatDropDown>
						<FontFormatToolbarPlugin />
					</div>
				)}
			</ToolbarPlugin>

			<div className="relative">
				<RichTextPlugin
					contentEditable={
						<div className="">
							<div className="" ref={onRef}>
								<ContentEditable
									placeholder={placeholder ?? "Start typing ..."}
								/>
							</div>
						</div>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<ListPlugin />
				<CheckListPlugin />
				{/* editor plugins */}
			</div>
			{/* actions plugins */}
			<ActionsPlugin>
				<div className="clear-both flex items-center justify-between gap-2 overflow-auto border-t p-1">
					<div className="flex flex-1 justify-start">
						{/* left side action buttons */}
					</div>
					<div>
						<CounterCharacterPlugin charset="UTF-16" />
						{/* center action buttons */}
					</div>
					<div className="flex flex-1 justify-end">
						{/* right side action buttons */}
					</div>
				</div>
			</ActionsPlugin>
		</div>
	);
}
