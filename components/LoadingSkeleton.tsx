import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function LoadingSkeleton({
	section = false,
	card = false,
}: {
	section?: boolean;
	card?: boolean;
}) {
	if (section) {
		return <SkeletonSection card={card} />;
	}
	if (card) {
		return <CardSkeleton />;
	}
	return (
		<div className="flex flex-col gap-5">
			<Skeleton className="h-40 w-full rounded-lg" />

			<div className="container mx-auto">
				<Skeleton className="mb-10 h-[500px] w-full rounded-lg" />
				<Skeleton className="h-[500px] w-full rounded-lg" />
			</div>
		</div>
	);
}

function CardSkeleton() {
	return (
		<Card>
			<CardHeader className="gap-1">
				<Skeleton className="h-5 w-1/5" />
				<Skeleton className="h-3.5 w-2/5" />
			</CardHeader>
			<CardContent className="h-16" />
			<CardFooter className="flex h-14 items-center justify-between border-t bg-accent/50 p-6" />
		</Card>
	);
}

export function SkeletonSection({ card = false }: { card?: boolean }) {
	return (
		<div className="grid grid-cols-1 gap-x-10 gap-y-4 py-8 md:grid-cols-10">
			<div className="col-span-4 space-y-1.5">
				<Skeleton className="h-5 w-36" />
				<Skeleton className="h-5 w-4/5" />
			</div>
			<div className="col-span-6">
				{card ? (
					<Skeleton className="h-44 w-full rounded-xl" />
				) : (
					<>
						<div className="mb-1.5 flex gap-x-2">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-[67px] shrink-0 sm:w-[130px]" />
						</div>
						<Skeleton className="h-5 w-56" />
					</>
				)}
			</div>
		</div>
	);
}
