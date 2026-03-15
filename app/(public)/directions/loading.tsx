import { Skeleton } from "@/components/ui/skeleton";

export default async function Loading() {
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
