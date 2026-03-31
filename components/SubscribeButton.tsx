"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader, StarIcon } from "lucide-react";
import { forwardRef, useContext, useEffect, useState } from "react";
import { registerToEvent } from "@/actions/registerToEvent";
import { Button, type ButtonProps } from "@/components/extendui/button";
import { ModalContext } from "@/components/modals/providers";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { EventWithRegistrations } from "@/types";

interface SubscribeButtonProps extends ButtonProps {
	event: EventWithRegistrations;
	actionText1: string;
	actionText2: string;
	initialStatus?: "subscribe" | "subscribed";
	onSubscribe?: () => void;
	onUnsubscribe?: () => void;
}

export const SubscribeButton = forwardRef<
	HTMLButtonElement,
	SubscribeButtonProps
>(
	(
		{
			className,
			event,
			initialStatus,
			actionText1,
			actionText2,
			onSubscribe,
			onUnsubscribe,
			...props
		},
		ref,
	) => {
		const [status, setStatus] = useState(initialStatus || "subscribe");
		const [isHovered, setIsHovered] = useState(false);
		const [isLoading, setIsLoading] = useState(false);
		const { data: session } = authClient.useSession();
		const { setShowSignInModal } = useContext(ModalContext);
		const { setShowMemberOnlyModal } = useContext(ModalContext);

		useEffect(() => {
			if (event && session) {
				const isRegistered = event.registrations?.find(
					(registration) =>
						registration.userId === session?.user.id &&
						registration.status === "REGISTERED",
				);
				setStatus(isRegistered ? "subscribed" : "subscribe");
			}
		}, [event, session]);

		const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
			e.stopPropagation();
			setIsLoading(true);
			if (!session) {
				setIsLoading(false);
				setShowSignInModal(true);
				return;
			}
			const res = await registerToEvent(
				event.id,
				status === "subscribe" ? "REGISTERED" : "CANCELLED",
			);
			if (res.status === "error") {
				setIsLoading(false);
				if (res.code === 409) {
					setShowMemberOnlyModal(true);
				}
				console.error(res.message);
				return;
			}
			if (status === "subscribe") {
				onSubscribe && (await onSubscribe());
				setStatus("subscribed");
			} else {
				onUnsubscribe && (await onUnsubscribe());
				setStatus("subscribe");
			}
			setIsLoading(false);
		};

		const btnSubscribed =
			"bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-700";

		return (
			<Button
				ref={ref}
				onClick={onClick}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				disabled={isLoading}
				{...props}
				variant={status === "subscribe" ? "outline" : "default"}
				className={cn(
					"w-3 overflow-hidden",
					status === "subscribed" && btnSubscribed,
					className,
				)}
			>
				<AnimatePresence mode="wait">
					{status === "subscribed" && !isLoading && (
						<motion.span
							key={status}
							initial={{ y: -50 }}
							animate={{ y: 0 }}
							style={{ display: "flex", alignItems: "center" }}
						>
							{actionText2}
							<Check className="ml-2 size-4" />
						</motion.span>
					)}

					{isLoading && <Loader className="animate-spin" size="19" />}

					{status === "subscribe" && !isLoading && (
						<motion.span
							key={status}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							style={{ display: "flex", alignItems: "center" }}
						>
							<span className="mr-1">{actionText1}</span>
							<motion.div
								initial={{ x: 0 }}
								animate={{ x: isHovered ? 4 : 0 }}
								transition={{ duration: 0.3 }}
							>
								<StarIcon className="ml-1 size-4" />
							</motion.div>
						</motion.span>
					)}
				</AnimatePresence>
			</Button>
		);
	},
);

SubscribeButton.displayName = "SubscribeButton";
