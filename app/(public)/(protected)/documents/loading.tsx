import { Skeleton } from "@/components/ui/skeleton";

export default async function Loading() {
  return (
    <div className="mb-8 flex flex-col gap-1">
      <Skeleton className="h-[200px] w-full rounded-lg" />
      <Skeleton className="h-[500px] w-full rounded-lg" />
      <Skeleton className="h-[500px] w-full rounded-lg" />
    </div>
  );
}
