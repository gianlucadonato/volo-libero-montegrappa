import { Skeleton } from "@/components/ui/skeleton";

export default async function EventLoading() {
	return (
		<div className="mb-8 flex flex-col gap-1">
			<Skeleton className="h-[200px] w-full rounded-lg" />
			<div className="flex gap-1">
				<Skeleton className="h-[500px] w-full rounded-lg" />
				<Skeleton className="hidden h-[500px] w-full rounded-lg sm:block" />
			</div>
			<Skeleton className="h-[32px] w-full rounded-lg" />
		</div>
	);
}
