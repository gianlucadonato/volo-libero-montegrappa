import { Skeleton } from "@/components/ui/skeleton";

export default async function Loading() {
  return (
    <div className="mb-8 flex flex-col gap-1">
      <Skeleton className="h-50 w-full rounded-lg" />
      <Skeleton className="h-125 w-full rounded-lg" />
      <Skeleton className="h-125 w-full rounded-lg" />
    </div>
  );
}
