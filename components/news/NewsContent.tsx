import Markdoc, { type Node } from "@markdoc/markdoc";
import * as React from "react";

type Props = { node: Node };

export default function NewsContent({ node }: Props) {
	const content = Markdoc.transform(node);
	return <>{Markdoc.renderers.react(content, React, { components: {} })}</>;
}
