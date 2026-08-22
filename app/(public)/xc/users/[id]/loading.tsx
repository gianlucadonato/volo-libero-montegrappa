import { Skeleton } from "@/components/ui/skeleton";

export default async function Loading() {
	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<Skeleton className="mb-6 h-10 w-40 rounded-lg" />
			<Skeleton className="h-52 w-full rounded-2xl" />
			<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Skeleton className="h-72 w-full rounded-xl" />
				<Skeleton className="h-72 w-full rounded-xl" />
				<Skeleton className="h-72 w-full rounded-xl" />
			</div>
			<Skeleton className="mt-8 h-64 w-full rounded-xl" />
		</div>
	);
}
