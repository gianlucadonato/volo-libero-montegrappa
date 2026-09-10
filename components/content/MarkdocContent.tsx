import Markdoc, { type Node } from "@markdoc/markdoc";
import * as React from "react";

type Props = { node: Node };

/**
 * Renders a parsed Markdoc tree — news entries from Keystatic and the static
 * pages under content/pages alike. Wrap it in `prose` for typography.
 */
export default function MarkdocContent({ node }: Props) {
	const content = Markdoc.transform(node);
	return <>{Markdoc.renderers.react(content, React, { components: {} })}</>;
}
