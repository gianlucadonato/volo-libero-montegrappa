import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div>
			<Skeleton className="h-[20vh] w-full rounded-none" />
			<div className="container mb-16">
				<div className="mt-6 flex items-center justify-between">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-4 w-56" />
				</div>
				<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
					<Skeleton className="h-9 w-full sm:w-64" />
					<Skeleton className="h-11 w-full sm:w-72" />
				</div>
				<Skeleton className="mt-4 h-[28rem] w-full rounded-xl" />
			</div>
		</div>
	);
}
