import type React from "react";

interface DashboardHeaderProps {
	heading: string | React.ReactNode;
	text?: string;
	children?: React.ReactNode;
}

export function DashboardHeader({
	heading,
	text,
	children,
}: DashboardHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="highlight mb-1 font-heading text-3xl uppercase">
					{heading}
				</h1>
				{text && <p className="text-base text-muted-foreground">{text}</p>}
			</div>
			{children}
		</div>
	);
}
