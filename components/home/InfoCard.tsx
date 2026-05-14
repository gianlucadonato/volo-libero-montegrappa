import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { InfoList } from "@/types";

export type InfoCardType = {
	title: string | React.ReactNode;
	image: string;
	description: string;
	list: InfoList[];
	width?: number;
	height?: number;
	custom?: boolean;
};

interface InfoCardProps {
	data: InfoCardType;
	reverse?: boolean;
}

export default function InfoCard({ data, reverse = false }: InfoCardProps) {
	return (
		<div className="py-10 sm:py-16">
			<div className="container mx-auto max-w-6xl grid gap-10 px-2.5 lg:grid-cols-2 lg:items-center lg:px-7">
				<div className={cn(reverse ? "lg:order-2" : "lg:order-1")}>
					<h2 className="text-center font-heading text-2xl text-foreground md:text-3xl lg:text-4xl">
						{data.title}
					</h2>
					<p className="mt-6 px-2 text-base text-muted-foreground">
						{data.description}
					</p>
					<dl className="mt-8 space-y-4 px-2 leading-7">
						{data.list.map((item, index) => {
							const Icon = item.icon || ArrowRight;
							return (
								<Link href={item.link || "#"} key={index}>
									<div className="relative p-4 pl-8 hover:cursor-pointer hover:bg-lime-500/20">
										<dt className="font-semibold">
											<div className="flex items-center">
												<Icon className="mr-2 size-5 stroke-purple-700" />
												<span>{item.title}</span>
											</div>
										</dt>
										<dd className="text-sm text-muted-foreground">
											{item.description}
										</dd>
									</div>
								</Link>
							);
						})}
					</dl>
				</div>
				<div
					className={cn(
						"overflow-hidden lg:-m-4",
						reverse ? "order-1" : "order-2",
					)}
				>
					<div>
						<Image
							className="size-full object-cover object-center"
							src={data.image}
							alt="image"
							width={data.width || 1000}
							height={data.height || 500}
							priority={true}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
