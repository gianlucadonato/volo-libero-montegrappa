import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div>
			<Skeleton className="h-[20vh] w-full rounded-none" />
			<div className="container mb-16">
				<div className="mt-8 grid gap-4 sm:grid-cols-2">
					<Skeleton className="h-44 w-full rounded-xl" />
					<Skeleton className="h-44 w-full rounded-xl" />
				</div>
			</div>
		</div>
	);
}
