"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

function PostHogIdentity() {
	const { data: session } = authClient.useSession();
	const identifiedUserId = useRef<string | null>(null);
	const user = session?.user;

	useEffect(() => {
		if (user?.id) {
			if (identifiedUserId.current !== user.id) {
				if (identifiedUserId.current) {
					posthog.reset();
				}

				posthog.identify(user.id, {
					email: user.email,
					name: user.name,
					role: user.role,
				});
				identifiedUserId.current = user.id;
			}
			return;
		}

		if (identifiedUserId.current) {
			posthog.reset();
			identifiedUserId.current = null;
		}
	}, [user]);

	return null;
}

export default function QueryProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<PostHogIdentity />
			{children}
		</QueryClientProvider>
	);
}
