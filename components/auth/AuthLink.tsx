"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { withCallbackUrl } from "@/helpers/authRedirect";

/**
 * A link between the auth pages that carries the current `callbackUrl` along,
 * so switching from login to signup — or coming back from the password pages —
 * still returns the user where they started. Reads the query string, so it has
 * to be rendered inside a `<Suspense>` boundary like the forms are.
 */
export function AuthLink({
	href,
	className,
	onClick,
	children,
}: {
	href: string;
	className?: string;
	onClick?: () => void;
	children: React.ReactNode;
}) {
	const searchParams = useSearchParams();

	return (
		<Link
			href={withCallbackUrl(href, searchParams.get("callbackUrl"))}
			onClick={onClick}
			className={className}
		>
			{children}
		</Link>
	);
}
