import { Skeleton } from "@/components/ui/skeleton";

export default async function EventsLoading() {
	return (
		<div className="mb-8 flex flex-col gap-1">
			<Skeleton className="h-[150px] w-full rounded-lg" />
			<Skeleton className="h-[350px] w-full rounded-lg" />
			<Skeleton className="h-[350px] w-full rounded-lg" />
		</div>
	);
}
