import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div>
			<Skeleton className="h-[20vh] w-full rounded-none" />
			<div className="container mb-16">
				<Skeleton className="mt-8 h-20 w-full rounded-xl" />
				<Skeleton className="mt-6 h-24 w-full rounded-xl" />
				<div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{["a", "b", "c", "d", "e", "f"].map((slot) => (
						<Skeleton
							key={slot}
							className="aspect-[844/700] w-full rounded-xl"
						/>
					))}
				</div>
			</div>
		</div>
	);
}
