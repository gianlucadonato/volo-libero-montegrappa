import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="min-h-screen bg-linear-to-b from-indigo-50 to-white">
			<div className="mx-auto max-w-5xl px-4 py-8">
				<Skeleton className="mb-6 h-10 w-36" />
				<Skeleton className="mb-6 h-40 w-full rounded-2xl" />
				<Skeleton className="mb-4 h-100 w-full rounded-xl" />
				<Skeleton className="h-32 w-full rounded-xl" />
			</div>
		</div>
	);
}
